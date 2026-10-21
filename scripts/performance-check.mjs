import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const report = [];
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/opt/google/chrome/chrome"),
  headless: true,
});
try {
  for (const path of ["/", "/platform"]) {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 100000,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.metrics = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.metrics.lcp = e.startTime;
          window.metrics.element = e.element?.outerHTML.slice(0, 250);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.metrics.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => ({
      ...window.metrics,
      ttfb: performance.getEntriesByType("navigation")[0].responseStart,
      transferBytes: performance
        .getEntriesByType("resource")
        .reduce((s, r) => s + r.transferSize, 0),
    }));
    report.push({
      path,
      profile:
        "375px mobile, 150ms latency, 200KB/s download, 4x CPU, cold browser cache",
      ...metrics,
    });
    await page.screenshot({
      path:
        "output/playwright/" +
        (path === "/" ? "home" : "platform") +
        "-slow-mobile.png",
    });
    await context.close();
  }
  await writeFile(
    "output/playwright/performance.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  const edge = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/opt/google/chrome/chrome"),
    headless: true,
  });
  try {
    const page = await edge.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(base + "/platform");
    await page.locator("#portal-tab-supplier").click();
    assert.ok(await page.locator("#portal-panel-supplier").isVisible());
    await page.goto(base + "/contact");
    await page
      .getByRole("button", { name: "Get a Quote", exact: true })
      .click();
    assert.equal(await page.locator(".field-error").count(), 3);
    console.log("PASS: configured Chromium browser portal interaction and form validation.");
  } finally {
    await edge.close();
  }
} finally {
  await browser.close();
}
