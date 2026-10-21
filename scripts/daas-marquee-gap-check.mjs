import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const libs = process.env.CHROME_LIBS || "/tmp/opencode/chrome-libs/lib";
process.env.LD_LIBRARY_PATH = [libs, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");
const out = "output/playwright/daas-marquee-gap";
await mkdir(out, { recursive: true });

const winChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const executablePath =
  process.platform === "win32" && winChrome
    ? winChrome
    : process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined;
const browser = await chromium.launch({ headless: true, executablePath });

const cases = [
  { name: "daas-marquee-gap-1440-light", width: 1440, height: 1200, theme: "light", offsetAbove: 620 },
  { name: "daas-marquee-gap-1440-dark", width: 1440, height: 1200, theme: "dark", offsetAbove: 620 },
  { name: "daas-marquee-gap-768", width: 768, height: 1200, theme: "light", offsetAbove: 620 },
  { name: "daas-marquee-gap-390", width: 390, height: 844, theme: "light", offsetAbove: 480 },
];

const report = { base, date: new Date().toISOString(), measures: {}, errors: [] };

try {
  for (const c of cases) {
    const context = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      colorScheme: c.theme,
    });
    await context.addInitScript(() =>
      sessionStorage.setItem("triyantra-intro-v1.2", "seen"),
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => report.errors.push(c.name + " PAGE: " + e.message));
    page.on("console", (m) => {
      if (m.type() === "error") report.errors.push(c.name + " CONSOLE: " + m.text());
    });
    await page.goto(base, { waitUntil: "networkidle" });

    const daas = page.locator("#daas-band");
    await daas.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.waitForLoadState("networkidle");

    const geometry = await page.evaluate(() => {
      const daas = document.querySelector("#daas-band");
      const marquee = document.querySelector("#trusted-ecosystem");
      if (!daas || !marquee) return null;
      const db = daas.getBoundingClientRect();
      const mt = marquee.getBoundingClientRect();
      const ys = window.scrollY;
      return {
        scrollY: Math.round(ys),
        daasBottomAbs: Math.round(db.bottom + ys),
        marqueeTopAbs: Math.round(mt.top + ys),
        visibleGap: Math.round(mt.top - db.bottom),
        daasWidth: Math.round(db.width),
        marqueeWidth: Math.round(mt.width),
        marqueeBg: getComputedStyle(marquee).backgroundColor,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        daasRadius: getComputedStyle(daas).borderRadius,
      };
    });

    const targetScroll = geometry
      ? Math.max(0, geometry.daasBottomAbs - c.offsetAbove)
      : 0;
    await page.evaluate((y) => window.scrollTo(0, y), targetScroll);
    await page.waitForTimeout(600);
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: `${out}/${c.name}.png` });

    const measure = await page.evaluate(() => {
      const daas = document.querySelector("#daas-band");
      const marquee = document.querySelector("#trusted-ecosystem");
      const db = daas.getBoundingClientRect();
      const mt = marquee.getBoundingClientRect();
      return {
        daasBottomViewport: Math.round(db.bottom),
        marqueeTopViewport: Math.round(mt.top),
        marqueeTopToViewportBottom: Math.round(window.innerHeight - mt.top),
        marqueeHeadingInView: !!(document.querySelector(".marquee-title") || document.querySelector("h2")),
      };
    });

    report.measures[c.name] = { geometry, measure };
    await context.close();
    console.log(`[GAP] ${c.name} → visibleGap = ${geometry?.visibleGap}px`);
  }

  await writeFile(`${out}/measurements.json`, JSON.stringify(report, null, 2));
  if (report.errors.length) console.log("ERRORS:", report.errors.slice(0, 10));
} finally {
  await browser.close();
}