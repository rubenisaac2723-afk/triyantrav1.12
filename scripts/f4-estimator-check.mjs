import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/f4";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/opt/google/chrome/chrome"),
  headless: true,
});
const report = { base, date: new Date().toISOString(), matrix: [], checks: [], errors: [], warnings: [], performance: [] };
async function fresh(width = 1440, theme = "light", extra = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, ...extra });
  await context.addInitScript(() => {
    sessionStorage.setItem("triyantra-intro-v1.2", "seen");
    window.estimatorEvents = [];
    window.addEventListener("triyantra:analytics", (event) => window.estimatorEvents.push(event.detail));
    window.estimatorShifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput && entry.sources?.some((s) => s.node?.closest?.("#cost-estimator")))
          window.estimatorShifts.push(entry.value);
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
    if (message.type() === "warning") report.warnings.push(message.text());
  });
  await page.goto(`${base}/platform`, { waitUntil: "networkidle" });
  await page.locator("#cost-estimator").scrollIntoViewIfNeeded();
  await expect(page.locator("#estimate-quantity")).toHaveValue("0");
  await page.evaluate(() => {
    window.estimatorInputPaint = [];
    let inputAt = 0;
    document.querySelector("#cost-estimator").addEventListener("input", () => { inputAt = performance.now(); }, true);
    new MutationObserver(() => {
      if (!inputAt) return;
      const started = inputAt;
      inputAt = 0;
      requestAnimationFrame(() => window.estimatorInputPaint.push(performance.now() - started));
    }).observe(document.querySelector(".estimate-summary"), { childList: true, subtree: true, characterData: true });
  });
  return { context, page, section: page.locator("#cost-estimator") };
}
async function geometry(page) {
  const bad = await page.evaluate(() => {
    const section = document.querySelector("#cost-estimator");
    return [...section.querySelectorAll("input, select, button, .estimate-number, dd, .button")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < 0 || r.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1;
      }).map((el) => el.id || el.className);
  });
  assert.deepEqual(bad, [], "No clipped controls or currency");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "No page overflow");
}
try {
  for (const width of [1440, 1280, 768, 390, 360]) {
    for (const theme of ["light", "dark"]) {
      const { context, page, section } = await fresh(width, theme, width < 500 ? { isMobile: true, hasTouch: true } : {});
      await expect(section).toBeVisible();
      await expect(section.getByRole("radio", { name: "Rent", exact: true })).toBeChecked();
      await expect(section.locator(".estimate-number")).toHaveText("₹0");
      await expect(section.getByText("Illustrative estimate", { exact: true })).toBeVisible();
      const initialCLS = await page.evaluate(() => window.estimatorShifts.reduce((sum, value) => sum + value, 0));
      await geometry(page);
      await page.locator("#estimate-quantity").fill("25");
      for (const service of ["Procure", "Manage", "Rent"]) {
        await section.getByRole("radio", { name: service, exact: true }).click();
        await expect(section.locator(".estimate-number")).toHaveText(service === "Procure" ? "₹12,50,000" : service === "Manage" ? "₹6,250" : "₹37,500");
        if (service === "Procure") await expect(page.locator("#estimate-duration")).toBeHidden();
        else await expect(page.locator("#estimate-duration")).toBeVisible();
        const axe = await new AxeBuilder({ page }).include("#cost-estimator").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        assert.deepEqual(axe.violations, [], `${width} ${theme} ${service}: axe`);
      }
      await section.getByRole("radio", { name: "Manage", exact: true }).click();
      await page.locator("#estimate-quantity").fill("10");
      await page.locator("#estimate-duration").fill("6");
      await expect(section.locator(".estimate-number")).toHaveText("₹2,500");
      await expect(section.locator("[data-estimate-total]")).toHaveText("₹15,000");
      await section.getByRole("button", { name: "Reset", exact: true }).click();
      const navs = await page.evaluate(() => performance.getEntriesByType("navigation").length);
      await page.locator("#estimate-quantity").fill("50");
      await expect(section.locator(".estimate-number")).toHaveText("₹75,000");
      await page.locator("#estimate-duration").fill("6");
      await expect(section.locator("[data-estimate-total]")).toHaveText("₹4,50,000");
      const devEl = page.locator("#estimate-device");
      if ((await devEl.getAttribute("role")) === "combobox") {
        await devEl.click();
        await page.locator('[role="option"][data-value="performance-laptop"]').click();
      } else {
        await devEl.selectOption("performance-laptop");
      }
      await expect(section.locator(".estimate-number")).toHaveText("₹1,25,000");
      await page.locator("#estimate-rate").fill("2000");
      await expect(section.locator(".estimate-number")).toHaveText("₹1,00,000");
      assert.equal(await page.evaluate(() => performance.getEntriesByType("navigation").length), navs);
      for (const invalid of ["", "-1", "1.5", "10001"]) {
        await page.locator("#estimate-quantity").fill(invalid);
        await expect(section.locator(".estimate-empty")).toBeVisible();
        await expect(page.locator("#estimate-quantity")).toHaveAttribute("aria-invalid", "true");
        assert.doesNotMatch(await section.innerText(), /NaN|Infinity|undefined/);
      }
      await page.locator("#estimate-quantity").fill("10000");
      await page.locator("#estimate-rate").fill("1000000");
      await page.locator("#estimate-duration").fill("60");
      await expect(section.locator("[data-estimate-total]")).toHaveText("₹6,00,00,00,00,000");
      await geometry(page);
      for (const service of ["Procure", "Manage", "Rent"]) {
        await section.getByRole("radio", { name: service, exact: true }).click();
        await page.locator("#estimate-rate").fill("1000000");
        await expect(section.locator(".estimate-number")).toHaveText("₹10,00,00,00,000");
        await geometry(page);
        assert.doesNotMatch(await section.locator(".estimate-summary").innerText(), /\d[eE][+-]\d/);
      }
      await page.locator("#estimate-quantity").fill("1");
      await page.locator("#estimate-duration").fill("1");
      await page.locator("#estimate-rate").fill("1");
      await expect(section.locator(".estimate-number")).toHaveText("₹1");
      await expect(section.locator("[data-estimate-total]")).toHaveText("₹1");
      await geometry(page);
      await section.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(section.locator(".estimate-number")).toHaveText("₹0");
      await page.evaluate(() => {
        document.querySelectorAll("header, .skip-link").forEach((el) => el.setAttribute("style", "visibility:hidden"));
      });
      await section.screenshot({ path: `${out}/${width}-${theme}.png` });
      await page.evaluate(() => {
        document.querySelectorAll("header, .skip-link").forEach((el) => el.removeAttribute("style"));
      });
      await section.getByRole("link", { name: "Get a Quote" }).scrollIntoViewIfNeeded();
      await expect(section.getByRole("link", { name: "Get a Quote" })).toBeInViewport();
      const shifts = await page.evaluate(() => window.estimatorShifts);
      const inputPaint = await page.evaluate(() => window.estimatorInputPaint);
      report.performance.push({ width, theme, initialEstimatorCLS: initialCLS, syntheticInteractionCLS: shifts.reduce((sum, v) => sum + v, 0) - initialCLS, maxInputToFrameMs: Math.max(0, ...inputPaint) });
      report.matrix.push({ width, theme, services: "PASS", inputs: "PASS", reset: "PASS", INR: "PASS", overflow: "PASS", axe: "PASS" });
      await context.close();
    }
  }

  {
    const { context, page, section } = await fresh();
    await section.getByRole("radio", { name: "Rent", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(section.getByRole("radio", { name: "Procure", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(section.getByRole("radio", { name: "Manage", exact: true })).toBeChecked();
    await page.keyboard.press("Home");
    await page.keyboard.press("Tab");
    await expect(page.locator("#estimate-device")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#estimate-quantity")).toBeFocused();
    assert.notEqual(await page.locator("#estimate-quantity").evaluate((el) => getComputedStyle(el).outlineStyle), "none");
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("32");
    await expect(section.locator(".estimate-number")).toHaveText("₹48,000");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(section.locator("summary")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(section.locator("details")).toHaveAttribute("open", "");
    await page.keyboard.press("Tab");
    await expect(section.getByRole("link", { name: "Get a Quote" })).toBeFocused();
    const handoff = new URL(await section.getByRole("link", { name: "Get a Quote" }).getAttribute("href"), base);
    assert.deepEqual([...handoff.searchParams.keys()].sort(), ["device", "devices", "months", "type"]);
    await expect(section.locator(".estimate-summary")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator(".theme-toggle")).toHaveCount(0);
    await expect(page.locator("#estimate-quantity")).toHaveValue("32");
    await expect(section.locator(".estimate-number")).toHaveText("₹48,000");
    await section.getByRole("link", { name: "Get a Quote" }).click();
    await expect(page).toHaveURL(/\/contact\?/);
    await expect(page.locator("#requirementType-hidden, select#requirementType")).toHaveValue("Rent");
    await expect(page.locator("#devices")).toHaveValue("32");
    await expect(page.locator("#deviceType")).toHaveValue("Business Laptops");
    await expect(page.locator("#message")).toContainText("Planning duration: 12 months");
    const events = await page.evaluate(() => window.estimatorEvents.filter((e) => e.event.startsWith("estimator_")));
    assert.equal(events.filter((e) => e.event === "estimator_started").length, 1);
    assert.ok(events.some((e) => e.event === "estimator_quote_clicked"));
    for (const event of events) assert.ok(Object.keys(event).every((key) => ["event", "service", "status"].includes(key)));
    await page.goto(`${base}/contact?devices=99999999&months=999&device=x&type=bad`);
    await expect(page.locator("#devices")).toHaveValue("");
    await expect(page.locator("#message")).toHaveValue("");
    report.checks.push("Keyboard, focus, disclosure, live semantics, theme-state preservation, quote prefill, invalid handoff and analytics privacy: PASS");
    await context.close();
  }
  {
    const { context, page, section } = await fresh();
    await page.locator("#estimate-quantity").fill("25");
    // A changed result confirms hydration before testing native pointer listeners.
    await section.getByRole("radio", { name: "Procure", exact: true }).click();
    await expect(section.locator(".estimate-number")).toHaveText("₹12,50,000");
    const rent = section.getByRole("radio", { name: "Rent", exact: true });
    await rent.click();
    await expect(section.locator(".estimate-number")).toHaveText("₹37,500");
    await page.mouse.move(0, 0);
    await rent.hover({ position: { x: 8, y: 8 } });
    await expect.poll(() => rent.evaluate((el) => el.style.getPropertyValue("--nav-glow-opacity"))).toBe("1");
    const before = await rent.evaluate((el) => el.style.getPropertyValue("--pointer-x"));
    await rent.hover({ position: { x: 45, y: 25 } });
    await expect.poll(() => rent.evaluate((el) => el.style.getPropertyValue("--pointer-x"))).not.toBe(before);
    const press = await rent.evaluate((el) => {
      el.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "mouse", bubbles: true }));
      return el.getAttribute("data-nav-pressed");
    });
    assert.equal(press, "true");
    await expect(rent).not.toHaveAttribute("data-nav-pressed", "true");
    await page.mouse.move(0, 0);
    await expect.poll(() => rent.evaluate((el) => el.style.getPropertyValue("--nav-glow-opacity"))).toBe("0");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await rent.hover();
    await expect(section.locator(".estimate-number")).toHaveCSS("animation-name", "none");
    assert.equal(await rent.evaluate((el) => getComputedStyle(el, "::after").display), "none");
    await page.locator("#estimate-quantity").fill("10");
    await expect(section.locator(".estimate-number")).toHaveText("₹15,000");
    await page.emulateMedia({ forcedColors: "active" });
    await section.getByRole("radio", { name: "Manage", exact: true }).click();
    await expect(section.locator(".estimate-number")).toHaveText("₹2,500");
    assert.notEqual(await section.getByRole("radio", { name: "Manage", exact: true }).evaluate((el) => getComputedStyle(el).outlineStyle), "none");
    await geometry(page);
    report.checks.push("Shared F3 RGB enter/move/press/leave, reduced motion and forced colors: PASS");
    await context.close();
  }
  {
    const { context, section } = await fresh(390, "light", { isMobile: true, hasTouch: true });
    const manage = section.getByRole("radio", { name: "Manage", exact: true });
    await manage.tap();
    assert.equal(await manage.evaluate((el) => el.getAttribute("data-nav-pressed")), null);
    assert.equal(await manage.evaluate((el) => getComputedStyle(el, "::after").display), "none");
    report.checks.push("Touch: no desktop follow or press bloom: PASS");
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
