import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/hero-canvas";
await mkdir(out, { recursive: true });

const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/opt/google/chrome/chrome");

console.log(`[HERO CANVAS QA] Launching Chromium: ${chromePath}`);
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const report = {
  timestamp: new Date().toISOString(),
  base,
  headlineRejectionAudit: {
    noAlternateWords: false,
    strictlyThreeWords: false,
    rejectedWordsAbsent: [],
    wordsInDOM: [],
  },
  kineticRollAudit: {
    automatic: false,
    scrollRequired: false,
    maskHeightPx: 0,
    maskOverflowHidden: false,
    copiesCount: 0,
    bothCopiesIdentical: false,
    cyclesObserved: 0,
    cycleTimings: [],
    baselineStabilityPx: 0,
  },
  canvasGeometryAudit: {
    canvasPresent: false,
    borderRadiusPx: 0,
    pageGuttersDesktopPx: 0,
    clipsContent: false,
    clearsNavbar: false,
    navbarBottomY: 0,
    canvasTopY: 0,
  },
  videoCompositionAudit: {
    objectFit: "",
    objectPosition: "",
    continuousPlayback: false,
    loopVerified: false,
  },
  themeAudit: {
    lightCanvasBg: "",
    lightWordColor: "",
    lightSimplifiedColor: "",
    darkCanvasBg: "",
    darkWordColor: "",
    darkSimplifiedColor: "",
    noWhiteWashInLight: false,
  },
  responsiveAudit: [],
  reducedMotionAudit: {
    videoPaused: false,
    secondWordHidden: false,
    staticWordVisible: false,
  },
  consoleErrors: [],
  hydrationErrors: [],
  gsapWarnings: [],
};

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") {
      report.consoleErrors.push(text);
      console.error(`[BROWSER ERROR] ${text}`);
    }
    if (/hydration/i.test(text)) {
      report.hydrationErrors.push(text);
    }
    if (/gsap warning/i.test(text)) {
      report.gsapWarnings.push(text);
    }
  });

  console.log(`[HERO CANVAS QA] Navigating to ${base}...`);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // =========================================================================
  // 1. REJECTION OF MULTI-WORD REEL & STRICT 3-WORD HEADLINE AUDIT
  // =========================================================================
  console.log("[HERO CANVAS QA] 1. Auditing Strict 3-Word Headline & Zero Alternate Words...");

  const headlineData = await page.evaluate(() => {
    const title = document.querySelector(".hero-kinetic-title");
    const srOnly = title?.querySelector(".sr-only")?.textContent?.trim() || "";
    const staticWords = Array.from(title?.querySelectorAll(".hero-word-static") || []).map(
      (el) => el.textContent?.trim() || ""
    );
    const simplifiedWords = Array.from(
      title?.querySelectorAll(".hero-simplified-word") || []
    ).map((el) => el.textContent?.trim() || "");

    const allTitleText = (title?.textContent || "").toUpperCase();
    const rejectedWords = ["CONNECTED.", "MANAGED.", "VISIBLE."];
    const foundRejected = rejectedWords.filter((w) => allTitleText.includes(w));

    return {
      srOnly,
      staticWords,
      simplifiedWords,
      foundRejected,
    };
  });

  console.log(`  Accessible headline (.sr-only): "${headlineData.srOnly}"`);
  console.log(`  Static lines: [${headlineData.staticWords.join(", ")}]`);
  console.log(`  Simplified copies: [${headlineData.simplifiedWords.join(", ")}]`);
  console.log(`  Found rejected alternate words: [${headlineData.foundRejected.join(", ")}]`);

  assert.equal(
    headlineData.srOnly,
    "Workplace Technology Simplified.",
    "Accessible headline must be exactly 'Workplace Technology Simplified.'"
  );
  assert.deepEqual(
    headlineData.staticWords,
    ["Workplace", "Technology"],
    "Static lines must be exactly 'Workplace' and 'Technology'"
  );
  assert.equal(
    headlineData.simplifiedWords.length,
    2,
    "Track must contain exactly 2 copies of 'Simplified.'"
  );
  assert.equal(
    headlineData.simplifiedWords[0],
    "Simplified.",
    "First copy must be 'Simplified.'"
  );
  assert.equal(
    headlineData.simplifiedWords[1],
    "Simplified.",
    "Second copy must be 'Simplified.'"
  );
  assert.equal(
    headlineData.foundRejected.length,
    0,
    `No alternate words allowed in headline! Found: ${headlineData.foundRejected.join(", ")}`
  );

  report.headlineRejectionAudit.noAlternateWords = headlineData.foundRejected.length === 0;
  report.headlineRejectionAudit.strictlyThreeWords = true;
  report.headlineRejectionAudit.wordsInDOM = [
    ...headlineData.staticWords,
    ...headlineData.simplifiedWords,
  ];

  // =========================================================================
  // 2. HERO CANVAS GEOMETRY & COMPOSITION AUDIT
  // =========================================================================
  console.log("[HERO CANVAS QA] 2. Auditing Hero Canvas Container Geometry & Clearance...");

  const canvasGeometry = await page.evaluate(() => {
    const hero = document.querySelector(".home-hero");
    const canvas = document.querySelector(".hero-canvas");
    const header = document.querySelector(".site-header");
    if (!hero || !canvas) return null;

    const heroRect = hero.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const headerRect = header ? header.getBoundingClientRect() : { bottom: 0 };
    const style = getComputedStyle(canvas);
    const heroStyle = getComputedStyle(hero);

    return {
      canvasPresent: true,
      borderRadius: style.borderRadius,
      overflow: style.overflow,
      heroWidth: heroRect.width,
      canvasWidth: canvasRect.width,
      gutterLeft: canvasRect.left,
      gutterRight: window.innerWidth - canvasRect.right,
      headerBottom: headerRect.bottom,
      canvasTop: canvasRect.top,
      heroPaddingTop: heroStyle.paddingTop,
    };
  });

  console.log(`  Canvas border-radius: ${canvasGeometry.borderRadius}`);
  console.log(`  Canvas overflow clipping: ${canvasGeometry.overflow}`);
  console.log(
    `  Desktop gutters: left=${canvasGeometry.gutterLeft.toFixed(1)}px, right=${canvasGeometry.gutterRight.toFixed(1)}px`
  );
  console.log(
    `  Navbar clearance: Header bottom = ${canvasGeometry.headerBottom.toFixed(1)}px, Canvas top = ${canvasGeometry.canvasTop.toFixed(1)}px`
  );

  const parsedRadius = parseFloat(canvasGeometry.borderRadius);
  assert.ok(
    parsedRadius >= 20,
    `Canvas border-radius should be >= 20px (clamp 22px-36px), got: ${parsedRadius}px`
  );
  assert.ok(
    canvasGeometry.gutterLeft >= 16 && canvasGeometry.gutterRight >= 16,
    `Canvas must have page gutters on desktop, got left=${canvasGeometry.gutterLeft}px, right=${canvasGeometry.gutterRight}px`
  );
  assert.ok(
    canvasGeometry.canvasTop >= canvasGeometry.headerBottom,
    `Canvas must sit cleanly beneath header without awkward overlap: header bottom=${canvasGeometry.headerBottom}px, canvas top=${canvasGeometry.canvasTop}px`
  );

  report.canvasGeometryAudit = {
    canvasPresent: true,
    borderRadiusPx: parsedRadius,
    pageGuttersDesktopPx: canvasGeometry.gutterLeft,
    clipsContent: canvasGeometry.overflow === "clip" || canvasGeometry.overflow === "hidden",
    clearsNavbar: canvasGeometry.canvasTop >= canvasGeometry.headerBottom,
    navbarBottomY: canvasGeometry.headerBottom,
    canvasTopY: canvasGeometry.canvasTop,
  };

  // =========================================================================
  // 3. THEME DUALITY & HARDWARE STAGE AUDIT (LIGHT VS DARK)
  // =========================================================================
  console.log("[HERO CANVAS QA] 3. Auditing Dual Theme Support (Light Hardware Stage vs Dark Atmosphere)...");

  // Force Light Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });
  await page.waitForTimeout(300);

  const lightData = await page.evaluate(() => {
    const canvas = document.querySelector(".hero-canvas");
    const staticWord = document.querySelector(".hero-word-static");
    const simplifiedWord = document.querySelector(".hero-simplified-word");
    const scrim = document.querySelector(".hero-bg-scrim");
    const pageBg = getComputedStyle(document.body).backgroundColor;

    return {
      canvasBg: canvas ? getComputedStyle(canvas).backgroundColor : "",
      staticColor: staticWord ? getComputedStyle(staticWord).color : "",
      simplifiedColor: simplifiedWord ? getComputedStyle(simplifiedWord).color : "",
      scrimBg: scrim ? getComputedStyle(scrim).backgroundImage : "",
      pageBg,
    };
  });

  console.log(`  Light Mode Body Background: ${lightData.pageBg}`);
  console.log(`  Light Mode .hero-canvas Background: ${lightData.canvasBg}`);
  console.log(`  Light Mode Static Word Color: ${lightData.staticColor}`);
  console.log(`  Light Mode Simplified Word Color: ${lightData.simplifiedColor}`);

  // In light theme, the body is light, but the .hero-canvas container is an intentional dark slate hardware stage (#050b18)
  const isLightCanvasDark =
    lightData.canvasBg.includes("rgb(5, 11, 24)") ||
    lightData.canvasBg.includes("rgb(2, 6, 23)");
  assert.ok(
    isLightCanvasDark,
    `Light mode .hero-canvas must be deep dark slate hardware stage (#050b18), got: ${lightData.canvasBg}`
  );
  assert.ok(
    !lightData.scrimBg.includes("rgba(255, 255, 255"),
    `Light mode scrim must not have white wash: ${lightData.scrimBg}`
  );

  report.themeAudit.lightCanvasBg = lightData.canvasBg;
  report.themeAudit.lightWordColor = lightData.staticColor;
  report.themeAudit.lightSimplifiedColor = lightData.simplifiedColor;
  report.themeAudit.noWhiteWashInLight = !lightData.scrimBg.includes("rgba(255, 255, 255");

  await page.screenshot({
    path: `${out}/hero-canvas-light.png`,
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // Switch to Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(300);

  const darkData = await page.evaluate(() => {
    const canvas = document.querySelector(".hero-canvas");
    const staticWord = document.querySelector(".hero-word-static");
    const simplifiedWord = document.querySelector(".hero-simplified-word");

    return {
      canvasBg: canvas ? getComputedStyle(canvas).backgroundColor : "",
      staticColor: staticWord ? getComputedStyle(staticWord).color : "",
      simplifiedColor: simplifiedWord ? getComputedStyle(simplifiedWord).color : "",
    };
  });

  console.log(`  Dark Mode .hero-canvas Background: ${darkData.canvasBg}`);
  console.log(`  Dark Mode Static Word Color: ${darkData.staticColor}`);
  console.log(`  Dark Mode Simplified Word Color: ${darkData.simplifiedColor}`);

  report.themeAudit.darkCanvasBg = darkData.canvasBg;
  report.themeAudit.darkWordColor = darkData.staticColor;
  report.themeAudit.darkSimplifiedColor = darkData.simplifiedColor;

  await page.screenshot({
    path: `${out}/hero-canvas-dark.png`,
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // =========================================================================
  // 4. SINGLE-WORD KINETIC ROLL & BASELINE STABILITY AUDIT
  // =========================================================================
  console.log("[HERO CANVAS QA] 4. Observing Single-Word Kinetic Roll Across 3 Cycles...");

  // Reload page to start cycle cleanly from t=0
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  const maskData = await page.evaluate(() => {
    const mask = document.querySelector(".hero-simplified-mask");
    const track = document.querySelector(".hero-simplified-track");
    const words = Array.from(document.querySelectorAll(".hero-simplified-word"));
    if (!mask || !track || words.length < 2) return null;

    const maskRect = mask.getBoundingClientRect();
    const style = getComputedStyle(mask);
    const word0Rect = words[0].getBoundingClientRect();
    const word1Rect = words[1].getBoundingClientRect();

    return {
      maskHeight: maskRect.height,
      maskOverflow: style.overflow,
      wordHeight: word0Rect.height,
      baselineInitialTop: word0Rect.top,
      secondWordInitialTop: word1Rect.top,
    };
  });

  console.log(`  Mask height: ${maskData.maskHeight.toFixed(1)}px (overflow: ${maskData.maskOverflow})`);
  console.log(`  Word height: ${maskData.wordHeight.toFixed(1)}px`);
  console.log(`  Word 0 initial top: ${maskData.baselineInitialTop.toFixed(1)}px`);
  console.log(`  Word 1 initial top: ${maskData.secondWordInitialTop.toFixed(1)}px (positioned right below Word 0)`);

  assert.ok(
    maskData.maskOverflow === "hidden" || maskData.maskOverflow === "clip",
    "Mask must strictly clip with overflow: hidden"
  );
  assert.ok(
    Math.abs(maskData.maskHeight - maskData.wordHeight) < 4,
    `Mask height (${maskData.maskHeight.toFixed(1)}px) must match single line word height (${maskData.wordHeight.toFixed(1)}px)`
  );

  report.kineticRollAudit.maskHeightPx = maskData.maskHeight;
  report.kineticRollAudit.maskOverflowHidden = true;
  report.kineticRollAudit.copiesCount = 2;
  report.kineticRollAudit.bothCopiesIdentical = true;

  // Poll over 12 seconds to observe 3 rolls (each roll ~3.15s: 2.4s hold + 0.75s roll)
  const rollObservations = [];
  const startRollTime = Date.now();
  let prevYPercent = 0;
  let rollsCount = 0;
  const baselines = [];

  while (Date.now() - startRollTime < 12000 && rollsCount < 3) {
    const state = await page.evaluate(() => {
      const track = document.querySelector(".hero-simplified-track");
      const words = Array.from(document.querySelectorAll(".hero-simplified-word"));
      const mask = document.querySelector(".hero-simplified-mask");
      if (!track || words.length < 2 || !mask) return null;

      const matrix = getComputedStyle(track).transform;
      let curY = 0;
      if (matrix && matrix !== "none") {
        const parts = matrix.split(",");
        if (parts.length === 6) {
          curY = parseFloat(parts[5]);
        } else if (parts.length === 16) {
          curY = parseFloat(parts[13]);
        }
      }

      // Check which word is in the mask
      const maskRect = mask.getBoundingClientRect();
      const w0Rect = words[0].getBoundingClientRect();
      const w1Rect = words[1].getBoundingClientRect();

      return {
        curY,
        w0Top: w0Rect.top,
        w1Top: w1Rect.top,
        maskTop: maskRect.top,
        scrollY: window.scrollY,
      };
    });

    assert.equal(state?.scrollY, 0, "Hero animation must progress without user scroll");

    // Detect when Word 2 is rolled in or reset happens
    if (state) {
      const elapsed = ((Date.now() - startRollTime) / 1000).toFixed(2);
      // Track moved significantly
      if (Math.abs(state.curY - prevYPercent) > 10) {
        // roll motion underway
      }
      // When at rest (curY near 0 after motion)
      if (Math.abs(state.curY) < 2 && Math.abs(prevYPercent) > 20) {
        rollsCount++;
        const activeBaseline = state.w0Top;
        baselines.push(activeBaseline);
        console.log(
          `  [t=${elapsed}s] Roll Cycle #${rollsCount} Completed! Baseline returned to: ${activeBaseline.toFixed(1)}px (initial: ${maskData.baselineInitialTop.toFixed(1)}px)`
        );
        rollObservations.push({ cycle: rollsCount, time: elapsed, baseline: activeBaseline });
      }
      prevYPercent = state.curY;
    }

    await page.waitForTimeout(100);
  }

  assert.ok(rollsCount >= 2, `Expected at least 2 complete roll cycles in 12s, observed: ${rollsCount}`);
  report.kineticRollAudit.automatic = true;
  report.kineticRollAudit.scrollRequired = false;
  report.kineticRollAudit.cyclesObserved = rollsCount;
  report.kineticRollAudit.cycleTimings = rollObservations;

  if (baselines.length > 0) {
    const drift = Math.max(...baselines) - Math.min(...baselines);
    report.kineticRollAudit.baselineStabilityPx = drift;
    console.log(`  Baseline Stability Drift: ${drift.toFixed(2)}px (<= 1.0px required)`);
    assert.ok(drift <= 1.0, `Baseline must not drift across cycles: drift=${drift}px`);
  }

  // =========================================================================
  // 5. VIDEO FRAMING & CONTINUOUS PLAYBACK AUDIT
  // =========================================================================
  console.log("[HERO CANVAS QA] 5. Auditing Hardware Video Framing & Playback...");

  const videoData = await page.evaluate(() => {
    const video = document.querySelector(".hero-bg-video");
    if (!video) return null;
    const style = getComputedStyle(video);
    return {
      paused: video.paused,
      muted: video.muted,
      loop: video.loop,
      currentTime: video.currentTime,
      duration: video.duration,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      display: style.display,
    };
  });

  console.log(`  Video object-fit: ${videoData.objectFit}`);
  console.log(`  Video object-position: ${videoData.objectPosition}`);
  console.log(`  Video duration: ${videoData.duration.toFixed(2)}s, currentTime: ${videoData.currentTime.toFixed(2)}s`);
  console.log(`  Video paused: ${videoData.paused}, muted: ${videoData.muted}, loop: ${videoData.loop}`);

  assert.equal(videoData.objectFit, "cover", "Video must have object-fit: cover");
  assert.ok(
    videoData.objectPosition.includes("60%") || videoData.objectPosition.includes("center"),
    `Video framing must prioritize hardware setup (center 60%), got: ${videoData.objectPosition}`
  );
  assert.equal(videoData.paused, false, "Video must play automatically");
  assert.equal(videoData.muted, true, "Video must be muted for autoplay");
  assert.equal(videoData.loop, true, "Video must loop continuously");

  report.videoCompositionAudit = {
    objectFit: videoData.objectFit,
    objectPosition: videoData.objectPosition,
    continuousPlayback: !videoData.paused,
    loopVerified: videoData.loop,
  };

  // =========================================================================
  // 6. REDUCED MOTION AUDIT
  // =========================================================================
  console.log("[HERO CANVAS QA] 6. Auditing prefers-reduced-motion: reduce...");

  const reducedPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await reducedPage.emulateMedia({ reducedMotion: "reduce" });
  await reducedPage.goto(base, { waitUntil: "networkidle" });
  await reducedPage.waitForTimeout(800);

  const reducedData = await reducedPage.evaluate(() => {
    const video = document.querySelector(".hero-bg-video");
    const track = document.querySelector(".hero-simplified-track");
    const words = Array.from(document.querySelectorAll(".hero-simplified-word"));
    if (!video || !track || words.length < 2) return null;

    const trackStyle = getComputedStyle(track);
    const word0Style = getComputedStyle(words[0]);
    const word1Style = getComputedStyle(words[1]);

    return {
      videoPaused: video.paused,
      trackTransform: trackStyle.transform,
      word0Display: word0Style.display,
      word1Display: word1Style.display,
      word0Text: words[0].textContent?.trim(),
    };
  });

  console.log(`  Reduced Motion Video Paused: ${reducedData.videoPaused}`);
  console.log(`  Track transform: ${reducedData.trackTransform}`);
  console.log(`  Word 0 text & display: "${reducedData.word0Text}" (${reducedData.word0Display})`);
  console.log(`  Word 1 (duplicate) display: ${reducedData.word1Display}`);

  assert.equal(reducedData.videoPaused, true, "Video must be paused in reduced motion mode");
  assert.equal(reducedData.word1Display, "none", "Second copy of Simplified must be hidden in reduced motion");

  report.reducedMotionAudit = {
    videoPaused: reducedData.videoPaused,
    secondWordHidden: reducedData.word1Display === "none",
    staticWordVisible: reducedData.word0Display !== "none" && reducedData.word0Text === "Simplified.",
  };

  await reducedPage.screenshot({
    path: `${out}/hero-reduced-motion.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });
  await reducedPage.close();

  // =========================================================================
  // 7. RESPONSIVE MATRIX AUDIT (8 VIEWPORTS: 360PX TO 1920PX)
  // =========================================================================
  console.log("[HERO CANVAS QA] 7. Auditing Responsive Matrix (360px - 1920px, 0px Overflow)...");

  const viewports = [
    { name: "mobile-360", width: 360, height: 780 },
    { name: "mobile-390", width: 390, height: 844 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "tablet-820", width: 820, height: 1180 },
    { name: "laptop-1280", width: 1280, height: 800 },
    { name: "laptop-1440", width: 1440, height: 900 },
    { name: "desktop-1600", width: 1600, height: 1000 },
    { name: "desktop-1920", width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);

    const vpMetrics = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const overflowPx = Math.max(0, docWidth - winWidth);
      const canvas = document.querySelector(".hero-canvas");
      const canvasRect = canvas ? canvas.getBoundingClientRect() : null;

      return {
        docWidth,
        winWidth,
        overflowPx,
        canvasWidth: canvasRect ? canvasRect.width : 0,
        gutterLeft: canvasRect ? canvasRect.left : 0,
        gutterRight: canvasRect ? window.innerWidth - canvasRect.right : 0,
      };
    });

    console.log(
      `  [${vp.name}] Width: ${vp.width}px | Overflow: ${vpMetrics.overflowPx}px | Canvas Width: ${vpMetrics.canvasWidth.toFixed(1)}px | Gutters: L=${vpMetrics.gutterLeft.toFixed(1)}px R=${vpMetrics.gutterRight.toFixed(1)}px`
    );

    assert.equal(
      vpMetrics.overflowPx,
      0,
      `Horizontal overflow detected at ${vp.width}px! Overflow = ${vpMetrics.overflowPx}px`
    );

    await page.screenshot({
      path: `${out}/viewport-${vp.name}.png`,
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(850, vp.height) },
    });

    report.responsiveAudit.push({
      viewport: vp.name,
      width: vp.width,
      overflowPx: vpMetrics.overflowPx,
      canvasWidth: vpMetrics.canvasWidth,
      gutters: { left: vpMetrics.gutterLeft, right: vpMetrics.gutterRight },
    });
  }

  // Check console / hydration / GSAP warnings
  assert.equal(report.consoleErrors.length, 0, `Console errors: ${JSON.stringify(report.consoleErrors)}`);
  assert.equal(report.hydrationErrors.length, 0, `Hydration errors: ${JSON.stringify(report.hydrationErrors)}`);
  assert.equal(report.gsapWarnings.length, 0, `GSAP warnings: ${JSON.stringify(report.gsapWarnings)}`);

  console.log("\n=======================================================");
  console.log("✅ ALL HERO CANVAS & KINETIC ROLL AUDITS PASSED WITH ZERO DEFECTS!");
  console.log("=======================================================\n");
} finally {
  await browser.close();
  await writeFile(`${out}/qa-report.json`, JSON.stringify(report, null, 2), "utf8");
}
