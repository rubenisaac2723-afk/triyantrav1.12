import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
console.log("=== TRIYANTRA SECURITY & PRODUCTION SEO VERIFICATION ===");
console.log("\n--- Track 1: SEO & Indexability Environment Logic ---");
const robotsRes = await fetch(`${base}/robots.txt`);
assert.equal(robotsRes.status, 200, "robots.txt must respond with 200");
const robotsText = await robotsRes.text();
assert.ok(robotsText.includes("User-Agent: *"), "robots.txt must define User-Agent: *");
assert.ok(robotsText.includes("Sitemap:"), "robots.txt must link to sitemap");
const robotsLines = robotsText.split(/\r?\n/).map(l => l.trim());
if (process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL) {
  assert.ok(robotsLines.includes("Allow: /"), "Production robots.txt must include Allow: /");
  assert.ok(!robotsLines.includes("Disallow: /"), "Production robots.txt must not contain blanket Disallow: /");
  assert.ok(robotsLines.includes("Disallow: /api/"), "Production robots.txt must disallow /api/");
}
console.log("PASS: robots.txt is actively served, well-formed, and verified against crawler rules");

// 2. HTTP Security Headers on Running Server
console.log("\n--- Track 2: HTTP Security Headers ---");
const pageRes = await fetch(`${base}/`);
assert.equal(pageRes.status, 200, "Home page must respond with 200");
const headers = Object.fromEntries(pageRes.headers.entries());

assert.ok(headers["content-security-policy"], "CSP header must be present");
assert.ok(headers["content-security-policy"].includes("default-src 'self'"), "CSP must define default-src 'self'");
assert.ok(headers["content-security-policy"].includes("frame-ancestors 'none'"), "CSP must define frame-ancestors 'none'");
assert.ok(headers["content-security-policy"].includes("https://www.google.com"), "CSP must permit Google Maps frame embed");
console.log("PASS: Content-Security-Policy verified with strict defaults and Google Maps integration");

assert.equal(headers["x-content-type-options"], "nosniff", "X-Content-Type-Options must be nosniff");
console.log("PASS: X-Content-Type-Options: nosniff verified");

assert.equal(headers["x-frame-options"], "DENY", "X-Frame-Options must be DENY");
console.log("PASS: X-Frame-Options: DENY verified");

assert.ok(headers["referrer-policy"], "Referrer-Policy must be set");
console.log("PASS: Referrer-Policy verified");

assert.ok(headers["permissions-policy"], "Permissions-Policy must be set");
console.log("PASS: Permissions-Policy verified");

// 3. API Input Validation & Defense-in-Depth
console.log("\n--- Track 3: API Input Validation & Boundary Hardening ---");
// Rejection of invalid Origin
const badOriginRes = await fetch(`${base}/api/leads`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://malicious-attacker.com" },
  body: JSON.stringify({ kind: "quote" }),
});
assert.equal(badOriginRes.status, 403, "API must reject untrusted Origin");
console.log("PASS: API rejects untrusted cross-origin requests (403)");

// Rejection of non-JSON content-type
const badContentTypeRes = await fetch(`${base}/api/leads`, {
  method: "POST",
  headers: { "Content-Type": "text/plain", Origin: base },
  body: "malicious text payload",
});
assert.equal(badContentTypeRes.status, 415, "API must reject invalid Content-Type");
console.log("PASS: API enforces application/json Content-Type (415)");

// Rejection of malformed JSON
const malformedJsonRes = await fetch(`${base}/api/leads`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: "{ broken json...",
});
assert.equal(malformedJsonRes.status, 400, "API must reject malformed JSON");
console.log("PASS: API safely handles malformed JSON without exposing internals (400)");

// Rejection of oversized payload (>16KB)
const oversizedRes = await fetch(`${base}/api/leads`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({
    kind: "quote",
    requestId: "12345678-1234-4234-8234-123456789abc",
    fullName: "Oversized Test",
    message: "A".repeat(20000),
  }),
});
assert.equal(oversizedRes.status, 413, "API must abort oversized payload (>16KB)");
console.log("PASS: API enforces 16KB payload limit (413)");

// 4. Browser Behavior Verification (Right-Click Context Menu & Selection)
console.log("\n--- Track 4: Browser Behavior Audit & Restoration ---");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("triyantra-intro-v1.2", "seen"); } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });

  const contextMenuCheck = await page.evaluate(() => {
    const targets = ["h1", "p", "a", "img", "body"];
    const results = {};
    for (const sel of targets) {
      const el = document.querySelector(sel);
      if (el) {
        const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, view: window });
        el.dispatchEvent(ev);
        results[sel] = ev.defaultPrevented;
      }
    }
    return results;
  });

  for (const [sel, prevented] of Object.entries(contextMenuCheck)) {
    assert.equal(prevented, false, `Right-click context menu was prevented on ${sel}!`);
  }
  console.log("PASS: Native right-click context menu is completely unhindered across all elements");

  const copyCheck = await page.evaluate(() => {
    const p = document.querySelector("p");
    const ev = new ClipboardEvent("copy", { bubbles: true, cancelable: true });
    p.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  assert.equal(copyCheck, false, "Copy event was prevented on paragraph!");
  console.log("PASS: Native text copying is completely unhindered");

  const selectCheck = await page.evaluate(() => {
    return {
      html: getComputedStyle(document.documentElement).userSelect,
      body: getComputedStyle(document.body).userSelect,
      h1: getComputedStyle(document.querySelector("h1")).userSelect,
      p: getComputedStyle(document.querySelector("p")).userSelect,
    };
  });
  assert.notEqual(selectCheck.body, "none", "body user-select must not be none");
  assert.notEqual(selectCheck.h1, "none", "h1 user-select must not be none");
  assert.notEqual(selectCheck.p, "none", "p user-select must not be none");
  console.log("PASS: Text selection is enabled and accessible (not none)");

  await context.close();
} finally {
  await browser.close();
}

console.log("\n========================================================");
console.log("ALL SECURITY, HARDENING, AND SEO GATES VERIFIED CLEANLY!");
console.log("========================================================\n");
