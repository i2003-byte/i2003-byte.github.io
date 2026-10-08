---
name: site-maintenance
description: Weekly SimLab health check and repair. Run all checks and browser tests, fix regressions, unstick the roadmap, tidy tracking files, record lessons learned, then add one well-chosen site capability (or none). Use for the weekly maintenance routine or when asked to "check the site" or "do maintenance".
---

# Weekly site maintenance

Goal: keep the site healthy and the harness accurate, so the daily builders keep working unattended. Build **no new simulations** in this run. Fix and tidy first; then, only if everything is green, add **one** site capability (step 5b).

## 0. Start from the latest `main`
```bash
git fetch origin main && git checkout -B maintenance origin/main
```

## 1. Health checks (fix everything that fails)
```bash
node tools/check.mjs --write
node tools/browser-test.mjs          # ALL pages, phone and desktop (skips itself if Playwright is missing)
```
- For each failure, find the root cause and fix it with the smallest change. Re-run until green.
- Take **one combined screenshot contact sheet** of a sample: the 5 newest simulations plus 3 random older ones, at phone width, both at the top of the page and after pressing Play and scrolling down to the controls (the picture, key-number chips and tabs should stay pinned and readable). Also check the home page on a phone: the hero, the Tap & play row and the class chips. Fix overlapping, cut-off or unreadable drawings.
- Science spot-check: pick 2 simulations built this week, and check one key formula or number in each against physics (e.g. pendulum T = 2π√(L/g)). Fix any errors.

## 2. Roadmap health (`ROADMAP.md`)
- **Stuck items:** anything in 🔨 In progress whose start date is more than 3 days old. Read its note and the latest `PROGRESS.md` entries.
  - If it's blocked, fix the blocker.
  - Otherwise leave a clear "Next:" note for the daily builder.
- **Queue:** if 📋 Next has fewer than 8 items, evolve it (see `roadmap-run` skill, step 6): add Class 7–12 India syllabus topics, auto-approved.
- **Accuracy:** coverage table and total match the live simulation count in `catalog.js`; ✅ Done matches reality.

## 2b. Feedback
Run `.claude/skills/feedback-triage/SKILL.md` to catch anything the daily runs missed. Also note in the `PROGRESS.md` entry any open issues the owner could close on GitHub (already handled in `FEEDBACK.md`).

## 3. Consistency
- `README.md` "What's inside" (titles, counts, total) matches the catalog.
- `AGENTS.md` "Current content" matches the catalog.
- `llms.txt`, `sitemap.xml` and `robots.txt` are regenerated (done by `check.mjs --write`).

## 4. Learn (keep the harness improving)
- Read this week's `PROGRESS.md` entries for problems, repeated fixes or blocked pushes.
- For each **non-obvious mistake** that could happen again, add a one-line lesson to **AGENTS.md → Gotchas** ("Do X, because Y happened").
- Keep Gotchas at about 20 lines or fewer. Merge similar lessons and delete ones that no longer apply.
- If a skill's steps caused a problem, fix the skill (`.claude/skills/*/SKILL.md`).

## 4b. Harness health (prove the safety nets still work)
Quick tests, a few seconds each. Fix anything broken before step 5b.
- **Settings:** `node -e 'JSON.parse(require("fs").readFileSync(".claude/settings.json"))'` succeeds, and the attribution is still the generic `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **Pre-push hook blocks bad pushes:** create a temp file containing a model name, run `echo '{"tool_input":{"command":"git push origin HEAD:main"}}' | node tools/check.mjs --hook`, expect exit code **2**, then delete the file. Without it, expect exit 0.
- **References:** every file path named in `AGENTS.md`, `CLAUDE.md` and `.claude/skills/*/SKILL.md` exists, and the skills agree with each other and with AGENTS.md (e.g. simulations per run, approved subjects).
- **CI:** the latest "Site check" runs on `main` are green: `curl -sS "https://api.github.com/repos/i2003-byte/i2003-byte.github.io/actions/runs?branch=main&per_page=10"` (look at `name` and `conclusion`).
- **Daily runs are happening:** `PROGRESS.md` has routine entries from the last 2 days. If not, write **NEEDS HUMAN** (the owner checks the routines).
- **Size:** AGENTS.md stays short (Gotchas about 20 lines or fewer, Current content is a list, not prose) so every run stays cheap to start.

## 5. Tidy
- `PROGRESS.md`: keep the latest ~30 entries and delete older ones (git history keeps them).
- Remove stray files (screenshots, temp files) accidentally committed.

## 5b. One new capability (only if steps 1–5 ended fully green)
Capabilities are site features beyond new simulations. There is **no fixed list**: choose one fresh each week.
1. **Commit the maintenance work first** (separate commit), so the capability can be undone on its own.
2. **Find candidates** from this week's feedback, the screenshot review, gaps you noticed while checking pages, and what would most help Class 7–12 students and teachers. Read `ROADMAP.md` → 🧩 Capabilities first so you don't repeat a done or skipped idea.
3. **Qualify each candidate. Skip it if any answer is "yes":**
   - **Too costly:** would it take a large share of this run, touch many simulation files one by one, or need ongoing per-simulation work from the daily builders?
   - **Disruptive:** could it change how existing simulations look or behave, break share links, move or rename things, or need a redesign?
   - **Platform-heavy:** does it need a framework, build step, server, outside service or script, accounts, tracking or data collection, ads or payments, or a change to the engine's existing API?
   - **Low value:** is it nice-to-have rather than something students or teachers would notice and use?
   Pick the best candidate that passes. If none passes, add none this week and say so in `PROGRESS.md`. That is a fine outcome.
   Ideas that are valuable but fail only the platform test go to 💡 Proposed with a one-line reason, for a human.
4. **Build it** small, additive and backward compatible: plain HTML/CSS/JS, mostly in shared code (`common.js`, `nav.js`, `style.css`) so every page gets it at once. Update `_template/`, the `add-simulation` skill and `AGENTS.md` only if daily builders must know about it.
5. **Prove it didn't break anything:** `node tools/check.mjs --write` and `node tools/browser-test.mjs` on **all pages**, phone and desktop, plus a screenshot of 3 pages showing the feature.
6. **If anything fails and you can't fix it safely, drop it** (`git reset --hard` to the maintenance commit), log it as skipped with the reason, and write **NEEDS HUMAN** in `PROGRESS.md` if a person should look. Never push a half-working capability.
7. Commit it separately: `Add capability: <name>`. Log it in `ROADMAP.md` → 🧩 Capabilities (done or skipped, with date and one line).

## 6. Ship and log
1. Add a `PROGRESS.md` entry at the top: kind `maintenance`, listing what was checked, fixed, learned, the capability added (or why none), and anything a human should look at.
2. Push:
```bash
node tools/check.mjs --write
git add -A && git commit -m "Weekly maintenance: log"   # only if anything is left uncommitted
git push origin HEAD:main
```
Never bypass the pre-push hook. If something can't be fixed safely, don't push a risky change. Describe it in `PROGRESS.md` under "Problems/notes" with **NEEDS HUMAN**, so the owner sees it.
