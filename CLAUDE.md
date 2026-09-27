# CLAUDE.md — SimLab maintenance guide for AI assistants

SimLab is a static science-simulations website hosted on GitHub Pages at https://i2003-byte.github.io/.
Read `README.md` for full step-by-step guides. This file lists the rules and the fastest way to get oriented.

## Hard rules
- **Plain HTML, CSS and vanilla JS only.** No frameworks, no npm packages, no build step. Files must work as-is when uploaded.
- **Root-relative paths** (`/assets/...`). The site is served from the domain root.
- **`assets/js/catalog.js` is the single source of truth.** Menus, search, subject pages, counts, the footer sitemap, prev/next and related links are all generated from it. Never hard-code simulation links elsewhere.
- **Must work on phone and desktop.** Test at about 375px and 1366px wide: no horizontal scrolling, touch targets at least 44px.
- **Keep accessibility:** ARIA labels on canvases, real `<button>`/`<input>` controls, reduced-motion support, visible focus.
- **Sound starts off** (the user toggles it). Keep volumes safe.
- **Deploy = push to `main`.** GitHub Pages builds from `main`, root folder. `.nojekyll` must stay (it keeps `/_template/` served).

## Where things are
| Task | File(s) |
|---|---|
| Add, rename or hide a simulation or subject; change a status/featured flag | `assets/js/catalog.js` only |
| Change colours, fonts or spacing (theme) | top of `assets/css/style.css` (CSS variables; light theme under `[data-theme='light']`) |
| Header, menus, search, footer, breadcrumbs | `assets/js/nav.js` |
| Simulation engine (sliders, loop, graph, audio, share links, fullscreen) | `assets/js/common.js` |
| Landing-page sections | `index.html` + `assets/js/main.js` |
| Subject pages / All Simulations page | `<subject>/index.html` (tiny template) + `assets/js/subject.js` |
| One simulation | `physics/<id>/sim.js` (logic) + `physics/<id>/index.html` (page + Learn text) |
| Thumbnails | `assets/img/thumbs/<id>.svg` (320×200) |

## Common tasks
- **New simulation:**
  1. Copy `/_template/` to `/<subject>/<id>/`.
  2. In its `index.html`, set `data-sim="<id>"`, update `<title>`, the meta description and the canonical/og URLs, and write the Learn section.
  3. Write the logic in `sim.js` using `SimLab.createSim({...})`. See the comments in `_template/sim.js` and the header of `assets/js/common.js`.
  4. Add one entry to `SIMULATIONS` in `catalog.js`, plus a thumbnail.
- **New subject:**
  1. Copy `physics/index.html` to `/<id>/index.html` and change `data-subject`.
  2. Add an entry to `SUBJECTS` in `catalog.js`. `status: 'coming-soon'` keeps it greyed out; `'live'` makes it clickable.
- **Mark a planned simulation live:** build its folder, then set `status: 'live'` in `catalog.js`.

## Current content
- **Physics (live):** Projectile Motion, Simple Pendulum, and the **Sound Lab** — 14 Class 7 "Sound" simulations in branch `sound`.
- **Coming-soon placeholders in `catalog.js`:** spring-mass, collisions, wave interference, planetary orbits, ray optics, electric fields.
- **Subjects Chemistry, Mathematics, Biology and Astronomy:** coming soon. Their folders exist.

## Before pushing
1. Run `node --check` on every changed `.js` file.
2. Serve locally with `python3 -m http.server 8000` and open the changed pages at phone and desktop widths. Check the browser console for errors.
3. Commit with a clear message and push to `main`.
