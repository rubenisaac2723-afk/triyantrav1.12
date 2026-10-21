import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const baseline = process.env.GEOMETRY_BASELINE === "1";
const out = `output/playwright/section-geometry${baseline ? "-before" : ""}`;
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined),
});
const report = { baseline, measurements: [], errors: [] };
try {
  for (const width of [1600, 1440, 1366, 1280, 1024, 768, 430, 390, 360]) {
    for (const route of ["/", "/about"]) {
      const themes = width === 1440 ? ["dark", "light"] : ["dark"];
      for (const theme of themes) {
        const name = route === "/" ? `journey-${width}${theme === "light" ? "-light" : ""}`
          : `about-cards-${width}${width === 1440 ? `-${theme}` : ""}`;
        const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: theme });
        await context.addInitScript(() => {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
          window.geometryCLS = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) window.geometryCLS += entry.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
        });
        const page = await context.newPage();
        page.on("pageerror", (e) => report.errors.push(`${name}: ${e.message}`));
        page.on("console", (m) => {
          if (m.type() === "error") report.errors.push(`${name}: ${m.text()}`);
        });
        await page.goto(base + route, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate((route) => {
          const anchor = document.querySelector(route === "/" ? ".estimator-layout" : ".mission-grid");
          const rect = anchor.getBoundingClientRect();
          window.scrollTo({ top: scrollY + (route === "/" ? rect.bottom : rect.top) - 180, behavior: "instant" });
        }, route);
        await page.waitForTimeout(1300);
        const m = await page.evaluate((route) => {
          const rect = (el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom };
          };
          const result = { overflow: document.documentElement.scrollWidth - innerWidth, cls: window.geometryCLS };
          if (route === "/") {
            const story = document.querySelector("#product-story");
            const head = story.querySelector(".section-head");
            const previous = document.querySelector(".estimator-layout");
            return { ...result, gap: rect(head).y - rect(previous).bottom,
              token: parseFloat(getComputedStyle(story.previousElementSibling).paddingBottom),
              minHeight: getComputedStyle(story).minHeight,
              aligned: [head, head.querySelector(".eyebrow"), head.querySelector("h2"), head.querySelector(".lead"), story.querySelector(".story-split")].map((el) => rect(el).x),
              pinned: !!story.closest(".pin-spacer") };
          }
          const cards = [...document.querySelectorAll(".mission-grid article")].map((el) => {
            const style = getComputedStyle(el);
            const last = el.lastElementChild;
            return { ...rect(el), padding: style.padding, radius: style.borderRadius,
              headingTop: rect(el.querySelector("h2")).y, labelOffset: rect(el.firstElementChild).y - rect(el).y,
              naturalHeight: rect(last).bottom - rect(el).y + parseFloat(getComputedStyle(last).marginBottom) +
                parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth) };
          });
          return { ...result, cards, stacked: Math.abs(cards[0].y - cards[1].y) > 1 };
        }, route);
        report.measurements.push({ name, ...m });
        await page.screenshot({ path: `${out}/${name}.png` });
        console.log(name, JSON.stringify(m));
        if (!baseline) {
          assert.equal(m.overflow, 0, `${name}: horizontal overflow`);
          if (route === "/") {
            assert.ok(Math.abs(m.gap - m.token) < 1, `${name}: exactly one existing section gap`);
            assert.equal(m.minHeight, "0px", `${name}: no section minimum height`);
            assert.equal(m.pinned, false);
            assert.ok(m.aligned.every((x) => Math.abs(x - m.aligned[0]) < 1), `${name}: left alignment`);
            const story = page.locator("#product-story");
            const tabs = story.getByRole("tab");
            await tabs.first().focus();
            await page.keyboard.press("ArrowRight");
            await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
            await expect(story.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", await tabs.nth(1).getAttribute("id"));
          } else {
            const [a, b] = m.cards;
            assert.ok(Math.abs(a.width - b.width) < 1, `${name}: equal widths`);
            assert.equal(a.padding, b.padding);
            assert.equal(a.radius, b.radius);
            assert.ok(Math.abs(a.labelOffset - b.labelOffset) < 1);
            if (m.stacked) {
              for (const card of m.cards) assert.ok(Math.abs(card.height - card.naturalHeight) < 1, `${name}: natural stacked height`);
            } else {
              for (const key of ["y", "bottom", "height", "headingTop"]) assert.ok(Math.abs(a[key] - b[key]) < 1, `${name}: aligned ${key}`);
              assert.ok(Math.abs(a.height - Math.max(a.naturalHeight, b.naturalHeight)) < 1, `${name}: no excess card height`);
            }
          }
        }
        await context.close();
      }
    }
  }
  assert.deepEqual(report.errors, [], "No application, console or hydration errors");
} finally {
  await writeFile(`${out}/measurements.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
