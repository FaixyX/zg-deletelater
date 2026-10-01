#!/usr/bin/env node
/**
 * Screenshots the lab direction pages: `npm run shots [-- a b c]`.
 *
 * Needs a production build (`npm run build`). Starts `next start` itself on
 * SHOTS_PORT (default 3200) unless SHOTS_URL points at a server that is
 * already running. Writes to screenshots/directions/ (gitignored): for each
 * direction, the fold and the full page at 1440x900 and 390x844, plus the
 * fold again with prefers-reduced-motion. A page is "ready" when it sets
 * <html data-ready>; the script waits for that, so animations have settled.
 *
 * Browser: the preinstalled Chromium if present (PLAYWRIGHT_BROWSERS_PATH or
 * /opt/pw-browsers), else Playwright's own. It never downloads one.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const PORT = process.env.SHOTS_PORT ?? "3200";
const BASE = process.env.SHOTS_URL ?? `http://localhost:${PORT}`;
const OUT = "screenshots/directions";
const only = process.argv.slice(2);
const DIRECTIONS = ["a", "b", "c"].filter((d) => only.length === 0 || only.includes(d));
const SIZES = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

async function waitForServer(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server did not answer at ${url}`);
}

let server;
if (!process.env.SHOTS_URL) {
  server = spawn("npx", ["next", "start", "-p", PORT], { stdio: "ignore", detached: true });
}
// Kill the whole process group: killing npx alone leaves next-server serving.
const stop = () => {
  try {
    if (server?.pid) process.kill(-server.pid);
  } catch {}
};
process.on("exit", stop);

try {
  await waitForServer(`${BASE}/lab/directions`);
  mkdirSync(OUT, { recursive: true });
  const exe = ["/opt/pw-browsers/chromium"].find(existsSync);
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});

  for (const dir of DIRECTIONS) {
    for (const reduced of [false, true]) {
      for (const size of reduced ? SIZES.slice(0, 1) : SIZES) {
        const ctx = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          reducedMotion: reduced ? "reduce" : "no-preference",
        });
        const page = await ctx.newPage();
        await page.goto(`${BASE}/lab/directions/${dir}`, { waitUntil: "load" });
        await page.waitForSelector("html[data-ready]", { timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        const tag = `${dir}-${size.name}${reduced ? "-reduced" : ""}`;
        await page.screenshot({ path: `${OUT}/${tag}-fold.png` });
        if (!reduced) {
          // Scroll through once so scroll-driven moments fire, then back to the top.
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0; y < h; y += size.height * 0.6) {
            await page.evaluate((v) => window.scrollTo(0, v), y);
            await page.waitForTimeout(250);
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(300);
          await page.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true });
        }
        console.log(`shot ${tag}`);
        await ctx.close();
      }
    }
  }
  await browser.close();
} finally {
  stop();
}
