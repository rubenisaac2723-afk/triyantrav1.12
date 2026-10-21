import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.addInitScript(() => {
    sessionStorage.setItem("triyantra-intro-v1.2", "seen");
  });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000); // wait for sequence to reach Simplified. and stop

  const styles = await page.evaluate(() => {
    function getProps(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const before = window.getComputedStyle(el, "::before");
      const after = window.getComputedStyle(el, "::after");
      return {
        tag: el.tagName,
        className: el.className,
        background: cs.background,
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        boxShadow: cs.boxShadow,
        textShadow: cs.textShadow,
        filter: cs.filter,
        backdropFilter: cs.backdropFilter,
        color: cs.color,
        opacity: cs.opacity,
        mixBlendMode: cs.mixBlendMode,
        beforeContent: before.content,
        beforeBg: before.background,
        beforeBoxShadow: before.boxShadow,
        afterContent: after.content,
        afterBg: after.background,
        afterBoxShadow: after.boxShadow,
      };
    }

    return {
      line: getProps(".hero-intro-line"),
      mask: getProps(".hero-intro-mask"),
      track: getProps(".hero-intro-track"),
      wordFinal: getProps(".hero-intro-word.is-final"),
      scrim: getProps(".hero-bg-scrim"),
      overlay: getProps(".hero-bg-overlay"),
    };
  });

  console.log(JSON.stringify(styles, null, 2));

  // Take a high-res screenshot clipped right around "SIMPLIFIED."
  const wordBox = await page.evaluate(() => {
    const el = document.querySelector(".hero-intro-mask");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x - 40, y: r.y - 20, width: r.width + 80, height: r.height + 40 };
  });

  if (wordBox) {
    await page.screenshot({
      path: "output/playwright/simplified-word-zoom.png",
      clip: {
        x: Math.max(0, wordBox.x),
        y: Math.max(0, wordBox.y),
        width: Math.min(1440, wordBox.width),
        height: wordBox.height,
      },
    });
    console.log("Saved output/playwright/simplified-word-zoom.png");
  }

  await browser.close();
}

main().catch(console.error);
