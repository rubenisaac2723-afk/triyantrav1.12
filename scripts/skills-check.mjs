import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/opt/google/chrome/chrome"),
  headless: true,
});
const results = [];
await mkdir("output/playwright", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  const story = page.locator("#product-story");
  await expect(story).toBeVisible();
  await story.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "output/playwright/skills-home-story.png",
    fullPage: false,
  });
  await story.locator("#story-tab-manage").click();
  await expect(story.locator(".stage-view-title")).toContainText(
    "Fleet Lifecycle Operations",
  );
  assert.equal(
    await story.locator(".stage-actions-row a").getAttribute("href"),
    "/platform",
  );

  let axe = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    axe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
  results.push(
    "Workplace essentials: product story, service controls, chapter switching and desktop axe pass",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await story.locator("#story-tab-rent").click();
  await expect(story.locator(".stage-view-title")).toContainText(
    "Active Hardware Allocations",
  );
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "overflow " + width,
    );
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page
    .locator("#product-story")
    .screenshot({ path: "output/playwright/skills-device-mobile.png" });
  axe = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    axe.violations.map((v) => v.id),
    [],
  );
  await story.locator(".stage-actions-row a").click();
  await expect(page).toHaveURL(/laptop-desktop-rental/);
  await page.goto(base + "/platform");
  assert.equal(await page.locator('.connection-story [role="tab"]').count(), 3);
  assert.equal(await page.locator('[role="tabpanel"] .portal').count(), 1);
  for (const name of ["02 TriYantra Central CRM", "03 Supplier Portal", "01 Client Portal"]) {
    await page.getByRole("tab", { name: new RegExp(name) }).click();
    await expect(page.locator('[role="tabpanel"] .portal')).toHaveCount(1);
  }
  results.push(
    "Reduced motion, widths 320\u20131024, mobile axe, route cleanup, and reused 3 portals pass",
  );
  assert.deepEqual(errors, []);
  await page.close();
  await writeFile(
    "output/playwright/skills-review-check.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results.join("\n"));
} finally {
  await browser.close();
}
