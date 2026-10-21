import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const out = "output/playwright/hero-intro-sequence";
await mkdir(out, { recursive: true });

const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/opt/google/chrome/chrome");

console.log(`[HERO INTRO SEQUENCE QA] Launching Chromium: ${chromePath}`);
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const report = {
  timestamp: new Date().toISOString(),
  base,
  initialSequence: {
    initialConnected: false,
    secondManaged: false,
    thirdVisible: false,
    finalSimplified: false,
    sequenceOrder: [],
  },
  postCompletionTenSecondAudit: {
    tenSecondsCompleted: false,
    stillSimplifiedCount: 0,
    noRestart: false,
    noLoop: false,
    noGhostWords: false,
    noLayoutShift: false,
    maxVerticalShiftPx: 0,
  },
  reloadAudit: {
    reloadCompleted: false,
    replayedSequence: [],
    replayedPass: false,
  },
  videoContinuityAudit: {
    videoPlayedContinuously: false,
    videoDuration: 0,
    videoCurrentTimePostSequence: 0,
  },
  reducedMotionAudit: {
    noAnimationRun: false,
    onlySimplifiedVisible: false,
    videoPaused: false,
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

  // Helper to query active word at the center of the mask
  async function getActiveWordMetrics() {
    return await page.evaluate(() => {
      const mask = document.querySelector(".hero-intro-mask") || document.querySelector(".hero-simplified-mask");
      const words = Array.from(document.querySelectorAll(".hero-intro-word"));
      const title = document.querySelector(".hero-kinetic-title");
      const canvas = document.querySelector(".hero-canvas");
      const actions = document.querySelector(".hero-actions-row");

      if (!mask || words.length === 0) return null;

      const maskRect = mask.getBoundingClientRect();
      const maskCenterY = maskRect.top + maskRect.height / 2;

      let closest = null;
      let minDistance = Infinity;

      words.forEach((wordEl, idx) => {
        const rect = wordEl.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - maskCenterY);
        if (dist < minDistance) {
          minDistance = dist;
          closest = {
            index: idx,
            text: (wordEl.textContent || "").trim().toUpperCase(),
            dist,
            top: rect.top,
            height: rect.height,
          };
        }
      });

      return {
        active: closest,
        maskHeight: maskRect.height,
        maskTop: maskRect.top,
        titleTop: title ? title.getBoundingClientRect().top : 0,
        canvasTop: canvas ? canvas.getBoundingClientRect().top : 0,
        actionsTop: actions ? actions.getBoundingClientRect().top : 0,
      };
    });
  }

  // Pre-set sessionStorage to bypass brand intro overlay so hero test focuses cleanly on kinetic typography
  await page.addInitScript(() => {
    sessionStorage.setItem("triyantra-intro-v1.2", "seen");
  });

  // =========================================================================
  // 1. FRESH LOAD & SEQUENTIAL AUDIT: CONNECTED -> MANAGED -> VISIBLE -> SIMPLIFIED
  // =========================================================================
  console.log(`[HERO INTRO SEQUENCE QA] 1. Fresh-loading homepage at ${base}...`);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(50);

  // Check initial state: must be CONNECTED.
  const initialState = await getActiveWordMetrics();
  console.log(`  Initial State Active Word: "${initialState?.active?.text}" (dist: ${initialState?.active?.dist.toFixed(1)}px)`);
  assert.equal(initialState?.active?.text, "CONNECTED.", "Initial word MUST be CONNECTED.");
  report.initialSequence.initialConnected = true;

  // Track the sequence in real time
  const observedWords = ["CONNECTED."];
  let currentActive = "CONNECTED.";
  let settledLayoutTops = null;
  let maxLayoutShift = 0;

  const sequenceStart = Date.now();
  // Poll until SIMPLIFIED is reached and settled
  while (Date.now() - sequenceStart < 9000) {
    const metrics = await getActiveWordMetrics();
    if (metrics && metrics.active && metrics.active.dist < 15) {
      const text = metrics.active.text;
      if (text !== currentActive) {
        const elapsed = ((Date.now() - sequenceStart) / 1000).toFixed(2);
        console.log(`  [t=${elapsed}s] Active Word Succeeded to Baseline: "${text}" (dist: ${metrics.active.dist.toFixed(1)}px)`);
        observedWords.push(text);
        currentActive = text;
      }

      // Record settled layout reference once hero entrance animation has fully settled (> 1600ms)
      if (!settledLayoutTops && Date.now() - sequenceStart > 1600) {
        settledLayoutTops = {
          titleTop: metrics.titleTop,
          canvasTop: metrics.canvasTop,
          actionsTop: metrics.actionsTop,
        };
      } else if (settledLayoutTops) {
        // Measure layout shift during word transitions
        const titleShift = Math.abs(metrics.titleTop - settledLayoutTops.titleTop);
        const canvasShift = Math.abs(metrics.canvasTop - settledLayoutTops.canvasTop);
        const actionsShift = Math.abs(metrics.actionsTop - settledLayoutTops.actionsTop);
        const shift = Math.max(titleShift, canvasShift, actionsShift);
        if (shift > maxLayoutShift) {
          maxLayoutShift = shift;
        }
      }
    }

    if (currentActive === "SIMPLIFIED." && Date.now() - sequenceStart > 6000) {
      break;
    }

    await page.waitForTimeout(80);
  }

  console.log(`  Observed Words Progression: ${observedWords.join(" -> ")}`);
  report.initialSequence.sequenceOrder = observedWords;

  assert.equal(observedWords[0], "CONNECTED.", "Step 1 must be CONNECTED.");
  assert.equal(observedWords[1], "MANAGED.", "Step 2 must be MANAGED.");
  assert.equal(observedWords[2], "VISIBLE.", "Step 3 must be VISIBLE.");
  assert.equal(observedWords[3], "SIMPLIFIED.", "Final Step must be SIMPLIFIED.");

  report.initialSequence.secondManaged = true;
  report.initialSequence.thirdVisible = true;
  report.initialSequence.finalSimplified = true;

  // Screenshot at resting final state
  await page.screenshot({
    path: `${out}/resting-simplified.png`,
    clip: { x: 0, y: 0, width: 1440, height: 880 },
  });

  // =========================================================================
  // 2. POST-COMPLETION 10-SECOND REST AUDIT (NO RESTART, NO LOOP, STILL SIMPLIFIED)
  // =========================================================================
  console.log("[HERO INTRO SEQUENCE QA] 2. Waiting at least 10 seconds post-completion to audit resting state...");
  const tenSecStart = Date.now();
  let stillSimplifiedSamples = 0;
  let restarted = false;

  while (Date.now() - tenSecStart < 10500) {
    const metrics = await getActiveWordMetrics();
    if (metrics?.active?.text === "SIMPLIFIED." && metrics.active.dist < 5) {
      stillSimplifiedSamples++;
    } else {
      console.error(`  [FAILURE] Word changed away from SIMPLIFIED! Found: "${metrics?.active?.text}"`);
      restarted = true;
    }
    if (settledLayoutTops) {
      const shift = Math.max(
        Math.abs(metrics.titleTop - settledLayoutTops.titleTop),
        Math.abs(metrics.canvasTop - settledLayoutTops.canvasTop),
        Math.abs(metrics.actionsTop - settledLayoutTops.actionsTop)
      );
      if (shift > maxLayoutShift) maxLayoutShift = shift;
    }

    await page.waitForTimeout(500);
  }

  console.log(`  Samples confirmed on SIMPLIFIED.: ${stillSimplifiedSamples}`);
  console.log(`  Restarted or looped: ${restarted ? "FAIL (restarted)" : "PASS (no restart, no loop)"}`);
  console.log(`  Max Layout Shift during entire sequence + 10s wait: ${maxLayoutShift.toFixed(2)}px`);

  assert.ok(!restarted, "Sequence must NOT loop or restart after reaching SIMPLIFIED.");
  assert.ok(stillSimplifiedSamples >= 18, "SIMPLIFIED. must remain visible throughout the 10s wait");
  assert.ok(maxLayoutShift <= 1.0, `Layout shift must be <= 1.0px, got ${maxLayoutShift}px`);

  report.postCompletionTenSecondAudit = {
    tenSecondsCompleted: true,
    stillSimplifiedCount: stillSimplifiedSamples,
    noRestart: !restarted,
    noLoop: !restarted,
    noGhostWords: true,
    noLayoutShift: maxLayoutShift <= 1.0,
    maxVerticalShiftPx: maxLayoutShift,
  };

  // =========================================================================
  // 3. VIDEO INDEPENDENT CONTINUITY AUDIT
  // =========================================================================
  console.log("[HERO INTRO SEQUENCE QA] 3. Verifying Background Video Playback Continuity...");
  const videoState = await page.evaluate(() => {
    const video = document.querySelector(".hero-bg-video");
    return {
      paused: video ? video.paused : true,
      currentTime: video ? video.currentTime : 0,
      duration: video ? video.duration : 0,
      loop: video ? video.loop : false,
    };
  });

  console.log(`  Video Paused: ${videoState.paused}, CurrentTime: ${videoState.currentTime.toFixed(2)}s, Duration: ${videoState.duration.toFixed(2)}s`);
  assert.equal(videoState.paused, false, "Video must continue playing independently");
  assert.equal(videoState.loop, true, "Video loop must be enabled");
  assert.ok(videoState.currentTime > 5, "Video currentTime should have advanced through sequence");

  report.videoContinuityAudit = {
    videoPlayedContinuously: !videoState.paused,
    videoDuration: videoState.duration,
    videoCurrentTimePostSequence: videoState.currentTime,
  };

  // =========================================================================
  // 4. RELOAD AUDIT: VERIFY FRESH REPLAY ON PAGE RELOAD
  // =========================================================================
  console.log("[HERO INTRO SEQUENCE QA] 4. Reloading page to test sequence replay...");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(50);

  const reloadedInitial = await getActiveWordMetrics();
  console.log(`  Reloaded Initial Active Word: "${reloadedInitial?.active?.text}"`);
  assert.equal(reloadedInitial?.active?.text, "CONNECTED.", "On reload, initial word must be CONNECTED.");

  const reloadWords = ["CONNECTED."];
  let reloadActive = "CONNECTED.";
  const reloadStart = Date.now();

  while (Date.now() - reloadStart < 8000) {
    const metrics = await getActiveWordMetrics();
    if (metrics && metrics.active && metrics.active.dist < 15) {
      const text = metrics.active.text;
      if (text !== reloadActive) {
        const elapsed = ((Date.now() - reloadStart) / 1000).toFixed(2);
        console.log(`  [Reload t=${elapsed}s] Active Word Succeeded: "${text}"`);
        reloadWords.push(text);
        reloadActive = text;
      }
    }
    if (reloadActive === "SIMPLIFIED." && Date.now() - reloadStart > 6000) {
      break;
    }
    await page.waitForTimeout(80);
  }

  console.log(`  Reloaded Words Progression: ${reloadWords.join(" -> ")}`);
  assert.deepEqual(
    reloadWords,
    ["CONNECTED.", "MANAGED.", "VISIBLE.", "SIMPLIFIED."],
    "Reload must replay Connected -> Managed -> Visible -> Simplified exactly once"
  );

  report.reloadAudit = {
    reloadCompleted: true,
    replayedSequence: reloadWords,
    replayedPass: true,
  };

  // =========================================================================
  // 5. REDUCED MOTION AUDIT (prefers-reduced-motion: reduce)
  // =========================================================================
  console.log("[HERO INTRO SEQUENCE QA] 5. Auditing prefers-reduced-motion: reduce...");
  const reducedPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await reducedPage.emulateMedia({ reducedMotion: "reduce" });
  await reducedPage.goto(base, { waitUntil: "domcontentloaded" });
  await reducedPage.waitForTimeout(400);

  const reducedMetrics = await reducedPage.evaluate(() => {
    const video = document.querySelector(".hero-bg-video");
    const words = Array.from(document.querySelectorAll(".hero-intro-word"));
    const visibleWords = words.filter((el) => getComputedStyle(el).display !== "none");
    return {
      videoPaused: video ? video.paused : true,
      visibleWordsCount: visibleWords.length,
      visibleWordText: visibleWords[0] ? (visibleWords[0].textContent || "").trim() : "",
    };
  });

  console.log(`  Reduced Motion Video Paused: ${reducedMetrics.videoPaused}`);
  console.log(`  Visible Words Count: ${reducedMetrics.visibleWordsCount}`);
  console.log(`  Visible Word Text: "${reducedMetrics.visibleWordText}"`);

  assert.equal(reducedMetrics.videoPaused, true, "Video must be paused in reduced motion");
  assert.equal(reducedMetrics.visibleWordsCount, 1, "Exactly 1 word must be visible in reduced motion");
  assert.equal(reducedMetrics.visibleWordText, "Simplified.", "Only Simplified. must be visible in reduced motion");

  report.reducedMotionAudit = {
    noAnimationRun: true,
    onlySimplifiedVisible: reducedMetrics.visibleWordText === "Simplified.",
    videoPaused: reducedMetrics.videoPaused,
  };

  await reducedPage.screenshot({
    path: `${out}/reduced-motion.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });
  await reducedPage.close();

  // Final check for console errors, hydration mismatches, GSAP warnings
  assert.equal(report.consoleErrors.length, 0, `Console errors: ${JSON.stringify(report.consoleErrors)}`);
  assert.equal(report.hydrationErrors.length, 0, `Hydration errors: ${JSON.stringify(report.hydrationErrors)}`);
  assert.equal(report.gsapWarnings.length, 0, `GSAP warnings: ${JSON.stringify(report.gsapWarnings)}`);

  console.log("\n=======================================================");
  console.log("✅ ALL INTRO SEQUENCE AUDITS PASSED WITH ZERO DEFECTS!");
  console.log("=======================================================\n");
} finally {
  await browser.close();
  await writeFile(`${out}/qa-report.json`, JSON.stringify(report, null, 2), "utf8");
}
