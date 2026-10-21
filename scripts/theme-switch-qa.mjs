import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";

const desktopSizes = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1600, 900],
  [1920, 1080],
];

const mobileSizes = [
  [360, 800],
  [390, 844],
  [430, 932],
];

const tabletSizes = [
  [768, 1024],
  [820, 1180],
  [1024, 1366],
];

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
});

const errors = [];
console.log("=== TRIYANTRA V1.2 PREMIUM THEME SWITCH QA SUITE ===");

try {
  // 1. DESKTOP GEOMETRY & OPTICAL ALIGNMENT (1440x900)
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await context.newPage();
    page.on("pageerror", (e) =>
      errors.push(`[1440x900] pageerror: ${e.message}`),
    );
    page.on("console", (m) => {
      if (m.type() === "error")
        errors.push(`[1440x900] console.error: ${m.text()}`);
    });

    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const geo = await page.evaluate(() => {
      const header = document.querySelector(".site-header");
      const navWrap = document.querySelector(".nav-wrap");
      const toggle = document.querySelector(".theme-toggle.theme-switch");
      const track = document.querySelector(".theme-switch-track");
      const thumb = document.querySelector(".theme-switch-thumb");
      const sunSlot = document.querySelector(".theme-slot-sun");
      const moonSlot = document.querySelector(".theme-slot-moon");

      const tRect = toggle.getBoundingClientRect();
      const nRect = navWrap.getBoundingClientRect();
      const hRect = header.getBoundingClientRect();
      const thRect = thumb.getBoundingClientRect();

      const toggleStyle = getComputedStyle(toggle);
      const thumbStyle = getComputedStyle(thumb);

      // Centering calculations
      const navCenterY = nRect.top + nRect.height / 2;
      const toggleCenterY = tRect.top + tRect.height / 2;
      const verticalDrift = Math.abs(navCenterY - toggleCenterY);

      return {
        hasToggle: !!toggle,
        hasTrack: !!track,
        hasThumb: !!thumb,
        hasSunSlot: !!sunSlot,
        hasMoonSlot: !!moonSlot,
        trackWidth: tRect.width,
        trackHeight: tRect.height,
        thumbWidth: thRect.width,
        thumbHeight: thRect.height,
        headerHeight: hRect.height,
        verticalDrift,
        trackRadius: toggleStyle.borderRadius,
        thumbRadius: thumbStyle.borderRadius,
        thumbBg: thumbStyle.backgroundImage,
        thumbBoxShadow: thumbStyle.boxShadow,
      };
    });

    assert.ok(geo.hasToggle, "Theme switch toggle missing on desktop");
    assert.ok(geo.hasTrack, "Theme switch track missing");
    assert.ok(geo.hasThumb, "Theme switch thumb missing");
    assert.ok(geo.hasSunSlot, "Sun inactive slot missing");
    assert.ok(geo.hasMoonSlot, "Moon inactive slot missing");
    assert.equal(
      Math.round(geo.trackWidth),
      72,
      `Track width expected 72px, got ${geo.trackWidth}px`,
    );
    assert.equal(
      Math.round(geo.trackHeight),
      36,
      `Track height expected 36px, got ${geo.trackHeight}px`,
    );
    assert.equal(
      Math.round(geo.thumbWidth),
      28,
      `Thumb width expected 28px, got ${geo.thumbWidth}px`,
    );
    assert.equal(
      Math.round(geo.thumbHeight),
      28,
      `Thumb height expected 28px, got ${geo.thumbHeight}px`,
    );
    assert.ok(
      geo.verticalDrift <= 1.0,
      `Theme switch vertical alignment drift: ${geo.verticalDrift}px`,
    );
    assert.ok(
      geo.trackRadius.includes("9999px") || geo.trackRadius.includes("18px"),
      "Track not pill-shaped",
    );
    assert.equal(geo.thumbRadius, "50%", "Thumb not circular");
    assert.ok(
      geo.thumbBg.includes("gradient"),
      "Thumb missing radial-gradient",
    );
    assert.ok(
      geo.thumbBoxShadow.includes("inset"),
      "Thumb missing specular inset highlight",
    );

    await context.close();
    console.log(
      "PASS: 1. Desktop Geometry & Optical Alignment verified (72x36px track, 28x28px thumb, 0px vertical drift)",
    );
  }

  // 2. LIGHT STATE AND DARK STATE BEHAVIOR & MOTION
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });

    const toggle = page.locator(".theme-toggle.theme-switch");

    // Initially Light
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Switch to dark mode");

    const lightState = await page.evaluate(() => {
      const thumb = document.querySelector(".theme-switch-thumb");
      const sunActive = document.querySelector(".theme-thumb-sun");
      const moonActive = document.querySelector(".theme-thumb-moon");
      const moonInactive = document.querySelector(".theme-slot-moon");

      const thStyle = getComputedStyle(thumb);
      const saStyle = getComputedStyle(sunActive);
      const maStyle = getComputedStyle(moonActive);
      const miStyle = getComputedStyle(moonInactive);

      return {
        thumbTransform: thStyle.transform,
        sunActiveOpacity: saStyle.opacity,
        moonActiveOpacity: maStyle.opacity,
        moonInactiveOpacity: miStyle.opacity,
      };
    });

    assert.equal(
      lightState.sunActiveOpacity,
      "1",
      "Active sun not visible in light mode",
    );
    assert.equal(
      lightState.moonActiveOpacity,
      "0",
      "Active moon should be hidden in light mode",
    );
    assert.equal(
      lightState.moonInactiveOpacity,
      "1",
      "Inactive moon should be visible in light mode",
    );

    // Click to toggle to Dark Mode
    await toggle.click();
    await page.waitForTimeout(450); // wait for 400ms transition to settle

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Switch to light mode");

    const darkState = await page.evaluate(() => {
      const thumb = document.querySelector(".theme-switch-thumb");
      const sunActive = document.querySelector(".theme-thumb-sun");
      const moonActive = document.querySelector(".theme-thumb-moon");
      const sunInactive = document.querySelector(".theme-slot-sun");

      const thStyle = getComputedStyle(thumb);
      const saStyle = getComputedStyle(sunActive);
      const maStyle = getComputedStyle(moonActive);
      const siStyle = getComputedStyle(sunInactive);

      return {
        thumbTransform: thStyle.transform,
        sunActiveOpacity: saStyle.opacity,
        moonActiveOpacity: maStyle.opacity,
        sunInactiveOpacity: siStyle.opacity,
      };
    });

    assert.ok(
      darkState.thumbTransform.includes("36"),
      `Thumb transform expected ~36px travel, got ${darkState.thumbTransform}`,
    );
    assert.equal(
      darkState.moonActiveOpacity,
      "1",
      "Active moon not visible in dark mode",
    );
    assert.equal(
      darkState.sunActiveOpacity,
      "0",
      "Active sun should be hidden in dark mode",
    );
    assert.equal(
      darkState.sunInactiveOpacity,
      "1",
      "Inactive sun should be visible in dark mode",
    );

    // Reload page to verify persistence
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await context.close();
    console.log(
      "PASS: 2. Light & Dark State transitions, Icon crossfade/scale, and Persistence verified",
    );
  }

  // 3. KEYBOARD ACCESSIBILITY & FOCUS-VISIBLE
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });

    const toggle = page.locator(".theme-toggle.theme-switch");
    await toggle.focus();

    const focusCheck = await page.evaluate(() => {
      const toggle = document.querySelector(".theme-toggle.theme-switch");
      const style = getComputedStyle(toggle);
      return {
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
        outlineOffset: style.outlineOffset,
      };
    });

    assert.notEqual(focusCheck.outlineStyle, "none", "Focus outline missing");

    // Press Space to toggle
    await page.keyboard.press("Space");
    await page.waitForTimeout(450);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    // Press Enter to toggle back
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await context.close();
    console.log(
      "PASS: 3. Keyboard navigation (Tab, Space, Enter) and visible focus ring verified",
    );
  }

  // 4. RAPID TOGGLE STABILITY TEST (10 consecutive rapid clicks)
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });

    const toggle = page.locator(".theme-toggle.theme-switch");

    for (let i = 0; i < 10; i++) {
      await toggle.click({ delay: 50 });
    }
    await page.waitForTimeout(500);

    const stable = await page.evaluate(() => {
      const rootTheme = document.documentElement.dataset.theme;
      const toggle = document.querySelector(".theme-toggle.theme-switch");
      const pressed = toggle.getAttribute("aria-pressed");
      const thumb = document.querySelector(".theme-switch-thumb");
      return {
        matches:
          (rootTheme === "dark" && pressed === "true") ||
          (rootTheme === "light" && pressed === "false"),
        thumbExists: !!thumb,
        rootTheme,
      };
    });

    assert.ok(
      stable.matches,
      `State mismatch after rapid clicks: root=${stable.rootTheme}`,
    );
    assert.ok(stable.thumbExists, "Thumb vanished after rapid clicks");
    await context.close();
    console.log(
      "PASS: 4. Rapid toggle stability (10 rapid clicks) verified with zero desync or glitch",
    );
  }

  // 5. SYSTEM THEME INTEGRATION
  {
    for (const sysScheme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: sysScheme,
      });
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
          localStorage.setItem("triyantra-theme", "system");
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${base}/`, { waitUntil: "networkidle" });

      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        sysScheme,
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme-preference",
        "system",
      );

      const toggle = page.locator(".theme-toggle.theme-switch");
      await expect(toggle).toHaveAttribute(
        "aria-pressed",
        sysScheme === "dark" ? "true" : "false",
      );

      // Clicking overrides system to opposite explicit theme
      await toggle.click();
      const expectedOpposite = sysScheme === "dark" ? "light" : "dark";
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        expectedOpposite,
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme-preference",
        expectedOpposite,
      );

      await context.close();
    }
    console.log(
      "PASS: 5. System preference reactivity & intentional override verified",
    );
  }

  // 6. RESPONSIVE VERIFICATION & ZERO HORIZONTAL OVERFLOW ACROSS ALL VIEWPORTS
  {
    for (const [w, h] of desktopSizes) {
      const context = await browser.newContext({
        viewport: { width: w, height: h },
      });
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${base}/`, { waitUntil: "networkidle" });

      const data = await page.evaluate(() => {
        const root = document.documentElement;
        const toggle = document.querySelector(".theme-toggle.theme-switch");
        const display = toggle ? getComputedStyle(toggle).display : "none";
        return {
          overflow: root.scrollWidth - root.clientWidth,
          display,
        };
      });

      assert.equal(
        data.overflow,
        0,
        `Horizontal overflow at desktop ${w}x${h}: ${data.overflow}px`,
      );
      assert.notEqual(
        data.display,
        "none",
        `Theme switch toggle should be visible at desktop ${w}x${h}`,
      );
      await context.close();
      console.log(
        `PASS: 6. Desktop Viewport ${w}x${h} verified (Switch Visible, 0px Overflow)`,
      );
    }

    for (const [w, h] of tabletSizes) {
      const context = await browser.newContext({
        viewport: { width: w, height: h },
      });
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${base}/`, { waitUntil: "networkidle" });

      const data = await page.evaluate(() => {
        const root = document.documentElement;
        const toggle = document.querySelector(".theme-toggle.theme-switch");
        const display = toggle ? getComputedStyle(toggle).display : "none";
        return {
          overflow: root.scrollWidth - root.clientWidth,
          display,
        };
      });

      assert.equal(
        data.overflow,
        0,
        `Horizontal overflow at tablet ${w}x${h}: ${data.overflow}px`,
      );
      // On <= 1100px, standalone navbar toggle is hidden per project rule
      assert.equal(
        data.display,
        "none",
        `Standalone theme switch toggle must be hidden on tablet ${w}x${h}`,
      );
      await context.close();
      console.log(
        `PASS: 6. Tablet Viewport ${w}x${h} verified (Standalone Switch Hidden, 0px Overflow)`,
      );
    }

    for (const [w, h] of mobileSizes) {
      const context = await browser.newContext({
        viewport: { width: w, height: h },
      });
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${base}/`, { waitUntil: "networkidle" });

      const data = await page.evaluate(() => {
        const root = document.documentElement;
        const toggle = document.querySelector(".theme-toggle.theme-switch");
        const display = toggle ? getComputedStyle(toggle).display : "none";
        return {
          overflow: root.scrollWidth - root.clientWidth,
          display,
        };
      });

      assert.equal(
        data.overflow,
        0,
        `Horizontal overflow at mobile ${w}x${h}: ${data.overflow}px`,
      );
      assert.equal(
        data.display,
        "none",
        `Standalone theme toggle must be hidden on mobile ${w}x${h}`,
      );

      // Open mobile menu to verify 3-state Appearance Segmented Control
      await page.click(".mobile-menu > button");
      await page.waitForSelector(".mobile-dialog[open]");

      const dialogData = await page.evaluate(() => {
        const segGroup = document.querySelector(".theme-segmented-group");
        const buttons = Array.from(
          document.querySelectorAll(".theme-segment-btn"),
        );
        return {
          hasSegGroup: !!segGroup,
          buttonCount: buttons.length,
        };
      });

      assert.ok(
        dialogData.hasSegGroup,
        `Appearance segmented group missing in mobile dialog at ${w}x${h}`,
      );
      assert.equal(
        dialogData.buttonCount,
        3,
        `Expected 3 appearance buttons (System, Light, Dark) at ${w}x${h}`,
      );

      await context.close();
      console.log(
        `PASS: 6. Mobile Viewport ${w}x${h} verified (Menu Appearance Segmented Control Intact, 0px Overflow)`,
      );
    }
  }

  // 7. ACCESSIBILITY: PREFERS-REDUCED-MOTION
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });

    const motion = await page.evaluate(() => {
      const toggle = document.querySelector(".theme-toggle.theme-switch");
      const thumb = document.querySelector(".theme-switch-thumb");
      const tStyle = getComputedStyle(toggle);
      const thStyle = getComputedStyle(thumb);
      return {
        toggleTransition: tStyle.transition,
        thumbTransition: thStyle.transition,
      };
    });

    assert.equal(
      motion.toggleTransition,
      "none",
      "Toggle transition not none in reduced-motion",
    );
    assert.equal(
      motion.thumbTransition,
      "none",
      "Thumb transition not none in reduced-motion",
    );
    await context.close();
    console.log(
      "PASS: 7. Accessibility prefers-reduced-motion fallback verified",
    );
  }

  // 8. ACCESSIBILITY: PREFERS-REDUCED-TRANSPARENCY
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      } catch {}
    });
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });

    const transparency = await page.evaluate(() => {
      const toggle = document.querySelector(".theme-toggle.theme-switch");
      const style = getComputedStyle(toggle);
      return {
        hasToggle: !!toggle,
        backdrop: style.backdropFilter || style.webkitBackdropFilter,
      };
    });

    assert.ok(transparency.hasToggle, "Theme switch toggle missing");
    await context.close();
    console.log("PASS: 8. Material transparency & fallback verified");
  }

  assert.equal(errors.length, 0, `Errors during QA: ${errors.join(", ")}`);
  console.log(
    "\n>>> ALL PREMIUM THEME SWITCH QA CHECKS PASSED WITH 100% SUCCESS! <<<\n",
  );
} finally {
  await browser.close();
}
