---
name: roadmap-run
description: One autonomous SimLab build run. Resume or take the next ROADMAP.md item, build 4 simulations, update the roadmap, progress log, README and coverage, then ship to main. Use for scheduled routines, or when asked to "continue the roadmap" or "do the next topic".
---

# Roadmap run: build the next 4 simulations

Goal: 4 high-quality finished simulations per run, working through the roadmap in order.
- First finish the current 🔨 In progress item.
- Then start the next 📋 Next item with the remaining budget. At most 2 items are touched per run.
- Leave any unfinished item 🔨 In progress with a precise "Next:" note. The result must be live on `main`, with the tracking files telling the next run precisely where things stand.

## 0. Start from the latest `main`
```bash
git fetch origin main && git checkout -B roadmap-run origin/main
```
Never work from an old branch. Other sessions may have pushed since.

## 1. Orient (read only these)
1. `PROGRESS.md`: the top 3 entries. What happened last, and any problems to handle first?
2. `ROADMAP.md`: 🔨 In progress, then 📋 Next.
3. Decide the work:
   - If the last entry reports a **problem** (failed check, broken page), fix that first. It counts as this run's work if it is big.
   - Else if **🔨 In progress** has an item, **resume** it using its "Next:" note.
   - Else take the **first item in 📋 Next**. Move it to 🔨 In progress with today's date before building.
   - If 📋 Next is empty, do step 6 (evolve the roadmap) and then build the first new item.

## 2. Build 4 simulations
Follow `.claude/skills/add-simulation/SKILL.md` for each one:
- page
- `sim.js`
- thumbnail
- catalog entry
- If the item says "build out the `<id>` placeholder", reuse that catalog entry and flip it to `status: 'live'`.
- **Subject that already exists but is coming soon** (chemistry, mathematics, biology, astronomy): set its `status: 'live'` in `catalog.js` and give it branches that match the syllabus.
- **Brand-new subject** (only Economics, Geography or Computer Science):
  1. Add a `SUBJECTS` entry in `catalog.js` with an id, name, emoji icon, a distinct colour, tagline, description, `status: 'live'` and syllabus branches.
  2. Copy `physics/index.html` to `/<id>/index.html` and change `data-subject`, `<title>` and meta.
  3. Check the menu, home page and footer still look good at phone width.
- **New physics branch:** add it to the subject's `branches` in `catalog.js`.
- **Audience:** Class 7–12 India. Use simple English, Indian examples and SI units, and write your own words (no textbook copying).
- **Science first:** double-check formulas and numbers, and state any simplification in the Learn panel.

## 3. Verify
```bash
node tools/check.mjs --write          # must end with ✅
node tools/browser-test.mjs <new pages>   # if Playwright is available
```
Look at one combined screenshot of the new simulations at phone and desktop width (cheaper than many separate images). Fix anything that overlaps, is cut off or unreadable.

## 4. Update the tracking files (always, even if unfinished)
- **Finished:** move the item from 🔨 In progress to ✅ Done: `- [x] **…** N sims: <ids>. Done YYYY-MM-DD.`
- **Not finished:** leave it in 🔨 In progress with `Done: <ids>. Next: <exact remaining steps>`. Commit only the simulations that pass checks. Remove unfinished ones from the commit, or keep them `coming-soon` without a folder.
- **Coverage:** update the table and the total in `ROADMAP.md`.
- **`README.md`:** update the "What's inside" table (titles, counts, total). `check.mjs` enforces the titles.
- **`AGENTS.md`:** update the "Current content" section.
- **`PROGRESS.md`:** add a new entry at the **top** using the template (kind `routine`, or `request` when a person asked).

## 5. Ship
```bash
node tools/check.mjs --write
git add -A && git commit -m "Roadmap: <Class · Subject · Sub-topic> (<n> simulations)"
git push origin HEAD:main
```
If a push is blocked by the check hook, fix the problems and push again. Never bypass the hook.
If you truly cannot get a green check:
1. Push only the tracking-file updates (roadmap and progress log), with the problem described.
2. Leave the item 🔨 In progress.
3. Do not push broken simulations.

## 6. Evolve the roadmap (when 📋 Next has fewer than 5 items, or once a week)
- Compare ✅ Done with the Class 7–12 India syllabus (CBSE / NCERT topic list) across all subjects in `catalog.js`.
- **Approved new subjects (auto-approved, Class 7–12 India curriculum):**
  - Economics: supply and demand, simple and compound interest, budgets
  - Geography: earth's rotation and revolution, seasons, monsoon, contour maps
  - Computer Science: binary, sorting and searching algorithms, logic gates
  - Statistics and probability belong under Mathematics.
- **Languages are out of scope for now.** Don't add them, not even to Proposed.
- Any other new subject goes to 💡 Proposed for a human to decide.
- Add the most valuable missing sub-topics to the end of 📋 Next, each with class, subject, branch and 3 planned simulations. These are auto-approved when on the syllabus.
- Ideas outside that scope go to 💡 Proposed with a one-line reason.
- Don't add duplicates of anything in Done, In progress or Next.

## Rules
- 4 simulations per run, from at most 2 roadmap items (finish the current one first). Quality still comes first: if a simulation isn't good enough, ship fewer and leave a Next note rather than pushing weak work.
- Keep token use low:
  - Open only the files you need.
  - Copy patterns from the most similar existing simulation.
  - Use one combined screenshot.
