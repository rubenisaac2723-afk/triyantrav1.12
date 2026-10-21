import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://127.0.0.1:3001";
const OUT = "C:\\Users\\samee\\.gemini\\antigravity-cli\\brain\\41cfbe40-0ac0-4c3c-bb94-2bc2f2b60b38\\.tempmediaStorage\\contact-qa";
mkdirSync(OUT, { recursive: true });

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  console.log("=== TRIYANTRA CONTACT CINEMATIC QA SUITE ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
  });

  const consoleErrors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  // 1. Load Contact Page
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 2. Capture Required Viewports & Themes
  const viewports = [
    { name: "contact-1440", width: 1440, height: 900, theme: "light" },
    { name: "contact-1440-dark", width: 1440, height: 900, theme: "dark" },
    { name: "contact-1920", width: 1920, height: 1080, theme: "light" },
    { name: "contact-1366x768-light", width: 1366, height: 768, theme: "light" },
    { name: "contact-1366x768-dark", width: 1366, height: 768, theme: "dark" },
    { name: "contact-1280x720", width: 1280, height: 720, theme: "dark" },
    { name: "contact-768", width: 768, height: 1024, theme: "light" },
    { name: "contact-390-light", width: 390, height: 844, theme: "light" },
    { name: "contact-390-dark", width: 390, height: 844, theme: "dark" },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.evaluate((theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-theme-preference", theme);
    }, vp.theme);
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`[VIEWPORT ${vp.name}] ${vp.width}x${vp.height} (${vp.theme}) - Overflow: ${overflow}px`);

    await page.screenshot({ path: `${OUT}\\${vp.name}.png` });
  }

  // 3. CustomSelect Open Screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });
  await page.waitForTimeout(300);

  const selectTrigger = page.locator("#requirementType, button.custom-select-trigger").first();
  if (await selectTrigger.isVisible()) {
    await selectTrigger.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}\\contact-custom-select-open.png` });
    console.log("[CUSTOM SELECT] Opened dropdown screenshot captured.");
    // Close it
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } else {
    console.warn("[CUSTOM SELECT] Trigger not visible");
  }

  // 4. Poster / Reduced Motion Check
  const pageRM = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await pageRM.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await pageRM.waitForTimeout(500);
  await pageRM.screenshot({ path: `${OUT}\\contact-reduced-motion.png` });
  console.log("[REDUCED MOTION] Static poster screenshot captured.");

  const isStatic = await pageRM.evaluate(() => {
    const c = document.querySelector(".contact-cinematic__media");
    const v = document.querySelector(".contact-cinematic__video");
    return {
      containerHasStaticClass: c?.classList.contains("is-static"),
      videoPaused: v?.paused,
      posterAttr: v?.getAttribute("poster"),
    };
  });
  console.log("[REDUCED MOTION EVAL]", isStatic);
  await pageRM.close();

  // 5. Video Playback & Loop Continuity QA
  const videoState = await page.evaluate(async () => {
    const v = document.querySelector(".contact-cinematic__video");
    if (!v) return { found: false };

    const initialTime = v.currentTime;
    const duration = v.duration || 10;
    const paused = v.paused;
    const readyState = v.readyState;

    // Test loop transition: seek near end
    v.currentTime = Math.max(0, duration - 0.25);
    await new Promise((r) => setTimeout(r, 600));
    const loopedTime = v.currentTime;
    const stillPlaying = !v.paused;

    return {
      found: true,
      paused,
      readyState,
      initialTime,
      duration,
      currentSrc: v.currentSrc,
      loopedTime,
      stillPlaying,
      loopWorked: loopedTime < 1.5 && stillPlaying,
    };
  });
  console.log("[VIDEO QA STATE]", videoState);

  // 6. Comprehensive Responsive Breakpoints Overflow Sweep
  const allBreakpoints = [360, 375, 390, 412, 430, 768, 820, 834, 1024, 1280, 1366, 1440, 1536, 1600, 1920];
  const overflowIssues = [];
  for (const w of allBreakpoints) {
    await page.setViewportSize({ width: w, height: 850 });
    await page.waitForTimeout(150);
    const diff = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (diff > 0) {
      overflowIssues.push({ width: w, overflow: diff });
    }
  }
  console.log(`[RESPONSIVE OVERFLOW SWEEP] ${allBreakpoints.length} breakpoints tested. Failures: ${overflowIssues.length}`);

  // 7. Structure & Hierarchy Assertion
  const structureCheck = await page.evaluate(() => {
    const canvas = document.querySelector(".contact-cinematic-section.wrap");
    const video = canvas?.querySelector(".contact-cinematic__video");
    const scrim = canvas?.querySelector(".contact-cinematic__scrim");
    const copy = canvas?.querySelector(".contact-canvas-copy");
    const form = canvas?.querySelector(".lead-form");

    const separateVideoCard = document.querySelector(".contact-video-card, .video-card");
    const darkWrapperPanel = document.querySelector(".contact-outer-panel");

    return {
      canvasExists: Boolean(canvas),
      videoDirectChildOfBackground: Boolean(video),
      scrimPresent: Boolean(scrim),
      copyDirectInsideCanvas: Boolean(copy),
      formDirectInsideCanvas: Boolean(form),
      separateVideoCardPresent: Boolean(separateVideoCard),
      darkWrapperPanelPresent: Boolean(darkWrapperPanel),
    };
  });
  console.log("[STRUCTURE VERIFICATION]", structureCheck);

  await browser.close();

  console.log("\n=== CONSOLE ERRORS ===");
  console.log("Count:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error(consoleErrors);
  }
  console.log("=== QA COMPLETE ===");
}

main().catch(console.error);
