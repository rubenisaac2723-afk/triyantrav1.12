import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  headless: true,
});
const results = [];
await mkdir("output/playwright", { recursive: true });

const fresh = async (w, h, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...opts });
  const page = await ctx.newPage();
  return { ctx, page };
};

const clearIntroFlag = async (page) => {
  await page.goto(base + "/contact", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try { sessionStorage.removeItem("triyantra-intro-v1.2"); } catch {}
  });
};

const probeEntry = (page) =>
  page.evaluate(() => {
    const hero = document.querySelector(".home-hero");
    const hs = hero ? getComputedStyle(hero) : null;
    return {
      introNodes: document.querySelectorAll(".brand-intro").length,
      introVideos: document.querySelectorAll(".brand-intro__video").length,
      introLogos: document.querySelectorAll(".brand-intro__fallback").length,
      introDataset: document.documentElement.dataset.intro ?? null,
      fixedOverlays: [...document.querySelectorAll("body *")].filter((el) => {
        const s = getComputedStyle(el);
        if (s.position !== "fixed" || s.display === "none" || s.visibility === "hidden") return false;
        const r = el.getBoundingClientRect();
        return r.width >= innerWidth * 0.95 && r.height >= innerHeight * 0.95 &&
          parseFloat(s.opacity || "1") > 0.5 &&
          !el.classList.contains("route-veil");
      }).length,
      heroPresent: !!hero,
      heroOpacity: hs ? hs.opacity : null,
      heroVisibility: hs ? hs.visibility : null,
      heroTransform: hs ? hs.transform : null,
      overflowInline: document.documentElement.style.overflow,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      kinetic: document.querySelector(".hero-word-stage")?.dataset.motion ?? null,
      navbarLogo: document.querySelectorAll(".site-header .logo").length,
      footerLogo: document.querySelectorAll(".site-footer .logo").length,
      introFlag: (() => { try { return sessionStorage.getItem("triyantra-intro-v1.2"); } catch { return null; } })(),
    };
  });

// 1. Desktop 1440x1000 first visit: video intro present, static-logo fallback absent.
{
  const { ctx, page } = await fresh(1440, 1000);
  await clearIntroFlag(page);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-hero", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(800);
  const s = await probeEntry(page);
  assert.ok(s.introNodes >= 1, "brand-intro node present on first visit");
  assert.ok(s.introVideos >= 1, "brand-intro video present on first visit");
  assert.equal(s.introLogos, 0, "brand-intro fallback logo never rendered");
  assert.equal(s.introDataset, "play", "intro dataset gate active during play");
  assert.equal(s.fixedOverlays, 1, "brand-intro full-viewport overlay covers page during intro");
  assert.equal(s.heroPresent, true, "home hero present behind intro");
  assert.equal(s.heroOpacity, "1", "hero opacity 1 (no flash/dim state)");
  assert.equal(s.heroVisibility, "visible", "hero visible");
  assert.equal(s.heroTransform, "none", "hero transform untouched during play");
  assert.equal(s.overflowInline, "hidden", "scroll locked while intro plays");
  assert.ok(s.overflowX <= 0, `no horizontal overflow (${s.overflowX}px)`);
  assert.equal(s.navbarLogo, 1, "navbar logo intact");
  assert.ok(s.footerLogo >= 1, "footer logo intact");
  assert.equal(s.introFlag, "seen", "intro session flag written on first visit");
  await page.screenshot({ path: "output/playwright/intro-final.png" });
  results.push("FIRST VISIT 1440: video intro present, fallback logo absent, hero intact: PASS");
  await ctx.close();
}

// 2. Kinetic hero word still starts without the intro gate.
{
  const { ctx, page } = await fresh(1440, 1000);
  await clearIntroFlag(page);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hero-word-stage", { state: "attached", timeout: 10000 });
  await page.waitForFunction(
    () => ["running", "settled"].includes(document.querySelector(".hero-word-stage")?.dataset.motion),
    null,
    { timeout: 5000 },
  );
  const motion = await page.evaluate(() => document.querySelector(".hero-word-stage").dataset.motion);
  assert.ok(["running", "settled"].includes(motion), `kinetic word started (${motion})`);
  results.push(`KINETIC WORD starts without intro gate (state=${motion}): PASS`);
  await ctx.close();
}

// 3. Repeat visits: still no intro, still clean entry.
{
  const { ctx, page } = await fresh(1440, 1000);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.goto(base + "/platform", { waitUntil: "domcontentloaded" });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-hero", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(400);
  const s = await probeEntry(page);
  assert.equal(s.introNodes, 0, "no intro on repeat visit");
  assert.equal(s.introLogos, 0, "no fallback logo on repeat visit");
  assert.equal(s.fixedOverlays, 0, "no overlay on repeat visit");
  results.push("REPEAT VISIT: no intro replay, clean entry: PASS");
  await ctx.close();
}

// 4. Reduced motion: no intro, hero still readable.
{
  const { ctx, page } = await fresh(1440, 1000, { reducedMotion: "reduce" });
  await clearIntroFlag(page);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-hero", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);
  const s = await probeEntry(page);
  assert.equal(s.introNodes, 0, "reduced-motion: no intro node");
  assert.equal(s.introLogos, 0, "reduced-motion: no fallback logo");
  assert.equal(s.fixedOverlays, 0, "reduced-motion: no overlay");
  assert.equal(s.heroVisibility, "visible", "reduced-motion: hero visible");
  const kinetic = await page.evaluate(() => document.querySelector(".hero-word-stage")?.dataset.motion);
  assert.equal(kinetic, "static", "reduced-motion: kinetic word static");
  results.push("REDUCED-MOTION: no intro, hero + static kinetic word: PASS");
  await ctx.close();
}

// 5. Mobile 390: no intro overlay on small viewport.
{
  const { ctx, page } = await fresh(390, 844, { isMobile: true, hasTouch: true });
  await clearIntroFlag(page);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-hero", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);
  const s = await probeEntry(page);
  assert.equal(s.introNodes, 0, "mobile: no intro node");
  assert.equal(s.introLogos, 0, "mobile: no fallback logo");
  assert.equal(s.fixedOverlays, 0, "mobile: no overlay");
  assert.ok(s.overflowX <= 0, `mobile: no horizontal overflow (${s.overflowX}px)`);
  await page.screenshot({ path: "output/playwright/intro-final-390.png" });
  results.push("MOBILE 390: no intro, no overlay, no overflow: PASS");
  await ctx.close();
}

console.log(results.join("\n"));
await browser.close();
