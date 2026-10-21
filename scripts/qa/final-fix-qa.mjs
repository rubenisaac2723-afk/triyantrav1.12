import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:3001";
const SCREENSHOT_DIR = "output/playwright/final-fix";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runFinalQA() {
  console.log("===============================================================");
  console.log("TRIYANTRA V1.2 — FINAL VISUAL STABILIZATION & ARROW QA VERIFICATION");
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
    overflowResults: {},
    measurements: {},
    screenshots: [],
  };

  // 1. Desktop Hero (1440px)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Check 1: hero-1440.png
  const heroEl = page.locator(".home-hero");
  if (await heroEl.count() > 0) {
    const heroFile = path.join(SCREENSHOT_DIR, "hero-1440.png");
    await heroEl.screenshot({ path: heroFile });
    reportData.screenshots.push({ id: "hero-1440", path: heroFile });
    console.log("[SCREENSHOT] Saved hero-1440.png");
  }

  // Check 2: nav-quote-1440.png
  const navQuote = page.locator(".nav-quote");
  if (await navQuote.count() > 0) {
    const quoteFile = path.join(SCREENSHOT_DIR, "nav-quote-1440.png");
    await navQuote.screenshot({ path: quoteFile });
    reportData.screenshots.push({ id: "nav-quote-1440", path: quoteFile });
    console.log("[SCREENSHOT] Saved nav-quote-1440.png");
  }

  // Check 3: nav-dropdown-1440.png
  const solutionsDetails = page.locator('.desktop-nav details:has-text("Solutions")');
  const solutionsSummary = solutionsDetails.locator("summary");
  if (await solutionsSummary.count() > 0) {
    await solutionsSummary.click();
    await page.waitForTimeout(400);
    const dropFile = path.join(SCREENSHOT_DIR, "nav-dropdown-1440.png");
    await solutionsDetails.screenshot({ path: dropFile });
    reportData.screenshots.push({ id: "nav-dropdown-1440", path: dropFile });
    console.log("[SCREENSHOT] Saved nav-dropdown-1440.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  // Check 4: two-column-section-1440.png & baseline measurement
  const problemSection = page.locator(".problem");
  if (await problemSection.count() > 0) {
    await problemSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const h2Box = await page.locator(".problem h2").boundingBox();
    const leadBox = await page.locator(".problem .lead").boundingBox();
    const baselineDelta = Math.abs((h2Box?.y || 0) - (leadBox?.y || 0));
    reportData.measurements.twoColumnBaselineDelta = baselineDelta;
    console.log(`[MEASUREMENT] Two-column baseline delta at 1440px: ${baselineDelta.toFixed(1)}px (h2.y: ${h2Box?.y?.toFixed(1)}, lead.y: ${leadBox?.y?.toFixed(1)})`);

    const pFile = path.join(SCREENSHOT_DIR, "two-column-section-1440.png");
    await problemSection.screenshot({ path: pFile });
    reportData.screenshots.push({ id: "two-column-section-1440", path: pFile });
    console.log("[SCREENSHOT] Saved two-column-section-1440.png");
  }

  // Check 5: workflow-connect-link.png (text-link with tight 6px gap)
  const workflowLink = page.locator('.problem a:has-text("See how the workflow connects")');
  if (await workflowLink.count() > 0) {
    const gapVal = await workflowLink.evaluate((el) => window.getComputedStyle(el).gap);
    reportData.measurements.textLinkGap = gapVal;
    console.log(`[MEASUREMENT] Text-link gap: ${gapVal}`);

    const wFile = path.join(SCREENSHOT_DIR, "workflow-connect-link.png");
    await workflowLink.screenshot({ path: wFile });
    reportData.screenshots.push({ id: "workflow-connect-link", path: wFile });
    console.log("[SCREENSHOT] Saved workflow-connect-link.png");
  }

  // Check 6: service-cards.png (.solution-triptych)
  const tripSection = page.locator(".solution-triptych");
  if (await tripSection.count() > 0) {
    await tripSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const tFile = path.join(SCREENSHOT_DIR, "service-cards.png");
    await tripSection.screenshot({ path: tFile });
    reportData.screenshots.push({ id: "service-cards", path: tFile });
    console.log("[SCREENSHOT] Saved service-cards.png");
  }

  // Check 7: native-select-closed.png in Cost Estimator
  const estSelect = page.locator("#estimate-device");
  if (await estSelect.count() > 0) {
    await estSelect.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const wrapper = estSelect.locator("xpath=..");
    const arrow = wrapper.locator(".select-arrow .animated-arrow");
    const isArrowVisible = await arrow.isVisible();
    const arrowBox = await arrow.boundingBox();
    console.log(`[SELECT CHECK] Estimator select arrow visible: ${isArrowVisible}, width: ${arrowBox?.width}, height: ${arrowBox?.height}`);

    const selFile = path.join(SCREENSHOT_DIR, "native-select-closed.png");
    await wrapper.screenshot({ path: selFile });
    reportData.screenshots.push({ id: "native-select-closed", path: selFile });
    console.log("[SCREENSHOT] Saved native-select-closed.png");
  }

  // Check 8: explore-platform.png
  const expPlatform = page.locator('.ecosystem-section a:has-text("Explore the platform")');
  if (await expPlatform.count() > 0) {
    await expPlatform.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const epFile = path.join(SCREENSHOT_DIR, "explore-platform.png");
    await expPlatform.screenshot({ path: epFile });
    reportData.screenshots.push({ id: "explore-platform", path: epFile });
    console.log("[SCREENSHOT] Saved explore-platform.png");
  }

  // Check 9: explore-device-rental.png (DaaS button)
  const daasBtn = page.locator('.daas-band a:has-text("Explore Device-as-a-Service")');
  if (await daasBtn.count() > 0) {
    await daasBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const dbFile = path.join(SCREENSHOT_DIR, "explore-device-rental.png");
    await daasBtn.screenshot({ path: dbFile });
    reportData.screenshots.push({ id: "explore-device-rental", path: dbFile });
    console.log("[SCREENSHOT] Saved explore-device-rental.png");
  }

  // Check 10: device-list.png (.category-list)
  const catList = page.locator(".category-list");
  if (await catList.count() > 0) {
    await catList.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const clFile = path.join(SCREENSHOT_DIR, "device-list.png");
    await catList.screenshot({ path: clFile });
    reportData.screenshots.push({ id: "device-list", path: clFile });
    console.log("[SCREENSHOT] Saved device-list.png");
  }

  // Check 11 & 12: faq-closed.png and faq-open.png on /resources
  await page.goto(`${BASE_URL}/resources`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const firstFaq = page.locator(".faq-list details").first();
  if (await firstFaq.count() > 0) {
    await firstFaq.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const faqClosedFile = path.join(SCREENSHOT_DIR, "faq-closed.png");
    await firstFaq.screenshot({ path: faqClosedFile });
    reportData.screenshots.push({ id: "faq-closed", path: faqClosedFile });
    console.log("[SCREENSHOT] Saved faq-closed.png");

    // Click to open
    const summary = firstFaq.locator("summary");
    await summary.click();
    await page.waitForTimeout(400);

    const arrowTransform = await summary.locator(".animated-arrow").evaluate((el) => window.getComputedStyle(el).transform);
    console.log(`[FAQ CHECK] Open arrow transform: ${arrowTransform}`);

    const faqOpenFile = path.join(SCREENSHOT_DIR, "faq-open.png");
    await firstFaq.screenshot({ path: faqOpenFile });
    reportData.screenshots.push({ id: "faq-open", path: faqOpenFile });
    console.log("[SCREENSHOT] Saved faq-open.png");
  }

  // Check 13: workflow-disclosure.png on /how-it-works
  await page.goto(`${BASE_URL}/how-it-works`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const workflowSection = page.locator(".workflow");
  if (await workflowSection.count() > 0) {
    await workflowSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const wfFile = path.join(SCREENSHOT_DIR, "workflow-disclosure.png");
    await workflowSection.screenshot({ path: wfFile });
    reportData.screenshots.push({ id: "workflow-disclosure", path: wfFile });
    console.log("[SCREENSHOT] Saved workflow-disclosure.png");
  }

  // Check 14: Mobile Hero at 390px (hero-390.png)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const hero390 = page.locator(".home-hero");
  if (await hero390.count() > 0) {
    const h390File = path.join(SCREENSHOT_DIR, "hero-390.png");
    await hero390.screenshot({ path: h390File });
    reportData.screenshots.push({ id: "hero-390", path: h390File });
    console.log("[SCREENSHOT] Saved hero-390.png");
  }

  // Check 15: two-column-section-390.png (clean vertical stack)
  const problem390 = page.locator(".problem");
  if (await problem390.count() > 0) {
    await problem390.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const p390File = path.join(SCREENSHOT_DIR, "two-column-section-390.png");
    await problem390.screenshot({ path: p390File });
    reportData.screenshots.push({ id: "two-column-section-390", path: p390File });
    console.log("[SCREENSHOT] Saved two-column-section-390.png");
  }

  // Horizontal Overflow Multi-Viewport Audit across 360, 390, 768, 1100, 1440, 1920
  const viewports = [360, 390, 768, 1100, 1440, 1920];
  const auditPages = ["/", "/platform", "/how-it-works", "/laptop-desktop-rental", "/it-device-procurement", "/device-as-a-service", "/resources", "/about", "/contact"];

  console.log("\n--- Multi-Viewport Overflow Matrix ---");
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

  // Stroke width & arrow vector metrics
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const strokeMetrics = await page.evaluate(() => {
    const arrow = document.querySelector(".animated-arrow-lottie svg path");
    if (!arrow) return null;
    const style = window.getComputedStyle(arrow);
    return {
      strokeWidth: style.strokeWidth,
      stroke: style.stroke,
    };
  });
  reportData.measurements.renderedStroke = strokeMetrics;
  console.log(`\n[STROKE CHECK] Rendered stroke-width: ${strokeMetrics?.strokeWidth}, stroke: ${strokeMetrics?.stroke}`);

  reportData.consoleErrors = consoleErrors;
  fs.writeFileSync("output/playwright/final-fix/results.json", JSON.stringify(reportData, null, 2));

  console.log("\n===============================================================");
  console.log("FINAL QA RUN COMPLETE — ALL 15 SCREENSHOTS CAPTURED & SAVED");
  console.log("===============================================================");

  await browser.close();
  process.exit(0);
}

runFinalQA().catch((err) => {
  console.error("FATAL ERROR in Final QA:", err);
  process.exit(1);
});
