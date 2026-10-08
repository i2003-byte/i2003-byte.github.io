---
name: add-simulation
description: Add a new interactive simulation to SimLab (or build out a "coming-soon" placeholder). Use whenever the user asks for a new simulation, activity or experiment page.
---

# Add a simulation to SimLab

Follow these steps in order. Open only the files named here.

## 1. Decide the catalog details
- `id`: lowercase-with-dashes (it's also the folder name).
- `subject` + `branch`: must already exist in `SUBJECTS` in `assets/js/catalog.js`. Grep for `branches:` to see them.
- If the id already exists as a `coming-soon` placeholder, reuse that entry. Don't add a duplicate.

## 2. Create the folder
```bash
cp -r _template <subject>/<id>
```

## 3. Edit `<subject>/<id>/index.html`
- `<body data-page="sim" data-sim="<id>">`. Delete the `data-title` and `data-description` attributes and the big template comment.
- Update `<title>` (`<Title> — Interactive Simulation | SimLab`) and the meta description.
- Update the canonical, `og:title`, `og:description` and `og:url` values.
- Rewrite the Learn section. Keep its structure: 💡 big idea, 🧮 formulas (`<code class="formula">`), 🌍 examples, 🎯 "Try this" (`<details>` answers), 📖 key terms (optional).
- The 🎯 `<ol class="try-list">` needs 3–5 challenges, each with a `<details><summary>Show answer</summary>…</details>`. On phones they become the "Try this" tab, one at a time, so make them things to *do* in the sim ("Set the angle to 30°. What happens to the range?"). `check.mjs` requires at least 2.

## 4. Write `<subject>/<id>/sim.js`
- Start from the template's structure: `SimLab.createSim({ params, readouts, graph?, reset, update, draw, readout, sample? })`.
- Look at a similar existing simulation for patterns (grep for `createSim` in `physics/*/sim.js`):
  - time-based physics → `physics/pendulum/sim.js`
  - an activity with no Play button → `physics/who-can-hear/sim.js` (`transport:false`)
  - sound → `physics/frequency-pitch/sim.js` (`audio:true`, `voice()`)
  - drag interaction → `pointer: {down, move, up}` in `physics/water-xylophone/sim.js`
- Draw responsively from `sim.width` / `sim.height` and test both below and above 560px wide. `mobileAspect` asks for a taller phone canvas, but phones cap it at 46% of the screen (often about 343×340), so pick layouts by height too and check a screenshot at 375×740.
- Use `sim.colors` (theme-aware), never fixed colours for text or axes.
- Give it an `ariaLabel`.
- Mark the 1–3 most important readouts `key: true` (required by `check.mjs`). Phones show them in a strip under the picture; add `short: '…'` (≤ 14 characters) when the label is long.
- Set `playLabel` if Play should say something clearer ("Launch", "Start race"). It also labels the big start button on the picture.

## 5. Thumbnail
Create `assets/img/thumbs/<id>.svg`: 320×200, a dark gradient background plus a simple motif. Copy the style of an existing thumb.

## 6. Catalog entry (`assets/js/catalog.js`, `SIMULATIONS` array)
```js
{ id, subject, branch, title, description, level: 'Beginner'|'Intermediate'|'Advanced',
  tags: [..., 'class 9'], thumbnail: '/assets/img/thumbs/<id>.svg', link: '/<subject>/<id>/',
  status: 'live', featured: false, dateAdded: 'YYYY-MM-DD', prerequisites: [...] }
```
- Add a `'class N'` tag (7–12) for each school class the sim serves. It drives the Class filter on subject pages; `check.mjs` fails without it.

## 7. Verify and ship
```bash
node tools/check.mjs --write     # must end with ✅
node tools/browser-test.mjs /<subject>/<id>/   # if Playwright is available
git add -A && git commit -m "Add <title> simulation" && git push origin HEAD:main
```
Check a phone screenshot (390×844) after pressing Play and scrolling to the controls: the picture, its key-number chips and the tabs should stay pinned and readable.

Also update, before pushing:
- the "What's inside" table in `README.md` (title, count per topic and total; the check enforces the titles)
- the "Current content" section of `AGENTS.md`
