import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/visual-hardening";
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

const widths = [1600, 1440, 1280, 1024, 768, 390, 360];
const themes = ["light", "dark"];

const report = {
  base,
  date: new Date().toISOString(),
  screenshots: [],
  geometry: {},
  errors: [],
  warnings: [],
};

const sectionOrder = [
  ".home-hero",
  "#connected-journey",
  ".audience-strip",
  ".problem",
  ".solutions-section",
  "#estimator",
  "#product-story",
  ".ecosystem-section",
  ".difference",
  "#daas-band",
  "#trusted-ecosystem",
  ".section.wrap:has(.home-steps)",
  ".audience-section",
  ".devices-section",
];

async function probe(page, width, theme) {
  const data = await page.evaluate(
    ({ sectionOrder }) => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          borderTop: cs.borderTopWidth,
          borderBottom: cs.borderBottomWidth,
          radius: cs.borderRadius,
          background: cs.backgroundColor,
        };
      };
      const text = (el) => (el ? (el.textContent || "").trim().slice(0, 60) : "");
      const sections = {};
      for (const sel of sectionOrder) {
        const el = document.querySelector(sel);
        if (el) {
          sections[sel] = {
            rect: rect(el),
            heading: text(el.querySelector("h1, h2, h3")),
            eyebrow: text(el.querySelector(".eyebrow")),
            firstH2: text(el.querySelector("h2")),
            h2Font: el.querySelector("h2")
              ? getComputedStyle(el.querySelector("h2")).fontSize
              : null,
            h1Font: el.querySelector("h1")
              ? getComputedStyle(el.querySelector("h1")).fontSize
              : null,
            lead: rect(el.querySelector(".lead")),
          };
        }
      }

      const header = document.querySelector(".site-header");
      const navWrap = document.querySelector(".nav-wrap");
      const headerRect = rect(header);
      const hb = header ? header.getBoundingClientRect() : null;

      const buttonInfo = [...document.querySelectorAll(".button")].map((b) => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return {
          text: (b.textContent || "").trim().slice(0, 30),
          w: Math.round(r.width),
          h: Math.round(r.height),
          fontSize: cs.fontSize,
          radius: cs.borderRadius,
          bg: cs.backgroundColor,
          color: cs.color,
          py: cs.paddingTop,
          px: cs.paddingLeft,
        };
      });

      const footerCols = [...document.querySelectorAll(".footer-col, .footer-brand")].map((c) => {
        const r = c.getBoundingClientRect();
        return {
          cls: c.className,
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          strong: c.querySelector("strong") ? c.querySelector("strong").textContent : "",
          links: c.querySelectorAll("a").length,
        };
      });

      const allHeadings = [...document.querySelectorAll("h1, h2, h3")].map((h) => ({
        tag: h.tagName,
        level: Math.round(parseFloat(getComputedStyle(h).fontSize)),
        weight: getComputedStyle(h).fontWeight,
        text: (h.textContent || "").trim().slice(0, 40),
      }));

      const allEyebrows = [...document.querySelectorAll(".eyebrow")].map((e) => ({
        fontSize: getComputedStyle(e).fontSize,
        letterSpacing: getComputedStyle(e).letterSpacing,
        text: (e.textContent || "").trim().slice(0, 30),
        y: Math.round(e.getBoundingClientRect().y),
      }));

      const wraps = [...document.querySelectorAll(".wrap")].map((w) => {
        const r = w.getBoundingClientRect();
        return { cls: (w.className || "").toString().slice(0, 40), w: Math.round(r.width), x: Math.round(r.x) };
      });

      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        headerRect,
        navWrap: navWrap ? rect(navWrap) : null,
        sections,
        buttonInfo,
        footerCols,
        allHeadings,
        allEyebrows,
        wraps,
      };
    },
    { sectionOrder },
  );
  return data;
}

try {
  for (const theme of themes) {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: 1200 },
        colorScheme: theme,
      });
      await context.addInitScript(() =>
        sessionStorage.setItem("triyantra-intro-v1.2", "seen"),
      );
      const page = await context.newPage();
      page.on("pageerror", (e) => report.errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") report.errors.push(m.text());
        if (m.type() === "warning") report.warnings.push(m.text());
      });
      await page.goto(base, { waitUntil: "networkidle" });
      const key = `${width}-${theme}`;

      // top-of-page
      await page.screenshot({ path: `${out}/audit-top-${key}.png` });
      report.screenshots.push(`audit-top-${key}.png`);

      // full page
      const full = await page.screenshot({ path: `${out}/audit-full-${key}.png`, fullPage: true });
      report.screenshots.push(`audit-full-${key}.png`);

      report.geometry[key] = await probe(page, width, theme);

      // scroll through sections and capture close-ups
      for (const sel of sectionOrder) {
        const loc = page.locator(sel);
        if ((await loc.count()) === 0) continue;
        try {
          await loc.first().scrollIntoViewIfNeeded();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(350);
          const name = sel.replace(/[^a-z0-9]+/gi, "-").slice(0, 30);
          await loc.first().screenshot({ path: `${out}/audit-sec-${name}-${key}.png` });
          report.screenshots.push(`audit-sec-${name}-${key}.png`);
        } catch (e) {
          report.warnings.push(`section ${sel} @ ${key}: ${e.message.split("\n")[0]}`);
        }
      }
      await context.close();
      console.log(`[AUDIT] ${key} done`);
    }
  }

  report.summary = {
    screenshots: report.screenshots.length,
    errors: report.errors.length,
    warnings: report.warnings.length,
  };
  await writeFile(`${out}/audit-geometry.json`, JSON.stringify(report, null, 2));
  console.log(
    `[AUDIT] Saved ${report.screenshots.length} screenshots + geometry JSON to ${out}`,
  );
  if (report.errors.length) console.log("ERRORS:", report.errors.slice(0, 10));
  if (report.warnings.length) console.log("WARNINGS:", report.warnings.slice(0, 10));
} finally {
  await browser.close();
}