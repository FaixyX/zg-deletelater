#!/usr/bin/env node
/**
 * Captures reference sites for design research: `NODE_EXTRA_CA_CERTS=<ca bundle> node scripts/capture-inspiration.mjs <url>...`
 *
 * For each URL: a fold frame and a scroll sequence driven by real wheel events at
 * 1440x900, a three-frame scroll-response burst, three phone frames at 390x844,
 * and report.json (fonts, sizes and the motion stack the page runs). Output goes to
 * screenshots/inspiration/<site>/, which is gitignored: third-party screenshots are
 * never committed.
 *
 * Requests are fetched in Node and handed to the page (route.fetch), so TLS is
 * verified against the CA bundle in NODE_EXTRA_CA_CERTS. That is how this works
 * behind an intercepting proxy without ever disabling certificate checks.
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const OUT = "screenshots/inspiration";
const urls = process.argv.slice(2);
const exe = ["/opt/pw-browsers/chromium"].find(existsSync);
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function makeCtx(viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile,
    userAgent: mobile ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" : undefined });
  await ctx.route("**/*", async (route) => {
    try { await route.fulfill({ response: await route.fetch({ timeout: 30000 }) }); } catch { await route.abort(); }
  });
  return ctx;
}

for (const url of urls) {
  const name = new URL(url).hostname.replace(/^www\./, "").replace(/\W+/g, "-") + (new URL(url).pathname.length > 1 ? new URL(url).pathname.replace(/\W+/g, "-").replace(/-$/, "") : "");
  const dir = `${OUT}/${name}`; mkdirSync(dir, { recursive: true });
  const report = { url };
  try {
    const ctx = await makeCtx({ width: 1440, height: 900 });
    const page = await ctx.newPage();
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    report.status = res?.status();
    await page.waitForTimeout(6000);
    report.title = await page.title();
    report.info = await page.evaluate(() => {
      const fam = (sel) => [...new Set([...document.querySelectorAll(sel)].slice(0, 30).map((e) => getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g, "").trim()))];
      const size = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).fontSize + " / " + getComputedStyle(e).fontWeight + " / ls " + getComputedStyle(e).letterSpacing : null; };
      const scripts = [...document.scripts].map((s) => s.src).filter(Boolean).join(" ");
      const libs = { gsap: !!window.gsap || /gsap/i.test(scripts), scrollTrigger: !!window.ScrollTrigger || /ScrollTrigger/i.test(scripts), lenis: !!window.lenis || !!document.querySelector(".lenis, html.lenis") || /lenis/i.test(scripts), locomotive: !!document.querySelector("[data-scroll-container]"), three: !!window.THREE || /three/i.test(scripts), webgl: !!document.querySelector("canvas"), framer: /framer/i.test(scripts) || !!document.querySelector("[data-framer-name]"), webflow: !!document.querySelector("html[data-wf-site]"), barba: !!document.querySelector("[data-barba]"), splitting: !!document.querySelector(".char, .word, [data-split]"), video: document.querySelectorAll("video").length };
      const bg = getComputedStyle(document.body).backgroundColor;
      return { h1: fam("h1"), h2: fam("h2"), body: fam("p"), h1size: size("h1"), h2size: size("h2"), libs, bg, height: document.documentElement.scrollHeight, sections: document.querySelectorAll("section").length };
    });
    await page.screenshot({ path: `${dir}/d00-fold.png` });
    // Scroll in steps with real wheel events, so smooth-scroll and scroll-linked effects respond.
    const H = report.info.height;
    const steps = Math.min(14, Math.max(4, Math.round(H / 900)));
    const stride = Math.max(450, Math.floor((H - 900) / steps));
    for (let i = 1; i <= steps; i++) {
      for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, stride / 6); await page.waitForTimeout(90); }
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `${dir}/d${String(i).padStart(2, "0")}.png` });
    }
    // A scroll-response burst near the top: three frames 120px apart, to see what moves with the wheel.
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 500); await page.waitForTimeout(1200);
    for (let j = 0; j < 3; j++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(160); await page.screenshot({ path: `${dir}/burst-${j}.png` }); }
    await ctx.close();
    // Phone fold + two scrolls.
    const m = await makeCtx({ width: 390, height: 844 }, true);
    const mp = await m.newPage();
    await mp.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }); await mp.waitForTimeout(6000);
    await mp.screenshot({ path: `${dir}/m00.png` });
    for (let i = 1; i <= 2; i++) { await mp.evaluate(() => window.scrollBy(0, 760)); await mp.waitForTimeout(1500); await mp.screenshot({ path: `${dir}/m0${i}.png` }); }
    await m.close();
  } catch (e) { report.error = e.message.split("\n")[0]; }
  writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(name, JSON.stringify(report));
}
await browser.close();
