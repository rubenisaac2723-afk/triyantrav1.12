import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { pageMeta } from "../src/lib/content.ts";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/opt/google/chrome/chrome"),
  headless: true,
});
const context = await browser.newContext({
  colorScheme: "light",
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("triyantra-intro-v1.2", "seen");
  } catch {
    /* Appearance checks exercise the settled page rather than the one-time intro. */
  }
});
const page = await context.newPage();
const errors = [];
const report = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
try {
  await page.goto(base);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme-preference",
    "light",
  );

  // Verify theme toggle is removed from desktop navbar
  await expect(page.locator(".theme-toggle")).toHaveCount(0);

  // Verify reload maintains locked light theme
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme-preference",
    "light",
  );

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of Object.keys(pageMeta)) {
      await page.goto(base + path, { waitUntil: "load" });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${path} ${width} overflow`,
      );
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.push({
        path,
        width,
        violations: axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
      if (["/", "/contact", "/platform", "/resources"].includes(path)) {
        await page.screenshot({
          path: `output/playwright/light-${width}-${path.slice(1) || "home"}.png`,
          fullPage: true,
        });
        if (path === "/")
          await page.screenshot({
            path: `output/playwright/light-hero-${width}.png`,
          });
      }
    }
    console.log("Light route/contrast sweep", width);
  }
  for (const width of [320, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "header overflow " + width,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  // Verify standalone theme toggle is removed from mobile navbar
  assert.equal(
    await page.evaluate(() => {
      const t = document.querySelector(".site-header .theme-toggle");
      return !t || getComputedStyle(t).display === "none";
    }),
    true,
    "standalone theme toggle must be removed/hidden from mobile navbar",
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator("#mobile-navigation[open]")).toHaveCount(1);
  const menuAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    menuAxe.violations.map((v) => v.id),
    [],
  );

  // Verify Appearance section is removed from mobile navigation dialog
  assert.equal(
    await page.locator("#mobile-navigation .appearance-section").count(),
    0,
    "Appearance selector must be removed from mobile menu",
  );

  await page.screenshot({ path: "output/playwright/light-mobile-menu.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: "output/playwright/light-hero-390.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: "output/playwright/light-hero-1440.png" });

  const heading = page
    .locator(".difference h2 .split-text, .problem h2 .split-text")
    .first();
  await expect(heading).toHaveClass(/reveal-pending/);
  await heading.evaluate((element) =>
    window.scrollTo({
      top: element.getBoundingClientRect().top + scrollY - innerHeight + 20,
      behavior: "instant",
    }),
  );
  await expect(heading).toHaveClass(/reveal-pending/);
  await page.evaluate(() => window.scrollBy({ top: 100, behavior: "instant" }));
  await expect
    .poll(() => heading.getAttribute("class"))
    .toMatch(/reveal-visible/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(heading).toHaveClass(/reveal-visible/);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".reveal-pending").count(), 0);
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );

  // Even if user's OS is dark, the site remains strictly light mode
  const system = await browser.newContext({ colorScheme: "dark" });
  const systemPage = await system.newPage();
  await systemPage.goto(base, { waitUntil: "domcontentloaded" });
  await expect(systemPage.locator("html")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await systemPage.emulateMedia({ colorScheme: "dark" });
  await expect(systemPage.locator("html")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await system.close();

  assert.deepEqual(errors, [], "console/hydration/CSP errors");
  assert.deepEqual(
    report.filter((r) => r.violations.length),
    [],
    "light accessibility",
  );
  console.log(
    "PASS: light theme lock, responsive navbar, clean mobile menu without theme toggle, light contrast and reduced scroll motion.",
  );
} finally {
  await writeFile(
    "output/playwright/appearance-report.json",
    JSON.stringify({ report, errors }, null, 2),
  );
  await browser.close();
}
