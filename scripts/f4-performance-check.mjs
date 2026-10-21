import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import { calculateEstimate } from "../src/lib/estimator-engine.ts";
import { estimatorConfig } from "../src/lib/estimator-config.ts";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3003";
const report = { base, profiles: [], rgb: {}, errors: [], warnings: [] };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE, headless: true });
await mkdir("output/playwright/f4", { recursive: true });
try {
  for (const width of [1440, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width < 500, isMobile: width < 500 });
    await context.addInitScript(() => {
      sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      window.f4Metrics = { shifts: [], longTasks: [], updates: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput)
          window.f4Metrics.shifts.push({ time: entry.startTime, value: entry.value, estimator: entry.sources?.some((source) => source.node?.closest?.("#cost-estimator")) });
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        window.f4Metrics.longTasks.push(...list.getEntries().map((entry) => ({ time: entry.startTime, duration: entry.duration })));
      }).observe({ type: "longtask", buffered: true });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push(message.text());
      if (message.type() === "warning") report.warnings.push(message.text());
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const load = await page.evaluate(() => ({ shifts: window.f4Metrics.shifts, end: performance.now() }));
    const section = page.locator("#cost-estimator");
    await section.scrollIntoViewIfNeeded();
    await section.getByRole("radio", { name: "Procure", exact: true }).click();
    await expect(section.locator(".estimate-number")).toHaveText("₹12,50,000");
    await section.getByRole("radio", { name: "Rent", exact: true }).click();
    await expect(section.locator(".estimate-number")).toHaveText("₹37,500");
    await page.locator("#estimate-quantity").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const start = await page.evaluate(() => {
      let started = 0;
      document.querySelector("#estimate-quantity").addEventListener("input", () => { started = performance.now(); }, true);
      new MutationObserver(() => {
        if (!started) return;
        const eventAt = started;
        const commitMs = performance.now() - eventAt;
        started = 0;
        requestAnimationFrame(() => window.f4Metrics.updates.push({ commitMs, frameMs: performance.now() - eventAt }));
      }).observe(document.querySelector(".estimate-summary"), { subtree: true, childList: true, characterData: true });
      return performance.now();
    });
    for (const quantity of [30, 100, 1, 10000, 25]) {
      await page.locator("#estimate-quantity").fill(String(quantity));
      await expect(section.locator(".estimate-number")).toHaveText(new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(quantity * 1500));
      await page.waitForTimeout(250);
    }
    const end = await page.evaluate(() => performance.now());
    await page.waitForTimeout(600);
    const metrics = await page.evaluate(() => window.f4Metrics);
    const sum = (entries) => entries.reduce((total, entry) => total + entry.value, 0);
    const profile = {
      width,
      loadPageCLS: sum(load.shifts),
      loadEstimatorCLS: sum(load.shifts.filter((entry) => entry.estimator)),
      stableQuantityInteractionCLS: sum(metrics.shifts.filter((entry) => entry.time >= start && entry.time <= end)),
      interactionLongTasks: metrics.longTasks.filter((entry) => entry.time >= start && entry.time <= end),
      maxCommitMs: Math.max(...metrics.updates.map((update) => update.commitMs)),
      maxInputToFrameMs: Math.max(...metrics.updates.map((update) => update.frameMs)),
    };
    report.profiles.push(profile);
    assert.ok(metrics.updates.length >= 5);
    assert.ok(profile.loadPageCLS <= 0.1 && profile.loadEstimatorCLS <= 0.1, "Acceptable production load CLS");
    assert.ok(profile.maxCommitMs < 100, "No slow estimator commit");
    assert.equal(profile.interactionLongTasks.length, 0, "No page long tasks during settled estimator quantity edits");

    if (width === 1440) {
      const cdp = await context.newCDPSession(page);
      const docMoveCount = async () => {
        const doc = await cdp.send("Runtime.evaluate", { expression: "document" });
        const docListeners = await cdp.send("DOMDebugger.getEventListeners", { objectId: doc.result.objectId });
        return docListeners.listeners.filter((listener) => listener.type === "pointermove").length;
      };
      const remote = await cdp.send("Runtime.evaluate", { expression: 'document.querySelector("#cost-estimator [role=radio]")' });
      const objectId = remote.result.objectId;
      const before = await cdp.send("DOMDebugger.getEventListeners", { objectId });
      assert.equal(before.listeners.filter((listener) => listener.type === "pointermove").length, 0, "No per-control pointer listeners under the shared delegated system");
      const docMoveBefore = await docMoveCount();
      assert.ok(docMoveBefore >= 1, "One delegated pointer engine is installed at the document level");
      const radio = section.getByRole("radio", { name: "Rent", exact: true });
      await radio.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        window.f4PointerResultMutations = 0;
        new MutationObserver((entries) => { window.f4PointerResultMutations += entries.length; }).observe(document.querySelector(".estimate-summary"), { subtree: true, childList: true, characterData: true, attributes: true });
      });
      await radio.hover({ position: { x: 5, y: 5 } });
      await page.mouse.down();
      await expect(radio).toHaveAttribute("data-nav-pressed", "true");
      await page.mouse.up();
      await expect(radio).not.toHaveAttribute("data-nav-pressed", "true");
      const rect = await radio.boundingBox();
      for (let i = 0; i < 20; i++) await page.mouse.move(rect.x + 8 + i, rect.y + 10);
      assert.equal(await page.evaluate(() => window.f4PointerResultMutations), 0);
      assert.equal(await docMoveCount(), docMoveBefore, "Hovering a control adds no pointer listeners");
      await section.getByRole("link", { name: "Get a Quote" }).click();
      await expect(page).toHaveURL(/\/contact/);
      const f4ListenerTypes = new Set(["pointerenter", "pointermove", "pointerleave", "pointerdown", "pointercancel"]);
      await expect.poll(async () => (await cdp.send("DOMDebugger.getEventListeners", { objectId })).listeners.filter((l) => f4ListenerTypes.has(l.type)).length).toBe(0);
      assert.equal(await docMoveCount(), docMoveBefore, "Single delegated engine persists across navigation with no listener growth");
      report.rgb = { pointerMoveListenersPerControl: 0, delegatedDocumentPointerMoveListeners: docMoveBefore, pointerMoveListenerGrowthOnHover: 0, pointerMoveListenerGrowthAfterNavigation: 0, resultMutationsDuringPointerMoves: 0, remainingPerControlPointerListenersAfterNavigation: 0, pointerUpBloomExpiry: "PASS", sourceReview: "One document-level pointermove feeds a single requestAnimationFrame writing CSS custom properties; hovering a control and navigating add zero listeners; no per-control listeners and no React state in the pointer path" };
    }
    await context.close();
  }
  const started = performance.now();
  for (let i = 0; i < 100000; i++) calculateEstimate(estimatorConfig.defaults);
  report.engineMicrosecondsPerCalculation = ((performance.now() - started) * 1000) / 100000;
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile("output/playwright/f4/performance.json", JSON.stringify(report, null, 2));
  await browser.close();
}
