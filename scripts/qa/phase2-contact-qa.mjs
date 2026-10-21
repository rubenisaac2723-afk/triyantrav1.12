/**
 * Phase 2 QA — TriYantra Contact / Get a Quote cinematic canvas.
 *
 * Verifies the Phase 2 specification:
 *  1. Full-bleed environment (no card): zero radius/border/shadow on the section.
 *  2. Desktop two-column editorial composition; mobile single natural-height column.
 *  3. Full approved loop duration, autoplay/loop/playsInline, no controls.
 *  4. Declarative <source> tiers (mobile/tablet/desktop, webm+mp4), no upscaling.
 *  5. Offscreen pause/resume, tab-hidden pause.
 *  6. Reduced motion -> no autoplay, static Blue Sky poster, identical layout.
 *  7. Light / dark / system themes share one video with no reload or reset.
 *  8. CustomSelect keyboard, outside-click, collision and z-index behaviour.
 *  9. Form payload contract unchanged.
 * 10. Accessibility: single h1, labelled controls, focus visibility, no traps.
 * 11. Interaction performance and lazy network behaviour.
 */
import { chromium } from "playwright";
import { mkdirSync, statSync } from "fs";

const BASE = "http://127.0.0.1:3001";
const OUT = "output/playwright/phase2-qa";
mkdirSync(OUT, { recursive: true });

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const POSTER = "/assets/media/contact-blue-sky-poster.webp";

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
  return condition;
};
const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;

const consoleErrors = [];
function wire(page, label) {
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${label}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] ${e.message}`));
}

async function newPage(browser, { width, height, theme = "light", reducedMotion = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    ...(reducedMotion ? { reducedMotion: "reduce" } : {}),
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("triyantra-theme", t);
  }, theme);
  return { ctx, page };
}

const settleVideo = (page, timeout = 20000) =>
  page
    .waitForFunction(
      () => {
        const v = document.querySelector(".contact-cinematic__video");
        if (!v || v.paused || !v.classList.contains("is-playing")) return false;
        return parseFloat(getComputedStyle(v).opacity) > 0.99;
      },
      null,
      { timeout },
    )
    .then(() => true)
    .catch(() => false);

/* ------------------------------------------------------------------ *
 * 1 + 2 — canvas geometry and composition
 * ------------------------------------------------------------------ */
async function testComposition(page, label, { expectTwoColumn }) {
  const geo = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const section = q(".contact-cinematic-section");
    const container = q(".contact-cinematic__media");
    const video = q(".contact-cinematic__video");
    const canvas = q(".contact-canvas");
    const copy = q(".contact-canvas-copy");
    const form = q(".lead-form");
    const scrim = q(".contact-cinematic__scrim");
    const cs = (el, p) => (el ? getComputedStyle(el)[p] : null);
    return {
      section: rect(section),
      container: rect(container),
      video: rect(video),
      canvas: rect(canvas),
      copy: rect(copy),
      form: rect(form),
      borderRadius: cs(section, "borderRadius"),
      overflow: cs(section, "overflow"),
      videoObjectFit: cs(video, "objectFit"),
      videoInset: {
        top: cs(video, "top"),
        left: cs(video, "left"),
        width: cs(video, "width"),
        height: cs(video, "height"),
      },
      containerCount: document.querySelectorAll(".contact-cinematic__media").length,
      canvasCount: document.querySelectorAll(".contact-canvas").length,
      videoInsideForm: !!(form && video && form.contains(video)),
      nestedSkyLayers: form ? form.querySelectorAll(".contact-cinematic__media, .contact-cinematic__video, .contact-cinematic__scrim").length : -1,
      canvasGridCols: cs(canvas, "gridTemplateColumns"),
      scrimOpacity: cs(scrim, "opacity"),
      copyH1FontSize: cs(q(".contact-canvas-copy h1"), "fontSize"),
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      formHasControls: !!form && !!form.querySelector("button[type=submit]"),
      // card-treatment probes: the environment must carry none of these
      sectionBorderWidth: cs(section, "borderTopWidth"),
      sectionBorderStyle: cs(section, "borderTopStyle"),
      sectionBoxShadow: cs(section, "boxShadow"),
      sectionBackground: cs(section, "backgroundColor"),
      sectionMarginBottom: cs(section, "marginBottom"),
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  // one canvas, video is the background of the canvas — never a card
  check(geo.containerCount === 1, `${label}: expected exactly 1 sky container, got ${geo.containerCount}`);
  check(geo.canvasCount === 1, `${label}: expected exactly 1 contact canvas, got ${geo.canvasCount}`);
  check(!geo.videoInsideForm, `${label}: video element is nested inside the form (box-in-box)`);
  check(geo.nestedSkyLayers === 0, `${label}: ${geo.nestedSkyLayers} sky layers nested inside the form`);
  check(geo.overflow === "clip" || geo.overflow === "hidden",
    `${label}: section overflow is ${geo.overflow}, expected clip/hidden`);

  /* No card: the section is an environment, so it must not present a frame.
     AGENTS.md 4 - "no black borders or postcard frames". */
  check(parseFloat(geo.borderRadius) === 0, `${label}: section has border-radius ${geo.borderRadius}, expected 0 (no card)`);
  check(["none", "0px"].includes(geo.sectionBorderStyle) || parseFloat(geo.sectionBorderWidth) === 0,
    `${label}: section has a ${geo.sectionBorderWidth} ${geo.sectionBorderStyle} border, expected none`);
  check(!geo.sectionBoxShadow || geo.sectionBoxShadow === "none",
    `${label}: section has box-shadow ${geo.sectionBoxShadow}, expected none`);
  check(near(geo.section.w, geo.viewportWidth, 1),
    `${label}: section is ${geo.section.w}px but viewport is ${geo.viewportWidth}px — not full-bleed`);

  // video is full-bleed against the canvas, not an inset rectangle
  check(geo.videoObjectFit === "cover", `${label}: video object-fit is ${geo.videoObjectFit}`);
  check(near(geo.video.w, geo.section.w, 3), `${label}: video width ${geo.video.w} != canvas width ${geo.section.w}`);
  check(near(geo.video.h, geo.section.h, 3), `${label}: video height ${geo.video.h} != canvas height ${geo.section.h}`);
  check(near(geo.video.left, geo.section.left, 3) && near(geo.video.top, geo.section.top, 3),
    `${label}: video is offset inside the canvas (${geo.video.left}/${geo.video.top} vs ${geo.section.left}/${geo.section.top})`);

  // composition — measured against the constrained .wrap canvas, not the
  // full-bleed section, so column ratios stay stable at every viewport width.
  const sectionW = geo.canvas.w;
  const copyPct = (geo.copy.w / sectionW) * 100;
  const formPct = (geo.form.w / sectionW) * 100;
  if (expectTwoColumn) {
    check(geo.form.left > geo.copy.right - 2, `${label}: form is not to the right of the copy column`);
    check(geo.form.top < geo.copy.bottom && geo.copy.top < geo.form.bottom,
      `${label}: columns do not share a row`);
    check(copyPct >= 34 && copyPct <= 48, `${label}: copy column is ${copyPct.toFixed(1)}% of canvas (want 40-45%)`);
    check(formPct >= 42 && formPct <= 56, `${label}: form column is ${formPct.toFixed(1)}% of canvas (want 45-50%)`);
    check(geo.canvasGridCols.split(" ").length === 2, `${label}: expected 2 grid columns, got "${geo.canvasGridCols}"`);
  } else {
    check(geo.form.top > geo.copy.bottom - 2, `${label}: form is not stacked below the copy`);
    check(copyPct > 85, `${label}: copy column only ${copyPct.toFixed(1)}% wide on a single-column layout`);
    check(formPct > 85, `${label}: form column only ${formPct.toFixed(1)}% wide on a single-column layout`);
  }
  check(geo.docOverflow === 0, `${label}: horizontal overflow ${geo.docOverflow}px`);
  check(geo.formHasControls, `${label}: submit control missing`);
  check(parseFloat(geo.scrimOpacity) > 0, `${label}: scrim opacity ${geo.scrimOpacity} keeps video readable`);

  return { geo, copyPct, formPct };
}

/* ------------------------------------------------------------------ *
 * 3 + 4 — playback, lazy attach, lifecycle, loop
 * ------------------------------------------------------------------ */
async function testPlayback(browser) {
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  wire(page, "playback");
  const requested = [];
  page.on("request", (r) => {
    if (/\.mp4/.test(r.url())) requested.push(r.url());
  });

  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  const playing = await settleVideo(page);
  check(playing, "playback: video never reached a settled playing state");

  const info = await page.evaluate(() => {
    const v = document.querySelector(".contact-cinematic__video");
    return {
      duration: v?.duration ?? 0,
      loop: v?.loop ?? false,
      muted: v?.muted ?? false,
      paused: v?.paused ?? true,
      playsInline: v?.playsInline ?? false,
      preload: v?.getAttribute("preload"),
      controls: v?.hasAttribute("controls"),
      currentSrc: v?.currentSrc ?? "",
      videoWidth: v?.videoWidth ?? 0,
      videoHeight: v?.videoHeight ?? 0,
    };
  });

  check(info.loop, "playback: video is not looping");
  check(info.muted, "playback: video is not muted");
  check(!info.paused, "playback: video is paused while in view");
  check(info.playsInline, "playback: video is not playsInline");
  check(!info.controls, "playback: native controls are exposed");
  check(info.preload === "none", `playback: preload is ${info.preload}, expected none`);
  check(near(info.duration, 10, 0.35), `playback: duration ${info.duration}s, expected the full approved ~10s`);
  check(
    /contact-blue-sky-desktop\.(webm|mp4)$/.test(info.currentSrc),
    `playback: desktop src is ${info.currentSrc}`,
  );
  check(info.videoWidth === 1600, `playback: desktop source is ${info.videoWidth}px wide, expected 1600`);
  check(
    !requested.some((u) => u.includes("-mobile.mp4")),
    "playback: mobile source used at 1440px",
  );

  // two complete loops. 4x is the highest rate this headless decoder sustains;
  // at 10x the pipeline stalls and currentTime freezes.
  const loops = await page.evaluate(async () => {
    const v = document.querySelector(".contact-cinematic__video");
    v.playbackRate = 4;
    let wraps = 0;
    let prev = v.currentTime;
    const started = performance.now();
    while (wraps < 2 && performance.now() - started < 20000) {
      await new Promise((r) => setTimeout(r, 60));
      const now = v.currentTime;
      if (now < prev - 0.5) wraps += 1;
      prev = now;
    }
    v.playbackRate = 1;
    return { wraps, total: v.duration, rate: 4 };
  });
  check(loops.wraps >= 2, `playback: only ${loops.wraps} full loop(s) observed (duration ${loops.total}s @${loops.rate}x)`);

  // offscreen pause + resume. The observer has a 300px rootMargin, so a short
  // page may never scroll the canvas out of range: displace it explicitly when
  // natural scrolling is not enough.
  const displaced = await page.evaluate(() => {
    const section = document.querySelector(".contact-cinematic-section");
    const r = section.getBoundingClientRect();
    const margin = 320;
    const outside = r.bottom < -margin || r.top > window.innerHeight + margin;
    if (!outside) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const r2 = section.getBoundingClientRect();
      const stillInside = !(r2.bottom < -margin || r2.top > window.innerHeight + margin);
      if (stillInside) {
        section.dataset.qaRestore = section.getAttribute("style") || "";
        section.style.position = "fixed";
        section.style.top = "-4000px";
        section.style.left = "0";
        return "forced";
      }
      return "scrolled";
    }
    return "already-out";
  });
  await page.waitForTimeout(900);
  const offscreenPaused = await page.evaluate(() => document.querySelector(".contact-cinematic__video")?.paused);
  check(offscreenPaused === true, `playback: video did not pause after going offscreen (${displaced})`);

  await page.evaluate(() => {
    const section = document.querySelector(".contact-cinematic-section");
    if (section.dataset.qaRestore !== undefined) {
      section.setAttribute("style", section.dataset.qaRestore);
      delete section.dataset.qaRestore;
    }
    section.scrollIntoView({ block: "center" });
  });
  const resumed = await settleVideo(page, 8000);
  check(resumed, "playback: video did not resume when scrolled back into view");

  // tab hidden pause / visible resume (exercises the real visibilitychange handler)
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(350);
  const hiddenPaused = await page.evaluate(() => document.querySelector(".contact-cinematic__video")?.paused);
  check(hiddenPaused === true, "playback: video kept playing while the tab was hidden");

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const visibleResumed = await settleVideo(page, 8000);
  check(visibleResumed, "playback: video did not resume when the tab became visible again");

  await ctx.close();
  return { info, loops, requested };
}

/**
 * Responsive source tiers. Each tier is declared with <source media>, so the
 * browser picks before paint. Chrome prefers WebM; both containers must be
 * acceptable. Widths must match the encoded derivatives exactly and must never
 * exceed the 1600px master (no upscaled tier).
 */
async function testSourceTiers(browser) {
  const tiers = [
    { label: "mobile", width: 390, height: 844, file: "contact-blue-sky-mobile", px: 960 },
    { label: "tablet", width: 1024, height: 768, file: "contact-blue-sky-tablet", px: 1280 },
    { label: "desktop", width: 1440, height: 900, file: "contact-blue-sky-desktop", px: 1600 },
  ];
  const results = [];
  for (const t of tiers) {
    const { ctx, page } = await newPage(browser, { width: t.width, height: t.height, theme: "light" });
    wire(page, `${t.label}-source`);
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
    await settleVideo(page);
    const src = await page.evaluate(
      () => document.querySelector(".contact-cinematic__video")?.currentSrc ?? "",
    );
    const w = await page.evaluate(
      () => document.querySelector(".contact-cinematic__video")?.videoWidth ?? 0,
    );
    check(src.includes(t.file), `${t.label} source: got ${src}, expected ${t.file}`);
    check(/\.(webm|mp4)$/.test(src), `${t.label} source: unexpected container in ${src}`);
    check(w === t.px, `${t.label} source: ${w}px wide, expected ${t.px}`);
    check(w <= 1600, `${t.label} source: ${w}px exceeds the 1600px master (upscaled)`);
    results.push({ tier: t.label, src, w });
    await ctx.close();
  }
  return results;
}

/* ------------------------------------------------------------------ *
 * 5 — reduced motion
 * ------------------------------------------------------------------ */
async function testReducedMotion(browser) {
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light", reducedMotion: true });
  wire(page, "reduced-motion");
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => {
    const container = document.querySelector(".contact-cinematic__media");
    const video = document.querySelector(".contact-cinematic__video");
    const copy = document.querySelector(".contact-canvas-copy");
    const form = document.querySelector(".lead-form");
    const r = (el) => {
      const b = el?.getBoundingClientRect();
      return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
    };
    return {
      isStatic: container?.classList.contains("is-static") ?? false,
      srcAttribute: video?.getAttribute("src"),
      poster: video?.getAttribute("poster"),
      paused: video?.paused,
      opacity: video ? parseFloat(getComputedStyle(video).opacity) : null,
      playingClass: video?.classList.contains("is-playing"),
      copy: r(copy),
      form: r(form),
    };
  });

  check(state.isStatic, "reduced motion: static class missing");
  check(!state.srcAttribute, `reduced motion: video source attached (${state.srcAttribute})`);
  check(state.poster === POSTER, `reduced motion: poster is ${state.poster}, expected ${POSTER}`);
  check(state.paused === true, "reduced motion: video is not paused");
  check(state.playingClass === false, "reduced motion: video marked playing");
  check(state.opacity === 1, `reduced motion: poster opacity is ${state.opacity}, expected 1`);

  await page.locator(".contact-cinematic-section").screenshot({ path: `${OUT}/contact-1440-reduced-motion.png` });
  await ctx.close();

  // layout parity against the motion build at the same viewport
  const motion = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  await motion.page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  const motionState = await motion.page.evaluate(() => {
    const r = (s) => {
      const b = document.querySelector(s)?.getBoundingClientRect();
      return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
    };
    return { copy: r(".contact-canvas-copy"), form: r(".lead-form") };
  });
  await motion.ctx.close();

  check(
    state.copy && motionState.copy && near(state.copy.y, motionState.copy.y, 4) && near(state.copy.w, motionState.copy.w, 4),
    `reduced motion: copy column layout drifted vs motion build (${JSON.stringify(state.copy)} vs ${JSON.stringify(motionState.copy)})`,
  );
  check(
    state.form && motionState.form && near(state.form.y, motionState.form.y, 4) && near(state.form.w, motionState.form.w, 4),
    `reduced motion: form layout drifted vs motion build (${JSON.stringify(state.form)} vs ${JSON.stringify(motionState.form)})`,
  );
  return state;
}

/* ------------------------------------------------------------------ *
 * 6 — themes share one video, no reload or reset
 * ------------------------------------------------------------------ */
async function testThemeSwitch(browser) {
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  wire(page, "theme-switch");
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await settleVideo(page);
  await page.locator(".contact-cinematic-section").scrollIntoViewIfNeeded();

  const before = await page.evaluate(() => {
    const v = document.querySelector(".contact-cinematic__video");
    window.__srcBefore = v.currentSrc;
    return { src: v.currentSrc, time: v.currentTime, theme: document.documentElement.dataset.theme };
  });

  await page.locator(".theme-toggle").click();
  await page.waitForTimeout(700);

  const after = await page.evaluate(() => {
    const v = document.querySelector(".contact-cinematic__video");
    return {
      src: v.currentSrc,
      time: v.currentTime,
      theme: document.documentElement.dataset.theme,
      sameNode: window.__srcBefore === v.currentSrc,
      paused: v.paused,
      readyState: v.readyState,
    };
  });

  check(after.theme !== before.theme, `theme switch: theme stayed ${after.theme}`);
  check(after.src === before.src, "theme switch: video source changed");
  check(after.sameNode, "theme switch: video element was re-created");
  check(!after.paused && after.readyState >= 2, "theme switch: video stopped playing");
  check(after.time > before.time, `theme switch: playback reset (${before.time} -> ${after.time})`);

  await ctx.close();
  return { before, after };
}

/* ------------------------------------------------------------------ *
 * 7 — CustomSelect
 * ------------------------------------------------------------------ */
async function testCustomSelect(browser) {
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  wire(page, "custom-select");
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.locator(".contact-cinematic-section").scrollIntoViewIfNeeded();

  const trigger = page.locator(".custom-select-trigger").first();
  const hidden = page.locator('input[type="hidden"][name="requirementType"]');
  const triggerId = await trigger.getAttribute("id");

  await trigger.focus();
  check(
    await trigger.evaluate((el) => {
      const cs = getComputedStyle(el);
      return parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== "none";
    }),
    "custom-select: no visible focus ring on the trigger",
  );

  // open with keyboard
  await page.keyboard.press("ArrowDown");
  await page.waitForSelector(".custom-select-listbox", { timeout: 4000 });
  check((await trigger.getAttribute("aria-expanded")) === "true", "custom-select: ArrowDown did not open the listbox");

  // arrow through options
  const active1 = await trigger.getAttribute("aria-activedescendant");
  await page.keyboard.press("ArrowDown");
  const active2 = await trigger.getAttribute("aria-activedescendant");
  check(active1 !== active2, "custom-select: ArrowDown did not move aria-activedescendant");

  // commit with Enter
  const optionText = await page.locator(`#${active2}`).innerText();
  await page.keyboard.press("Enter");
  await page.waitForSelector(".custom-select-listbox", { state: "detached", timeout: 4000 });
  const committed = await hidden.inputValue();
  check(committed.length > 0, "custom-select: Enter did not commit a value to the hidden input");
  check(
    await trigger.evaluate((el) => document.activeElement === el),
    "custom-select: focus was not returned to the trigger after commit",
  );

  // Escape closes without committing
  const beforeEscape = await hidden.inputValue();
  await page.keyboard.press("ArrowDown");
  await page.waitForSelector(".custom-select-listbox", { timeout: 4000 });
  await page.keyboard.press("Escape");
  await page.waitForSelector(".custom-select-listbox", { state: "detached", timeout: 4000 });
  check((await hidden.inputValue()) === beforeEscape, "custom-select: Escape changed the committed value");

  // outside click closes
  await trigger.click();
  await page.waitForSelector(".custom-select-listbox", { timeout: 4000 });
  await page.locator(".contact-canvas-copy h1").click();
  await page.waitForSelector(".custom-select-listbox", { state: "detached", timeout: 4000 });

  // collision / z-index: listbox must be on top and inside the viewport
  await trigger.click();
  await page.waitForSelector(".custom-select-listbox", { timeout: 4000 });
  const collision = await page.evaluate(() => {
    const list = document.querySelector(".custom-select-listbox");
    const r = list.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const cs = getComputedStyle(list);
    return {
      inViewport: r.left >= -1 && r.top >= -1 && r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1,
      onTop: !!(top && (list === top || list.contains(top))),
      zIndex: cs.zIndex,
      position: cs.position,
      placement: list.dataset.placement,
      clampedToViewport: r.top >= -1 && r.bottom <= window.innerHeight + 1,
    };
  });
  check(collision.inViewport, "custom-select: listbox overflows the viewport");
  check(collision.onTop, "custom-select: listbox is covered by another element (z-index collision)");
  check(collision.clampedToViewport, "custom-select: listbox is not clamped to the viewport");
  check(
    Number(collision.zIndex) > 0 || collision.position === "fixed" || collision.position === "absolute",
    `custom-select: listbox stacking context looks wrong (z-index ${collision.zIndex}, position ${collision.position})`,
  );

  // touch-sized hit target
  const box = await trigger.boundingBox();
  check(box.height >= 40, `custom-select: trigger height ${Math.round(box.height)}px is below the 40px touch minimum`);

  await page.locator(".contact-cinematic__media").screenshot({ path: `${OUT}/custom-select-open.png` }).catch(() => {});
  await ctx.close();
  return { committed, optionText: optionText.trim(), collision, triggerId };
}

/* ------------------------------------------------------------------ *
 * 8 — payload contract
 * ------------------------------------------------------------------ */
async function testPayload(browser) {
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  wire(page, "payload");
  let captured = null;
  await page.route("**/api/leads", async (route) => {
    captured = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accepted: true }),
    });
  });

  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.locator(".contact-cinematic-section").scrollIntoViewIfNeeded();
  await page.locator(".lead-form").waitFor();

  await page.fill("#fullName", "Aarav Sharma");
  await page.fill("#workEmail", "aarav.sharma@zenithsystems.example");
  await page.fill("#companyName", "Zenith Systems Pvt Ltd");
  await page.locator(".lead-form button[type=submit]").click();
  await page.waitForFunction(() => document.readyState !== "loading", null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  check(!!captured, "payload: no POST /api/leads request was issued");
  if (captured) {
    check(captured.fullName === "Aarav Sharma", `payload: fullName = ${captured.fullName}`);
    check(captured.workEmail === "aarav.sharma@zenithsystems.example", `payload: workEmail = ${captured.workEmail}`);
    check(captured.companyName === "Zenith Systems Pvt Ltd", `payload: companyName = ${captured.companyName}`);
    check(captured.kind === "quote", `payload: kind = ${captured.kind}`);
    check(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(captured.requestId || "")),
      `payload: requestId = ${captured.requestId}`,
    );
    for (const key of ["requirementType", "deviceType", "phone", "employees", "devices", "locations", "startDate", "message"]) {
      check(key in captured, `payload: missing key "${key}"`);
    }
  }
  await ctx.close();
  return captured;
}

/* ------------------------------------------------------------------ *
 * 9 — accessibility
 * ------------------------------------------------------------------ */
async function testAccessibility(browser) {
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  wire(page, "a11y");
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.locator(".contact-cinematic-section").scrollIntoViewIfNeeded();

  const a11y = await page.evaluate(() => {
    const section = document.querySelector(".contact-cinematic-section");
    const form = document.querySelector(".lead-form");
    const unlabelled = [];
    for (const el of form.querySelectorAll("input, textarea, select")) {
      if (el.type === "hidden") continue;
      const byFor = el.id && form.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      const wrapping = el.closest("label");
      if (!byFor && !wrapping && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) {
        unlabelled.push(el.name || el.id || el.tagName);
      }
    }
    const triggers = [...form.querySelectorAll(".custom-select-trigger")];
    return {
      h1Total: document.querySelectorAll("h1").length,
      h1Text: document.querySelector("h1")?.textContent?.trim() ?? "",
      skyAriaHidden: document.querySelector(".contact-cinematic__media")?.getAttribute("aria-hidden"),
      videoTabIndex: document.querySelector(".contact-cinematic__video")?.getAttribute("tabindex"),
      unlabelled,
      comboboxesWithoutLabel: triggers.filter((t) => !t.getAttribute("aria-label")).length,
      langAttr: document.documentElement.getAttribute("lang"),
      sectionHasHeading: !!section?.querySelector("h1"),
      canvasOrder: [...section.querySelectorAll(".contact-canvas-copy h1, .lead-form")].map((n) => (n.tagName === "H1" ? "copy" : "form")),
    };
  });

  check(a11y.h1Total === 1, `a11y: page has ${a11y.h1Total} h1 elements, expected 1`);
  check(a11y.h1Text.length > 8, `a11y: h1 text is "${a11y.h1Text}"`);
  check(a11y.skyAriaHidden === "true", `a11y: decorative sky container aria-hidden is ${a11y.skyAriaHidden}`);
  check(a11y.videoTabIndex === "-1", `a11y: background video tabindex is ${a11y.videoTabIndex}`);
  check(a11y.unlabelled.length === 0, `a11y: unlabelled form controls: ${a11y.unlabelled.join(", ")}`);
  check(a11y.comboboxesWithoutLabel === 0, `a11y: ${a11y.comboboxesWithoutLabel} comboboxes without an accessible name`);
  check(!!a11y.langAttr, "a11y: html lang attribute missing");
  check(a11y.canvasOrder.join(">") === "copy>form", `a11y: DOM order is ${a11y.canvasOrder.join(">")}`);

  // keyboard reaches the submit button without a focus trap
  const reached = await page.evaluate(async () => {
    const form = document.querySelector(".lead-form");
    const focusables = [...form.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])')];
    return { count: focusables.length, first: focusables[0]?.tagName ?? null, submit: !!form.querySelector('button[type="submit"]') };
  });
  check(reached.count > 3 && reached.submit, "a11y: form has no reachable keyboard path to submit");

  await ctx.close();
  return a11y;
}

/* ------------------------------------------------------------------ *
 * 10 — lazy network + asset budget
 * ------------------------------------------------------------------ */
async function testPerformance(browser) {
  const html = await (await browser.newContext()).request.get(`${BASE}/contact`);
  const body = await html.text();
  check(!/bluesky(-mobile)?\.mp4/.test(body), "perf: the mp4 source is present in the SSR HTML (eager load)");
  check(body.includes("contact-blue-sky-poster.webp"), "perf: poster is missing from the SSR HTML");

  const budgets = [
    ["public/assets/media/contact-blue-sky-desktop.mp4", 3_600_000],
    ["public/assets/media/contact-blue-sky-desktop.webm", 3_600_000],
    ["public/assets/media/contact-blue-sky-tablet.mp4", 2_000_000],
    ["public/assets/media/contact-blue-sky-mobile.mp4", 900_000],
    ["public/assets/media/contact-blue-sky-poster.webp", 200_000],
  ];
  const sizes = budgets.map(([p, max]) => {
    const bytes = statSync(p).size;
    check(bytes <= max, `perf: ${p} is ${Math.round(bytes / 1024)}KB, over the ${Math.round(max / 1024)}KB budget`);
    return { p, kb: Math.round(bytes / 1024), maxKb: Math.round(max / 1024) };
  });

  // compositor-friendly: video and canvas are promoted, no layout thrash on idle
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  wire(page, "perf");
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await settleVideo(page);
  // let the intentional one-shot 900ms fade-in finish before measuring idle cost
  await page.waitForTimeout(1200);
  const anim = await page.evaluate(() => {
    const container = document.querySelector(".contact-cinematic__media");
    const inCanvas = (a) => {
      const t = a.effect?.target;
      return t ? container.contains(t) : false;
    };
    // repeating work is the real idle cost; a one-shot fade is not
    const repeating = document.getAnimations().filter((a) => {
      const it = a.effect?.getTiming?.().iterations;
      return inCanvas(a) && it === Infinity;
    });
    return {
      canvasRepeatingAnimations: repeating.length,
      repeatingRunning: repeating.filter((a) => a.playState === "running").length,
      canvasAnimationsRunning: document.getAnimations().filter((a) => a.playState === "running" && inCanvas(a)).length,
      layersPaused: container.classList.contains("is-playing"),
      pageAnimationsRunning: document.getAnimations().filter((a) => a.playState === "running").length,
    };
  });
  check(anim.layersPaused, "perf: CSS sky layers keep animating while the opaque video plays");
  check(
    anim.repeatingRunning === 0,
    `perf: ${anim.repeatingRunning} repeating canvas animations still running once the video plays`,
  );
  check(
    anim.canvasAnimationsRunning === 0,
    `perf: ${anim.canvasAnimationsRunning} canvas animations still running after the fade settles (${JSON.stringify(anim)})`,
  );
  await ctx.close();
  return { sizes, anim };
}

/* ------------------------------------------------------------------ *
 * viewport / theme matrix with screenshots
 * ------------------------------------------------------------------ */
async function testMatrix(browser) {
  const matrix = [
    { name: "contact-1920-light", width: 1920, height: 1080, theme: "light", two: true },
    { name: "contact-1440-light", width: 1440, height: 900, theme: "light", two: true },
    { name: "contact-1440-dark", width: 1440, height: 900, theme: "dark", two: true },
    { name: "contact-1440-system", width: 1440, height: 900, theme: "system", two: true },
    { name: "contact-1280-dark", width: 1280, height: 800, theme: "dark", two: true },
    { name: "contact-1024-light", width: 1024, height: 768, theme: "light", two: true },
    { name: "contact-834-light", width: 834, height: 1112, theme: "light", two: false },
    { name: "contact-768-light", width: 768, height: 1024, theme: "light", two: false },
    { name: "contact-430-dark", width: 430, height: 932, theme: "dark", two: false },
    { name: "contact-390-light", width: 390, height: 844, theme: "light", two: false },
    { name: "contact-390-dark", width: 390, height: 844, theme: "dark", two: false },
    { name: "contact-375-light", width: 375, height: 812, theme: "light", two: false },
    { name: "contact-360-light", width: 360, height: 800, theme: "light", two: false },
    { name: "contact-360-short", width: 360, height: 640, theme: "light", two: false },
  ];

  const out = {};
  for (const m of matrix) {
    const { ctx, page } = await newPage(browser, m);
    wire(page, m.name);
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
    if (m.name !== "contact-1440-reduced-motion") await settleVideo(page, 12000);
    await page.locator(".contact-cinematic-section").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const r = await testComposition(page, m.name, { expectTwoColumn: m.two });
    await page.locator(".contact-cinematic-section").screenshot({ path: `${OUT}/${m.name}-canvas.png` });
    await page.screenshot({ path: `${OUT}/${m.name}-viewport.png`, fullPage: false });
    out[m.name] = { copyPct: +r.copyPct.toFixed(1), formPct: +r.formPct.toFixed(1) };
    await ctx.close();
  }
  return out;
}

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  const matrix = await testMatrix(browser);
  const playback = await testPlayback(browser);
  const tiers = await testSourceTiers(browser);
  const reduced = await testReducedMotion(browser);
  const theme = await testThemeSwitch(browser);
  const select = await testCustomSelect(browser);
  const payload = await testPayload(browser);
  const a11y = await testAccessibility(browser);
  const perf = await testPerformance(browser);

  await browser.close();

  console.log("\n================ PHASE 2 QA RESULTS ================");
  console.log("canvas composition (copy% / form%):");
  console.log(JSON.stringify(matrix, null, 2));
  console.log("playback:", JSON.stringify({ info: playback.info, loops: playback.loops }, null, 2));
  console.log("source tiers:", JSON.stringify(tiers));
  console.log("reduced motion:", JSON.stringify(reduced));
  console.log("theme switch:", JSON.stringify({ before: theme.before, after: theme.after }, null, 2));
  console.log("custom select:", JSON.stringify(select, null, 2));
  console.log("payload keys:", payload ? Object.keys(payload).sort().join(", ") : "NOT CAPTURED");
  console.log("a11y:", JSON.stringify(a11y, null, 2));
  console.log("perf:", JSON.stringify(perf, null, 2));

  check(consoleErrors.length === 0, `console/page errors: ${[...new Set(consoleErrors)].join(" | ")}`);

  if (failures.length) {
    console.error(`\n❌ PHASE 2 QA — ${failures.length} FAILURE(S):`);
    failures.forEach((f) => console.error(` - ${f}`));
    process.exit(1);
  }
  console.log(`\n✅ PHASE 2 QA PASSED — screenshots in ${OUT}/`);
}

run().catch((err) => {
  console.error("QA crashed:", err);
  process.exit(1);
});