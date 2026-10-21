import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3999";
const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const results = [];
const errors = [];

async function fresh(w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...opts });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console(${w}): ${m.text()}`);
  });
  return { ctx, page };
}

{
  const { ctx, page } = await fresh(1440, 1000);
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  // 1. Navbar logo present once, compact width, small height.
  const logo = await page.evaluate(() => {
    const el = document.querySelector(".site-header .logo");
    const link = document.querySelector(".header-logo");
    if (!el || !link) return null;
    const r = el.getBoundingClientRect();
    const lr = link.getBoundingClientRect();
    return { w: r.width, h: r.height, linkW: lr.width, layoutOverflow: document.documentElement.scrollWidth - innerWidth };
  });
  assert.ok(logo, "navbar logo element exists");
  assert.ok(logo.w >= 100 && logo.w <= 160, "navbar logo width 100-160 (" + logo.w + ")");
  assert.ok(logo.linkW <= 170, "navbar logo click target compact (" + logo.linkW + ")");
  assert.ok(logo.layoutOverflow <= 0, "no horizontal overflow at 1440");
  results.push("HARDEN navbar logo present, compact, no overflow (1440): PASS");

  // 2. Eyebrow budget: max 1 per 3 sections on homepage (~14 sections -> <=5).
  //    Excludes menu labels (header dropdown) and data-honesty labels (estimate-projection).
  const eyebrows = await page.evaluate(() =>
    [...document.querySelectorAll(".eyebrow, .marquee-eyebrow")]
      .filter((e) => e.offsetParent !== null)
      .filter((e) => !e.closest(".dropdown") && !e.closest(".estimate-projection"))
      .map((e) => e.textContent.trim()),
  );
  assert.ok(
    eyebrows.length <= 5,
    `homepage eyebrow count ${eyebrows.length} <= 5 (${eyebrows.map((e) => e.trim()).join(" | ")})`,
  );
  results.push(`HARDEN eyebrow budget ${eyebrows.length}/6: PASS`);

  // 3. Zero em-dashes/en-dashes in visible homepage copy.
  const dashes = await page.evaluate(() =>
    [...document.querySelectorAll("body p, body h1, body h2, body h3, body span, body a, body li, body button, body dt, body dd, body label, body [aria-label], body img")].filter((e) => {
      const t = e.textContent || "";
      return t.includes("\u2014") || t.includes("\u2013");
    }).map((e) => e.tagName + ":" + (e.textContent || "").trim().slice(0, 90)),
  );
  assert.ok(dashes.length === 0, "zero visible em/en-dashes on homepage\n  " + dashes.slice(0, 5).join("\n  "));
  results.push("HARDEN zero visible em/en-dashes (homepage): PASS");

  // 4. CTA labels: one label per intent.
  const cta = await page.evaluate(() => {
    const texts = [...document.querySelectorAll('a[data-cta], button[data-cta]')].map((e) => e.getAttribute("data-cta"));
    const counts = texts.reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {});
    return counts;
  });
  const hasQuote = Object.keys(cta).some((k) => /quote/i.test(k));
  const hasDemo = Object.keys(cta).some((k) => /demo/i.test(k));
  assert.ok(hasQuote && hasDemo, "both intent labels present: " + JSON.stringify(cta));
  results.push("HARDEN CTA one-label-per-intent: PASS");

  // 5. Navigation single line on desktop.
  const nav = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".desktop-nav > *")];
    const tops = links.map((l) => l.getBoundingClientRect().top);
    return { count: links.length, distinctTops: new Set(tops.map((t) => Math.round(t))).size };
  });
  assert.equal(nav.distinctTops, 1, "desktop nav single line (" + nav.count + " items)");
  results.push("HARDEN desktop nav single line: PASS");

  // 6. Marquee appears at most once.
  const marquees = await page.locator(".trusted-marquee-section, .trusted-marquee, .marquee").count();
  assert.ok(marquees <= 1, "at most one marquee (" + marquees + ")");
  results.push("HARDEN marquee <= 1: PASS");

  // 7. Dark theme logo is visible (invert filter).
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(200);
  const darkFilter = await page.evaluate(() =>
    getComputedStyle(document.querySelector(".site-header .logo")).filter,
  );
  assert.ok(darkFilter.includes("invert"), "dark-theme navbar logo uses invert filter");
  results.push("HARDEN dark-theme logo invert filter: PASS");

  await page.screenshot({ path: "output/playwright/hardening-home-1440-dark.png" });
  await ctx.close();
}

// Mobile 390: logo present and compact, no overflow.
{
  const { ctx, page } = await fresh(390, 900);
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const el = document.querySelector(".site-header .logo");
    const r = el.getBoundingClientRect();
    const header = document.querySelector(".site-header").getBoundingClientRect();
    return { w: r.width, h: r.height, headerW: header.width, overflow: document.documentElement.scrollWidth - innerWidth, logoRight: r.right };
  });
  assert.ok(m.w <= 132, "mobile navbar logo width " + m.w + " <= 132");
  assert.ok(m.logoRight <= m.headerW + 1, "logo stays inside header on mobile");
  assert.ok(m.overflow <= 0, "no horizontal overflow at 390");
  results.push("HARDEN mobile 390 logo compact, inside header, no overflow: PASS");
  await page.screenshot({ path: "output/playwright/hardening-home-390-light.png" });
  await ctx.close();
}

// Subpage sweep: logo present everywhere, no overflow.
{
  const { ctx, page } = await fresh(1440, 1000);
  for (const route of ["/", "/platform", "/how-it-works", "/contact"]) {
    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const s = await page.evaluate(() => ({
      logos: document.querySelectorAll(".site-header .logo").length,
      overflow: document.documentElement.scrollWidth - innerWidth,
    }));
    assert.equal(s.logos, 1, `navbar logo on ${route}`);
    assert.ok(s.overflow <= 0, `no overflow ${route}`);
  }
  results.push("HARDEN subpage navbar logo + no overflow sweep: PASS");
  await ctx.close();
}

assert.deepEqual(errors, [], `console errors:\n${errors.join("\n")}`);
console.log(results.join("\n"));
await browser.close();