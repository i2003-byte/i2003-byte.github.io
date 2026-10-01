#!/usr/bin/env node
/* =====================================================================
   SimLab — tools/check.mjs  (zero dependencies, Node 18+)
   ---------------------------------------------------------------------
   One command that proves the site is healthy before it goes live.

     node tools/check.mjs           → run all checks (exit 1 on any error)
     node tools/check.mjs --write   → also regenerate sitemap.xml, llms.txt and
                                      robots.txt from catalog.js, then check
     node tools/check.mjs --hook    → used by the Claude Code pre-push hook
                                      (reads the tool call from stdin)

   What it checks:
     1. Every .js file parses (node --check)
     2. catalog.js is valid: unique ids, known subject/branch/level/status,
        dates, links, thumbnails, prerequisites
     3. Every LIVE simulation has /<subject>/<id>/index.html + sim.js and
        its page says data-sim="<id>"
     4. Every subject has /<id>/index.html with data-subject="<id>"
     5. Every root-relative link/src in every HTML file points to a real file
     6. Every page has <title>, meta description and a viewport tag
     7. Generated files (sitemap.xml, llms.txt) match catalog.js
     8. README.md lists every live simulation (the "What's inside" table)
     9. No AI model names or session links in public files (and, in --hook mode,
        in commit messages about to be pushed)
    10. Required files exist (.nojekyll, 404.html, favicon …)

   Used by: the Claude Code pre-push hook (.claude/settings.json),
   GitHub Actions (.github/workflows/check.yml) and humans.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
// --hook: called by the Claude Code PreToolUse hook with the tool call as JSON on
// stdin. Only runs for shell commands that push; exit code 2 blocks the push.
const HOOK = process.argv.includes('--hook');
if (HOOK) {
  let cmd = '';
  try { cmd = JSON.parse(fs.readFileSync(0, 'utf8')).tool_input.command || ''; } catch { /* not a Bash call */ }
  if (!/\bgit\s+push\b/.test(cmd)) process.exit(0);
}
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const rel = (p) => path.relative(ROOT, p) || '.';
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/* ---------- walk the repo (skip .git, node_modules) ---------- */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const files = walk(ROOT);

/* ---------- 1. JS syntax ---------- */
for (const f of files.filter((f) => /\.(m?js)$/.test(f))) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { err(`Syntax error in ${rel(f)}:\n${String(e.stderr).trim()}`); }
}

/* ---------- 2. Load catalog.js in a sandbox ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/catalog.js'), 'utf8'), ctx); }
catch (e) { err('catalog.js failed to run: ' + e.message); report(); }
const S = ctx.window.SimLab;
const { subjects, simulations, site } = S;

const idRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const seen = new Set();
for (const s of subjects) {
  const where = `subject "${s.id}"`;
  if (!idRe.test(s.id)) err(`${where}: id must be lowercase-with-dashes`);
  if (seen.has(s.id)) err(`${where}: duplicate id`); seen.add(s.id);
  for (const k of ['name', 'icon', 'color', 'tagline', 'description']) if (!s[k]) err(`${where}: missing ${k}`);
  if (!/^#[0-9a-f]{6}$/i.test(s.color)) err(`${where}: color must be #rrggbb`);
  if (!['live', 'coming-soon'].includes(s.status)) err(`${where}: status must be live|coming-soon`);
  if (!Array.isArray(s.branches) || !s.branches.length) err(`${where}: needs at least one branch`);
  const bids = new Set();
  for (const b of s.branches || []) {
    if (!idRe.test(b.id) || !b.name) err(`${where}: bad branch ${JSON.stringify(b)}`);
    if (bids.has(b.id)) err(`${where}: duplicate branch ${b.id}`); bids.add(b.id);
  }
  // 4. subject page
  const page = `${s.id}/index.html`;
  if (!exists(page)) err(`${where}: missing ${page} (copy physics/index.html)`);
  else if (!fs.readFileSync(path.join(ROOT, page), 'utf8').includes(`data-subject="${s.id}"`)) err(`${page}: must contain data-subject="${s.id}"`);
}

const simIds = new Set();
for (const m of simulations) {
  const where = `simulation "${m.id}"`;
  if (!idRe.test(m.id)) err(`${where}: id must be lowercase-with-dashes`);
  if (simIds.has(m.id)) err(`${where}: duplicate id`); simIds.add(m.id);
  const subj = subjects.find((s) => s.id === m.subject);
  if (!subj) { err(`${where}: unknown subject "${m.subject}"`); continue; }
  if (!subj.branches.some((b) => b.id === m.branch)) err(`${where}: branch "${m.branch}" is not a branch of ${m.subject}`);
  for (const k of ['title', 'description']) if (!m[k]) err(`${where}: missing ${k}`);
  if (!S.LEVELS.includes(m.level)) err(`${where}: level must be one of ${S.LEVELS.join('/')}`);
  if (!['live', 'coming-soon'].includes(m.status)) err(`${where}: status must be live|coming-soon`);
  if (typeof m.featured !== 'boolean') err(`${where}: featured must be true/false`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.dateAdded || '')) err(`${where}: dateAdded must be YYYY-MM-DD`);
  if (!Array.isArray(m.tags)) err(`${where}: tags must be an array`);
  if (m.link !== `/${m.subject}/${m.id}/`) err(`${where}: link should be "/${m.subject}/${m.id}/" (is "${m.link}")`);
  if (!m.thumbnail || !exists(m.thumbnail.replace(/^\//, ''))) err(`${where}: thumbnail not found: ${m.thumbnail}`);
  for (const p of m.prerequisites || []) if (!simulations.some((x) => x.id === p)) err(`${where}: unknown prerequisite "${p}"`);
  // 3. live sim folder
  if (m.status === 'live') {
    const dir = `${m.subject}/${m.id}`;
    if (!exists(`${dir}/index.html`)) err(`${where}: missing ${dir}/index.html (copy /_template/)`);
    else if (!fs.readFileSync(path.join(ROOT, dir, 'index.html'), 'utf8').includes(`data-sim="${m.id}"`)) err(`${dir}/index.html: must contain data-sim="${m.id}"`);
    if (!exists(`${dir}/sim.js`)) err(`${where}: missing ${dir}/sim.js`);
  } else if (exists(`${m.subject}/${m.id}/index.html`)) {
    warn(`${where}: folder exists but status is "coming-soon" — set status: 'live' when it is ready`);
  }
}

/* ---------- 5 + 6. HTML pages ---------- */
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  const r = rel(f);
  if (!/<title>[^<]+<\/title>/.test(html)) err(`${r}: missing <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) err(`${r}: missing meta description`);
  if (!/<meta name="viewport"/.test(html)) err(`${r}: missing viewport meta (needed for phones)`);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#|data:|javascript:)/.test(url)) continue;
    const clean = url.split(/[?#]/)[0];
    if (!clean) continue;
    const target = clean.startsWith('/') ? path.join(ROOT, clean) : path.join(path.dirname(f), clean);
    const ok = fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
    if (!ok) err(`${r}: broken link/asset "${url}"`);
  }
}

/* ---------- 7. Generated files ---------- */
function sitemapXml() {
  const urls = ['/', '/about.html', '/simulations/',
    ...subjects.map((s) => `/${s.id}/`),
    ...simulations.filter((m) => S.isLive(m)).map((m) => m.link)];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- GENERATED by tools/check.mjs --write from assets/js/catalog.js. Do not edit by hand. -->\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n') + '\n</urlset>\n';
}
function llmsTxt() {
  // llms.txt: open format (https://llmstxt.org) describing the site for AI tools
  const lines = [
    `# ${site.name}`, '',
    `> ${site.tagline}: free, hands-on experiments with sliders, live graphs and sound that run in any browser ` +
    '(phone or desktop). Each simulation includes a Learn panel with the concept, formulas, examples and challenges.', '',
    '<!-- GENERATED by tools/check.mjs --write from assets/js/catalog.js. Do not edit by hand. -->', '',
    `Source code: ${site.github}`,
    'Maintainers (human or AI): read AGENTS.md and README.md in the repository first.', ''
  ];
  for (const s of subjects) {
    lines.push(`## ${s.name}${S.isSubjectLive(s) ? '' : ' (coming soon)'}`, '', s.description, '');
    for (const b of s.branches) {
      const sims = simulations.filter((m) => m.subject === s.id && m.branch === b.id);
      if (!sims.length) continue;
      lines.push(`### ${b.name}`, '');
      for (const m of sims) {
        const live = S.isLive(m);
        lines.push(`- [${m.title}](${site.url}${live ? m.link : `/${s.id}/`}): ${m.description} (${m.level}${live ? '' : ', coming soon'})`);
      }
      lines.push('');
    }
  }
  lines.push('## Optional', '', `- [About](${site.url}/about.html)`, `- [All simulations](${site.url}/simulations/)`, '');
  return lines.join('\n');
}
function robotsTxt() {
  return `# GENERATED by tools/check.mjs --write\nUser-agent: *\nAllow: /\nDisallow: /_template/\nDisallow: /tools/\n\nSitemap: ${site.url}/sitemap.xml\n`;
}
for (const [file, content] of [['sitemap.xml', sitemapXml()], ['llms.txt', llmsTxt()], ['robots.txt', robotsTxt()]]) {
  const p = path.join(ROOT, file);
  const current = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (current === content) continue;
  if (WRITE) { fs.writeFileSync(p, content); console.log(`wrote ${file}`); }
  else err(`${file} is out of date with catalog.js — run: node tools/check.mjs --write`);
}

/* ---------- 8. README lists every live simulation ---------- */
const readme = exists('README.md') ? fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8') : '';
for (const m of simulations.filter((x) => S.isLive(x)))
  if (!readme.includes(m.title)) err(`README.md: live simulation "${m.title}" is missing from the "What's inside" table`);

/* ---------- 9. Public repo: no AI model names or session links ---------- */
const PRIVATE_RE = /\bclaude-(?:opus|sonnet|haiku|fable|mythos)\b|\b(?:opus|sonnet|haiku|fable|mythos)\s*\d(?:\.\d)?\b|claude\.ai\/code\/session_|\bsession_0[0-9A-Za-z]{10,}|\bcse_0[0-9A-Za-z]{10,}/i;
for (const f of files.filter((f) => /\.(md|html|js|mjs|txt|xml|json|svg)$/.test(f) && !rel(f).startsWith('tools/'))) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => { if (PRIVATE_RE.test(line)) err(`${rel(f)}:${i + 1}: mentions an AI model name or session link. Remove it (public repo, AGENTS.md rule 8)`); });
}
if (HOOK) { // commit messages about to be pushed
  try {
    const msgs = execFileSync('git', ['log', '--format=%h %B', '@{u}..HEAD'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    if (PRIVATE_RE.test(msgs)) err('an unpushed commit message mentions an AI model name or session link. Reword it (git commit --amend) before pushing');
  } catch { /* no upstream: skip */ }
}

/* ---------- 10. Required files ---------- */
for (const f of ['.nojekyll', '404.html', 'index.html', 'assets/img/favicon.svg', 'assets/img/og-image.png', 'AGENTS.md', 'README.md', 'ROADMAP.md', 'PROGRESS.md', 'FEEDBACK.md'])
  if (!exists(f)) err(`missing required file: ${f}`);

report();

function report() {
  const live = S ? S.liveSims().length : 0;
  for (const w of warnings) console.log('⚠️  ' + w);
  if (errors.length) {
    console.error(`\n❌ ${errors.length} problem(s):\n` + errors.map((e) => ' • ' + e).join('\n'));
    if (HOOK) console.error('\nPush blocked by the SimLab pre-push check. Fix the problems above (often: node tools/check.mjs --write), commit, then push again.');
    process.exit(HOOK ? 2 : 1);
  }
  console.log(`✅ All checks passed (${S ? S.subjects.length : 0} subjects, ${live} live simulations, ${files.filter((f) => f.endsWith('.html')).length} pages).`);
  process.exit(0);
}
