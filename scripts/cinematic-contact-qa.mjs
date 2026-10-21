import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const sizes = [
  [360, 800],
  [375, 812],
  [390, 844],
  [412, 915],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [834, 1194],
  [1024, 1366],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1600, 900],
  [1920, 1080],
];

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});

const errors = [];
console.log("Starting Universal Responsive & Cinematic Contact QA...");

try {
  // 1. Test Contact Page across all 15 viewports in both Dark and Light themes
  for (const [w, h] of sizes) {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({
        viewport: { width: w, height: h },
        colorScheme: theme,
      });
      await context.addInitScript(() => {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(`[${w}x${h} ${theme}] pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`[${w}x${h} ${theme}] console.error: ${m.text()}`);
      });

      await page.goto(`${base}/contact`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const data = await page.evaluate(() => {
        const root = document.documentElement;
        const overflow = root.scrollWidth - root.clientWidth;
        const section = document.querySelector(".contact-cinematic-section");
        const video = section?.querySelector(".contact-bg-video");
        const overlay = section?.querySelector(".contact-bg-overlay");
        const form = section?.querySelector(".lead-form");
        const formWrapper = section?.querySelector(".contact-form-wrapper");
        const secondary = section?.querySelector(".contact-secondary-block");

        const sRect = section ? section.getBoundingClientRect() : null;
        const fRect = form ? form.getBoundingClientRect() : null;
        const fwRect = formWrapper ? formWrapper.getBoundingClientRect() : null;
        const secRect = secondary ? secondary.getBoundingClientRect() : null;
        const vStyle = video ? getComputedStyle(video) : null;

        return {
          overflow,
          hasSection: !!section,
          hasVideo: !!video,
          hasOverlay: !!overlay,
          hasForm: !!form,
          hasSecondary: !!secondary,
          videoFit: vStyle?.objectFit,
          videoBorder: vStyle?.borderWidth,
          videoOutline: vStyle?.outlineWidth,
          videoMuted: video?.muted,
          videoLoop: video?.loop,
          videoPlaysInline: video?.playsInline,
          videoPoster: video?.poster,
          sectionWidth: sRect?.width,
          formWidth: fRect?.width,
          formWrapperWidth: fwRect?.width,
          formCenterOffset: fwRect && sRect ? Math.abs((sRect.left + sRect.width / 2) - (fwRect.left + fwRect.width / 2)) : 999,
          secondaryBelowForm: secRect && fRect ? secRect.top >= fRect.bottom - 10 : false,
          stepsCount: secondary ? secondary.querySelectorAll(".contact-step-card").length : 0,
        };
      });

      assert.equal(data.overflow, 0, `Horizontal overflow at ${w}x${h} (${theme}): ${data.overflow}px`);
      assert.ok(data.hasSection, `Missing .contact-cinematic-section at ${w}x${h}`);
      assert.ok(data.hasVideo, `Missing .contact-bg-video at ${w}x${h}`);
      assert.ok(data.hasOverlay, `Missing .contact-bg-overlay at ${w}x${h}`);
      assert.ok(data.hasForm, `Missing .lead-form at ${w}x${h}`);
      assert.ok(data.hasSecondary, `Missing .contact-secondary-block at ${w}x${h}`);
      assert.equal(data.videoFit, "cover", `Video object-fit is not cover at ${w}x${h}`);
      assert.ok(data.videoMuted && data.videoLoop && data.videoPlaysInline, `Video missing attributes at ${w}x${h}`);
      assert.ok(data.formCenterOffset < 4, `Form not visually centered at ${w}x${h}, offset: ${data.formCenterOffset}px`);
      assert.ok(data.secondaryBelowForm, `Secondary block not below form at ${w}x${h}`);
      assert.equal(data.stepsCount, 3, `Expected 3 steps in secondary block, got ${data.stepsCount}`);

      if (w <= 430) {
        assert.ok(data.formWidth >= w * 0.82, `Mobile form too narrow at ${w}px: ${data.formWidth}px`);
      } else {
        assert.ok(data.formWidth <= 720, `Desktop form stretched too wide at ${w}px: ${data.formWidth}px`);
      }

      await context.close();
    }
    console.log(`PASS: Contact viewport ${w}x${h} (dark + light)`);
  }

  // 2. Test Prefers-Reduced-Motion on Contact
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${base}/contact`, { waitUntil: "networkidle" });
    const isPaused = await page.evaluate(() => {
      const v = document.querySelector(".contact-bg-video");
      return v ? v.paused : false;
    });
    assert.ok(isPaused, "Background video did not pause under prefers-reduced-motion: reduce");
    await context.close();
    console.log("PASS: Contact prefers-reduced-motion verification");
  }

  // 3. Test Jitter UI Motion Placement 1: Product Story on Home Page
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    const hasPhaseMotion = await page.evaluate(() => {
      const el = document.querySelector(".product-story-phase-motion");
      return !!el;
    });
    assert.ok(hasPhaseMotion, "Missing Jitter UI Motion 1: .product-story-phase-motion");
    await context.close();
    console.log("PASS: Jitter UI Motion 1 (.product-story-phase-motion) verified");
  }

  // 4. Test Jitter UI Motion Placement 2: Portal State on Platform Page
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/platform`, { waitUntil: "networkidle" });
    const hasPortalMotion = await page.evaluate(() => {
      const el = document.querySelector(".portal-state-motion");
      return !!el;
    });
    assert.ok(hasPortalMotion, "Missing Jitter UI Motion 2: .portal-state-motion");
    await context.close();
    console.log("PASS: Jitter UI Motion 2 (.portal-state-motion) verified");
  }

  // 5. Test Jitter UI Motion Placement 3: Confirmation Page Checkmark
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/confirmation`, { waitUntil: "networkidle" });
    const checkSymbol = await page.evaluate(() => {
      const el = document.querySelector(".confirmation-symbol");
      return el ? el.textContent.trim() : null;
    });
    assert.ok(checkSymbol !== null, "Confirmation symbol element missing");
    await context.close();
    console.log("PASS: Jitter UI Motion 3 (Confirmation symbol) verified");
  }

  assert.equal(errors.length, 0, `Encountered console/runtime errors: ${errors.join(", ")}`);
  console.log("\nALL UNIVERSAL RESPONSIVE & CINEMATIC CONTACT CHECKS PASSED PERFECTLY!");
} finally {
  await browser.close();
}
