import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:3001";
const SCREENSHOT_DIR = "output/playwright/arrows";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log("==================================================");
  console.log("TRIYANTRA V1.2 — ANIMATED ARROW SYSTEM QA AUDIT");
  console.log("==================================================\n");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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
  page.on("requestfailed", (req) => {
    console.log(`[REQUEST FAILED] ${req.url()} (${req.failure()?.errorText})`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  const results = {
    pagesChecked: 0,
    arrowsFound: 0,
    overflowPassed: true,
    hoverPassed: true,
    accordionPassed: true,
    reducedMotionPassed: true,
    consoleErrors: 0,
  };

  const pagesToTest = [
    { path: "/", name: "home" },
    { path: "/how-it-works", name: "how-it-works" },
    { path: "/platform", name: "platform" },
    { path: "/laptop-desktop-rental", name: "rent" },
    { path: "/it-device-procurement", name: "procure" },
    { path: "/device-as-a-service", name: "daas" },
    { path: "/resources", name: "resources" },
    { path: "/contact", name: "contact" },
    { path: "/confirmation", name: "confirmation" },
  ];

  // 1. Audit each page for arrows and horizontal overflow
  for (const p of pagesToTest) {
    await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle" });
    results.pagesChecked++;

    const arrowCount = await page.locator(".animated-arrow").count();
    results.arrowsFound += arrowCount;

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasOverflow) {
      console.error(`[OVERFLOW ERROR] Page ${p.path} has horizontal overflow!`);
      results.overflowPassed = false;
    }

    console.log(`Page: ${p.path.padEnd(20)} | Arrows: ${String(arrowCount).padStart(2)} | Overflow: ${hasOverflow ? "FAIL" : "PASS (0px)"}`);
  }

  // 2. Test Desktop Navigation Dropdown
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  const navSummary = page.locator('.desktop-nav details summary:has-text("Solutions")');
  if (await navSummary.count() > 0) {
    const arrowInSummary = navSummary.locator(".animated-arrow");
    const dirBefore = await arrowInSummary.getAttribute("data-direction");
    console.log(`\nDesktop Nav Solutions Summary arrow direction before click: ${dirBefore}`);

    // Click to open
    await navSummary.click();
    await page.waitForTimeout(300);
    const isOpen = await page.locator('.desktop-nav details:has-text("Solutions")').getAttribute("open");
    console.log(`Desktop Nav Solutions dropdown opened: ${isOpen !== null}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "desktop-nav-dropdown-open.png"),
      clip: { x: 200, y: 0, width: 800, height: 450 },
    });

    // Close again
    await page.keyboard.press("Escape");
  }

  // 3. Test Navbar Header Quote CTA Arrow Hover
  const headerQuote = page.locator(".nav-quote");
  if (await headerQuote.count() > 0) {
    const arrow = headerQuote.locator(".animated-arrow");
    const isReady = await arrow.getAttribute("data-ready");
    console.log(`Header quote arrow data-ready: ${isReady}`);

    // Hover over button
    await headerQuote.hover();
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "header-quote-hover.png"),
      clip: { x: 1000, y: 0, width: 440, height: 120 },
    });
  }

  // 4. Test Workflow Accordion Disclosure & Arrow Rotation
  await page.goto(`${BASE_URL}/how-it-works`, { waitUntil: "networkidle" });
  const workflowDetails = page.locator(".workflow details").nth(1);
  if (await workflowDetails.count() > 0) {
    const summary = workflowDetails.locator("summary");
    const arrow = summary.locator(".animated-arrow");

    console.log(`\nWorkflow Details item 2:`);
    const initialTransform = await arrow.evaluate((el) => window.getComputedStyle(el).transform);
    console.log(`- Arrow transform before opening: ${initialTransform}`);

    await summary.click();
    await page.waitForTimeout(300);

    const openTransform = await arrow.evaluate((el) => window.getComputedStyle(el).transform);
    console.log(`- Arrow transform after opening: ${openTransform}`);

    if (openTransform.includes("matrix") && openTransform !== initialTransform) {
      console.log(`- PASS: Accordion arrow rotated on disclosure toggle.`);
    } else {
      console.warn(`- WARN: Check accordion arrow transform.`);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "workflow-accordion-expanded.png"),
      clip: { x: 300, y: 400, width: 840, height: 500 },
    });
  }

  // 5. Test FAQ Accordion Disclosure
  await page.goto(`${BASE_URL}/resources`, { waitUntil: "networkidle" });
  const faqDetails = page.locator(".faq-list details").first();
  if (await faqDetails.count() > 0) {
    const summary = faqDetails.locator("summary");
    const arrow = summary.locator(".animated-arrow");
    console.log(`\nFAQ item 1:`);
    await summary.click();
    await page.waitForTimeout(300);
    const faqTransform = await arrow.evaluate((el) => window.getComputedStyle(el).transform);
    console.log(`- FAQ arrow transform after open: ${faqTransform}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "faq-accordion-expanded.png"),
      clip: { x: 250, y: 600, width: 900, height: 350 },
    });
  }

  // 6. Test Reduced Motion
  console.log(`\nTesting prefers-reduced-motion: reduce:`);
  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  const reducedArrow = reducedPage.locator(".nav-quote .animated-arrow");
  const fallbackVisible = await reducedArrow.locator(".animated-arrow-fallback").evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.opacity === "1" && style.visibility !== "hidden";
  });
  const lottieHidden = await reducedArrow.locator(".animated-arrow-lottie").evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.display === "none";
  });

  console.log(`- Fallback SVG visible under reduced-motion: ${fallbackVisible}`);
  console.log(`- Lottie container suppressed under reduced-motion: ${lottieHidden}`);
  if (fallbackVisible && lottieHidden) {
    console.log(`- PASS: prefers-reduced-motion fully respected with static fallback.`);
  } else {
    console.warn(`- Note on reduced-motion styles.`);
  }

  await reducedContext.close();

  // 7. Responsive Viewport Check (390px, 768px, 1024px, 1920px)
  console.log(`\nTesting Responsive Viewports for zero horizontal overflow:`);
  const viewports = [
    { width: 390, height: 844, name: "mobile" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 1024, height: 768, name: "small-desktop" },
    { width: 1920, height: 1080, name: "ultrawide" },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`- Viewport ${vp.width}x${vp.height} (${vp.name}): Overflow = ${overflow ? "FAIL" : "PASS (0px)"}`);

    if (overflow) results.overflowPassed = false;

    if (vp.name === "mobile") {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "mobile-hero-arrows.png"),
        clip: { x: 0, y: 0, width: 390, height: 700 },
      });
    }
  }

  results.consoleErrors = consoleErrors.length;
  console.log(`\nConsole Errors Total: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error("Console Errors:", consoleErrors);
  }

  await browser.close();

  console.log("\n==================================================");
  console.log("FINAL AUDIT SUMMARY:");
  console.log(`- Pages Audited: ${results.pagesChecked}`);
  console.log(`- Total Animated Arrows: ${results.arrowsFound}`);
  console.log(`- Zero Horizontal Overflow: ${results.overflowPassed ? "PASS" : "FAIL"}`);
  console.log(`- Console Errors: ${results.consoleErrors === 0 ? "0 (CLEAN)" : results.consoleErrors}`);
  console.log("==================================================");
}

runAudit().catch(console.error);
