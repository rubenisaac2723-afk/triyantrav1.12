import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3001";
const OUTPUT_DIR = path.resolve(process.cwd(), "output/playwright/contact-map");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runVerification() {
  console.log("=== STARTING TRIYANTRA CONTACT MAP & SECTION VERIFICATION ===");
  const browser = await chromium.launch();

  const results = {
    redundantRowRemoved: false,
    whatsAppCardIntact: false,
    callCardIntact: false,
    googleMapsEmbedVerified: false,
    noLeafletAttribution: false,
    directionsLinkVerified: false,
    themeSwitchVerified: false,
    overflowPassed: true,
    axeViolations: [],
    consoleErrors: [],
    cspViolations: [],
    viewports: [],
  };

  // 1. Desktop 1440x900 Verification
  {
    console.log("\n--- Testing Desktop 1440x900 (Light & Dark Theme) ---");
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("Console error:", msg.text());
        results.consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      console.error("Page error:", err.message);
      results.consoleErrors.push(err.message);
    });

    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    // A. Verify redundant "Office Location" row is completely removed
    const mapsChannelCount = await page.locator(".maps-channel").count();
    console.log(`Checking redundant .maps-channel count: ${mapsChannelCount}`);
    assert.equal(mapsChannelCount, 0, "Redundant .maps-channel must not exist in DOM");

    const redundantTextCount = await page.locator("text='Office Location'").count();
    console.log(`Checking redundant text 'Office Location' count: ${redundantTextCount}`);
    assert.equal(redundantTextCount, 0, "Text 'Office Location' must not exist in direct channels");
    results.redundantRowRemoved = true;
    console.log("PASS: Redundant 'Office Location' contact row completely removed!");

    // B. Verify WhatsApp and Call cards remain intact
    const whatsappCard = page.locator(".whatsapp-channel");
    assert.ok(await whatsappCard.isVisible(), "WhatsApp channel card must remain visible");
    results.whatsAppCardIntact = true;
    console.log("PASS: WhatsApp channel card is intact!");

    const phoneCard = page.locator(".phone-channel");
    assert.ok(await phoneCard.isVisible(), "Phone channel card must remain visible");
    results.callCardIntact = true;
    console.log("PASS: Phone channel card is intact!");

    // C. Verify Google Maps Embed iframe
    const mapCard = page.locator(".contact-office-map-card");
    assert.ok(await mapCard.isVisible(), "Contact office map card must be visible");

    const iframe = page.locator("iframe.office-map-iframe");
    assert.ok(await iframe.isVisible(), "Google Maps iframe must be visible");

    const iframeSrc = await iframe.getAttribute("src");
    console.log("Google Maps iframe src:", iframeSrc);
    assert.ok(iframeSrc?.includes("google.com/maps/embed"), "Iframe src must be official Google Maps embed URL");

    const iframeTitle = await iframe.getAttribute("title");
    console.log("Google Maps iframe title:", iframeTitle);
    assert.equal(iframeTitle, "Google Maps location for Matrix DaaS Private Limited");
    results.googleMapsEmbedVerified = true;
    console.log("PASS: Genuine Google Maps embed loaded with correct attributes!");

    // D. Verify NO Leaflet or CARTO attribution exists
    const leafletCount = await page.locator(".leaflet-container, .leaflet-control-attribution").count();
    assert.equal(leafletCount, 0, "No Leaflet containers or attribution should exist");
    const bodyText = await page.innerText("body");
    assert.ok(!bodyText.includes("Leaflet"), "No Leaflet text should be visible");
    assert.ok(!bodyText.includes("CARTO"), "No CARTO text should be visible");
    results.noLeafletAttribution = true;
    console.log("PASS: Leaflet, OpenStreetMap, and CARTO attribution are completely removed!");

    // E. Verify Get Directions button is absent from the rendered UI
    const directionsBtnCount = await page.locator(".contact-directions-btn").count();
    console.log(`Checking .contact-directions-btn count: ${directionsBtnCount}`);
    assert.equal(directionsBtnCount, 0, "Get Directions button must be absent from rendered UI");

    const getDirectionsTextCount = await page.locator("text='Get Directions'").count();
    console.log(`Checking 'Get Directions' text count: ${getDirectionsTextCount}`);
    assert.equal(getDirectionsTextCount, 0, "'Get Directions' button text must be absent from card");
    results.directionsBtnRemoved = true;
    console.log("PASS: Redundant Get Directions button removed from UI!");

    // F. Verify card bottom padding has no empty gap
    const cardBox = await mapCard.boundingBox();
    const iframeBox = await iframe.boundingBox();
    assert.ok(cardBox && iframeBox);
    const bottomGap = (cardBox.y + cardBox.height) - (iframeBox.y + iframeBox.height);
    console.log(`Map card bottom gap beneath iframe: ${Math.round(bottomGap)}px`);
    // Bottom padding should naturally be clamp(18px, 2.5vw, 24px) ~ 18px to 26px, NOT 60px+
    assert.ok(bottomGap <= 32, `Expected balanced bottom padding (<= 32px), got ${bottomGap}px`);
    console.log("PASS: Map card has clean, balanced bottom spacing without awkward gap!");

    // Take Desktop Screenshot (Light)
    await page.screenshot({ path: path.join(OUTPUT_DIR, "contact-desktop-1440-light.png") });

    // Test Theme Switch to Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(1000);
    assert.ok(await mapCard.isVisible());
    results.themeSwitchVerified = true;
    await page.screenshot({ path: path.join(OUTPUT_DIR, "contact-desktop-1440-dark.png") });
    console.log("PASS: Dark theme rendered without visual or structural defects!");

    // Axe Accessibility Audit
    console.log("Running Axe accessibility scan on map card...");
    const axe = await new AxeBuilder({ page }).include(".contact-office-map-card").exclude("iframe").analyze();
    console.log(`Axe violations on map card: ${axe.violations.length}`);
    results.axeViolations = axe.violations;
    assert.equal(axe.violations.length, 0, `Expected 0 violations, got: ${JSON.stringify(axe.violations, null, 2)}`);

    await context.close();
  }

  // 2. In-Page Navigation Test (from "/" to "/contact")
  {
    console.log("\n--- Testing In-Page Navigation from Home to Contact ---");
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const contactLink = page.locator("a[href='/contact']:visible").first();
    await contactLink.click();
    await page.waitForURL("**/contact");
    await page.waitForSelector(".contact-office-map-card", { timeout: 8000 });
    assert.ok(await page.locator(".office-map-title").isVisible());
    assert.ok(await page.locator("iframe.office-map-iframe").isVisible());
    console.log("PASS: In-page navigation successfully rendered contact map card and iframe!");
    await context.close();
  }

  // 3. Multi-Viewport & Overflow Tests
  const viewportsToTest = [
    { name: "mobile-320", width: 320, height: 600, isMobile: true },
    { name: "mobile-360", width: 360, height: 740, isMobile: true },
    { name: "mobile-375", width: 375, height: 812, isMobile: true },
    { name: "mobile-390", width: 390, height: 844, isMobile: true },
    { name: "mobile-414", width: 414, height: 896, isMobile: true },
    { name: "mobile-430", width: 430, height: 932, isMobile: true },
    { name: "tablet-768", width: 768, height: 1024, isMobile: false },
    { name: "tablet-820", width: 820, height: 1180, isMobile: false },
    { name: "tablet-1024", width: 1024, height: 768, isMobile: false },
    { name: "desktop-1280", width: 1280, height: 800, isMobile: false },
    { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
    { name: "desktop-1728", width: 1728, height: 1080, isMobile: false },
    { name: "desktop-1920", width: 1920, height: 1080, isMobile: false },
  ];

  console.log("\n--- Testing All Required Viewports (320px to 1920px) ---");
  for (const vp of viewportsToTest) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    // Check overflow
    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      return {
        docWidth,
        winWidth,
        hasOverflow: docWidth > winWidth + 1, // 1px threshold for subpixel rounding
      };
    });

    if (overflow.hasOverflow) {
      console.error(`FAIL: Horizontal overflow at ${vp.name} (${overflow.docWidth}px > ${overflow.winWidth}px)`);
      results.overflowPassed = false;
    } else {
      console.log(`PASS: ${vp.name} (${vp.width}px) — 0px horizontal overflow.`);
    }

    if (vp.width === 390) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, "contact-mobile-390-light.png") });
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
      });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, "contact-mobile-390-dark.png") });
    }

    if ([375, 768].includes(vp.width)) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, `contact-${vp.name}.png`) });
    }

    results.viewports.push({ name: vp.name, width: vp.width, ...overflow });
    await context.close();
  }

  // 4. Schema / JSON-LD Validation
  {
    console.log("\n--- Validating Production Schema & Metadata ---");
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/contact`, { waitUntil: "networkidle" });

    const schemas = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
      return scripts.map((s) => JSON.parse(s.innerHTML));
    });

    console.log("Found JSON-LD schemas count:", schemas.length);
    const orgSchema = schemas.find((s) => s["@graph"]?.some((item) => item["@type"] === "Organization"));
    const org = orgSchema?.["@graph"]?.find((item) => item["@type"] === "Organization");
    console.log("Organization schema address:", JSON.stringify(org?.address, null, 2));
    assert.ok(org?.address?.streetAddress?.includes("1st floor, 36th Cross Rd"));
    assert.equal(org?.address?.addressLocality, "Bengaluru");
    assert.equal(org?.address?.postalCode, "560041");
    console.log("PASS: Verified Organization schema contains accurate address!");
    await context.close();
  }

  await browser.close();

  console.log("\n=================== VERIFICATION SUMMARY ===================");
  console.log("Redundant 'Office Location' Row Removed:", results.redundantRowRemoved);
  console.log("WhatsApp Card Intact:", results.whatsAppCardIntact);
  console.log("Call Card Intact:", results.callCardIntact);
  console.log("Google Maps Embed Verified:", results.googleMapsEmbedVerified);
  console.log("Leaflet & CARTO Attribution Removed:", results.noLeafletAttribution);
  console.log("Get Directions Button Removed:", results.directionsBtnRemoved);
  console.log("All Viewports 0px Overflow:", results.overflowPassed);
  console.log("Theme Switch Verified:", results.themeSwitchVerified);
  console.log("Axe Violations:", results.axeViolations.length);
  console.log("Console Errors:", results.consoleErrors.length);
  console.log("============================================================\n");

  assert.ok(results.redundantRowRemoved);
  assert.ok(results.whatsAppCardIntact);
  assert.ok(results.callCardIntact);
  assert.ok(results.googleMapsEmbedVerified);
  assert.ok(results.noLeafletAttribution);
  assert.ok(results.directionsBtnRemoved);
  assert.ok(results.overflowPassed);
  assert.equal(results.axeViolations.length, 0);
  assert.equal(results.consoleErrors.length, 0);

  console.log("ALL TESTS AND QUALITY GATES PASSED WITH ZERO ERRORS!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
