import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";

const baseline = process.env.MEDIA_BASELINE === "1";
const out = `output/playwright/media-fit${baseline ? "-before" : ""}`;
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const sizes = [[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[820,1180],[834,1194],[1024,1366],[1280,720],[1366,768],[1440,900],[1536,864],[1600,900],[1920,1080]];
const report = { base, baseline, baselineNote: baseline ? "Reconstructed pre-fix CSS from the handoff; original measurement artifacts are unavailable." : undefined, assets: {}, cases: [], errors: [] };
await mkdir(out, { recursive: true });
for (const suffix of [".webm", ".mp4", "-mobile.webm", "-mobile.mp4", "-poster.jpg"]) {
  const data = await readFile(`public/assets/media/triyantra-product-motion${suffix}`);
  report.assets[suffix] = { bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") };
}
const browser = await chromium.launch({ headless: true, executablePath:
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined) });
try {
  const cases = sizes.flatMap(([width,height]) => ["/", "/contact"].map(route => ({width,height,route,theme:"dark",reduced:false})));
  if (!baseline) {
    for (const width of [390,768,1024,1366,1440,1920]) {
      const height = sizes.find(size => size[0] === width)[1];
      for (const route of ["/", "/contact"]) cases.push({width,height,route,theme:"light",reduced:false});
    }
    for (const [width,height] of [[390,844],[768,1024],[1440,900],[844,390],[1180,820]]) {
      for (const route of ["/", "/contact"]) cases.push({width,height,route,theme:"dark",reduced:true});
    }
  }
  for (const c of cases) {
    const name = `${c.route === "/" ? "home" : "contact"}-media-${c.width}${c.theme === "light" ? "-light" : ""}${c.reduced ? "-reduced" : ""}`;
    const context = await browser.newContext({viewport:{width:c.width,height:c.height},colorScheme:c.theme,reducedMotion:c.reduced?"reduce":"no-preference"});
    await context.addInitScript(() => {
      sessionStorage.setItem("triyantra-intro-v1.2", "seen");
      window.mediaShifts = [];
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.mediaShifts.push({value:e.value,
          media:e.sources.some(s => s.node?.closest?.(".product-motion"))});
      }).observe({type:"layout-shift",buffered:true});
    });
    const page = await context.newPage();
    page.on("pageerror", e => report.errors.push(`${name}: ${e.message}`));
    page.on("console", m => { if (m.type() === "error") report.errors.push(`${name}: ${m.text()}`); });
    await page.goto(base + c.route, {waitUntil:"networkidle"});
    if (baseline) await page.evaluate(css => {
      const style = document.createElement("style");
      style.nonce = document.querySelector("script[nonce]")?.nonce || "";
      style.textContent = css;
      document.head.append(style);
    }, `
      @media (min-width:1101px) { .home-hero { grid-template-columns:1fr 1.05fr; } }
      .contact-aside--contact .product-motion { margin:-16px 0 24px; border:1px solid var(--border); border-radius:32px; }
      .contact-aside--contact .product-motion-video { object-fit:cover; }
    `);
    await page.evaluate(() => document.fonts.ready);
    const video = page.locator(".product-motion-video").first();
    await video.scrollIntoViewIfNeeded();
    if (!c.reduced) await page.waitForFunction(() => document.querySelector(".product-motion-video").readyState >= 2);
    await page.waitForTimeout(1000);
    const playback = await video.evaluate(async v => {
      const before = v.getVideoPlaybackQuality();
      const time = v.currentTime;
      await new Promise(resolve => setTimeout(resolve, matchMedia("(max-width:760px)").matches ? 3000 : 500));
      const after = v.getVideoPlaybackQuality();
      return {advanced:v.currentTime > time, paused:v.paused,frames:after.totalVideoFrames-before.totalVideoFrames,dropped:after.droppedVideoFrames-before.droppedVideoFrames};
    });
    const m = await page.evaluate(() => {
      const rect = e => {const r=e.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height,right:r.right,bottom:r.bottom+scrollY};};
      const media=document.querySelector(".product-motion"),frame=media.querySelector(".product-motion-frame"),v=media.querySelector("video"),hero=document.querySelector(".home-hero"),card=document.querySelector(".contact-aside");
      const common={media:rect(media),frame:rect(frame),video:rect(v),fit:getComputedStyle(v).objectFit,position:getComputedStyle(v).objectPosition,
        source:v.currentSrc,sourceWidth:v.videoWidth,sourceHeight:v.videoHeight,muted:v.muted,loop:v.loop,inline:v.playsInline,poster:v.poster,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,mediaCLS:window.mediaShifts.filter(e=>e.media).reduce((n,e)=>n+e.value,0),
        radius:getComputedStyle(media).borderRadius,transform:getComputedStyle(media).transform};
      if(hero) return {...common,hero:rect(hero),heading:rect(hero.querySelector(".hero-heading")),columns:getComputedStyle(hero).gridTemplateColumns,
        story:rect(document.querySelector(".device-studio")),stage:rect(document.querySelector(".device-stage"))};
      const s=getComputedStyle(card);
      return {...common,card:rect(card),innerWidth:card.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),
        inset:parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth),outerRadius:s.borderRadius,eyebrow:rect(card.querySelector(".eyebrow")),form:rect(document.querySelector(".lead-form"))};
    });
    if (!baseline) {
      assert.equal(m.overflow,0,`${name}: overflow`);
      assert.ok(Math.abs(m.frame.width/m.frame.height-16/9)<0.001,`${name}: aspect ratio`);
      assert.equal(m.mediaCLS,0,`${name}: media layout shift`);
      assert.ok(m.muted && m.loop && m.inline,`${name}: native playback attributes`);
      if(c.reduced) assert.ok(playback.paused,`${name}: reduced motion`);
      else {
        assert.ok(playback.advanced,`${name}: playback advances`);
        assert.equal(m.source.includes("-mobile."),c.width<=760,`${name}: correct source`);
      }
      if(c.route==="/") {
        assert.ok(Math.abs(m.media.right-m.hero.right)<1,`${name}: container right edge`);
        if(c.width<=760) {
          assert.ok(Math.abs(m.media.width-m.hero.width)<1,`${name}: full mobile width`);
          assert.ok(m.media.y>=m.heading.bottom,`${name}: mobile order`);
        } else {
          assert.ok(m.media.x>=m.heading.right,`${name}: no text overlap`);
          if(c.width>1100) assert.ok(m.media.width/m.story.width>=0.95,`${name}: coherent media widths`);
        }
      } else {
        assert.ok(Math.abs(m.media.width-m.innerWidth)<1,`${name}: full card inner width`);
        assert.ok(Math.abs(m.media.x-m.eyebrow.x)<1,`${name}: text alignment`);
        assert.ok(Math.abs(m.media.y-m.card.y-m.inset)<1,`${name}: matching top inset`);
        assert.ok(parseFloat(m.radius)<parseFloat(m.outerRadius),`${name}: nested radius`);
        assert.ok(["contain", "cover"].includes(m.fit), `${name}: undistorted fitting`);
        if (m.fit === "cover" && !c.reduced) {
          assert.ok(Math.abs(m.sourceWidth/m.sourceHeight-m.frame.width/m.frame.height)<0.001, `${name}: no added source crop`);
        }
      }
    }
    if(c.route==="/") await page.locator(".device-experience").scrollIntoViewIfNeeded();
    await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
    await page.waitForTimeout(1200);
    if(!c.reduced) {await video.evaluate(v=>{v.pause();v.currentTime=2});await page.waitForTimeout(150);}
    const bottom=await page.locator(c.route==="/"?".device-experience":".contact-aside").evaluate(e=>e.getBoundingClientRect().bottom+scrollY);
    await page.screenshot({path:`${out}/${name}.png`,fullPage:true,clip:{x:0,y:0,width:c.width,height:Math.ceil(bottom+32)}});
    report.cases.push({name,...c,...m,playback});
    console.log(`${name}: width=${m.media.width.toFixed(2)} height=${m.media.height.toFixed(2)} overflow=${m.overflow} mediaCLS=${m.mediaCLS}`);
    await context.close();
  }
  assert.deepEqual(report.errors,[],"No application/console/hydration errors");
} finally {
  await writeFile(`${out}/measurements.json`,JSON.stringify(report,null,2));
  await browser.close();
}
