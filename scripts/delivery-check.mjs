import assert from "node:assert/strict";
import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3002";
const port = new URL(base).port;
let mode = "accept";
const ids = new Set();
let accepted = 0;
const attempts = [];
const upstream = createServer(
  {
    key: readFileSync("output/playwright/test-key.pem"),
    cert: readFileSync("output/playwright/test-cert.pem"),
  },
  async (req, res) => {
    let text = "";
    for await (const chunk of req) text += chunk;
    const data = JSON.parse(text);
    attempts.push(data.requestId);
    if (mode === "timeout") return;
    assert.equal(req.headers.authorization, "Bearer local-test-token");
    assert.equal(req.headers["idempotency-key"], data.requestId);
    await new Promise((r) => setTimeout(r, 500));
    if (mode === "reject") {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ accepted: false }));
      return;
    }
    if (!ids.has(data.requestId)) {
      ids.add(data.requestId);
      accepted++;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ accepted: true }));
  },
);
await new Promise((r) => upstream.listen(3443, "127.0.0.1", r));
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", port, "-H", "127.0.0.1"],
  {
    windowsHide: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: base,
      LEAD_WEBHOOK_URL: "https://127.0.0.1:3443/leads",
      LEAD_WEBHOOK_TOKEN: "local-test-token",
      FORM_RECEIPT_SECRET: "local-test-receipt-secret-at-least-32-characters",
      NODE_EXTRA_CA_CERTS: resolve("output/playwright/test-cert.pem"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
app.stdout.on("data", (d) => (logs += d));
app.stderr.on("data", (d) => (logs += d));
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
      (process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : "/opt/google/chrome/chrome"),
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  for (const kind of ["quote", "demo"]) {
    await page.goto(base + (kind === "demo" ? "/contact?type=Demo" : "/contact"), {
      timeout: 90000,
    });
    assert.equal(
      await page.locator(".form-notice").count(),
      0,
      "configured forms must be available",
    );
    await page.evaluate(() => {
      window.testEvents = [];
      window.addEventListener("triyantra:analytics", (e) =>
        window.testEvents.push(e.detail),
      );
    });
    await page.getByLabel("Full Name *", { exact: true }).fill("Local Test");
    await page
      .getByLabel("Work Email *", { exact: true })
      .fill("local@example.com");
    await page
      .getByLabel("Company Name *", { exact: true })
      .fill("Local Test Company");
    mode = "reject";
    await page
      .getByRole("button", {
        name: kind === "demo" ? "Request a Demo" : "Get a Quote",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Sending request…" }).waitFor();
    await page.locator(".lead-form [role=alert]").waitFor();
    assert.ok(
      (await page.locator(".lead-form [role=alert]").innerText()).includes(
        "could not confirm delivery",
      ),
      await page.locator(".lead-form [role=alert]").innerText(),
    );
    assert.equal(await page.locator("#fullName").inputValue(), "Local Test");
    const firstId = attempts.at(-1);
    await page
      .getByRole("button", {
        name: kind === "demo" ? "Request a Demo" : "Get a Quote",
        exact: true,
      })
      .click();
    await page.locator(".lead-form [role=alert]").waitFor();
    assert.equal(
      attempts.at(-1),
      firstId,
      "Unchanged retries reuse the request reference",
    );
    if (kind === "quote") {
      mode = "timeout";
      await page
        .getByRole("button", { name: "Get a Quote", exact: true })
        .click();
      await page.locator(".lead-form [role=alert]").waitFor();
      assert.ok(
        (await page.locator(".lead-form [role=alert]").innerText()).includes(
          "could not confirm delivery",
        ),
      );
      assert.equal(await page.locator("#companyName").isDisabled(), false);
    }
    await page.locator("#companyName").fill("Updated Local Test Company");
    mode = "accept";
    await page
      .getByRole("button", {
        name: kind === "demo" ? "Request a Demo" : "Get a Quote",
        exact: true,
      })
      .click();
    await page.waitForURL("**/confirmation");
    await page
      .getByRole("heading", { name: "Your request has been received." })
      .waitFor();
    assert.notEqual(
      attempts.at(-1),
      firstId,
      "Changed fields use a new request reference",
    );
    const events = await page.evaluate(() => window.testEvents);
    assert.ok(
      events.some((e) => e.event === "form_completion" && e.kind === kind),
    );
    assert.ok(
      events.every((e) => !JSON.stringify(e).includes("local@example.com")),
    );
    const cookies = await context.cookies(base + "/confirmation");
    const cookie = cookies.find((c) => c.name === "triyantra_receipt");
    assert.ok(cookie.httpOnly && cookie.sameSite === "Strict");
    await page.screenshot({
      path: `output/playwright/${kind}-local-mock-confirmation.png`,
      fullPage: true,
    });
  }
  assert.equal(accepted, 2);
  assert.ok(logs.includes('"status":"accepted"'));
  assert.ok(!logs.includes("local@example.com"));
  assert.ok(!logs.includes("local-test-token"));
  console.log(
    "PASS: quote and demo pending, real server-to-local-HTTPS acknowledgment, provider rejection, retry, signed confirmation and PII-free analytics/logging. LOCAL MOCK ONLY; no company delivery verified.",
  );
} finally {
  if (browser) await browser.close();
  app.kill();
  upstream.closeAllConnections();
  await new Promise((r) => upstream.close(r));
}
