import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/navbar-social";
await mkdir(out, { recursive: true });

const winChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const executablePath =
  process.platform === "win32" && winChrome
    ? winChrome
    : process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined;
const browser = await chromium.launch({ headless: true, executablePath });

const report = { base, date: new Date().toISOString(), navbar: {}, social: {}, errors: [] };

function pick(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}

try {
  // ---------- NAVBAR ----------
  for (const width of [390, 360, 768]) {
    for (const theme of width === 360 ? ["light"] : ["light", "dark"]) {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: theme,
      });
      await ctx.addInitScript(() =>
        sessionStorage.setItem("triyantra-intro-v1.2", "seen"),
      );
      const page = await ctx.newPage();
      page.on("pageerror", (e) => report.errors.push(`nav ${width}/${theme}: ${e.message}`));
      await page.goto(base, { waitUntil: "networkidle" });

      const m = await page.evaluate(() => {
        const pick = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        };
        const hdr = document.querySelector(".site-header");
        const before = getComputedStyle(hdr, "::before");
        const glass = {
          leftAbs: hdr.getBoundingClientRect().x + parseFloat(before.left),
          rightAbs:
            hdr.getBoundingClientRect().x +
            hdr.getBoundingClientRect().width -
            parseFloat(before.right),
          topAbs: hdr.getBoundingClientRect().y + parseFloat(before.top),
          bottomAbs:
            hdr.getBoundingClientRect().y +
            parseFloat(before.top) +
            parseFloat(before.height),
        };
        const logo = document.querySelector(".header-logo .brand-source");
        const lg = logo.getBoundingClientRect();
        return {
          logo: pick(logo),
          toggle: pick(document.querySelector(".theme-toggle")),
          menu: pick(document.querySelector(".mobile-menu")),
          quote: pick(document.querySelector(".nav-quote")),
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          gapLeft: Math.round(lg.left - glass.leftAbs),
          gapTop: Math.round(lg.top - glass.topAbs),
          gapBottom: Math.round(glass.bottomAbs - lg.bottom),
          glass,
        };
      });
      report.navbar[`${width}-${theme}`] = m;

      if (width === 390 && theme === "light") await page.screenshot({ path: `${out}/mobile-navbar-390-light.png` });
      if (width === 390 && theme === "dark") await page.screenshot({ path: `${out}/mobile-navbar-390-dark.png` });
      if (width === 360 && theme === "light") await page.screenshot({ path: `${out}/mobile-navbar-360.png` });
      await ctx.close();
      console.log(`[NAV] ${width}/${theme} → left ${m.gapLeft}px top ${m.gapTop}px bottom ${m.gapBottom}px overflow ${m.overflowX}`);
    }
  }

  // ---------- SOCIAL ROW ----------
  for (const width of [390, 1440]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      colorScheme: "light",
    });
    await ctx.addInitScript(() =>
      sessionStorage.setItem("triyantra-intro-v1.2", "seen"),
    );
    const page = await ctx.newPage();
    page.on("pageerror", (e) => report.errors.push(`social ${width}: ${e.message}`));
    await page.goto(base, { waitUntil: "networkidle" });

    const f = await page.evaluate(() => {
      const rows = [...document.querySelectorAll(".footer-follow .social-button, .follow-us-section .social-button")];
      const out = [];
      for (const row of rows) {
        const icon = row.querySelector(".social-icon-svg");
        const iconId = icon ? icon.closest(".social-button").dataset.id : null;
        const texts = [...row.querySelectorAll("span")]
          .filter((s) => !s.classList.contains("social-icon-svg"))
          .map((s) => s.textContent.trim())
          .filter(Boolean);
        out.push({
          iconPresent: !!row.querySelector(".social-icon-svg"),
          visibleText: texts,
          ariaLabel: row.getAttribute("aria-label"),
          href: row.getAttribute("href"),
          tag: row.tagName,
        });
      }
      return out;
    });
    report.social[`${width}`] = f;

    const foll = page.locator("#follow-us").first();
    await foll.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await foll.screenshot({ path: `${out}/footer-x-${width}.png` });
    await ctx.close();
    console.log(`[SOCIAL] ${width} → ${JSON.stringify(f)}`);
  }

  await writeFile(`${out}/measurements.json`, JSON.stringify(report, null, 2));
  if (report.errors.length) console.log("ERRORS:", report.errors.slice(0, 10));
} finally {
  await browser.close();
}