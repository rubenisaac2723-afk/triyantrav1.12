import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const out = "output/playwright/media-performance";
const browser = await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined)});
const report = {base, cases:[], errors:[]};
await mkdir(out, {recursive:true});
try {
  for (const [width,height] of [[360,800],[390,844],[430,932],[1440,900]]) for (const route of ["/","/contact"]) {
    const context = await browser.newContext({viewport:{width,height},isMobile:width<760,hasTouch:width<760,deviceScaleFactor:width<760?3:1,colorScheme:"dark"});
    await context.addInitScript(()=>sessionStorage.setItem("triyantra-intro-v1.2","seen"));
    const page = await context.newPage();
    page.on("pageerror",e=>report.errors.push(e.message));
    page.on("console",m=>{if(m.type()==="error")report.errors.push(m.text());});
    const cdp = await context.newCDPSession(page);
    const properties = [];
    cdp.on("Media.playerPropertiesChanged",e=>properties.push(...e.properties));
    await cdp.send("Media.enable");
    await page.goto(base+route,{waitUntil:"networkidle"});
    const video = page.locator(".product-motion-video").first();
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const v=document.querySelector(".product-motion-video");return v.readyState>=2&&!v.paused;});
    const samples = [];
    for (const phase of ["startup","steady","scroll"]) {
      const start = await video.evaluate(v=>({time:performance.now(),frames:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames}));
      if(phase==="scroll") for(let i=0;i<10;i++){await page.mouse.wheel(0,i%2?-60:60);await page.waitForTimeout(300);}
      else await page.waitForTimeout(phase==="startup"?3000:6000);
      const end = await video.evaluate(v=>({time:performance.now(),frames:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames,paused:v.paused}));
      const frames=end.frames-start.frames, dropped=end.dropped-start.dropped, seconds=(end.time-start.time)/1000;
      assert.ok(frames>0&&!end.paused,`${width} ${route} ${phase}: playing`);
      samples.push({phase,frames,dropped,seconds,presentedFps:(frames-dropped)/seconds});
    }
    const geometry = await video.evaluate(v=>({width:v.clientWidth,height:v.clientHeight,source:v.currentSrc,sourceWidth:v.videoWidth,sourceHeight:v.videoHeight,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
    assert.equal(geometry.overflow,0);
    assert.equal(geometry.source.includes("-mobile.mp4"),width<=760);
    assert.equal(geometry.sourceWidth,width<=760?960:1920);
    const before = await video.boundingBox();
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector(".product-motion-video").paused);
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>!document.querySelector(".product-motion-video").paused);
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.waitForFunction(()=>document.querySelector(".product-motion-video").paused);
    const after = await video.boundingBox();
    assert.equal(before.width,after.width);
    assert.equal(before.height,after.height);
    const result = {viewport:{width,height},route,...geometry,samples,decoder:properties.filter(p=>/Decoder/.test(p.name)),offscreenPause:true,visibleResume:true,reducedMotionStable:true};
    report.cases.push(result);
    console.log(JSON.stringify(result));
    await context.close();
  }
  assert.deepEqual(report.errors,[]);
} finally {
  await writeFile(`${out}/${base.startsWith("https:")?"deployed":"local"}-playback.json`,JSON.stringify(report,null,2));
  await browser.close();
}
