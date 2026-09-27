#!/usr/bin/env node
/* =====================================================================
   SimLab — tools/browser-test.mjs  (optional, needs Playwright)
   ---------------------------------------------------------------------
   Opens pages in a real headless Chromium at PHONE (375px) and DESKTOP
   (1366px) sizes and fails on:
     • JavaScript errors / console errors / missing files (HTTP ≥ 400)
     • horizontal scrolling (page wider than the screen)
   On simulation pages it also presses Play, every action button, and
   moves every slider to make sure nothing throws.

     node tools/browser-test.mjs              → every page in the site
     node tools/browser-test.mjs /physics/pendulum/   → just these pages
     SHOTS=out node tools/browser-test.mjs    → also save screenshots to ./out

   Playwright is found from a global install (npm i -g playwright) or
   the PLAYWRIGHT_MODULE env var. If it isn't installed the test is
   skipped (exit 0) so it never blocks work on machines without it.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, 'playwright'];
  try { candidates.push(path.join(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright')); } catch { /* no npm */ }
  for (const c of candidates.filter(Boolean)) { try { return require(c); } catch { /* try next */ } }
  return null;
}
const pw = loadPlaywright();
if (!pw) { console.log('⏭  Playwright not installed — browser test skipped (npm i -g playwright to enable).'); process.exit(0); }

/* ---------- tiny static server (root-relative paths need a real server) ---------- */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html' }).end(fs.readFileSync(path.join(ROOT, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const BASE = 'http://localhost:' + server.address().port;

/* ---------- which pages ---------- */
function allPages() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'tools') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push('/' + path.relative(ROOT, p).replace(/index\.html$/, '').replace(/\\/g, '/'));
    }
  })(ROOT);
  return out.sort();
}
const pages = process.argv.slice(2).length ? process.argv.slice(2) : allPages();

/* ---------- run ---------- */
const VIEWPORTS = [
  { name: 'phone', viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1366, height: 900 } }
];
const browser = await pw.chromium.launch();
let failures = 0;
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp.viewport, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  for (const url of pages) {
    const page = await ctx.newPage();
    const problems = [];
    page.on('pageerror', (e) => problems.push('JS error: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_CERT|ERR_TUNNEL|ERR_NAME|net::ERR/.test(m.text())) problems.push('console: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE) && !/favicon\.ico/.test(r.url())) problems.push(`HTTP ${r.status()} ${r.url().slice(BASE.length)}`); });
    page.on('dialog', (d) => d.dismiss());
    try {
      await page.goto(BASE + url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(400);
      // Exercise simulations
      if (await page.$('#sim-canvas')) {
        const play = await page.$('[data-act="play"]');
        if (play) await play.click();
        for (const b of await page.$$('[data-btn]')) { await b.click().catch(() => {}); await page.waitForTimeout(60); }
        for (const r of await page.$$('#sim-controls input[type=range]')) { await r.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); }
        await page.waitForTimeout(300);
      }
      const overflow = await page.evaluate((w) => document.documentElement.scrollWidth - w, vp.viewport.width);
      if (overflow > 1) problems.push(`page is ${overflow}px wider than the screen (horizontal scroll)`);
      if (process.env.SHOTS) {
        fs.mkdirSync(process.env.SHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SHOTS, `${vp.name}${url.replace(/[\/?=&]/g, '_') || '_home'}.png`) });
      }
    } catch (e) { problems.push('failed to load: ' + e.message); }
    if (problems.length) { failures++; console.log(`❌ [${vp.name}] ${url}\n   ` + problems.join('\n   ')); }
    else console.log(`✅ [${vp.name}] ${url}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(failures ? `\n❌ ${failures} page check(s) failed` : `\n✅ All ${pages.length} pages clean on phone and desktop`);
process.exit(failures ? 1 : 0);
