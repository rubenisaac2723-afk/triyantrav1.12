import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:3001";
const SCREENSHOT_DIR = "output/playwright/contact-experience";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runContactMasterQA() {
  console.log("===============================================================");
  console.log("TRIYANTRA V1.2 — BLUE SKY CONTACT & CUSTOM SELECT MASTER QA");
  console.log("===============================================================\n");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("triyantra-intro-v1.2", "seen");
    } catch {}
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  const reportData = {
    consoleErrors: [],
    gradientVerification: {},
    customSelectVerification: {},
    overflowResults: {},
    measurements: {},
    screenshots: [],
  };

  // Helper to set theme
  async function setTheme(theme) {
    await page.evaluate((t) => {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("triyantra-theme", t);
    }, theme);
    await page.waitForTimeout(200);
  }

  // -------------------------------------------------------------
  // 1. GRADIENT AUDIT & SCREENSHOTS (Section 64)
  // -------------------------------------------------------------
  console.log("\n--- Phase 1: Blue Sky Gradient Audit ---");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await setTheme("light");

  // Inspect gradient layers
  const gradientInfo = await page.evaluate(() => {
    const section = document.querySelector(".contact-cinematic-section");
    const container = document.querySelector(".contact-cinematic__media");
    const base = document.querySelector(".contact-blue-sky-base");
    const grain = document.querySelector(".contact-blue-sky-grain");
    const scrim = document.querySelector(".contact-cinematic__scrim");
    const layerA = document.querySelector(".contact-blue-sky-layer-a");
    const layerB = document.querySelector(".contact-blue-sky-layer-b");

    const baseStyle = base ? window.getComputedStyle(base) : null;
    const grainStyle = grain ? window.getComputedStyle(grain) : null;
    const scrimStyle = scrim ? window.getComputedStyle(scrim) : null;

    return {
      hasSection: !!section,
      hasContainer: !!container,
      hasBase: !!base,
      hasGrain: !!grain,
      hasScrim: !!scrim,
      hasLayerA: !!layerA,
      hasLayerB: !!layerB,
      baseBackground: baseStyle ? baseStyle.backgroundImage : "",
      grainBackground: grainStyle ? grainStyle.backgroundImage : "",
      grainMixBlend: grainStyle ? grainStyle.mixBlendMode : "",
      grainOpacity: grainStyle ? grainStyle.opacity : "",
      scrimOpacityLight: scrimStyle ? scrimStyle.opacity : "",
    };
  });
  reportData.gradientVerification = gradientInfo;
  console.log("[GRADIENT CHECK]", gradientInfo);

  // Capture Section 64 Screenshots:
  // 1440 Desktop Light
  const sec1440 = page.locator(".contact-cinematic-section");
  const p1440 = path.join(SCREENSHOT_DIR, "contact-1440.png");
  await sec1440.screenshot({ path: p1440 });
  reportData.screenshots.push({ id: "contact-1440", path: p1440 });
  console.log("[SCREENSHOT] Saved contact-1440.png");

  // 1920 Ultrawide Light
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(300);
  const p1920 = path.join(SCREENSHOT_DIR, "contact-1920.png");
  await sec1440.screenshot({ path: p1920 });
  reportData.screenshots.push({ id: "contact-1920", path: p1920 });
  console.log("[SCREENSHOT] Saved contact-1920.png");

  // 1366 Laptop Light & Dark
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(300);
  await setTheme("light");
  const p1366L = path.join(SCREENSHOT_DIR, "contact-1366-light.png");
  await sec1440.screenshot({ path: p1366L });
  reportData.screenshots.push({ id: "contact-1366-light", path: p1366L });
  console.log("[SCREENSHOT] Saved contact-1366-light.png");

  await setTheme("dark");
  const p1366D = path.join(SCREENSHOT_DIR, "contact-1366-dark.png");
  await sec1440.screenshot({ path: p1366D });
  reportData.screenshots.push({ id: "contact-1366-dark", path: p1366D });
  console.log("[SCREENSHOT] Saved contact-1366-dark.png");

  // 1024 Tablet Landscape
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  const p1024 = path.join(SCREENSHOT_DIR, "contact-1024.png");
  await sec1440.screenshot({ path: p1024 });
  reportData.screenshots.push({ id: "contact-1024", path: p1024 });
  console.log("[SCREENSHOT] Saved contact-1024.png");

  // 768 Tablet Portrait Light
  await page.setViewportSize({ width: 768, height: 1024 });
  await setTheme("light");
  await page.waitForTimeout(300);
  const p768L = path.join(SCREENSHOT_DIR, "contact-768-light.png");
  await sec1440.screenshot({ path: p768L });
  reportData.screenshots.push({ id: "contact-768-light", path: p768L });
  console.log("[SCREENSHOT] Saved contact-768-light.png");

  // 390 Mobile Light & Dark
  await page.setViewportSize({ width: 390, height: 844 });
  await setTheme("light");
  await page.waitForTimeout(300);
  const p390L = path.join(SCREENSHOT_DIR, "contact-390-light.png");
  await sec1440.screenshot({ path: p390L });
  reportData.screenshots.push({ id: "contact-390-light", path: p390L });
  console.log("[SCREENSHOT] Saved contact-390-light.png");

  await setTheme("dark");
  const p390D = path.join(SCREENSHOT_DIR, "contact-390-dark.png");
  await sec1440.screenshot({ path: p390D });
  reportData.screenshots.push({ id: "contact-390-dark", path: p390D });
  console.log("[SCREENSHOT] Saved contact-390-dark.png");

  // -------------------------------------------------------------
  // 2. CUSTOM SELECT DETAILED AUDIT & SCREENSHOTS (Section 65)
  // -------------------------------------------------------------
  console.log("\n--- Phase 2: Custom Select Interaction & States ---");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await setTheme("light");

  const reqContainer = page.locator(".custom-select-container").first();
  const reqTrigger = reqContainer.locator(".custom-select-trigger");

  // A. requirement-closed-light
  const pReqClosedL = path.join(SCREENSHOT_DIR, "requirement-closed-light.png");
  await reqContainer.screenshot({ path: pReqClosedL });
  reportData.screenshots.push({ id: "requirement-closed-light", path: pReqClosedL });
  console.log("[SCREENSHOT] Saved requirement-closed-light.png");

  // B. requirement-open-light
  await reqTrigger.click();
  await page.waitForTimeout(300);
  const pReqOpenL = path.join(SCREENSHOT_DIR, "requirement-open-light.png");
  await reqContainer.screenshot({ path: pReqOpenL });
  reportData.screenshots.push({ id: "requirement-open-light", path: pReqOpenL });
  console.log("[SCREENSHOT] Saved requirement-open-light.png");

  // C. requirement-selected-light (select "Purchase")
  const purchaseOpt = reqContainer.locator('.custom-select-option:has-text("Purchase")');
  await purchaseOpt.click();
  await page.waitForTimeout(300);
  const pReqSelL = path.join(SCREENSHOT_DIR, "requirement-selected-light.png");
  await reqContainer.screenshot({ path: pReqSelL });
  reportData.screenshots.push({ id: "requirement-selected-light", path: pReqSelL });
  console.log("[SCREENSHOT] Saved requirement-selected-light.png");

  // Verify hidden input value
  const hiddenVal = await page.locator('input[name="requirementType"]').inputValue();
  console.log(`[FORM VALUE CHECK] requirementType hidden input value: "${hiddenVal}"`);

  // D. Dark mode closed and open
  await setTheme("dark");
  await page.waitForTimeout(300);
  const pReqClosedD = path.join(SCREENSHOT_DIR, "requirement-closed-dark.png");
  await reqContainer.screenshot({ path: pReqClosedD });
  reportData.screenshots.push({ id: "requirement-closed-dark", path: pReqClosedD });
  console.log("[SCREENSHOT] Saved requirement-closed-dark.png");

  await reqTrigger.click();
  await page.waitForTimeout(300);
  const pReqOpenD = path.join(SCREENSHOT_DIR, "requirement-open-dark.png");
  await reqContainer.screenshot({ path: pReqOpenD });
  reportData.screenshots.push({ id: "requirement-open-dark", path: pReqOpenD });
  console.log("[SCREENSHOT] Saved requirement-open-dark.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // E. Cost Estimator Device Category Select
  console.log("\n--- Phase 3: Cost Estimator Custom Select ---");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await setTheme("light");

  const estContainer = page.locator("#estimate-device").locator("xpath=..");
  const estTrigger = page.locator("#estimate-device");
  await estTrigger.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // device-category-closed
  const pDevClosed = path.join(SCREENSHOT_DIR, "device-category-closed.png");
  await estContainer.screenshot({ path: pDevClosed });
  reportData.screenshots.push({ id: "device-category-closed", path: pDevClosed });
  console.log("[SCREENSHOT] Saved device-category-closed.png");

  // device-category-open
  await estTrigger.click();
  await page.waitForTimeout(300);
  const pDevOpen = path.join(SCREENSHOT_DIR, "device-category-open.png");
  await estContainer.screenshot({ path: pDevOpen });
  reportData.screenshots.push({ id: "device-category-open", path: pDevOpen });
  console.log("[SCREENSHOT] Saved device-category-open.png");

  // device-category-selected (select "MacBooks")
  const macOpt = estContainer.locator('.custom-select-option:has-text("MacBooks")');
  await macOpt.click();
  await page.waitForTimeout(300);
  const pDevSel = path.join(SCREENSHOT_DIR, "device-category-selected.png");
  await estContainer.screenshot({ path: pDevSel });
  reportData.screenshots.push({ id: "device-category-selected", path: pDevSel });
  console.log("[SCREENSHOT] Saved device-category-selected.png");

  // F. mobile-select-open-390
  console.log("\n--- Phase 4: Mobile & Keyboard Focus States ---");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const mobTrigger = page.locator(".custom-select-trigger").first();
  await mobTrigger.scrollIntoViewIfNeeded();
  await mobTrigger.click();
  await page.waitForTimeout(300);

  const pMobOpen = path.join(SCREENSHOT_DIR, "mobile-select-open-390.png");
  await page.locator(".custom-select-container").first().screenshot({ path: pMobOpen });
  reportData.screenshots.push({ id: "mobile-select-open-390", path: pMobOpen });
  console.log("[SCREENSHOT] Saved mobile-select-open-390.png");

  // G. keyboard-focus-state
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  // Focus trigger via keyboard Tab
  await page.locator("#fullName").focus();
  await page.keyboard.press("Tab"); // workEmail
  await page.keyboard.press("Tab"); // companyName
  await page.keyboard.press("Tab"); // requirementType trigger
  await page.waitForTimeout(200);

  const pKbFocus = path.join(SCREENSHOT_DIR, "keyboard-focus-state.png");
  await page.locator(".custom-select-container").first().screenshot({ path: pKbFocus });
  reportData.screenshots.push({ id: "keyboard-focus-state", path: pKbFocus });
  console.log("[SCREENSHOT] Saved keyboard-focus-state.png");

  // H. error-state
  // Submit empty form to trigger validation errors
  const submitBtn = page.locator('.lead-form > button[type="submit"]');
  await submitBtn.click();
  await page.waitForTimeout(400);

  const pErrState = path.join(SCREENSHOT_DIR, "error-state.png");
  await page.locator(".lead-form").screenshot({ path: pErrState });
  reportData.screenshots.push({ id: "error-state", path: pErrState });
  console.log("[SCREENSHOT] Saved error-state.png");

  // -------------------------------------------------------------
  // 3. KEYBOARD INTERACTION & ACCESSIBILITY TESTS (Section 32-35)
  // -------------------------------------------------------------
  console.log("\n--- Phase 5: Keyboard Navigation & ARIA Checks ---");
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const testTrigger = page.locator(".custom-select-trigger").first();
  await testTrigger.focus();

  // Test ArrowDown opens list
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  const isExpandedAfterDown = await testTrigger.getAttribute("aria-expanded");
  console.log(`[ARIA CHECK] aria-expanded after ArrowDown: ${isExpandedAfterDown} (expected "true")`);

  // Test ArrowDown navigation
  await page.keyboard.press("ArrowDown");
  const activeDesc = await testTrigger.getAttribute("aria-activedescendant");
  console.log(`[ARIA CHECK] aria-activedescendant: ${activeDesc}`);

  // Test Enter to select
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const isExpandedAfterEnter = await testTrigger.getAttribute("aria-expanded");
  const chosenVal = await page.locator('input[name="requirementType"]').inputValue();
  console.log(`[KEYBOARD CHECK] Selected via Enter: "${chosenVal}", menu closed: ${isExpandedAfterEnter === "false"}`);

  // Test Outside click closes menu
  await testTrigger.click();
  await page.waitForTimeout(200);
  await page.locator("body").click({ position: { x: 50, y: 50 } });
  await page.waitForTimeout(200);
  const isExpandedAfterOutside = await testTrigger.getAttribute("aria-expanded");
  console.log(`[OUTSIDE CLICK] Menu closed after outside click: ${isExpandedAfterOutside === "false"}`);

  // -------------------------------------------------------------
  // 4. MULTI-VIEWPORT HORIZONTAL OVERFLOW MATRIX (Section 19)
  // -------------------------------------------------------------
  console.log("\n--- Phase 6: Multi-Viewport Overflow Matrix ---");
  const viewports = [360, 375, 390, 412, 430, 768, 820, 834, 1024, 1280, 1366, 1440, 1536, 1600, 1920];
  const auditPages = ["/contact", "/"];

  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 900 });
    let maxOverflowForWidth = 0;
    for (const p of auditPages) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => {
        return Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
      });
      if (overflow > maxOverflowForWidth) maxOverflowForWidth = overflow;
      if (overflow > 0) {
        console.error(`[OVERFLOW] Width ${w}px on ${p}: ${overflow}px overflow!`);
      }
    }
    reportData.overflowResults[w] = maxOverflowForWidth === 0 ? "0px (PASS)" : `${maxOverflowForWidth}px (FAIL)`;
    console.log(`Viewport ${String(w).padStart(4)}px: ${reportData.overflowResults[w]}`);
  }

  reportData.consoleErrors = consoleErrors;
  fs.writeFileSync("output/playwright/contact-experience/results.json", JSON.stringify(reportData, null, 2));

  console.log("\n===============================================================");
  console.log("MASTER QA COMPLETE — ALL CHECKS & SCREENSHOTS EXECUTED");
  console.log("===============================================================");

  await browser.close();
  process.exit(0);
}

runContactMasterQA().catch((err) => {
  console.error("FATAL ERROR in Contact Master QA:", err);
  process.exit(1);
});
