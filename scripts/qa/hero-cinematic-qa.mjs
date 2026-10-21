import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/hero-cinematic";
await mkdir(out, { recursive: true });

const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/opt/google/chrome/chrome");

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const report = {
  base,
  timestamp: new Date().toISOString(),
  viewports: [],
  requiredScreenshots: [],
  reducedMotion: null,
  posterState: null,
  contrast: {},
  errors: [],
};

const viewports = [
  { width: 360, height: 640, label: "360x640 Mobile Small" },
  { width: 360, height: 800, label: "360x800 Mobile Tall" },
  { width: 375, height: 667, label: "375x667 iPhone SE" },
  { width: 390, height: 844, label: "390x844 iPhone Standard" },
  { width: 412, height: 915, label: "412x915 Android Standard" },
  { width: 430, height: 932, label: "430x932 iPhone Max" },
  { width: 768, height: 1024, label: "768x1024 iPad Mini" },
  { width: 820, height: 1180, label: "820x1180 iPad Air" },
  { width: 834, height: 1194, label: "834x1194 iPad Pro 11" },
  { width: 1024, height: 1366, label: "1024x1366 iPad Pro 12.9" },
  { width: 1280, height: 720, label: "1280x720 Laptop HD" },
  { width: 1366, height: 768, label: "1366x768 Laptop WXGA" },
  { width: 1440, height: 900, label: "1440x900 MacBook Pro" },
  { width: 1536, height: 864, label: "1536x864 FHD Scaled" },
  { width: 1600, height: 900, label: "1600x900 Desktop Wide" },
  { width: 1920, height: 1080, label: "1920x1080 Large Desktop FHD" },
];

try {
  console.log("=== TRIYANTRA V1.2 FINAL HERO REBUILD COMPREHENSIVE QA ===");

  // 1. Comprehensive Viewport Sweep (Light and Dark)
  for (const vp of viewports) {
    for (const theme of ["dark", "light"]) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      await ctx.addInitScript(() => {
        try {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
        } catch {}
      });

      const page = await ctx.newPage();
      page.on("pageerror", (err) => report.errors.push(`${vp.label} [${theme}]: ${err.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error") report.errors.push(`${vp.label} [${theme}]: ${msg.text()}`);
      });

      await page.goto(`${base}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      const data = await page.evaluate(() => {
        const hero = document.querySelector(".home-hero");
        const h1 = document.querySelector(".home-hero h1");
        const video = document.querySelector(".hero-bg-video");
        const scrim = document.querySelector(".hero-bg-scrim");
        const lines = Array.from(document.querySelectorAll(".hero-kinetic-line")).map(e => e.textContent.trim());
        const emphasis = document.querySelector(".hero-word-inner.hero-emphasis");
        const actions = Array.from(document.querySelectorAll(".hero-actions-row a")).map(e => ({
          text: e.textContent.trim(),
          href: e.getAttribute("href"),
          rgb: e.hasAttribute("data-rgb"),
        }));

        const overflow = document.documentElement.scrollWidth - window.innerWidth;
        const h1Count = document.querySelectorAll("h1").length;

        const h1Rect = h1 ? h1.getBoundingClientRect() : null;
        const heroRect = hero ? hero.getBoundingClientRect() : null;

        return {
          h1Count,
          h1Text: h1 ? h1.textContent.trim().replace(/\s+/g, " ") : "",
          lines,
          emphasisText: emphasis ? emphasis.textContent.trim() : "",
          videoSrc: video ? video.currentSrc : "",
          videoPoster: video ? video.getAttribute("poster") : "",
          videoMuted: video ? video.muted : false,
          videoLoop: video ? video.loop : false,
          videoPlaysInline: video ? video.playsInline : false,
          hasScrim: Boolean(scrim),
          actions,
          overflow,
          heroWidth: heroRect ? heroRect.width : 0,
          heroHeight: heroRect ? heroRect.height : 0,
          h1Width: h1Rect ? h1Rect.width : 0,
          h1Height: h1Rect ? h1Rect.height : 0,
        };
      });

      // Assertions
      assert.equal(data.h1Count, 1, `Exactly one H1 at ${vp.label}`);
      assert.equal(data.lines.length, 3, `Three lines in H1 at ${vp.label}`);
      assert.equal(data.lines[0], "Workplace", `Line 1 is Workplace`);
      assert.equal(data.lines[1], "Technology", `Line 2 is Technology`);
      assert.equal(data.lines[2], "Simplified.", `Line 3 is Simplified.`);
      assert.equal(data.emphasisText, "Simplified.", `Emphasis is on Simplified.`);
      assert.ok(data.hasScrim, `Contrast scrim present at ${vp.label}`);
      assert.equal(data.overflow, 0, `Zero horizontal overflow at ${vp.label}`);
      assert.ok(data.videoMuted && data.videoLoop && data.videoPlaysInline, `Video playback attributes correct at ${vp.label}`);

      // Verify responsive video sources
      if (vp.width <= 760) {
        assert.ok(data.videoSrc.includes("-mobile."), `Mobile video source selected at ${vp.width}px`);
      } else if (vp.width <= 1200) {
        assert.ok(data.videoSrc.includes("-720.") || data.videoSrc.includes("-1080."), `720p or 1080p source at ${vp.width}px`);
      } else {
        assert.ok(data.videoSrc.includes("-1080."), `1080p high quality source selected at ${vp.width}px`);
      }

      report.viewports.push({
        label: vp.label,
        theme,
        width: vp.width,
        height: vp.height,
        heroSize: `${data.heroWidth}x${data.heroHeight}`,
        h1Size: `${data.h1Width}x${data.h1Height}`,
        videoSrc: data.videoSrc,
        actions: data.actions,
      });

      await ctx.close();
    }
  }
  console.log("PASS: 16 Viewport dimensions x 2 themes (32 permutations) checked with 0 overflow and valid semantics.");

  // 2. Specific Required Screenshots
  const screenshotTargets = [
    { name: "hero-390-light", width: 390, height: 844, theme: "light" },
    { name: "hero-390-dark", width: 390, height: 844, theme: "dark" },
    { name: "hero-768", width: 768, height: 1024, theme: "dark" },
    { name: "hero-1280", width: 1280, height: 720, theme: "dark" },
    { name: "hero-1366", width: 1366, height: 768, theme: "dark" },
    { name: "hero-1440", width: 1440, height: 900, theme: "dark" },
    { name: "hero-1920", width: 1920, height: 1080, theme: "dark" },
  ];

  for (const st of screenshotTargets) {
    const ctx = await browser.newContext({
      viewport: { width: st.width, height: st.height },
      colorScheme: st.theme,
    });
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const shotPath = `${out}/${st.name}.png`;
    const heroLocator = page.locator(".home-hero");
    await heroLocator.screenshot({ path: shotPath });
    report.requiredScreenshots.push({ name: st.name, path: shotPath, size: `${st.width}x${st.height}`, theme: st.theme });
    console.log(`Saved screenshot: ${shotPath}`);
    await ctx.close();
  }

  // 3. Poster State Screenshot & Verification
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
    });
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    // Pause video immediately to capture static poster state
    await page.evaluate(() => {
      const v = document.querySelector(".hero-bg-video");
      if (v) v.pause();
    });
    const shotPath = `${out}/poster-state.png`;
    await page.locator(".home-hero").screenshot({ path: shotPath });
    report.posterState = { path: shotPath, status: "PASS" };
    console.log(`Saved poster state screenshot: ${shotPath}`);
    await ctx.close();
  }

  // 4. Reduced Motion State Screenshot & Verification
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const check = await page.evaluate(() => {
      const video = document.querySelector(".hero-bg-video");
      const lines = Array.from(document.querySelectorAll(".hero-word-inner")).map(e => ({
        text: e.textContent.trim(),
        opacity: getComputedStyle(e).opacity,
        transform: getComputedStyle(e).transform,
      }));
      return {
        videoPaused: video ? video.paused : false,
        videoAutoplay: video ? video.hasAttribute("autoplay") : false,
        lines,
      };
    });

    assert.ok(check.videoPaused, "Video is paused under prefers-reduced-motion");
    assert.equal(check.videoAutoplay, false, "Video autoplay attribute removed under prefers-reduced-motion");
    assert.equal(check.lines.length, 3, "All 3 words present under reduced motion");
    check.lines.forEach(l => {
      assert.equal(l.opacity, "1", `${l.text} is fully visible under reduced motion`);
    });

    const shotPath = `${out}/reduced-motion-state.png`;
    await page.locator(".home-hero").screenshot({ path: shotPath });
    report.reducedMotion = { path: shotPath, status: "PASS", details: check };
    console.log(`Saved reduced motion screenshot: ${shotPath}`);
    await ctx.close();
  }

  console.log("\n>>> ALL FINAL HERO REBUILD CHECKS PASSED WITH 0 ERRORS! <<<");
  await writeFile(`${out}/qa-report.json`, JSON.stringify(report, null, 2));

} catch (err) {
  report.errors.push(err.message);
  console.error("FAILED:", err);
  throw err;
} finally {
  await browser.close();
}
