import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const out = "output/playwright/hero-no-haze";
await mkdir(out, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const report = {
    themes: {},
    viewports: {},
    consoleErrors: [],
    hydrationErrors: [],
  };

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") report.consoleErrors.push(msg.text());
      if (/hydration/i.test(msg.text())) report.hydrationErrors.push(msg.text());
    });

    await page.addInitScript(() => {
      sessionStorage.setItem("triyantra-intro-v1.2", "seen");
    });

    // 1. Audit Themes: Dark and Light
    for (const theme of ["dark", "light"]) {
      console.log(`[QA] Auditing Theme: ${theme.toUpperCase()}...`);
      await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.dataset.themePreference = t;
        localStorage.setItem("triyantra-theme", t);
      }, theme);
      await page.waitForTimeout(6000); // Wait for sequence to complete and settle on SIMPLIFIED.

      const metrics = await page.evaluate(() => {
        const mask = document.querySelector(".hero-intro-mask");
        const track = document.querySelector(".hero-intro-track");
        const word = document.querySelector(".hero-intro-word.is-final");
        const getStyles = (el) => {
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          return {
            bg: cs.backgroundColor,
            bgImg: cs.backgroundImage,
            boxShadow: cs.boxShadow,
            textShadow: cs.textShadow,
            filter: cs.filter,
            backdropFilter: cs.backdropFilter,
            color: cs.color,
          };
        };
        return {
          mask: getStyles(mask),
          track: getStyles(track),
          word: getStyles(word),
          wordText: word?.textContent?.trim(),
        };
      });

      console.log(`  Word text: "${metrics.wordText}"`);
      console.log(`  Word color: ${metrics.word?.color}`);
      console.log(`  Word textShadow: ${metrics.word?.textShadow}`);
      console.log(`  Mask background: ${metrics.mask?.bg}`);
      console.log(`  Track background: ${metrics.track?.bg}`);

      assert.equal(metrics.wordText, "Simplified.");
      assert.equal(metrics.mask?.bg, "rgba(0, 0, 0, 0)");
      assert.equal(metrics.track?.bg, "rgba(0, 0, 0, 0)");
      assert.equal(metrics.word?.bg, "rgba(0, 0, 0, 0)");
      assert.ok(!metrics.word?.textShadow.includes("56, 189, 248"), "Zero blue text shadow allowed");

      report.themes[theme] = {
        pass: true,
        wordColor: metrics.word?.color,
        textShadow: metrics.word?.textShadow,
      };

      const wordBox = await page.evaluate(() => {
        const el = document.querySelector(".hero-intro-mask");
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x - 30, y: r.y - 15, width: r.width + 60, height: r.height + 30 };
      });

      if (wordBox) {
        await page.screenshot({
          path: `${out}/theme-${theme}-simplified-zoom.png`,
          clip: {
            x: Math.max(0, wordBox.x),
            y: Math.max(0, wordBox.y),
            width: Math.min(1440, wordBox.width),
            height: wordBox.height,
          },
        });
      }
    }

    // 2. Audit Viewports: 390, 768, 1366, 1440, 1920
    const viewports = [
      { name: "mobile-390", width: 390, height: 844 },
      { name: "tablet-768", width: 768, height: 1024 },
      { name: "laptop-1366", width: 1366, height: 768 },
      { name: "desktop-1440", width: 1440, height: 900 },
      { name: "ultrawide-1920", width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      console.log(`[QA] Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const vpPage = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await vpPage.addInitScript(() => {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      });
      await vpPage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

      // Wait until timeline completes and Simplified settles in mask center (dist < 2)
      const pollStart = Date.now();
      while (Date.now() - pollStart < 8500) {
        const d = await vpPage.evaluate(() => {
          const mask = document.querySelector(".hero-intro-mask");
          const word = document.querySelector(".hero-intro-word.is-final");
          if (!mask || !word) return 999;
          const maskRect = mask.getBoundingClientRect();
          const wordRect = word.getBoundingClientRect();
          return Math.abs((wordRect.top + wordRect.height / 2) - (maskRect.top + maskRect.height / 2));
        });
        if (d < 2 && Date.now() - pollStart > 5500) {
          break;
        }
        await vpPage.waitForTimeout(100);
      }

      const data = await vpPage.evaluate(() => {
        const mask = document.querySelector(".hero-intro-mask");
        const word = document.querySelector(".hero-intro-word.is-final");
        const maskRect = mask?.getBoundingClientRect();
        const wordRect = word?.getBoundingClientRect();
        const cs = word ? window.getComputedStyle(word) : null;
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        return {
          overflowX: scrollWidth > innerWidth,
          maskOverflow: mask ? window.getComputedStyle(mask).overflow : "",
          wordText: word?.textContent?.trim(),
          wordColor: cs?.color,
          textShadow: cs?.textShadow,
          distFromMaskCenter: maskRect && wordRect ? Math.abs((wordRect.top + wordRect.height / 2) - (maskRect.top + maskRect.height / 2)) : 999,
        };
      });

      console.log(`  OverflowX: ${data.overflowX ? "FAIL" : "PASS (0px)"}`);
      console.log(`  Active Word: "${data.wordText}" (dist: ${data.distFromMaskCenter.toFixed(1)}px)`);
      console.log(`  Mask overflow: ${data.maskOverflow}`);

      assert.equal(data.overflowX, false, `No horizontal overflow at ${vp.width}px`);
      assert.equal(data.wordText, "Simplified.");
      assert.equal(data.maskOverflow, "hidden");
      assert.ok(data.distFromMaskCenter < 2, "Simplified must land precisely in mask center");

      report.viewports[vp.name] = {
        pass: true,
        overflowX: false,
        dist: data.distFromMaskCenter,
        textShadow: data.textShadow,
      };

      await vpPage.screenshot({
        path: `${out}/${vp.name}-resting.png`,
        clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 800) },
      });

      await vpPage.close();
    }

    assert.equal(report.consoleErrors.length, 0);
    assert.equal(report.hydrationErrors.length, 0);
    console.log("\n✅ ALL NO-HAZE AUDITS PASSED WITH ZERO DEFECTS!\n");
  } finally {
    await browser.close();
    await writeFile(`${out}/qa-report.json`, JSON.stringify(report, null, 2), "utf8");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
