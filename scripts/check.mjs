import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { validateLead } from "../src/lib/lead.ts";
import { receipt, verifyReceipt } from "../src/lib/delivery.ts";
const valid = {
  kind: "quote",
  requestId: randomUUID(),
  fullName: "Sample Request",
  workEmail: "sample@example.com",
  companyName: "Sample Company",
  website: "",
  requirementType: "Rent",
};
assert.ok(validateLead(valid).data);
for (const invalid of [
  { ...valid, fullName: " " },
  { ...valid, workEmail: "invalid" },
  { ...valid, devices: "1.5" },
  { ...valid, devices: "-1" },
  { ...valid, startDate: "2026-02-31" },
  { ...valid, requirementType: "Other" },
  { ...valid, companyName: [] },
  { ...valid, website: "bot" },
  { ...valid, unexpected: "field" },
  { ...valid, message: "x".repeat(3001) },
])
  assert.equal(validateLead(invalid).data, undefined);
assert.ok(
  validateLead({ ...valid, startDate: "2028-02-29", devices: "12" }).data,
);
process.env.FORM_RECEIPT_SECRET = "test-only-receipt-secret-not-for-production";
const signed = receipt("demo");
assert.equal(verifyReceipt(signed), "demo");
assert.equal(verifyReceipt(signed + "x"), null);
assert.equal(verifyReceipt(undefined), null);
assert.equal(verifyReceipt("quote.1." + "0".repeat(64)), null);
console.log(
  "PASS: validation boundaries, calendar dates, signed receipt and tamper rejection.",
);
const base = process.env.TEST_BASE_URL;
if (base) {
  const headers = { "Content-Type": "application/json", Origin: base };
  for (const [body, status] of [
    [{ ...valid, devices: "-1" }, 422],
    [valid, 503],
  ]) {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    assert.equal(res.status, status);
    assert.equal((await res.json()).accepted, false);
  }
  assert.equal(
    (
      await fetch(base + "/api/leads", {
        method: "POST",
        headers: { ...headers, Origin: "https://example.invalid" },
        body: JSON.stringify(valid),
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(base + "/api/leads", { method: "POST", headers, body: "{" }))
      .status,
    400,
  );
  assert.equal(
    (
      await fetch(base + "/api/leads", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...valid, message: "x".repeat(20000) }),
      })
    ).status,
    413,
  );
  console.log(
    "PASS: API rejects invalid, cross-origin, malformed, oversized and unavailable requests.",
  );
}
if (base && process.env.TEST_RATE_LIMIT === "1") {
  const responses = await Promise.all(
    Array.from({ length: 31 }, () =>
      fetch(base + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: "{}",
      }),
    ),
  );
  const limited = responses.find((r) => r.status === 429);
  assert.ok(limited, "Burst requests must be rate limited");
  assert.equal(limited.headers.get("retry-after"), "60");
  console.log("PASS: burst limit returns 429 with Retry-After.");
}

if (base) {
  for (const path of [
    "/solutions/constructor",
    "/solutions/__proto__",
    "/solutions/hasOwnProperty",
  ]) {
    assert.equal(
      (await fetch(base + path)).status,
      404,
      path + " must not resolve inherited object properties",
    );
  }
  console.log("PASS: prototype-like unknown audience URLs return 404.");
}
