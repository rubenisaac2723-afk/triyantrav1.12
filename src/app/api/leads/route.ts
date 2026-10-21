import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { validateLead, type Lead } from "@/lib/lead";
import { formsAvailable, isWebhookTargetSafe, postSafeWebhook, receipt } from "@/lib/delivery";
import { hasCanonicalOrigin, siteOrigin } from "@/lib/site-url";
export const runtime = "nodejs";
// ponytail: bounded per-process limiter; tracks per-client IP with a global ceiling.
interface RateRecord {
  count: number;
  resetAt: number;
}
const ipLimits = new Map<string, RateRecord>();
const MAX_MAP_SIZE = 10000;
let lastPruneTime = Date.now();
let globalWindowStart = Date.now();
let globalRequests = 0;

function getClientIp(request: Request): string {
  // On Vercel, x-real-ip is stripped of client input and populated with the true remote client IP.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp) !== 0) return realIp;

  // Cloudflare Connecting IP is only trusted if the deployment is configured to be behind Cloudflare
  if (process.env.BEHIND_CLOUDFLARE === "1") {
    const cfIp = request.headers.get("cf-connecting-ip")?.trim();
    if (cfIp && isIP(cfIp) !== 0) return cfIp;
  }

  // Fallback to x-forwarded-for for local testing and intermediate proxies
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim());
    for (const part of parts) {
      if (isIP(part) !== 0) return part;
    }
  }

  return "127.0.0.1";
}

function pruneExpired(now: number) {
  if (now - lastPruneTime < 10000 && ipLimits.size < 1000) return;
  lastPruneTime = now;
  for (const [key, record] of ipLimits.entries()) {
    if (now > record.resetAt) {
      ipLimits.delete(key);
    }
  }
  // Enforce strict memory ceiling to prevent unbounded growth under spoofing floods
  while (ipLimits.size >= MAX_MAP_SIZE) {
    const oldestKey = ipLimits.keys().next().value;
    if (oldestKey) ipLimits.delete(oldestKey);
    else break;
  }
}

function checkRateLimit(request: Request): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const isDeployed = Boolean(process.env.VERCEL);
  const maxPerIp = isDeployed ? 10 : 30;
  const maxGlobal = isDeployed ? 60 : 120;

  if (now - globalWindowStart > 60000) {
    globalWindowStart = now;
    globalRequests = 0;
  }
  if (++globalRequests > maxGlobal) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((globalWindowStart + 60000 - now) / 1000)),
    };
  }

  pruneExpired(now);

  const clientIp = getClientIp(request);
  const record = ipLimits.get(clientIp);
  if (!record || now > record.resetAt) {
    ipLimits.set(clientIp, { count: 1, resetAt: now + 60000 });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count >= maxPerIp) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function reply(
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    { accepted: false, message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (
    secFetchSite &&
    !["same-origin", "same-site", "none"].includes(secFetchSite)
  )
    return reply(403, "Cross-site requests are not permitted.");

  const origin = request.headers.get("origin");
  // Only the deployed origins may submit. The localhost pair is added solely
  // for local review, so a deployed build cannot be bypassed by a caller
  // claiming `Origin: http://localhost:3001`.
  const deployedOrigins = [
    siteOrigin,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ];
  const localOrigins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
  ];
  const isDeployed = Boolean(process.env.VERCEL);
  const allowedOrigins = isDeployed && hasCanonicalOrigin
    ? deployedOrigins
    : [...deployedOrigins, ...localOrigins];
  if (!origin || !allowedOrigins.includes(origin))
    return reply(403, "This request must be sent from the TriYantra website.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply(415, "Use the website form to send your requirement.");
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    const response = reply(
      429,
      "Too many requests. Please wait a minute and try again.",
    );
    response.headers.set("Retry-After", String(rateLimit.retryAfter));
    return response;
  }
  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, "Enter a valid request.");
    let total = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 16384) {
        await reader.cancel();
        return reply(
          413,
          "Your request is too long. Please shorten your message.",
        );
      }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply(400, "Enter a valid request.");
  }
  const { data, errors } = validateLead(payload);
  if (!data)
    return reply(422, "Please check the highlighted fields.", { errors });
  if (
    !formsAvailable() ||
    !(await isWebhookTargetSafe(process.env.LEAD_WEBHOOK_URL || ""))
  )
    return reply(
      503,
      "Online requests are temporarily unavailable. Your request has not been delivered. Please try again later.",
    );
  const started = Date.now();
  let delivered = false;

  try {
    await postSafeWebhook({
      url: process.env.LEAD_WEBHOOK_URL!,
      token: process.env.LEAD_WEBHOOK_TOKEN || "",
      idempotencyKey: data.requestId,
      data,
      timeoutMs: 8000,
    });
    delivered = true;
  } catch (webhookErr) {
    console.warn(
      JSON.stringify({
        event: "webhook_delivery_warning",
        kind: data.kind,
        error: webhookErr instanceof Error ? webhookErr.message : String(webhookErr),
      }),
    );
    // Direct Supabase fallback if webhook fails
    delivered = await persistDirectToSupabase(data);
  }

  if (delivered) {
    console.info(
      JSON.stringify({
        event: "lead_delivery",
        kind: data.kind,
        status: "accepted",
        durationMs: Date.now() - started,
      }),
    );
    const res = NextResponse.json(
      { accepted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    res.cookies.set("triyantra_receipt", receipt(data.kind), {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "strict",
      path: "/confirmation",
      maxAge: 3600,
    });
    return res;
  }

  console.warn(
    JSON.stringify({
      event: "lead_delivery",
      kind: data.kind,
      status: "unconfirmed",
      durationMs: Date.now() - started,
    }),
  );
  return reply(
    502,
    "We could not confirm delivery. Your details are still here. Please try again.",
  );
}

async function persistDirectToSupabase(data: Lead): Promise<boolean> {
  const token =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.LEAD_WEBHOOK_TOKEN;
  if (!token) return false;

  const webhookUrl = process.env.LEAD_WEBHOOK_URL || "";
  let origin = "";
  try {
    const parsed = new URL(webhookUrl);
    if (!parsed.hostname.endsWith(".supabase.co")) return false;
    origin = parsed.origin;
  } catch {
    return false;
  }

  const targetUrl = `${origin}/rest/v1/leads?on_conflict=request_id`;
  if (!(await isWebhookTargetSafe(targetUrl))) return false;

  const row = {
    request_id: data.requestId,
    kind: data.kind,
    full_name: data.fullName,
    work_email: data.workEmail,
    company_name: data.companyName,
    phone: data.phone?.trim() || null,
    employees: data.employees?.trim() || null,
    devices: data.devices?.trim() || null,
    requirement_type: data.requirementType?.trim() || null,
    device_type: data.deviceType?.trim() || null,
    locations: data.locations?.trim() || null,
    start_date: data.startDate?.trim() || null,
    message: data.message?.trim() || null,
  };

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: token,
        Authorization: `Bearer ${token}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });
    return response.ok;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "supabase_direct_delivery_error",
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return false;
  }
}
