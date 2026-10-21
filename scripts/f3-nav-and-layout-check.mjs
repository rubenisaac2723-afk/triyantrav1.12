import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  headless: true,
});
const results = [];
const errors = [];
await mkdir("output/playwright", { recursive: true });

const trackConsole = (page) => {
  page.on("console", (msg) => {
    if (msg.type() === "error")
      errors.push(`${page.url()} :: ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => errors.push(`${page.url()} :: ${err.message}`));
};

const fresh = async (w, h, { mobile, dark, reduced } = {}) => {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced,
    deviceScaleFactor: 1,
  });
  // Skip the F2 intro for layout testing by priming its session gate.
  await ctx.addInitScript(() =>
    window.sessionStorage.setItem("triyantra-intro-v1.2", "seen"),
  );
  if (dark)
    await ctx.addInitScript(() =>
      window.localStorage.setItem("triyantra-theme", "dark"),
    );
  const page = await ctx.newPage();
  trackConsole(page);
  return { ctx, page };
};

const setup = async (page, url = "/") => {
  await page.goto(base + url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
};

const nav = (page) => page.locator(".site-header");
const pill = (page) =>
  page.evaluate(() => {
    const el = document.querySelector(".site-header");
    return {
      before: getComputedStyle(el, "::before"),
      after: getComputedStyle(el, "::after"),
      varOpacity: getComputedStyle(el).getPropertyValue("--nav-glow-opacity"),
    };
  });

// ============================================================= NAV
{
  const { ctx, page } = await fresh(1440, 1000);
  await setup(page);
  // 1. No visible chevrons anywhere in the desktop nav.
  const navHtml = await page.evaluate(() => ({
    chevronSpans: document.querySelectorAll(
      ".desktop-nav summary [aria-hidden='true']",
    ).length,
    summaryText: [...document.querySelectorAll(".desktop-nav summary")].map(
      (s) => s.textContent.trim(),
    ),
  }));
  assert.equal(navHtml.chevronSpans, 0, "no aria-hidden chevron spans");
  for (const t of navHtml.summaryText)
    assert.ok(
      !/[⌄˄▲▾▼∧∨>]/.test(t),
      `summary "${t}" has no chevron glyph`,
    );
  assert.deepEqual(
    navHtml.summaryText,
    ["Solutions", "Platform", "Resources"],
    "labels stay Solutions / Platform / Resources",
  );
  results.push("NAV chevrons absent: Solutions/Platform/Resources clean: PASS");

  // 2. Navbar brand present; redundant intro removed; footer logo present.
  const brand = await page.evaluate(() => ({
    navbarLogo: document.querySelectorAll(".site-header .logo").length,
    footerLogos: document.querySelectorAll(".site-footer .logo").length,
    introNodes: document.querySelectorAll(".brand-intro").length,
    introFallback: document.querySelectorAll(".brand-intro__fallback").length,
  }));
  assert.equal(brand.navbarLogo, 1, "navbar has exactly one logo");
  assert.ok(brand.footerLogos >= 1, "footer logo present");
  assert.equal(brand.introNodes, 0, "intro overlay removed");
  assert.equal(brand.introFallback, 0, "duplicate intro logo removed");
  results.push(
    `NAVBAR LOGO PRESENT (navbar=${brand.navbarLogo}); intro=${brand.introNodes}; footer=${brand.footerLogos}: PASS`,
  );

  // 3. Dropdown behavior preserved without chevrons.
  await nav(page).locator("summary", { hasText: "Solutions" }).click();
  assert.equal(
    await page.locator(".desktop-nav details[open]").count(),
    1,
    "details/summary opens Solutions dropdown",
  );
  await nav(page).locator("summary", { hasText: "Solutions" }).focus();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator(".desktop-nav details[open]").count(),
    0,
    "Escape closes dropdown",
  );
  results.push("NAV details/summary + keyboard behavior preserved: PASS");

  // 4. Sticky/compact glass present with fine border and blur.
  await page.mouse.move(720, 500);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForSelector('.site-header[data-compact="true"]', {
    timeout: 5000,
  });
  const glass = await pill(page);
  assert.ok(
    (glass.before.backdropFilter || "").includes("blur"),
    "compact pillar has backdrop blur",
  );
  assert.equal(glass.before.borderTopWidth, "1px", "clean 1px glass hairline");
  await page.waitForFunction(
    () => parseFloat(getComputedStyle(document.querySelector(".site-header"), "::before").borderRadius) >= 998,
    undefined,
    { timeout: 4000 },
  );
  const geom = await page.evaluate(() => {
    const el = document.querySelector(".site-header");
    const b = getComputedStyle(el, "::before");
    return {
      beforeRadius: b.borderRadius,
      afterRadius: getComputedStyle(el, "::after").borderRadius,
      afterDisplay: getComputedStyle(el, "::after").display,
    };
  });
  assert.equal(geom.beforeRadius, geom.afterRadius, "glow mirrors pill radius");
  assert.notEqual(geom.afterDisplay, "none", "glow visible in compact state");
  results.push("NAV glass (compact): blur + 1px hairline + RGB beam geometry: PASS");

  // 5. Pointer enter/move updates coords + glow 0 -> 1; leave -> 0.
  const hbox = await nav(page).boundingBox();
  const inside = { x: hbox.x + hbox.width * 0.5, y: hbox.y + hbox.height * 0.5 };
  const before = await pill(page);
  assert.equal(before.varOpacity, "0", "idle glow opacity 0 (pointer outside)");
  await page.mouse.move(inside.x, inside.y);
  await page.waitForFunction(
    () => {
      const el = document.querySelector(".site-header");
      const x = getComputedStyle(el).getPropertyValue("--pointer-x");
      const o = getComputedStyle(el).getPropertyValue("--nav-glow-opacity");
      return x && x !== "0" && o === "1";
    },
    null,
    { timeout: 5000 },
  );
  const entered = await page.evaluate(() => {
    const el = document.querySelector(".site-header");
    const style = el.style;
    return {
      px: style.getPropertyValue("--pointer-x"),
      py: style.getPropertyValue("--pointer-y"),
      o: getComputedStyle(el).getPropertyValue("--nav-glow-opacity"),
    };
  });
  assert.ok(
    entered.o === "1" && entered.px && entered.py,
    `enter: glow 1, coords (${entered.px}, ${entered.py})`,
  );
  // move across the pill -> coords track
  const moved = inside.x + 260;
  await page.mouse.move(moved, inside.y);
  await page.waitForFunction(
    (min) => {
      const el = document.querySelector(".site-header");
      return parseFloat(el.style.getPropertyValue("--pointer-x")) > min;
    },
    inside.x,
    { timeout: 5000 },
  );
  await page.mouse.move(20, 300); // leave header
  await page.waitForFunction(
    () =>
      document.querySelector(".site-header").style.getPropertyValue("--nav-glow-opacity") ===
      "0",
    null,
    { timeout: 5000 },
  );
  results.push("POINTER enter 0->1, move tracks --pointer-x/y, leave ->0: PASS");

  // 6. Pointer-down pressed state activates and clears within ~300ms.
  await page.mouse.move(inside.x, inside.y);
  await page.waitForTimeout(220);
  await page.mouse.down();
  assert.equal(
    await nav(page).getAttribute("data-nav-pressed"),
    "true",
    "pointerdown sets data-nav-pressed",
  );
  const t0 = Date.now();
  await page.waitForFunction(
    () => !document.querySelector(".site-header").hasAttribute("data-nav-pressed"),
    null,
    { timeout: 2000 },
  );
  const cleared = Date.now() - t0;
  assert.ok(cleared <= 400, `pressed cleared within ${cleared}ms`);
  await page.mouse.up();
  results.push(`POINTERDOWN press activates and clears in ${cleared}ms: PASS`);

  // 7. ThemeToggle works while pointer inside navbar; glow persists across toggle.
  await page.mouse.move(inside.x, inside.y);
  await page.waitForTimeout(220);
  const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
  await nav(page).locator(".theme-toggle").click();
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
  assert.notEqual(themeBefore, themeAfter, "theme toggles");
  assert.equal(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".site-header")).getPropertyValue(
          "--nav-glow-opacity",
        ),
    ),
    "1",
    "glow stays on after theme switch",
  );
  results.push(`THEME toggle works in-navbar (${themeBefore}->${themeAfter}), glow persists: PASS`);
  results.push("NAV 1440 light: PASS");

  await page.mouse.move(20, 300);
  await page.waitForTimeout(200);
  await nav(page).screenshot({ path: "output/playwright/f3-nav-1440-light-compact.png" });
  await ctx.close();
}

// Pointer-glow screenshot over the navbar (light, idle + pointed).
{
  const { ctx, page } = await fresh(1440, 1000);
  await setup(page);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForSelector('.site-header[data-compact="true"]');
  await nav(page).screenshot({ path: "output/playwright/f3-nav-1440-light-idle.png" });
  const hbox = await nav(page).boundingBox();
  await page.mouse.move(hbox.x + hbox.width * 0.6, hbox.y + hbox.height * 0.5);
  await page.waitForTimeout(350);
  await nav(page).screenshot({ path: "output/playwright/f3-nav-1440-light-pointer.png" });
  results.push("SCREENSHOTS f3-nav-1440-light-idle + pointer: PASS");
  await ctx.close();
}

// Dark theme compact navbar + pointer glow.
{
  const { ctx, page } = await fresh(1440, 1000, { dark: true });
  await setup(page);
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "dark",
    "dark theme applied",
  );
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForSelector('.site-header[data-compact="true"]');
  const hbox = await nav(page).boundingBox();
  await page.mouse.move(hbox.x + hbox.width * 0.4, hbox.y + hbox.height * 0.5);
  await page.waitForTimeout(350);
  const dark = await pill(page);
  assert.equal(dark.varOpacity, "1", "dark glow on after enter");
  await nav(page).screenshot({ path: "output/playwright/f3-nav-1440-dark-pointer.png" });
  results.push("SCREENSHOT f3-nav-1440-dark-pointer (glow active): PASS");
  await ctx.close();
}

// 1280 light compact navbar.
{
  const { ctx, page } = await fresh(1280, 900);
  await setup(page);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForSelector('.site-header[data-compact="true"]');
  assert.equal(
    await page.evaluate(() => document.querySelectorAll(".site-header .logo").length),
    1,
    "1280 navbar logo present",
  );
  const g = await pill(page);
  assert.ok((g.before.backdropFilter || "").includes("blur"), "1280 glass");
  await page.mouse.move(640, 40);
  await page.waitForTimeout(300);
  await nav(page).screenshot({ path: "output/playwright/f3-nav-1280-light.png" });
  results.push("NAV 1280 light glass + logo present: PASS");
  await ctx.close();
}

// Touch device: no cursor-follow glow.
{
  const { ctx, page } = await fresh(390, 844, { mobile: true });
  await setup(page);
  const t = page.locator(".site-header");
  const tb = await t.boundingBox();
  await page.touchscreen.tap(tb.x + 80, tb.y + 28);
  await page.waitForTimeout(250);
  const touchState = await page.evaluate(() => ({
    glow: getComputedStyle(document.querySelector(".site-header")).getPropertyValue(
      "--nav-glow-opacity",
    ),
    pressed: document.querySelector(".site-header").hasAttribute("data-nav-pressed"),
  }));
  assert.equal(touchState.glow, "0", "no cursor-follow glow on touch");
  assert.equal(touchState.pressed, false, "no pressed bloom on touch tap");
  assert.equal(
    await page.evaluate(() => document.querySelectorAll(".site-header .logo").length),
    1,
    "mobile navbar logo present",
  );
  await page.locator('.mobile-menu > button[aria-label="Open navigation"]').click();
  assert.ok(await page.locator(".mobile-dialog").isVisible(), "mobile menu opens");
  await page.keyboard.press("Escape");
  await t.screenshot({ path: "output/playwright/f3-nav-390-light-mobile.png" });
  results.push("MOBILE 390: no touch glow, logo present, menu works: PASS");
  await ctx.close();
}

// Reduced motion: glow + press fully disabled.
{
  const { ctx, page } = await fresh(1440, 1000, { reduced: "reduce" });
  await setup(page);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  const hbox = await nav(page).boundingBox();
  await page.mouse.move(hbox.x + hbox.width * 0.5, hbox.y + 40);
  await page.waitForTimeout(250);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.up();
  const rm = await page.evaluate(() => ({
    glow: getComputedStyle(document.querySelector(".site-header")).getPropertyValue(
      "--nav-glow-opacity",
    ),
    afterDisplay: getComputedStyle(document.querySelector(".site-header"), "::after").display,
    pressed: document.querySelector(".site-header").hasAttribute("data-nav-pressed"),
  }));
  assert.equal(rm.glow, "0", "reduced-motion glow stays 0");
  assert.equal(rm.afterDisplay, "none", "reduced-motion glow layer hidden");
  assert.equal(rm.pressed, false, "reduced-motion no pressed state");
  results.push("REDUCED-MOTION disables glow + press bloom: PASS");
  await ctx.close();
}

// ============================================================= SERVICE CARDS
{
  const { ctx, page } = await fresh(1440, 1000);
  await setup(page);
  await page.locator(".solution-triptych").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const cards = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll(".solution-tile")];
    return tiles.map((t) => {
      const r = t.getBoundingClientRect();
      return { title: t.querySelector("h2")?.textContent.trim(), top: r.top, left: r.left };
    });
  });
  assert.deepEqual(
    cards.map((c) => c.title),
    ["Rent.", "Procure.", "Manage."],
    "DOM order Rent -> Procure -> Manage",
  );
  const tops = cards.map((c) => c.top);
  const lf = cards.map((c) => c.left);
  assert.ok(
    Math.max(...tops) - Math.min(...tops) <= 2,
    `card top baseline equal (${tops.map((t) => t.toFixed(1)).join(" / ")})`,
  );
  assert.ok(
    lf[0] < lf[1] && lf[1] < lf[2],
    "visual order Rent < Procure < Manage",
  );
  results.push(
    `CARDS 1440 DOM+visual order Rent->Procure->Manage, baseline aligned (spread ${(Math.max(...tops) - Math.min(...tops)).toFixed(1)}px): PASS`,
  );
  await page.locator(".solution-triptych").screenshot({ path: "output/playwright/f3-cards-1440.png" });
  await ctx.close();
}

// Card alignment across 1280 / 768 / 390.
for (const [w, h] of [
  [1280, 900],
  [768, 1024],
  [390, 844],
]) {
  const { ctx, page } = await fresh(w, h);
  await setup(page);
  await page.locator(".solution-triptych").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const data = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll(".solution-tile")];
    return {
      titles: tiles.map((t) => t.querySelector("h2")?.textContent.trim()),
      tops: tiles.map((t) => t.getBoundingClientRect().top),
      lefts: tiles.map((t) => t.getBoundingClientRect().left),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  assert.deepEqual(data.titles, ["Rent.", "Procure.", "Manage."], `order ${w}`);
  const spread = Math.max(...data.tops) - Math.min(...data.tops);
  if (w >= 1101) {
    assert.ok(spread <= 2, `baseline ${w} (spread ${spread.toFixed(1)}px)`);
  } else {
    assert.ok(
      data.tops[0] < data.tops[1] && data.tops[1] < data.tops[2],
      `stacked order ${w}`,
    );
  }
  assert.ok(data.overflow <= 0, `no horizontal overflow at ${w}`);
  await page.waitForTimeout(200);
  await page.locator(".solution-triptych").screenshot({ path: `output/playwright/f3-cards-${w}.png` });
  results.push(`CARDS ${w}: order + alignment + no overflow: PASS`);
  await ctx.close();
}

// ============================================================= WORKPLACE ESSENTIALS
{
  const { ctx, page } = await fresh(1440, 1000);
  await setup(page);
  await page.locator(".device-experience").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  const geo = await page.evaluate(() => {
    const shell = document.querySelector(".device-experience");
    const s = getComputedStyle(shell);
    const shellRect = shell.getBoundingClientRect();
    const childLeft = (sel) => {
      const el = document.querySelector(sel);
      const r = el.getBoundingClientRect();
      return Math.round(r.left - shellRect.left + parseFloat(getComputedStyle(el).paddingLeft));
    };
    const rule = document.querySelector(".device-story-rule");
    return {
      border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
      radius: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius],
      insets: {
        topline: childLeft(".studio-topline"),
        stage: childLeft(".device-stage"),
        controls: childLeft(".studio-controls"),
        note: childLeft(".studio-note"),
      },
      ruleDisplay: rule ? getComputedStyle(rule).display : "gone",
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  assert.ok(geo.border.every((b) => b === "1px"), `single 1px border (${geo.border})`);
  assert.equal(new Set(geo.radius).size, 1, `consistent radius (${geo.radius[0]})`);
  assert.ok(geo.radius[0] !== "0px", "rounded corners present");
  assert.equal(geo.ruleDisplay, "none", "no double top border from .device-story-rule");
  const vals = Object.values(geo.insets);
  assert.ok(
    Math.max(...vals) - Math.min(...vals) <= 2,
    `right-column insets aligned (${JSON.stringify(geo.insets)})`,
  );
  // Vertical: stage starts below topline without overlap.
  const vertical = await page.evaluate(() => {
    const r1 = document.querySelector(".studio-topline").getBoundingClientRect();
    const r2 = document.querySelector(".device-stage").getBoundingClientRect();
    return { toplineBottom: r1.bottom, stageTop: r2.top };
  });
  assert.ok(
    vertical.stageTop > vertical.toplineBottom,
    "stage below header row",
  );
  assert.ok(geo.overflow <= 0, "no horizontal overflow");
  results.push(
    `WORKPLACE single 1px border, uniform radius ${geo.radius[0]}, insets ${JSON.stringify(geo.insets)}, no double line: PASS`,
  );
  await page.locator(".device-experience").screenshot({ path: "output/playwright/f3-workplace-1440.png" });
  await ctx.close();
}

// Workplace geometry at 1280 / 768 / 390.
for (const [w, h] of [
  [1280, 900],
  [768, 1024],
  [390, 844],
]) {
  const { ctx, page } = await fresh(w, h);
  await setup(page);
  await page.locator(".device-experience").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  const d = await page.evaluate(() => {
    const shell = document.querySelector(".device-experience");
    const rect = shell.getBoundingClientRect();
    const left = (sel) => {
      const el = document.querySelector(sel);
      const r = el.getBoundingClientRect();
      return Math.round(r.left - rect.left + parseFloat(getComputedStyle(el).paddingLeft));
    };
    return {
      border: getComputedStyle(shell).borderTopWidth,
      insets: {
        topline: left(".studio-topline"),
        stage: left(".device-stage"),
        controls: left(".studio-controls"),
        note: left(".studio-note"),
      },
      overflow: document.documentElement.scrollWidth - innerWidth,
      shellW: Math.round(rect.width),
    };
  });
  if (w >= 1101) {
    const v = Object.values(d.insets);
    assert.ok(Math.max(...v) - Math.min(...v) <= 2, `insets aligned ${w}`);
    assert.equal(d.border, "1px", `border ${w}`);
  }
  assert.ok(d.overflow <= 0, `no overflow ${w}`);
  assert.ok(d.shellW <= w, `shell fits ${w}`);
  await page.waitForTimeout(200);
  await page.locator(".device-experience").screenshot({ path: `output/playwright/f3-workplace-${w}.png` });
  results.push(`WORKPLACE ${w}: fits, no overflow, geometry sane: PASS`);
  await ctx.close();
}

// Route + console sweep (shared navbar everywhere).
{
  const { ctx, page } = await fresh(1440, 1000);
  for (const route of ["/", "/platform", "/how-it-works", "/contact"]) {
    await setup(page, route);
    const navOk = await page.evaluate(() => ({
      header: !!document.querySelector(".site-header"),
      chevrons: document.querySelectorAll(".desktop-nav summary [aria-hidden='true']").length,
      logos: document.querySelectorAll(".site-header .logo").length,
      overflow: document.documentElement.scrollWidth - innerWidth,
    }));
    assert.ok(navOk.header, `header on ${route}`);
    assert.equal(navOk.chevrons, 0, `no chevrons on ${route}`);
    assert.equal(navOk.logos, 1, `navbar logo present on ${route}`);
    assert.ok(navOk.overflow <= 0, `no overflow on ${route}`);
  }
  results.push("ROUTES / /platform /how-it-works /contact: shared header, no chevrons, logo present, no overflow: PASS");
  await ctx.close();
}

assert.deepEqual(errors, [], `console errors:\n${errors.join("\n")}`);
results.push("CONSOLE zero errors across all cases: PASS");

console.log(results.join("\n"));
await browser.close();
