import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/about-brand";
await mkdir(out, { recursive: true });

const winChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const executablePath =
  process.platform === "win32" && winChrome
    ? winChrome
    : process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined;
const browser = await chromium.launch({ headless: true, executablePath });

const lum = (r, g, b) => {
  const f = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const cases = [
  { name: "about-brand-1440-light", width: 1440, theme: "light" },
  { name: "about-brand-1440-dark", width: 1440, theme: "dark" },
  { name: "about-brand-390-light", width: 390, theme: "light" },
  { name: "about-brand-390-dark", width: 390, theme: "dark" },
];
const report = { base, date: new Date().toISOString(), measures: {}, errors: [] };

try {
  for (const c of cases) {
    const ctx = await browser.newContext({
      viewport: { width: c.width, height: 900 },
      colorScheme: c.theme,
    });
    await ctx.addInitScript(() =>
      sessionStorage.setItem("triyantra-intro-v1.2", "seen"),
    );
    const page = await ctx.newPage();
    page.on("pageerror", (e) => report.errors.push(`${c.name}: ${e.message}`));
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator(".brand-intro__fallback").count(),
      0,
      `${c.name}: no brand-intro fallback logo layer`,
    );

    const media = page.locator(".home-hero > .product-motion").first();
    await media.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const m = await page.evaluate(() => {
      const el = document.querySelector(".home-hero > .product-motion");
      const frame = el.querySelector(".product-motion-frame");
      const video = el.querySelector("video");
      const cs = (e) => window.getComputedStyle(e);
      const rect = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const mr = rect(el), fr = rect(frame);
      const vs = video ? cs(video) : null;
      const source = el.querySelector("source");
      return {
        media: mr,
        frame: fr,
        renderedAspect: Number((fr.w / fr.h).toFixed(3)),
        sourceAspect: video && video.videoHeight ? Number((video.videoWidth / video.videoHeight).toFixed(3)) : null,
        maxWidth: cs(el).maxWidth,
        width: cs(el).width,
        useMobileSource: source ? source.getAttribute("media") : null,
        poster: video ? video.getAttribute("poster") : null,
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        insideHeadingZone: fr.left >= 40 && fr.width > 0,
      };
    });
    report.measures[c.name] = m;
    await page.screenshot({ path: `${out}/${c.name}.png` });
    await ctx.close();
    console.log(`[BRAND] ${c.name} → ${JSON.stringify(m)}`);
  }

  const logoLum = lum(23, 61, 110);
  const panelLum = lum(238, 245, 255);
  const pageNavylum = lum(16, 23, 34);
  report.contrast = {
    logo_on_panel: Number(ratio(logoLum, panelLum).toFixed(2)),
    logo_on_navy: Number(ratio(logoLum, pageNavylum).toFixed(2)),
    note: "target AA=4.5 AAA=7 for logo glyph legibility",
  };
  console.log("\n[CONTRAST]", JSON.stringify(report.contrast, null, 2));

  await writeFile(`${out}/measurements.json`, JSON.stringify(report, null, 2));
  if (report.errors.length) console.log("ERRORS:", report.errors.slice(0, 10));
} finally {
  await browser.close();
}