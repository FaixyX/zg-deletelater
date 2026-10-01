#!/usr/bin/env node
/**
 * Screenshots the lab direction pages: `npm run shots [-- a b c]`.
 *
 * Needs a production build (`npm run build`). Starts `next start` itself on
 * SHOTS_PORT (default 3200) unless SHOTS_URL points at a server that is
 * already running. Writes to screenshots/directions/ (gitignored): for each
 * direction, the fold and a scroll sequence (a frame every ~70% of a screen,
 * driven by real wheel events) at 1440x900 and 390x844, plus the fold with
 * prefers-reduced-motion. A page is "ready" when it sets
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
const DIRECTIONS = ["run", "ledger", "atlas"].filter((d) => only.length === 0 || only.includes(d));
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
          // Scroll sequence: real wheel steps through the page (so smooth
          // scroll and scrubbed timelines respond as they would for a person),
          // a frame every ~70% of a screen.
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          const step = Math.round(size.height * 0.7);
          let n = 0;
          for (let y = 0; y < h - size.height && n < 24; y += step) {
            for (let k = 0; k < 5; k++) {
              await page.mouse.wheel(0, step / 5);
              await page.waitForTimeout(60);
            }
            await page.waitForTimeout(1100);
            n += 1;
            await page.screenshot({ path: `${OUT}/${tag}-s${String(n).padStart(2, "0")}.png` });
          }
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
