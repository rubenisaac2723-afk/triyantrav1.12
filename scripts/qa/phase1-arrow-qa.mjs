/**
 * Phase 1 QA: Disclosure arrow system — comprehensive screenshot audit
 * Uses correct TriYantra selectors (header.site-header, nav.desktop-nav, etc.)
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://127.0.0.1:3001";
const OUT = "output/playwright/phase1-qa";
mkdirSync(OUT, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  // ======== DESKTOP LIGHT ========
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "light");
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Remove inert from header (it's set during intro animation)
    await page.evaluate(() => {
      document.querySelector("header.site-header")?.removeAttribute("inert");
    });
    await page.waitForTimeout(300);

    const header = page.locator("header.site-header");
    await header.screenshot({ path: `${OUT}/navbar-light-closed.png` });

    // Open Solutions dropdown
    const solutionsSummary = page.locator("nav.desktop-nav details summary").first();
    await solutionsSummary.click();
    await page.waitForTimeout(800);
    await header.screenshot({ path: `${OUT}/navbar-light-solutions-open.png` });

    // Close and open Platform
    await solutionsSummary.click();
    await page.waitForTimeout(300);
    const platformSummary = page.locator("nav.desktop-nav details summary").nth(1);
    await platformSummary.click();
    await page.waitForTimeout(800);
    await header.screenshot({ path: `${OUT}/navbar-light-platform-open.png` });
    await platformSummary.click();
    await page.waitForTimeout(300);

    // Open Resources
    const resourcesSummary = page.locator("nav.desktop-nav details summary").nth(2);
    await resourcesSummary.click();
    await page.waitForTimeout(800);
    await header.screenshot({ path: `${OUT}/navbar-light-resources-open.png` });
    await resourcesSummary.click();

    await ctx.close();
    console.log("✅ Desktop light done");
  }

  // ======== DESKTOP DARK ========
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "dark");
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      document.querySelector("header.site-header")?.removeAttribute("inert");
    });
    await page.waitForTimeout(300);

    const header = page.locator("header.site-header");
    await header.screenshot({ path: `${OUT}/navbar-dark-closed.png` });

    const solutionsSummary = page.locator("nav.desktop-nav details summary").first();
    await solutionsSummary.click();
    await page.waitForTimeout(800);
    await header.screenshot({ path: `${OUT}/navbar-dark-solutions-open.png` });
    await solutionsSummary.click();

    await ctx.close();
    console.log("✅ Desktop dark done");
  }

  // ======== MOBILE ========
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "light");
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      document.querySelector("header.site-header")?.removeAttribute("inert");
    });
    await page.waitForTimeout(300);

    const header = page.locator("header.site-header");
    await header.screenshot({ path: `${OUT}/mobile-header-closed.png` });

    // Open mobile menu
    const menuBtn = page.locator("button[aria-label='Open navigation']");
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/mobile-menu-open.png` });
    }

    await ctx.close();
    console.log("✅ Mobile done");
  }

  // ======== RESOURCES / FAQ ========
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "light");
    });
    await page.goto(`${BASE}/resources`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // FAQ
    const faq = page.locator(".faq-list").first();
    if (await faq.isVisible({ timeout: 5000 }).catch(() => false)) {
      await faq.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await faq.screenshot({ path: `${OUT}/faq-closed.png` });

      const faqSummary = faq.locator("details summary").first();
      if (await faqSummary.isVisible()) {
        await faqSummary.click();
        await page.waitForTimeout(500);
        await faq.screenshot({ path: `${OUT}/faq-open.png` });
      }
      console.log("✅ FAQ done");
    } else {
      console.log("⚠ FAQ not found on /resources");
    }

    await ctx.close();
  }

  // ======== HOW IT WORKS (WORKFLOW) ========
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "light");
    });
    await page.goto(`${BASE}/how-it-works`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const workflow = page.locator(".workflow").first();
    if (await workflow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await workflow.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await workflow.screenshot({ path: `${OUT}/workflow-closed.png` });

      const wfSummary = workflow.locator("details summary").first();
      if (await wfSummary.isVisible()) {
        await wfSummary.click();
        await page.waitForTimeout(500);
        await workflow.screenshot({ path: `${OUT}/workflow-open.png` });
      }
      console.log("✅ Workflow done");
    } else {
      console.log("⚠ Workflow not found on /how-it-works");
    }

    await ctx.close();
  }

  // ======== CONTACT (CUSTOM SELECT + ESTIMATOR) ========
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "light");
    });
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Custom select
    const customSelect = page.locator(".custom-select").first();
    if (await customSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await customSelect.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await customSelect.screenshot({ path: `${OUT}/custom-select-closed.png` });

      const selectBtn = customSelect.locator("button").first();
      await selectBtn.click();
      await page.waitForTimeout(500);
      // Screenshot wider area to capture dropdown
      await page.screenshot({ path: `${OUT}/custom-select-open-page.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
      console.log("✅ Custom select done");
    } else {
      console.log("⚠ Custom select not found on /contact");
    }

    // Estimator assumptions
    const assumptions = page.locator(".estimate-assumptions").first();
    if (await assumptions.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assumptions.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await assumptions.screenshot({ path: `${OUT}/estimator-assumptions-closed.png` });

      const aSummary = assumptions.locator("summary").first();
      if (await aSummary.isVisible()) {
        await aSummary.click();
        await page.waitForTimeout(500);
        await assumptions.screenshot({ path: `${OUT}/estimator-assumptions-open.png` });
      }
      console.log("✅ Estimator assumptions done");
    } else {
      console.log("⚠ Estimator assumptions not found on /contact");
    }

    await ctx.close();
  }

  // ======== RESPONSIVE MATRIX ========
  const viewports = [
    { w: 360, h: 640, name: "360" },
    { w: 768, h: 1024, name: "768" },
    { w: 1920, h: 1080, name: "1920" },
  ];
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/responsive-${vp.name}w.png`, fullPage: false });
    await ctx.close();
  }
  console.log("✅ Responsive matrix done");

  // ======== THEME SWITCHING ========
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("triyantra-theme", "light");
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      document.querySelector("header.site-header")?.removeAttribute("inert");
    });
    await page.waitForTimeout(300);

    const header = page.locator("header.site-header");
    await header.screenshot({ path: `${OUT}/theme-light-navbar.png` });

    // Dark
    await page.evaluate(() => {
      localStorage.setItem("triyantra-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    });
    await page.waitForTimeout(800);
    await header.screenshot({ path: `${OUT}/theme-dark-navbar.png` });

    // System
    await page.evaluate(() => {
      localStorage.setItem("triyantra-theme", "system");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      document.querySelector("header.site-header")?.removeAttribute("inert");
    });
    await page.waitForTimeout(300);
    await header.screenshot({ path: `${OUT}/theme-system-navbar.png` });

    await ctx.close();
    console.log("✅ Theme switching done");
  }

  await browser.close();
  console.log(`\n✅ Phase 1 QA COMPLETE — screenshots saved to ${OUT}/`);
}

run().catch((err) => {
  console.error("QA FAILED:", err.message);
  process.exit(1);
});
