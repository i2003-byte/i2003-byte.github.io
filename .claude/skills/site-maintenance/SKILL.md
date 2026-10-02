---
name: site-maintenance
description: Weekly SimLab health check and repair. Run all checks and browser tests, fix regressions, unstick the roadmap, tidy tracking files, record lessons learned, then add one site capability from the roadmap. Use for the weekly maintenance routine or when asked to "check the site" or "do maintenance".
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
- Take **one combined screenshot contact sheet** of a sample: the 5 newest simulations plus 3 random older ones, at phone width. Fix overlapping, cut-off or unreadable drawings.
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

## 5. Tidy
- `PROGRESS.md`: keep the latest ~30 entries and delete older ones (git history keeps them).
- Remove stray files (screenshots, temp files) accidentally committed.

## 5b. One new capability (only if steps 1–5 ended fully green)
Capabilities are site features beyond new simulations (see `ROADMAP.md` → 🧩 Capabilities).
1. **Commit the maintenance work first** (separate commit), so the capability can be undone on its own.
2. **Review and refresh the list.** From this week's feedback, the screenshot review and anything you noticed, add or reorder ideas. Keep about 8 items.
   - **Auto-approved:** additive or opt-in features that work on every page without changing how existing simulations behave, use only plain HTML/CSS/JS, and add no outside services.
   - **Never auto-approved** (put in 💡 Proposed with a reason): outside services or scripts, analytics or tracking, accounts or logins, collecting any visitor data, ads or payments, a visual redesign, removing or renaming existing features, changing the engine's existing API.
3. **Build the top item only.** One per week, however small. If it is too big for one run, build a working first part that ships safely and leave a "Next:" note on the item.
   - Shared code (`common.js`, `nav.js`, `style.css`) affects every page: keep changes small, opt-in, and backward compatible.
   - Update `_template/`, the `add-simulation` skill and `AGENTS.md` (cheat-sheet, Where things are) if daily builders must use or know the feature.
4. **Prove it didn't break anything:** `node tools/check.mjs --write` and `node tools/browser-test.mjs` on **all pages**, phone and desktop, plus a screenshot of 3 pages showing the feature.
5. **If anything fails and you can't fix it safely, drop the capability** (`git reset --hard` to the maintenance commit), leave the item in the list with a note, and write **NEEDS HUMAN** in `PROGRESS.md`. Never push a half-working capability.
6. Commit it separately: `Add capability: <name>`. Move the item to ✅ Done (under a "Capabilities" line).

## 6. Ship and log
1. Add a `PROGRESS.md` entry at the top: kind `maintenance`, listing what was checked, fixed, learned, the capability added (or why none), and anything a human should look at.
2. Push:
```bash
node tools/check.mjs --write
git add -A && git commit -m "Weekly maintenance: log"   # only if anything is left uncommitted
git push origin HEAD:main
```
Never bypass the pre-push hook. If something can't be fixed safely, don't push a risky change. Describe it in `PROGRESS.md` under "Problems/notes" with **NEEDS HUMAN**, so the owner sees it.
