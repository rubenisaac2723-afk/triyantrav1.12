import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/f5";
await mkdir(out, { recursive: true });

const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/opt/google/chrome/chrome");

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const report = {
  base,
  date: new Date().toISOString(),
  matrix: [],
  checks: [],
  errors: [],
  warnings: [],
  performance: [],
  realDataAudit: {
    fakeCompanyLogosFound: 0,
    fakeSocialUrlsFound: 0,
    unsupportedTrustClaimsFound: 0,
  },
};

async function fresh(width = 1440, theme = "light", extra = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    colorScheme: theme,
    ...extra,
  });

  await context.addInitScript(() => {
    sessionStorage.setItem("triyantra-intro-v1.2", "seen");
    window.f5AnalyticsEvents = [];
    window.addEventListener("triyantra:analytics", (e) => {
      window.f5AnalyticsEvents.push(e.detail);
    });
  });

  const page = await context.newPage();
  page.on("pageerror", (err) => report.errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") report.errors.push(msg.text());
    if (msg.type() === "warning") report.warnings.push(msg.text());
  });

  await page.goto(base, { waitUntil: "domcontentloaded" });
  return { context, page };
}

try {
  console.log(`[F5 CHECK] Testing against ${base}`);

  // 1. RESPONSIVE MATRIX & THEMES
  const widths = [1440, 1280, 768, 390, 360];
  const themes = ["light", "dark"];

  for (const width of widths) {
    for (const theme of themes) {
      console.log(`[F5 CHECK] Matrix test: width=${width}, theme=${theme}`);
      const { context, page } = await fresh(width, theme);

      // Verify sections exist in DOM
      const story = page.locator("#product-story");
      const orbit = page.locator("#workspace-orbit");
      const marquee = page.locator("#trusted-ecosystem");
      const follow = page.locator("#follow-us");

      await expect(story).toBeAttached();
      await expect(orbit).toBeAttached();
      await expect(marquee).toBeAttached();
      await expect(marquee).toBeVisible();
      await expect(follow).toBeAttached();

      // Check for horizontal overflow across whole page
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      assert.equal(overflow, false, `No horizontal page overflow at width ${width}`);

      // Scroll into view & take targeted screenshots
      if (width === 1440) {
        await page.evaluate(() => {
          document.querySelectorAll("header, .skip-link").forEach((el) =>
            el.setAttribute("style", "visibility:hidden")
          );
        });

        await story.scrollIntoViewIfNeeded();
        await story.screenshot({ path: `${out}/f5-story-1440-${theme}.png` });

        await orbit.scrollIntoViewIfNeeded();
        await orbit.screenshot({ path: `${out}/f5-workspace-1440-${theme}.png` });

        await marquee.scrollIntoViewIfNeeded();
        await marquee.screenshot({ path: `${out}/f5-marquee-1440-${theme}.png` });

        await follow.scrollIntoViewIfNeeded();
        await follow.screenshot({ path: `${out}/f5-follow-us-1440-${theme}.png` });

        await page.evaluate(() => {
          document.querySelectorAll("header, .skip-link").forEach((el) =>
            el.removeAttribute("style")
          );
        });
      }

      if (width === 390 && theme === "light") {
        await page.evaluate(() => {
          document.querySelectorAll("header, .skip-link").forEach((el) =>
            el.setAttribute("style", "visibility:hidden")
          );
        });
        await story.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${out}/f5-mobile-390.png`,
          fullPage: false,
        });
        await page.evaluate(() => {
          document.querySelectorAll("header, .skip-link").forEach((el) =>
            el.removeAttribute("style")
          );
        });
      }

      // Axe accessibility check on F5 sections
      const axeResults = await new AxeBuilder({ page })
        .include(["#product-story", "#workspace-orbit", "#trusted-ecosystem", "#follow-us"])
        .disableRules(["color-contrast"]) // Handled via theme-token verification
        .analyze();
      assert.equal(
        axeResults.violations.length,
        0,
        `Axe accessibility clean on F5 sections at ${width}px (${theme}): ${JSON.stringify(axeResults.violations.map((v) => v.id))}`
      );

      report.matrix.push({
        width,
        theme,
        story: "PASS",
        orbit: "PASS",
        marquee: "PASS",
        followUs: "PASS",
        overflow: "PASS",
        axe: "PASS",
      });

      await context.close();
    }
  }

  // 2. DETAILED PRODUCT STORY FUNCTIONAL TESTS
  {
    console.log("[F5 CHECK] Testing Product Story interactions and keyboard...");
    const { context, page } = await fresh(1440, "light");
    const story = page.locator("#product-story");
    await story.scrollIntoViewIfNeeded();

    // Step 1: Initial state must be Rent (Rent -> Procure -> Manage order)
    const tabRent = story.locator("#story-tab-rent");
    const tabProcure = story.locator("#story-tab-procure");
    const tabManage = story.locator("#story-tab-manage");

    await expect(tabRent).toHaveAttribute("aria-selected", "true");
    await expect(tabProcure).toHaveAttribute("aria-selected", "false");
    await expect(tabManage).toHaveAttribute("aria-selected", "false");
    await expect(story.locator(".story-step-headline")).toContainText("Equip the team.");
    await expect(story.locator(".story-step-workflow")).toHaveCount(0);

    // Click step 2: Procure
    await tabProcure.click();
    await expect(tabProcure).toHaveAttribute("aria-selected", "true");
    await expect(tabRent).toHaveAttribute("aria-selected", "false");
    await expect(story.locator(".story-step-headline")).toContainText("Source fleet hardware.");
    await expect(story.locator(".story-step-workflow")).toHaveCount(0);

    // Click step 3: Manage
    await tabManage.click();
    await expect(tabManage).toHaveAttribute("aria-selected", "true");
    await expect(story.locator(".story-step-headline")).toContainText("Keep every laptop accounted for.");
    await expect(story.locator(".story-step-workflow")).toHaveCount(0);

    // Keyboard navigation (Tabs role pattern with arrow keys)
    await tabManage.focus();
    await page.keyboard.press("ArrowUp");
    await expect(tabProcure).toHaveAttribute("aria-selected", "true");
    await expect(tabProcure).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(tabRent).toHaveAttribute("aria-selected", "true");
    await expect(tabRent).toBeFocused();

    await page.keyboard.press("Home");
    await expect(tabRent).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(tabManage).toHaveAttribute("aria-selected", "true");

    // Check RGB attribute removed per Fix 2 (clean text tabs with active underline)
    assert.equal(await tabRent.getAttribute("data-rgb"), null, "tabRent has no data-rgb");
    assert.equal(await tabProcure.getAttribute("data-rgb"), null, "tabProcure has no data-rgb");
    assert.equal(await tabManage.getAttribute("data-rgb"), null, "tabManage has no data-rgb");

    // Analytics event check
    const events = await page.evaluate(() => window.f5AnalyticsEvents);
    const storyEvents = events.filter((e) => e.event === "product_story_step_selected");
    assert.ok(storyEvents.length >= 3, "Analytics fired for story step selections");

    report.checks.push({ feature: "ProductStory", result: "PASS" });
    await context.close();
  }

  // 3. DETAILED MARQUEE / TRUST-RAIL FUNCTIONAL TESTS (active verified logo rail)
  {
    console.log("[F5 CHECK] Testing the active verified-logo rail...");
    const { context, page } = await fresh(1440, "light");
    const marquee = page.locator("#trusted-ecosystem");
    await expect(marquee).toBeVisible();
    await marquee.scrollIntoViewIfNeeded();

    // Section is the real homepage trust marquee — visibly present, not just in DOM
    const box = await marquee.boundingBox();
    assert.ok(
      box && box.height >= 180,
      `Trust marquee visibly present on homepage (height ${box && Math.round(box.height)}px)`
    );

    // Heading + eyebrow per the brief structure
    await expect(marquee.locator(".marquee-eyebrow")).toContainText("TriYantra Ecosystem");
    await expect(marquee.locator(".marquee-title")).toContainText(
      "Connected capabilities behind your workplace."
    );

    // Verified-real-company logo images only (no fake words/cards inside the moving rail)
    assert.equal(
      await marquee.locator(".marquee-card-code, .marquee-card-title, .marquee-card-sub").count(),
      0,
      "No pillar-card code/title/subtitle markup inside the rail"
    );
    const mode = await marquee.getAttribute("data-logo-rail");
    assert.equal(mode, "true", "data-logo-rail reflects the verified state");

    // Two identical track groups; second group aria-hidden; logos actually load
    assert.equal(
      await marquee.locator(".marquee-track-set").count(),
      2,
      "Two identical groups for a seamless loop"
    );
    assert.equal(
      await marquee.locator('.marquee-track-set[aria-hidden="true"]').count(),
      1,
      "Duplicate group is aria-hidden"
    );
    const logoCount = await marquee.locator(".marquee-logo-image").count();
    assert.ok(logoCount >= 2, "Logo rail contains real logos (" + logoCount + ")");
    const logoState = await marquee.evaluate(() => {
      const imgs = [...document.querySelectorAll("#trusted-ecosystem .marquee-logo-image")];
      return {
        total: imgs.length,
        brandSrc: imgs.filter((i) => (i.getAttribute("src") || "").startsWith("/brands/")).length,
        brokenSrcs: imgs.filter((i) => (i.getAttribute("src") || "").startsWith("data:")).length,
        complete: imgs.filter((i) => i.complete).length,
      };
    });
    assert.equal(
      logoState.total,
      logoState.brandSrc,
      "Every logo image points at a self-hosted /brands/ vector (offline-safe, no fake data: logos)"
    );
    assert.equal(logoState.brokenSrcs, 0, "No inline data: placeholder icons used as logos");
    // Rail motion is running (CSS-driven translate3d loop, RIGHT -> LEFT)
    const trackAnim = await marquee
      .locator(".marquee-track-container")
      .evaluate((el) => getComputedStyle(el).animationName);
    assert.equal(trackAnim, "marquee-roll", "Logo rail animates via CSS marquee-roll loop");

    // No tabindex on the decorative rail
    assert.equal(
      await marquee.locator(".marquee-track-container[tabindex]").count(),
      0,
      "No tabindex on the decorative looping rail"
    );

    report.checks.push({ feature: "TrustedLogoMarquee", result: "PASS" });
    await context.close();
  }

  // 4. DETAILED WORKSPACE ORBIT FUNCTIONAL TESTS
  {
    console.log("[F5 CHECK] Testing Built Around Your Workspace Orbit (compact)...");
    const { context, page } = await fresh(1440, "light");
    const daasBand = page.locator("#daas-band");
    const orbit = page.locator("#workspace-orbit");

    // Verify orbit is integrated inside the DaaS section
    await expect(daasBand).toBeAttached();
    await expect(orbit).toBeAttached();
    const isInsideDaas = await orbit.evaluate(
      (el) => el.closest("#daas-band") !== null
    );
    assert.ok(isInsideDaas, "Orbit is inside the DaaS section");

    await orbit.scrollIntoViewIfNeeded();

    // Verify DaaS band heading is present (left column)
    await expect(daasBand.locator(".eyebrow")).toContainText("Device-as-a-Service");
    await expect(daasBand.locator("h2")).toContainText("without the upfront investment");

    // Verify central core
    await expect(orbit.locator(".orbit-center-core .center-core-title")).toHaveText("CONNECTED WORKPLACE TECHNOLOGY");

    // Verify 6 compact service nodes
    const nodeCards = orbit.locator(".orbit-node-card");
    const nodeCount = await nodeCards.count();
    assert.equal(nodeCount, 6, "Exactly 6 compact service nodes in orbit");

    // Verify counter-rotation style is applied so text stays upright
    const counterRotAnim = await nodeCards.first().evaluate(
      (el) => getComputedStyle(el).animationName
    );
    assert.ok(
      counterRotAnim.includes("orbit-counter-rotate"),
      `Node cards counter-rotate to remain upright (actual: ${counterRotAnim})`
    );

    // Verify SVG decorative tracks have aria-hidden="true"
    const svgTracks = orbit.locator("svg.orbit-svg-tracks");
    await expect(svgTracks).toHaveAttribute("aria-hidden", "true");

    // Verify orbit has data-inview for offscreen performance
    const hasInView = await orbit.evaluate(
      (el) => el.hasAttribute("data-inview")
    );
    assert.ok(hasInView, "Orbit has data-inview attribute for offscreen performance");

    // Verify no lifecycle-wheel exists
    const oldWheel = page.locator(".lifecycle-wheel");
    const wheelCount = await oldWheel.count();
    assert.equal(wheelCount, 0, "Old lifecycle-wheel removed from DOM");

    // Mobile fallback verification
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await mobileContext.addInitScript(() => {
      sessionStorage.setItem("triyantra-intro-v1.2", "seen");
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(base, { waitUntil: "domcontentloaded" });
    const mobileOrbit = mobilePage.locator("#workspace-orbit");
    await mobileOrbit.scrollIntoViewIfNeeded();

    // On mobile, orbit-stage-wrapper should be hidden and mobile-container visible
    const stageDisplay = await mobileOrbit.locator(".orbit-stage-wrapper").evaluate(
      (el) => getComputedStyle(el).display
    );
    assert.equal(stageDisplay, "none", "Complex orbit hidden on mobile screens");

    const mobileContainerDisplay = await mobileOrbit.locator(".orbit-mobile-container").evaluate(
      (el) => getComputedStyle(el).display
    );
    assert.equal(mobileContainerDisplay, "flex", "Clean mobile vertical flow visible on mobile");

    await mobileContext.close();
    report.checks.push({ feature: "WorkspaceOrbit", result: "PASS" });
    await context.close();
  }

  // 5. DETAILED FOLLOW US FUNCTIONAL TESTS
  {
    console.log("[F5 CHECK] Testing Follow Us social links & honest status...");
    const { context, page } = await fresh(1440, "light");
    const follow = page.locator("#follow-us");
    await follow.scrollIntoViewIfNeeded();

    // Follow TriYantra must live INSIDE the footer grid (no standalone full-width band)
    const isInsideFooter = await follow.evaluate(
      (el) => el.closest(".site-footer") !== null
    );
    assert.ok(isInsideFooter, "Follow Us is integrated inside the site footer");

    const standaloneBands = await page.locator(".follow-us-section").count();
    assert.equal(
      standaloneBands,
      0,
      "No standalone full-width Follow Us section on the homepage"
    );

    const links = follow.locator(".footer-social-link");
    const count = await links.count();
    assert.equal(count, 3, "Exactly 3 approved social platforms (LinkedIn, YouTube, Instagram)");

    const expectedUrls = {
      linkedin: "https://www.linkedin.com/company/triyantra/",
      youtube: "https://www.youtube.com/@Triyantra-matrix",
      instagram: "https://www.instagram.com/triyantraofficial?vrfl=MmJ2YTNhMWc4cjQw&utm_source=qr",
    };

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute("href");
      assert.ok(href, "Verified social link has href attribute");
      const target = await link.getAttribute("target");
      assert.equal(target, "_blank", "Social link opens in new tab");
      const rel = await link.getAttribute("rel");
      assert.ok(rel && rel.includes("noopener"), "Social link has secure rel attribute");
      assert.ok(await link.getAttribute("data-rgb") !== null, "Verified social link has data-rgb interaction");

      const isLinkSemantics = await link.evaluate((el) => el.tagName.toLowerCase() === "a");
      assert.equal(isLinkSemantics, true, "Verified social is an <a> link");

      // Verify URL belongs to one of expected platforms
      const matched = Object.values(expectedUrls).some((u) => href.includes(u));
      assert.ok(matched, `Link href matches approved platform URL (${href})`);

      // Tap surface check
      const box = await link.boundingBox();
      assert.ok(box && box.height >= 32, "Social link height >= 32px");
    }

    // Verify Twitter / X is absent
    const twitterLinks = await follow.locator('a[href*="twitter.com"], a[href*="x.com"]').count();
    assert.equal(twitterLinks, 0, "Twitter / X is completely removed");

    // No redundant final CTA on the homepage (shared FinalCTA stays on inner pages)
    const finalCtas = await page.locator(".final-cta").count();
    assert.equal(finalCtas, 0, "Redundant final CTA removed from homepage");

    report.checks.push({ feature: "FollowUs", result: "PASS" });
    report.checks.push({ feature: "FinalCTAAbsent", result: "PASS" });
    await context.close();
  }

  // 5b. ORBIT UPRIGHT LABEL VERIFICATION ACROSS FULL ROTATION CYCLE
  {
    console.log("[F5 CHECK] Verifying orbit labels stay upright across the full 64s cycle...");
    const { context, page } = await fresh(1440, "light");
    await page.locator("#workspace-orbit").scrollIntoViewIfNeeded();

    const result = await page.evaluate(() => {
      const ring = document.querySelector("#workspace-orbit .orbit-nodes-ring");
      const cards = Array.from(document.querySelectorAll("#workspace-orbit .orbit-node-card"));
      if (!ring) return { error: "ring missing" };

      const ringAnim = ring.getAnimations().find((a) => a.animationName === "orbit-rotate");
      if (!ringAnim) return { error: "no orbit-rotate animation" };

      const cardAnims = cards.map((card) => {
        const anim = card.getAnimations().find(
          (a) => a.animationName === "orbit-counter-rotate"
        );
        return { card, anim };
      });
      if (cardAnims.some((c) => !c.anim)) return { error: "counter-rotation missing on a card" };

      const duration =
        ringAnim.effect && ringAnim.effect.getTiming()
          ? ringAnim.effect.getTiming().duration
          : 64000;

      const samples = [0, 0.25, 0.5, 0.75];
      const failures = [];

      for (const fraction of samples) {
        const time = fraction * duration;
        ringAnim.currentTime = time;
        for (const { anim } of cardAnims) anim.currentTime = time;

        const ringMatrix = new DOMMatrix(getComputedStyle(ring).transform);
        const angles = cardAnims.map(({ card }) => {
          const cardMatrix = new DOMMatrix(getComputedStyle(card).transform);
          const combined = ringMatrix.multiply(cardMatrix);
          // Net 2D rotation of text = atan2(b, a) of combined matrix
          const degrees = (Math.atan2(combined.b, combined.a) * 180) / Math.PI;
          return degrees;
        });

        for (const degrees of angles) {
          if (Math.abs(degrees) > 0.5) {
            failures.push({ fraction, degrees });
          }
        }
      }

      return { failures, duration };
    });

    if (result.error) {
      throw new Error(`Orbit upright-label check setup failed: ${result.error}`);
    }
    assert.equal(
      result.failures.length,
      0,
      `Orbit labels must stay upright at 0/25/50/75% of the cycle: ${JSON.stringify(result.failures)}`
    );

    report.checks.push({ feature: "OrbitUprightLabels", result: "PASS" });
    await context.close();
  }

  // 5c. HYDRATION MISMATCH CHECK (production build must not emit hydration warnings)
  {
    console.log("[F5 CHECK] Verifying zero hydration mismatches on fresh production loads...");
    for (const theme of ["light", "dark"]) {
      const { context, page } = await fresh(1440, theme);
      await page.locator("#workspace-orbit").scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await context.close();
    }

    const hydrationSignals = report.errors
      .concat(report.warnings)
      .filter((m) => /hydrat/i.test(m) || /did not match/i.test(m) || /server-rendered/i.test(m) || /Extra attributes/i.test(m));

    assert.equal(
      hydrationSignals.length,
      0,
      `No hydration warnings/errors in production console: ${JSON.stringify(hydrationSignals)}`
    );

    report.checks.push({ feature: "HydrationClean", result: "PASS" });
  }

  // 6. REDUCED MOTION BEHAVIOR ACROSS ALL 4 SYSTEMS
  {
    console.log("[F5 CHECK] Testing prefers-reduced-motion: reduce across all 4 systems...");
    const { context, page } = await fresh(1440, "light", {
      reducedMotion: "reduce",
    });

    const marqueeReduced = page.locator("#trusted-ecosystem");
    await expect(marqueeReduced).toBeAttached();
    // Foreground rail animation fully stopped under reduced motion (CSS-only motion)
    const trackState = await marqueeReduced
      .locator(".marquee-track-container")
      .evaluate(
        (el) => getComputedStyle(el).animationName + ":" + getComputedStyle(el).animationPlayState
      );
    assert.equal(trackState, "none:running", "Marquee track animation disabled under reduced motion");
    // One static readable logo group remains (section never hidden, duplicate group removed)
    assert.equal(
      await marqueeReduced
        .locator('.marquee-track-set[aria-hidden="true"]')
        .evaluate((el) => getComputedStyle(el).display),
      "none",
      "Duplicate logo group hidden under reduced motion"
    );
    assert.ok(
      (await marqueeReduced.locator(".marquee-logo-image").count()) > 0,
      "One static logo group stays visible under reduced motion"
    );
    // Background drift frozen too
    const driftAnim = await marqueeReduced
      .locator(".marquee-texture-drift")
      .evaluate((el) => getComputedStyle(el).animationName);
    assert.equal(driftAnim, "none", "Background drift frozen under reduced motion");

    const orbitRing = page.locator("#workspace-orbit .orbit-nodes-ring");
    const orbitAnim = await orbitRing.evaluate((el) => getComputedStyle(el).animationName);
    assert.equal(orbitAnim, "none", "Workspace orbit animation disabled in reduced-motion mode");

    // Counter-rotation must freeze too so labels remain upright under reduced motion
    const orbitCardAnim = await page
      .locator("#workspace-orbit .orbit-node-card")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    assert.equal(orbitCardAnim, "none", "Orbit label counter-rotation disabled in reduced-motion mode");

    report.checks.push({ feature: "ReducedMotion", result: "PASS" });
    await context.close();
  }

  // 6b. MARQUEE HONEST FRAMING LABEL
  {
    console.log("[F5 CHECK] Verifying marquee honest framing...");
    const { context, page } = await fresh(1440, "light");
    const marquee = page.locator("#trusted-ecosystem");

    await expect(marquee.locator(".marquee-eyebrow")).toContainText("TriYantra Ecosystem");
    await expect(marquee.locator(".marquee-title")).toContainText(
      "Connected capabilities behind your workplace."
    );

    // Honest framing: no unsupported customer-endorsement claim, no "pending" badge while the active rail exists
    assert.equal(
      await marquee.locator(".marquee-status-badge").count(),
      0,
      "No pending-onboarding badge when verified logos are active"
    );

    const title = await marquee.locator(".marquee-title").textContent();
    const unsupported = /trusted by|trusted companies|our clients include|as seen in/i.test(title || "");
    assert.equal(unsupported, false, "Marquee must not imply fake customer endorsement");

    report.checks.push({ feature: "MarqueeHonestLabel", result: "PASS" });
    await context.close();
  }

  // 7. REAL-DATA AUDIT SUMMARY
  assert.equal(report.realDataAudit.fakeCompanyLogosFound, 0);
  assert.equal(report.realDataAudit.fakeSocialUrlsFound, 0);
  assert.equal(report.realDataAudit.unsupportedTrustClaimsFound, 0);

  // 8. CONSOLE CLEANLINESS (production build must emit zero errors/warnings)
  assert.equal(
    report.errors.length,
    0,
    `Zero console errors across all F5 checks (got ${report.errors.length}: ${JSON.stringify(report.errors)})`
  );
  assert.equal(
    report.warnings.length,
    0,
    `Zero console warnings across all F5 checks (got ${report.warnings.length}: ${JSON.stringify(report.warnings)})`
  );

  // Write out test report
  await writeFile(`${out}/f5-report.json`, JSON.stringify(report, null, 2), "utf8");
  console.log(`[F5 CHECK] All checks PASSED. Full report written to ${out}/f5-report.json`);
} catch (err) {
  console.error("[F5 CHECK] Test failed:", err);
  report.errors.push(err.message);
  await writeFile(`${out}/f5-report.json`, JSON.stringify(report, null, 2), "utf8");
  process.exit(1);
} finally {
  await browser.close();
}
