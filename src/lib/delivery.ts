import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP, type LookupFunction } from "node:net";
import https from "node:https";
import http from "node:http";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";

export function isDisallowedIpAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    const [b0, b1] = parts;
    if (b0 === 0) return true; // 0.0.0.0/8
    if (b0 === 10) return true; // 10.0.0.0/8
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true; // 100.64.0.0/10 Carrier-Grade NAT
    if (b0 === 127) return true; // 127.0.0.0/8 Loopback
    if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 Link-local / Cloud Metadata
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12 Private
    if (b0 === 192 && b1 === 0 && (parts[2] === 0 || parts[2] === 2)) return true; // 192.0.0.0/24 & 192.0.2.0/24
    if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16 Private
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true; // 198.18.0.0/15
    if (b0 === 198 && b1 === 51 && parts[2] === 100) return true; // 198.51.100.0/24 TEST-NET-2
    if (b0 === 203 && b1 === 0 && parts[2] === 113) return true; // 203.0.113.0/24 TEST-NET-3
    if (b0 >= 224) return true; // Multicast & Reserved
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "0000:0000:0000:0000:0000:0000:0000:0001") return true;
    if (normalized === "::" || normalized === "0000:0000:0000:0000:0000:0000:0000:0000") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // Unique local
    if (/^fe[89ab]/.test(normalized)) return true; // Link-local
    if (normalized.startsWith("::ffff:")) {
      const ipv4Part = normalized.substring(7);
      if (isIP(ipv4Part) === 4) return isDisallowedIpAddress(ipv4Part);
      return true;
    }
    if (normalized.startsWith("ff")) return true; // Multicast
    if (normalized.startsWith("100:") || normalized.startsWith("2001:db8:")) return true;
    return false;
  }
  return false;
}

export function cleanWebhookHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

export function isDisallowedWebhookHost(hostname: string): boolean {
  const host = cleanWebhookHostname(hostname);
  // Cloud metadata is unconditionally disallowed
  if (host === "169.254.169.254" || host.startsWith("169.254.") || host === "fd00:ec2::254") {
    return true;
  }

  const isDeployed = Boolean(process.env.VERCEL);
  const allowLocal = process.env.ALLOW_LOCAL_WEBHOOK === "1";

  // IP literal checks
  if (isIP(host) !== 0) {
    if (isDisallowedIpAddress(host)) {
      if (isDeployed || (!allowLocal && process.env.VERCEL_ENV === "production")) {
        return true;
      }
    }
  }

  // Local & internal domain patterns
  if (isDeployed || (!allowLocal && process.env.VERCEL_ENV === "production")) {
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".onion") ||
      host.endsWith(".arpa")
    ) {
      return true;
    }
  }

  // Strict allowlist if specified via LEAD_WEBHOOK_ALLOWED_HOSTS
  if (process.env.LEAD_WEBHOOK_ALLOWED_HOSTS) {
    const allowed = process.env.LEAD_WEBHOOK_ALLOWED_HOSTS.split(",").map((h) =>
      h.trim().toLowerCase(),
    );
    if (!allowed.includes(host)) {
      return true;
    }
  }

  return false;
}

export function formsAvailable() {
  try {
    const parsed = new URL(process.env.LEAD_WEBHOOK_URL || "");
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    const isDeployed = Boolean(process.env.VERCEL);
    const allowLocal = process.env.ALLOW_LOCAL_WEBHOOK === "1";
    if (isDeployed || (!allowLocal && process.env.VERCEL_ENV === "production")) {
      if (parsed.port && parsed.port !== "443") return false;
    }
    if (isDisallowedWebhookHost(parsed.hostname)) return false;
    return (
      !!process.env.LEAD_WEBHOOK_TOKEN &&
      (process.env.FORM_RECEIPT_SECRET?.length || 0) >= 32
    );
  } catch {
    return false;
  }
}
export interface WebhookDeliveryOptions {
  url: string;
  token: string;
  idempotencyKey: string;
  data: unknown;
  timeoutMs?: number;
  lookupFn?: LookupFunction;
}

export async function isWebhookTargetSafe(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    const isDeployed = Boolean(process.env.VERCEL);
    const allowLocal = process.env.ALLOW_LOCAL_WEBHOOK === "1";
    if (isDeployed || (!allowLocal && process.env.VERCEL_ENV === "production")) {
      if (parsed.port && parsed.port !== "443") return false;
    }
    const host = cleanWebhookHostname(parsed.hostname);
    if (isDisallowedWebhookHost(host)) return false;

    // If host is an IP literal, it was already verified above
    if (isIP(host) !== 0) return true;

    // For domain names in deployed / production environments, resolve and inspect all DNS records
    if (isDeployed || (!allowLocal && process.env.VERCEL_ENV === "production")) {
      try {
        const records = await dnsPromises.lookup(host, { all: true });
        if (!records.length) return false;
        for (const record of records) {
          if (isDisallowedIpAddress(record.address)) {
            return false;
          }
        }
      } catch {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function postSafeWebhook(
  options: WebhookDeliveryOptions,
): Promise<{ accepted: boolean; status: number }> {
  const {
    url: urlStr,
    token,
    idempotencyKey,
    data,
    timeoutMs = 8000,
    lookupFn = (h, o, cb) => dns.lookup(h, o, cb),
  } = options;

  const parsed = new URL(urlStr);
  const protocol = parsed.protocol;
  if (protocol !== "https:" && protocol !== "http:") {
    throw new Error(`SSRF: Unsupported webhook protocol ${protocol}`);
  }

  const isDeployed = Boolean(process.env.VERCEL);
  const allowLocal = process.env.ALLOW_LOCAL_WEBHOOK === "1";
  const enforceStrict = isDeployed || (!allowLocal && process.env.VERCEL_ENV === "production");

  if (enforceStrict && protocol !== "https:") {
    throw new Error("SSRF: Only HTTPS is permitted in deployed environments");
  }

  // 1. Reject embedded user credentials
  if (parsed.username || parsed.password) {
    throw new Error("SSRF: Webhook URLs must not contain embedded user credentials");
  }

  // 2. Enforce standard port in deployed mode
  if (enforceStrict && parsed.port && parsed.port !== "443") {
    throw new Error(`SSRF: Webhook port ${parsed.port} is not permitted in deployed environments`);
  }

  const host = cleanWebhookHostname(parsed.hostname);
  if (isDisallowedWebhookHost(host)) {
    throw new Error(`SSRF: Disallowed webhook destination host ${host}`);
  }

  // 3. If host is an IP literal, validate directly before opening socket
  if (isIP(host) !== 0) {
    if (isDisallowedIpAddress(host)) {
      if (enforceStrict || host.startsWith("169.254.") || host === "fd00:ec2::254") {
        throw new Error(`SSRF: Direct connection to disallowed IP ${host} blocked`);
      }
    }
  }

  // 4. Connection-time destination lookup enforcement (prevents DNS rebinding)
  const connectionLookup: LookupFunction = (hostname, opts, cb) => {
    lookupFn(hostname, { all: true }, (err, addresses) => {
      if (err) return cb(err, "");
      if (!addresses || (Array.isArray(addresses) && addresses.length === 0)) {
        return cb(new Error(`SSRF: No DNS records found for ${hostname}`), "");
      }

      const rawRecords: unknown[] = Array.isArray(addresses) ? addresses : [addresses];
      const records: Array<dns.LookupAddress> = [];

      for (const rec of rawRecords) {
        if (typeof rec === "string") {
          records.push({ address: rec, family: isIP(rec) });
        } else if (rec && typeof rec === "object" && "address" in rec) {
          const typed = rec as { address: string; family?: number };
          records.push({ address: typed.address, family: typed.family ?? isIP(typed.address) });
        }
      }

      for (const rec of records) {
        if (isDisallowedIpAddress(rec.address)) {
          if (enforceStrict || rec.address.startsWith("169.254.") || rec.address === "fd00:ec2::254") {
            return cb(new Error(`SSRF: Connection blocked to disallowed destination IP ${rec.address}`), "");
          }
        }
      }

      if (opts && opts.all) {
        cb(null, records);
      } else {
        const preferred = records.find((r) => r.family === 4) || records[0];
        cb(null, preferred.address, preferred.family);
      }
    });
  };

  const payloadString = JSON.stringify(data);
  const client = protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      parsed,
      {
        method: "POST",
        lookup: connectionLookup,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: token,
          "Idempotency-Key": idempotencyKey,
          Host: parsed.host,
        },
        servername: isIP(host) === 0 ? host : undefined,
        timeout: timeoutMs,
      },
      (res) => {
        // Enforce redirect disabling: any 3xx response is immediately treated as non-delivery
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          return reject(
            new Error(`SSRF: Webhook HTTP redirects are strictly disabled (got status ${res.statusCode})`),
          );
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`provider-rejected: status ${res.statusCode}`));
          }
          try {
            const json = JSON.parse(body);
            if (json.accepted !== true) {
              return reject(new Error("provider-not-confirmed"));
            }
            resolve({ accepted: true, status: res.statusCode });
          } catch {
            reject(new Error("provider-invalid-response"));
          }
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("provider-timeout"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(payloadString);
    req.end();
  });
}
export function receipt(kind: string) {
  const value = `${kind}.${Date.now()}`;
  return (
    value +
    "." +
    createHmac("sha256", process.env.FORM_RECEIPT_SECRET!)
      .update(value)
      .digest("hex")
  );
}
export function verifyReceipt(value: string | undefined) {
  if (!value || !process.env.FORM_RECEIPT_SECRET) return null;
  const [kind, time, mac, ...rest] = value.split(".");
  if (
    rest.length ||
    !["quote", "demo"].includes(kind) ||
    !/^\d+$/.test(time) ||
    !/^\w{64}$/.test(mac || "")
  )
    return null;
  const age = Date.now() - Number(time);
  if (age < 0 || age > 3600000) return null;
  const expected = createHmac("sha256", process.env.FORM_RECEIPT_SECRET)
    .update(`${kind}.${time}`)
    .digest("hex");
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) ? kind : null;
}
