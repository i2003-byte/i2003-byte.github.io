# AGENTS.md — SimLab guide for AI coding agents

> Open-standard agent instructions (https://agents.md), read by Claude Code (via CLAUDE.md), Codex, Cursor, Copilot, Gemini and others.
> Human docs are in `README.md`. This file tells an agent how to work here safely, and with as few file reads as possible.

**SimLab** is a static website of interactive science simulations, live at https://i2003-byte.github.io/.
It deploys from the `main` branch via GitHub Pages. There is no build step.

## Hard rules
1. **Plain HTML, CSS and vanilla JS only.** No frameworks, npm packages, bundlers or build steps in the site. (`tools/` is dev-only and uses only Node built-ins.)
2. **Root-relative paths** (`/assets/...`). The site is served from the domain root.
3. **`assets/js/catalog.js` is the single source of truth** for subjects and simulations. Menus, search, subject pages, counts, the footer sitemap, prev/next and related links are all generated from it. Never hard-code simulation links in HTML.
4. **Phone + desktop.** No horizontal scrolling at 375px, touch targets at least 44px, and the layout must also work at 1366px.
5. **Accessibility.** Canvases get `ariaLabel`, controls are real `<button>`/`<input>`/`<select>`, respect `prefers-reduced-motion`, and keep focus visible.
6. **Sound is off until the user turns it on.** Keep volumes gentle (`gain` ≤ 0.6).
7. **Keep `README.md` in step with the site.** When simulations or subjects are added, renamed or removed, update the "What's inside" table in `README.md`: the titles, the counts per topic and the total. `tools/check.mjs` fails if a live simulation's title is missing from the README.
8. **Never edit generated files by hand:** `sitemap.xml`, `llms.txt`, `robots.txt`. Regenerate them with `node tools/check.mjs --write`.
9. **Keep `.nojekyll`.** Without it, GitHub Pages hides `/_template/`.

## Workflow (every change)
```bash
node tools/check.mjs --write   # validate everything + regenerate sitemap/llms.txt
node tools/browser-test.mjs    # optional: real-browser test at phone & desktop (needs Playwright)
git add -A && git commit -m "…" && git push origin HEAD:main
```
- `tools/check.mjs` must pass before pushing. A Claude Code hook (`.claude/settings.json`) blocks `git push` if it fails, and GitHub Actions re-runs it on every push.
- Commit messages: short imperative summary, for example `Add spring-mass simulation`.

## Where things are (open only what you need)
| Task | Edit |
|---|---|
| Add/rename/hide a simulation or subject; `status`, `featured`, `level`, tags | `assets/js/catalog.js` |
| Colours, fonts, spacing, radius, shadows | CSS variables at the top of `assets/css/style.css` (light theme under `[data-theme='light']`) |
| Header, mega-menu, drawer, search, breadcrumbs, footer | `assets/js/nav.js` |
| Simulation engine: sliders, loop, graph, audio, URL share state, fullscreen | `assets/js/common.js` (API documented in its header comment) |
| Landing page sections | `index.html` + `assets/js/main.js` |
| Subject pages + `/simulations/` | `<subject>/index.html` (8-line template) + `assets/js/subject.js` |
| One simulation's behaviour | `<subject>/<id>/sim.js` |
| One simulation's page text (Learn panel, meta tags) | `<subject>/<id>/index.html` |
| Thumbnails | `assets/img/thumbs/<id>.svg` (320×200 SVG) |
| Site name, GitHub URL, "New" badge window | `SimLab.site` at the top of `catalog.js` |

## Recipes
- **Add a simulation.** Follow the skill in `.claude/skills/add-simulation/SKILL.md`. Short version:
  1. `cp -r _template <subject>/<id>`
  2. Edit `index.html`: set `data-sim`, the `<title>`, meta and og/canonical URLs, and the Learn section.
  3. Write `sim.js` with `SimLab.createSim({...})`.
  4. Add the thumbnail SVG.
  5. Add the catalog entry (`status: 'live'`).
  6. Run `node tools/check.mjs --write`.
- **Add a subject.**
  1. `mkdir <id>`, then copy `physics/index.html` into it and change `data-subject`, `<title>` and meta.
  2. Add a `SUBJECTS` entry in `catalog.js` (`status: 'coming-soon'` until it has live simulations).
- **Make a planned simulation live:** build its folder, then flip `status` to `'live'` in `catalog.js`.
- **Retheme:** change CSS variables only. Canvas colours come from `--canvas-*` and `--sim-1..4`.

## Simulation API cheat-sheet (`SimLab.createSim(cfg)`)
- `params: [{id,label,min,max,step,value,unit,presets?,help?} | {id,label,type:'select',options:[{value,label}],value} | {id,label,type:'toggle',value}]` → read as `sim.p.<id>`, saved in the URL automatically
- `readouts: [{id,label,unit,digits,key?}]` + `readout(sim) → {id: value|string}`
- `graph: {title,yLabel,series:[{label,color?}],window?,yMin?,yMax?}` + `sample(sim) → [values]`
- `reset(sim)`, `update(sim, dt)` (fixed 1/240 s steps), `draw(sim, now)` (use `sim.ctx`, `sim.width`, `sim.height`, `sim.colors`)
- Optional:
  - `finished(sim)`, `onParam(sim,id,v) → true to keep running`, `status(sim)`
  - `buttons:[{label,onClick,primary?,full?}]`, `pointer:{down,move,up,hover}`
  - `audio:true` (then `SimLab.audio.tone/voice/noise`), `transport:false`, `autoplay:true`
  - `animate(sim) → bool`, `mobileAspect:'3 / 4'`
- Helpers: `SimLab.math` (clamp, rk4, fmt, rng…), `SimLab.vec`, `SimLab.draw` (arrow, text{fit}, grid, curve, roundRect, alpha…)

## Current content (update when it changes)
- **Physics (live):**
  - branch `mechanics`: projectile, pendulum
  - branch `sound` ("Sound Lab", Class 7): 14 simulations (vibration, sound-media, bell-jar, amplitude-loudness, frequency-pitch, oscillation-counter, vocal-cords, human-ear, who-can-hear, music-or-noise, decibel-meter, noise-pollution, water-xylophone, guitar-string)
  - branch `thermodynamics` ("Heat", Class 7): 6 simulations (hot-and-cold, thermometer, conduction, convection, radiation, sea-land-breeze)
- **Coming soon (catalog placeholders):** spring-mass, collisions, wave-interference, planetary-orbits, ray-optics, electric-fields.
- **Subjects coming soon:** chemistry, mathematics, biology, astronomy (their folders exist).

## Gotchas
- Canvases are absolutely positioned inside `.sim-canvas-wrap`, so don't let content set their size.
- Grid/flex children that scroll sideways need `min-width: 0`, or phones zoom out.
- Share-link numbers are written with `String(parseFloat(x.toFixed(d)))`. Never strip zeros with a regex (350 would become 35).
- On desktop the mega-menu opens on hover. A click right after the hover must not close it.
