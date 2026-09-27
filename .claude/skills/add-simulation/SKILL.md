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

## 4. Write `<subject>/<id>/sim.js`
- Start from the template's structure: `SimLab.createSim({ params, readouts, graph?, reset, update, draw, readout, sample? })`.
- Look at a similar existing simulation for patterns (grep for `createSim` in `physics/*/sim.js`):
  - time-based physics → `physics/pendulum/sim.js`
  - an activity with no Play button → `physics/who-can-hear/sim.js` (`transport:false`)
  - sound → `physics/frequency-pitch/sim.js` (`audio:true`, `voice()`)
  - drag interaction → `pointer: {down, move, up}` in `physics/water-xylophone/sim.js`
- Draw responsively from `sim.width` / `sim.height`, test both below and above 560px wide, and use `mobileAspect` if a phone needs a taller canvas.
- Use `sim.colors` (theme-aware), never fixed colours for text or axes.
- Give it an `ariaLabel`.

## 5. Thumbnail
Create `assets/img/thumbs/<id>.svg`: 320×200, a dark gradient background plus a simple motif. Copy the style of an existing thumb.

## 6. Catalog entry (`assets/js/catalog.js`, `SIMULATIONS` array)
```js
{ id, subject, branch, title, description, level: 'Beginner'|'Intermediate'|'Advanced',
  tags: [...], thumbnail: '/assets/img/thumbs/<id>.svg', link: '/<subject>/<id>/',
  status: 'live', featured: false, dateAdded: 'YYYY-MM-DD', prerequisites: [...] }
```

## 7. Verify and ship
```bash
node tools/check.mjs --write     # must end with ✅
node tools/browser-test.mjs /<subject>/<id>/   # if Playwright is available
git add -A && git commit -m "Add <title> simulation" && git push origin HEAD:main
```
Update the "Current content" section of `AGENTS.md` if the list of live simulations changed.
