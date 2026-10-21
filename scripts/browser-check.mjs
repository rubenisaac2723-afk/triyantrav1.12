import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pageMeta } from "../src/lib/content.ts";
import { articles } from "../src/lib/articles.ts";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/opt/google/chrome/chrome"),
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("triyantra-intro-v1.2", "seen");
  } catch {
    /* The general regression suite should not be blocked by the one-time intro. */
  }
});
const page = await context.newPage();
const issues = [];
const report = {
  routes: [],
  accessibility: [],
  screenshots: [],
  interactions: [],
  links: [],
  errors: issues,
};
const links = new Set();
page.on("pageerror", (e) => issues.push(e.message));
page.on("response", (r) => {
  if (
    ["stylesheet", "script", "image"].includes(r.request().resourceType()) &&
    r.status() >= 400
  )
    issues.push(`Asset ${r.status()}: ${r.url()}`);
});
page.on("console", (m) => {
  if (
    m.type() === "error" &&
    !m.text().includes("Failed to load resource") &&
    !m.text().includes("Encountered a script tag while rendering React component")
  )
    issues.push(m.text());
});
try {
  const introContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const introPage = await introContext.newPage();
  introPage.on("pageerror", (e) => issues.push(e.message));
  introPage.on("console", (m) => {
    if (
      m.type() === "error" &&
      !m.text().includes("Failed to load resource") &&
      !m.text().includes("Encountered a script tag while rendering React component")
    )
      issues.push(m.text());
  });
  await introPage.goto(base + "/contact", { waitUntil: "load" });
  await introPage.evaluate(() =>
    sessionStorage.removeItem("triyantra-intro-v1.2"),
  );
  await introPage.goto(base + "/", { waitUntil: "domcontentloaded" });
  await expect(introPage.locator(".home-hero")).toBeVisible();
  await introPage.waitForTimeout(700);
  await expect(introPage.locator(".brand-intro")).toHaveCount(1);
  await expect(introPage.locator(".brand-intro-logo-box")).toHaveCount(1);
  assert.equal(
    await introPage.evaluate(() => document.documentElement.style.overflow),
    "hidden",
    "Intro locks scroll while playing",
  );
  assert.equal(
    await introPage.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "No horizontal overflow on entry",
  );
  await introPage.reload({ waitUntil: "load" });
  await expect(introPage.locator(".brand-intro")).toHaveCount(0);
  await introContext.close();
  report.interactions.push(
    "One-time vector logo intro plays on first visit; reload/repeat visit enters the homepage cleanly.",
  );

  for (const path of [
    ...Object.keys(pageMeta),
    ...articles.map((a) => "/resources/" + a.slug),
  ]) {
    const response = await page.goto(base + path, { waitUntil: "load" });
    assert.equal(response.status(), 200, path);
    assert.equal(await page.locator("h1").count(), 1, path + " H1");
    assert.ok((await page.title()).length > 10, path + " title");
    assert.ok(
      await page.locator('meta[name="description"]').getAttribute("content"),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      path + " overflow",
    );
    (
      await page
        .locator("a[href]")
        .evaluateAll((els) => els.map((a) => a.getAttribute("href")))
    ).forEach((h) => {
      if (h?.startsWith("/")) links.add(h.split("#")[0]);
    });
    report.routes.push({
      path,
      status: response.status(),
      title: await page.title(),
    });
    if (!path.startsWith("/resources/")) {
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.accessibility.push({
        path,
        width: 1440,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  }
  console.log("Checked all content routes and desktop accessibility.");
  for (const path of links) {
    const res = await context.request.get(base + path);
    assert.equal(res.status(), 200, "broken link " + path);
    report.links.push(path);
  }
  for (const path of [
    "/",
    "/platform",
    "/contact",
    "/resources",
    "/how-it-works",
    "/laptop-desktop-rental",
  ]) {
    await page.goto(base + path, { waitUntil: "load" });
    const file =
      out + "/" + (path === "/" ? "home" : path.slice(1)) + "-desktop.png";
    await page.screenshot({ path: file, fullPage: true, caret: "initial" });
    report.screenshots.push(file);
  }
  await page.goto(base + "/platform", { waitUntil: "load" });
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(page.locator(".portal")).toHaveCount(1);
  for (const id of ["client", "central", "supplier"]) {
    await page.locator("#portal-tab-" + id).click();
    await expect(page.locator("#portal-panel-" + id)).toBeVisible();
    await expect(page.locator(".portal")).toHaveCount(1);
    for (const button of await page
      .locator("#" + id + " .portal-tabs button")
      .all()) {
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("#" + id + " .record").count(), 3);
    }
  }
  await expect(page.locator("#cost-estimator")).toBeVisible();
  report.interactions.push(
    "Three portal tabs with one active panel, all module selectors, and relocated cost estimator on platform page.",
  );
  await page.goto(base + "/resources");
  await page.getByLabel("Search resources").fill("zzzzmissing");
  assert.ok(
    await page.getByRole("heading", { name: "No matching guides" }).isVisible(),
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(await page.locator(".resource-card").count(), 15);
  await page.getByRole("button", { name: "DaaS", exact: true }).click();
  assert.equal(await page.locator(".resource-card").count(), 3);
  report.interactions.push(
    "Resource search, category filter and empty-state reset.",
  );
  await page.goto(base + "/contact?type=Rent&device=Business%20Laptops");
  assert.equal(
    await page.locator("#requirementType-hidden, select#requirementType").inputValue(),
    "Rent",
  );
  assert.equal(
    await page.locator("#deviceType").inputValue(),
    "Business Laptops",
  );
  await page.getByRole("button", { name: "Get a Quote", exact: true }).click();
  assert.equal(await page.locator(".field-error").count(), 3);
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "fullName",
  );
  await page.getByLabel("Full Name *", { exact: true }).fill("QA Sample");
  await page.getByLabel("Work Email *", { exact: true }).fill("qa@example.com");
  await page
    .getByLabel("Company Name *", { exact: true })
    .fill("QA Sample Company");
  await page.route("**/api/leads", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        accepted: false,
        message:
          "Online requests are temporarily unavailable. Your request has not been delivered. Please try again later.",
      }),
    }),
  );
  await page.getByRole("button", { name: "Get a Quote", exact: true }).click();
  await page.locator(".lead-form [role=alert]").waitFor();
  assert.ok(
    (await page.locator(".lead-form [role=alert]").innerText()).includes(
      "not been delivered",
    ),
  );
  assert.equal(await page.locator("#fullName").inputValue(), "QA Sample");
  await page.screenshot({
    path: out + "/quote-unavailable.png",
    fullPage: true,
    caret: "initial",
  });
  await page.unroute("**/api/leads");
  await page.route("**/api/leads", (route) => route.abort());
  await page.getByRole("button", { name: "Get a Quote", exact: true }).click();
  await page
    .getByText("We could not confirm delivery.", { exact: false })
    .waitFor();
  assert.equal(await page.locator("#workEmail").inputValue(), "qa@example.com");
  await page.unroute("**/api/leads");
  await context.setOffline(true);
  await page.getByText("You’re offline.", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Get a Quote", exact: true }).click();
  await page.locator(".form-error").filter({ hasText: "Reconnect" }).waitFor();
  assert.equal(await page.locator("#workEmail").inputValue(), "qa@example.com");
  await context.setOffline(false);
  await page.route("**/api/leads", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        accepted: false,
        message: "Please try again shortly.",
      }),
    });
  });
  await page.getByRole("button", { name: "Get a Quote", exact: true }).click();
  await page
    .getByText("This is taking a little longer.", { exact: false })
    .waitFor();
  assert.equal(await page.locator("#fullName").isDisabled(), true);
  await page.getByText("Please try again shortly.", { exact: false }).waitFor();
  assert.equal(await page.locator("#fullName").inputValue(), "QA Sample");
  assert.equal(await page.locator("#fullName").isDisabled(), false);
  await page.unroute("**/api/leads");
  report.interactions.push(
    "Quote prefills, required-field validation, error focus, unavailable delivery, offline recovery, delayed-request feedback, preserved input.",
  );
  await page.goto(base + "/confirmation");
  assert.ok(
    await page
      .getByRole("heading", { name: "No confirmed submission yet." })
      .isVisible(),
  );
  const missing = await page.goto(base + "/not-a-real-page");
  report.notFoundStatus = missing.status();
  await expect(
    page.getByRole("heading", { name: "Let’s get you to the right place." }),
  ).toBeVisible();
  assert.equal(missing.status(), 404);
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of Object.keys(pageMeta)) {
      await page.goto(base + path, { waitUntil: "load" });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${path} overflow ${width}`,
      );
      if (
        width === 375 &&
        ["/", "/platform", "/contact", "/resources", "/how-it-works"].includes(
          path,
        )
      ) {
        const file =
          out + "/" + (path === "/" ? "home" : path.slice(1)) + "-mobile.png";
        await page.screenshot({ path: file, fullPage: true, caret: "initial" });
        report.screenshots.push(file);
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        report.accessibility.push({
          path,
          width,
          violations: axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        });
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(2200);
  const header = page.locator(".site-header");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-compact", "false");
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-compact", "true");
  await expect(header).toHaveAttribute("data-direction", "down");
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-compact", "true");
  await expect(header).toHaveAttribute("data-direction", "up");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-compact", "false");
  report.interactions.push("Navbar morphs between expanded and centered capsule states with hysteresis and scroll direction.");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(base + "/platform");
  await expect(page.getByRole("tab")).toHaveCount(3);
  await page.locator("#portal-tab-client").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#portal-tab-central")).toBeFocused();
  await expect(page.locator("#portal-panel-central")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.locator("#portal-panel-supplier")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.locator("#portal-panel-client")).toBeVisible();
  await expect(page.locator(".portal")).toHaveCount(1);
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  assert.equal(await page.locator("#mobile-navigation[open]").count(), 1);
  await page
    .locator("#mobile-navigation a")
    .filter({ hasText: "How It Works" })
    .click();
  assert.equal(await page.locator("#mobile-navigation[open]").count(), 0);
  await menu.click();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#mobile-navigation[open]").count(), 0);
  await menu.click();
  await page.locator("#mobile-navigation").click({ position: { x: 1, y: 1 } });
  assert.equal(await page.locator("#mobile-navigation[open]").count(), 0);
  await page.goto(base + "/");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent),
    "Skip to content",
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  assert.equal(
    await page
      .locator(".site-header")
      .evaluate((e) => getComputedStyle(e).backdropFilter),
    "none",
  );
  report.interactions.push(
    "Mobile menu open/close, Escape, route-close, skip link, reduced motion and reduced transparency.",
  );
  const violations = report.accessibility.flatMap((r) =>
    r.violations.map((v) => ({ ...v, path: r.path, width: r.width })),
  );
  await writeFile(out + "/qa-report.json", JSON.stringify(report, null, 2));
  assert.deepEqual(issues, [], "browser console errors");
  assert.deepEqual(violations, [], "accessibility violations");
  console.log(
    `PASS: ${report.routes.length} routes, ${report.links.length} internal URLs, 4 responsive widths, keyboard and form failures.`,
  );
} finally {
  await writeFile(out + "/qa-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
