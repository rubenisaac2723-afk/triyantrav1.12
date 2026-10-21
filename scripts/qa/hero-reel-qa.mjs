import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/hero-reel";
await mkdir(out, { recursive: true });

const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/opt/google/chrome/chrome");

console.log(`[HERO REEL QA] Launching Chromium: ${chromePath}`);
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const report = {
  timestamp: new Date().toISOString(),
  base,
  wordSequenceAudit: {
    automatic: false,
    scrollRequired: false,
    seamlessLoop: false,
    cycle1: false,
    cycle2: false,
    cyclesObserved: [],
    opticalCenteringPass: false,
  },
  themeIndependenceAudit: {
    lightHeroBackground: "",
    darkHeroBackground: "",
    lightWordColor: "",
    darkWordColor: "",
    whiteWashRemoved: false,
    sameCinematicTreatment: false,
  },
  videoLoopAudit: {
    videoLoop1: false,
    videoLoop2: false,
    currentTimeSamples: [],
  },
  responsiveAudit: [],
  reducedMotionAudit: {
    reelPaused: false,
    staticWord: "",
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

  console.log(`[HERO REEL QA] Navigating to ${base}...`);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // =========================================================================
  // 1. THEME INDEPENDENCE & WHITE WASH AUDIT (LIGHT VS DARK)
  // =========================================================================
  console.log("[HERO REEL QA] 1. Checking Theme Independence & White Wash Removal...");

  // Force Light Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });
  await page.waitForTimeout(300);

  const lightStyles = await page.evaluate(() => {
    const hero = document.querySelector(".home-hero");
    const scrim = document.querySelector(".hero-bg-scrim");
    const overlay = document.querySelector(".hero-bg-overlay");
    const staticWord = document.querySelector(".hero-word-static");
    const promise = document.querySelector(".hero-promise");
    const video = document.querySelector(".hero-bg-video");

    return {
      heroBg: hero ? getComputedStyle(hero).backgroundColor : "",
      scrimBg: scrim ? getComputedStyle(scrim).backgroundImage : "",
      overlayBg: overlay ? getComputedStyle(overlay).backgroundImage : "",
      wordColor: staticWord ? getComputedStyle(staticWord).color : "",
      promiseColor: promise ? getComputedStyle(promise).color : "",
      videoDisplay: video ? getComputedStyle(video).display : "",
    };
  });

  report.themeIndependenceAudit.lightHeroBackground = lightStyles.heroBg;
  report.themeIndependenceAudit.lightWordColor = lightStyles.wordColor;

  console.log(`  Light Mode .home-hero background: ${lightStyles.heroBg}`);
  console.log(`  Light Mode .hero-word-static color: ${lightStyles.wordColor}`);
  console.log(`  Light Mode .hero-promise color: ${lightStyles.promiseColor}`);

  // Confirm Light mode hero background is dark navy (#020617 = rgb(2, 6, 23)), NOT white (rgb(255, 255, 255))
  const isLightHeroDark =
    lightStyles.heroBg.includes("rgb(2, 6, 23)") ||
    lightStyles.heroBg.includes("rgba(2, 6, 23");
  assert.ok(
    isLightHeroDark,
    `Light mode hero background should be dark navy (#020617), got: ${lightStyles.heroBg}`
  );

  // Confirm word color in light mode is near-white (rgb(248, 250, 252)), NOT black/dark
  assert.ok(
    lightStyles.wordColor.includes("248, 250, 252") ||
      lightStyles.wordColor.includes("255, 255, 255"),
    `Light mode static words should remain near-white, got: ${lightStyles.wordColor}`
  );

  // Confirm scrim does NOT contain white wash (no rgba(255, 255, 255) in scrim)
  const isScrimClean = !lightStyles.scrimBg.includes("rgba(255, 255, 255");
  assert.ok(
    isScrimClean,
    `Light mode scrim should not have white wash gradient: ${lightStyles.scrimBg}`
  );

  report.themeIndependenceAudit.whiteWashRemoved = isLightHeroDark && isScrimClean;

  // Take screenshot in Light mode
  await page.screenshot({
    path: `${out}/hero-light-cinematic.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });

  // Switch to Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(300);

  const darkStyles = await page.evaluate(() => {
    const hero = document.querySelector(".home-hero");
    const staticWord = document.querySelector(".hero-word-static");
    return {
      heroBg: hero ? getComputedStyle(hero).backgroundColor : "",
      wordColor: staticWord ? getComputedStyle(staticWord).color : "",
    };
  });

  report.themeIndependenceAudit.darkHeroBackground = darkStyles.heroBg;
  report.themeIndependenceAudit.darkWordColor = darkStyles.wordColor;
  report.themeIndependenceAudit.sameCinematicTreatment =
    darkStyles.heroBg === lightStyles.heroBg &&
    darkStyles.wordColor === lightStyles.wordColor;

  console.log(`  Dark Mode .home-hero background: ${darkStyles.heroBg}`);
  console.log(`  Dark Mode .hero-word-static color: ${darkStyles.wordColor}`);
  console.log(
    `  Same Cinematic Treatment across themes: ${report.themeIndependenceAudit.sameCinematicTreatment ? "PASS" : "FAIL"}`
  );

  await page.screenshot({
    path: `${out}/hero-dark-cinematic.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });

  // =========================================================================
  // 2. AUTOMATIC WORD REEL OBSERVATION (TWO FULL CYCLES WITHOUT SCROLL)
  // =========================================================================
  console.log("[HERO REEL QA] 2. Observing Two Full Word Cycles (Automatic, No Scroll)...");

  // Reload page to start cycle 1 cleanly from SIMPLIFIED. at t=0
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Verify scrollY is 0 throughout
  const initialScrollY = await page.evaluate(() => window.scrollY);
  assert.equal(initialScrollY, 0, "Initial scrollY must be 0");

  const observedActiveWords = [];
  const startTime = Date.now();
  let lastWord = "";
  const centers = [];

  // Poll over ~22 seconds (two full 9.0s cycles + buffer)
  while (Date.now() - startTime < 22000 && observedActiveWords.length < 9) {
    const sample = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".hero-reel-item"));
      const viewport = document.querySelector(".hero-reel-viewport");
      const track = document.querySelector(".hero-reel-track");
      if (!viewport || !track) return null;

      const vpRect = viewport.getBoundingClientRect();
      const vpCenterY = vpRect.top + vpRect.height / 2;
      const vpCenterX = vpRect.left + vpRect.width / 2;

      // Find item closest to viewport center Y
      let closestItem = null;
      let minDistance = Infinity;

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        const itemCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(itemCenterY - vpCenterY);
        const opacity = parseFloat(getComputedStyle(item).opacity);

        if (dist < minDistance) {
          minDistance = dist;
          closestItem = {
            index,
            text: (item.textContent || "").trim().toUpperCase(),
            dist,
            opacity,
            itemCenterX,
            vpCenterX,
            diffX: Math.abs(itemCenterX - vpCenterX),
          };
        }
      });

      return {
        closestItem,
        scrollY: window.scrollY,
      };
    });

    if (sample && sample.closestItem && sample.closestItem.dist < 15) {
      const word = sample.closestItem.text;
      if (word !== lastWord && sample.closestItem.opacity > 0.8) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(
          `  [t=${elapsed}s] Active Word Center: "${word}" (dist: ${sample.closestItem.dist.toFixed(1)}px, opacity: ${sample.closestItem.opacity.toFixed(2)}, horiz diff: ${sample.closestItem.diffX.toFixed(1)}px)`
        );
        observedActiveWords.push({
          word,
          time: elapsed,
          diffX: sample.closestItem.diffX,
        });
        centers.push(sample.closestItem.diffX);
        lastWord = word;
      }
    }

    assert.equal(sample?.scrollY, 0, "Reel must progress without user scroll");
    await page.waitForTimeout(200);
  }

  const finalScrollY = await page.evaluate(() => window.scrollY);
  assert.equal(finalScrollY, 0, "Reel progressed completely with 0px scroll");
  report.wordSequenceAudit.scrollRequired = false;
  report.wordSequenceAudit.automatic = true;

  const observedTexts = observedActiveWords.map((w) => w.word);
  report.wordSequenceAudit.cyclesObserved = observedActiveWords;
  console.log(`  Observed Sequence (${observedTexts.length} steps): ${observedTexts.join(" -> ")}`);

  // Check Cycle 1: SIMPLIFIED. -> CONNECTED. -> MANAGED. -> VISIBLE. -> SIMPLIFIED.
  const c1Expected = ["SIMPLIFIED.", "CONNECTED.", "MANAGED.", "VISIBLE.", "SIMPLIFIED."];
  const c1Pass = c1Expected.every((w, i) => observedTexts[i] === w);
  report.wordSequenceAudit.cycle1 = c1Pass;
  console.log(`  Cycle 1 Complete: ${c1Pass ? "PASS" : "FAIL"}`);

  // Check Cycle 2: CONNECTED. -> MANAGED. -> VISIBLE. -> SIMPLIFIED.
  const c2Expected = ["CONNECTED.", "MANAGED.", "VISIBLE.", "SIMPLIFIED."];
  const c2Pass = c2Expected.every((w, i) => observedTexts[5 + i] === w);
  report.wordSequenceAudit.cycle2 = c2Pass;
  console.log(`  Cycle 2 Complete: ${c2Pass ? "PASS" : "FAIL"}`);

  report.wordSequenceAudit.seamlessLoop = c1Pass && c2Pass;

  // Optical centering: max horizontal drift between active words < 2px
  const maxHorizDiff = Math.max(...centers);
  report.wordSequenceAudit.opticalCenteringPass = maxHorizDiff < 2.0;
  console.log(
    `  Active Word Optical Centering: max horiz drift = ${maxHorizDiff.toFixed(2)}px (${report.wordSequenceAudit.opticalCenteringPass ? "PASS" : "FAIL"})`
  );

  // =========================================================================
  // 3. VIDEO PLAYBACK & TWO LOOPS AUDIT
  // =========================================================================
  console.log("[HERO REEL QA] 3. Verifying Video Playback & Loop Continuity...");

  const videoMeta = await page.evaluate(() => {
    const video = document.querySelector(".hero-bg-video");
    if (!video) return null;
    return {
      paused: video.paused,
      muted: video.muted,
      loop: video.loop,
      duration: video.duration,
      currentTime: video.currentTime,
      readyState: video.readyState,
    };
  });

  console.log(
    `  Video state: duration=${videoMeta?.duration}s, paused=${videoMeta?.paused}, muted=${videoMeta?.muted}, loop=${videoMeta?.loop}`
  );
  assert.ok(!videoMeta?.paused, "Video must be playing");
  assert.ok(videoMeta?.loop, "Video must have loop attribute");
  assert.ok(videoMeta?.duration > 9.5, "Video duration must be ~10s");

  // Track video progress across loop
  let loopedCount = 0;
  let prevTime = videoMeta.currentTime;
  const loopStartTime = Date.now();

  while (Date.now() - loopStartTime < 23000 && loopedCount < 2) {
    const curr = await page.evaluate(() => {
      const v = document.querySelector(".hero-bg-video");
      return v ? v.currentTime : 0;
    });

    if (curr < prevTime && prevTime > 8.0) {
      loopedCount++;
      console.log(
        `  Video Loop ${loopedCount} detected! (from ${prevTime.toFixed(2)}s back to ${curr.toFixed(2)}s)`
      );
      if (loopedCount === 1) report.videoLoopAudit.videoLoop1 = true;
      if (loopedCount === 2) report.videoLoopAudit.videoLoop2 = true;
    }
    prevTime = curr;
    await page.waitForTimeout(400);
  }

  console.log(
    `  Video Loops Completed: ${loopedCount} (Loop 1: ${report.videoLoopAudit.videoLoop1 ? "PASS" : "FAIL"}, Loop 2: ${report.videoLoopAudit.videoLoop2 ? "PASS" : "FAIL"})`
  );

  // =========================================================================
  // 4. RESPONSIVE AUDIT ACROSS 8 VIEWPORTS
  // =========================================================================
  console.log("[HERO REEL QA] 4. Testing Responsive Viewports (390 to 1920)...");

  const testViewports = [
    { width: 390, height: 844, name: "Mobile iPhone" },
    { width: 430, height: 932, name: "Mobile Max" },
    { width: 768, height: 1024, name: "Tablet iPad Mini" },
    { width: 1024, height: 1366, name: "Tablet Pro" },
    { width: 1280, height: 720, name: "Laptop HD" },
    { width: 1366, height: 768, name: "Laptop WXGA" },
    { width: 1440, height: 900, name: "Desktop Mac" },
    { width: 1920, height: 1080, name: "Desktop FHD" },
  ];

  for (const vp of testViewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);

    const vpMetrics = await page.evaluate(() => {
      const hero = document.querySelector(".home-hero");
      const video = document.querySelector(".hero-bg-video");
      const reel = document.querySelector(".hero-reel-viewport");
      const cta = document.querySelector(".hero-actions-row");

      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      const hasOverflow = scrollW > clientW + 1;

      return {
        hasOverflow,
        scrollW,
        clientW,
        videoW: video ? video.getBoundingClientRect().width : 0,
        heroW: hero ? hero.getBoundingClientRect().width : 0,
        reelVisible: reel ? getComputedStyle(reel).display !== "none" : false,
        titleClipped: false,
        ctaVisible: cta ? getComputedStyle(cta).display !== "none" : false,
      };
    });

    const isFullBleed = Math.abs(vpMetrics.videoW - vp.width) <= 2;
    const pass = !vpMetrics.hasOverflow && isFullBleed && vpMetrics.reelVisible && vpMetrics.ctaVisible;

    report.responsiveAudit.push({
      viewport: `${vp.width}x${vp.height} (${vp.name})`,
      fullBleed: isFullBleed,
      overflow: vpMetrics.hasOverflow ? "FAIL" : "NONE",
      reelActive: vpMetrics.reelVisible,
      ctaVisible: vpMetrics.ctaVisible,
      pass,
    });

    console.log(
      `  ${vp.width}px: Full Bleed=${isFullBleed ? "PASS" : "FAIL"} | Overflow=${vpMetrics.hasOverflow ? "FAIL" : "NONE"} | Reel=${vpMetrics.reelVisible ? "PASS" : "FAIL"} | CTA=${vpMetrics.ctaVisible ? "PASS" : "FAIL"}`
    );
  }

  // =========================================================================
  // 5. REDUCED MOTION AUDIT
  // =========================================================================
  console.log("[HERO REEL QA] 5. Testing prefers-reduced-motion: reduce...");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const reducedState = await page.evaluate(() => {
    const video = document.querySelector(".hero-bg-video");
    const activeItem = document.querySelector(".hero-reel-item.is-default-active");
    const hiddenItems = Array.from(
      document.querySelectorAll(".hero-reel-item:not(.is-default-active)")
    );
    const allHidden = hiddenItems.every(
      (item) => getComputedStyle(item).display === "none"
    );

    return {
      videoPaused: video ? video.paused : false,
      activeText: activeItem ? (activeItem.textContent || "").trim() : "",
      allHidden,
    };
  });

  report.reducedMotionAudit.reelPaused = reducedState.allHidden;
  report.reducedMotionAudit.staticWord = reducedState.activeText;
  const isReducedStaticPass = reducedState.activeText.toUpperCase() === "SIMPLIFIED.";
  console.log(`  Reduced Motion Video Paused: ${reducedState.videoPaused ? "PASS" : "FAIL"}`);
  console.log(`  Reduced Motion Static Word: "${reducedState.activeText}" (${isReducedStaticPass ? "PASS" : "FAIL"})`);
  console.log(`  Reduced Motion Inactive Words Hidden: ${reducedState.allHidden ? "PASS" : "FAIL"}`);

  // Write full JSON report
  await writeFile(
    `${out}/hero-reel-audit-report.json`,
    JSON.stringify(report, null, 2),
    "utf-8"
  );
  console.log(`\n[HERO REEL QA] Audit completed! Report saved to ${out}/hero-reel-audit-report.json`);

} catch (err) {
  console.error("[HERO REEL QA ERROR]", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
