# SimLab Roadmap

> The living plan for SimLab. AI agents work through it automatically; see **AGENTS.md → Roadmap workflow**.
> Humans can edit anything here at any time: reorder, delete or add items. Agents follow whatever is written.

## Audience & scope
- **Students:** Class 7–12, India (CBSE / NCERT syllabus).
- **Subjects:** Physics first, then Chemistry, Mathematics, Biology (and Astronomy where the syllabus touches it).
- **Approved new subjects** (added automatically when their topics come up): Economics, Geography, Computer Science.
- **Out of scope for now:** languages.
- **Priority:** topics that are most taught and hardest to picture in a textbook, lower classes first.
- **Style:**
  - simple English
  - Indian contexts (₹, cricket, monsoon, trains, festivals, jal tarang…)
  - SI units
  - every simulation has a Learn panel with Try-this questions
- **Copyright:** use syllabus topic names only as structure. Write all explanations in our own words; never copy textbook text or images.
- **Approval:** **auto-approve.** Any topic that is part of the Class 7–12 India syllabus may go straight into 📋 Next. Out-of-scope ideas go to 💡 Proposed for a human to decide.

## Coverage (agents: update after every run)
| Class | Physics | Chemistry | Mathematics | Biology | Geography | Economics | Computer Science |
|---|---|---|---|---|---|---|---|
| 7 | 29 (Sound 14, Heat 6, Motion 3, Electricity 3, Light 3) | 0 | 0 | 0 | 3 (Earth's motions 3) | 0 | 0 |
| 8 | 9 (Force and pressure 3, Friction 3, Natural phenomena 3) | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 13 (Motion 3, Force and laws of motion 4, Gravitation 3, Work and energy 3) | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | 2 (Light: reflection and refraction 2) | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | 2 (projectile, pendulum) | 0 | 0 | 0 | 0 | 3 (Demand and supply 3) | 3 (Numbers and logic 3) |
| 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Total live simulations: 64**

## 🔨 In progress
<!-- Format: - [~] **Class · Subject · Sub-topic**. Done: <ids>. Next: <what remains>. Started <YYYY-MM-DD>. -->
- [~] **Class 10 · Physics · Light: reflection and refraction.** Branch `optics`. Done: ray-optics (spherical mirrors), refraction-glass-slab. Next: build `lens-images` (convex and concave lens ray diagrams like ray-optics: object drag, F and 2F on both sides, the three standard rays, lens formula 1/v − 1/u = 1/f, magnification m = v/u, power P = 1/f in dioptres, image table for each object position; uses in a camera, magnifier and spectacles), then move this item to ✅ Done. Started 2026-10-02.

## 📋 Next (auto-approved; take items from the top. Each item plans ~3 simulations; each run builds 4)
- [ ] **Class 10 · Physics · Human eye and the colourful world.** Branch `optics`. Sims: eye accommodation and near/far point; myopia/hypermetropia with corrective lens; dispersion through a prism and why the sky is blue.
- [ ] **Class 10 · Physics · Electricity.** Branch `electricity`. Sims: Ohm's law V–I graph; resistors in series and parallel; heating effect and electric power bill (₹ per unit).
- [ ] **Class 10 · Physics · Magnetic effects of current.** Branch `electricity`. Sims: magnetic field lines of a bar magnet and wire; right-hand thumb rule / solenoid; electric motor and generator.
- [ ] **Class 11 · Physics · Oscillations.** Branch `mechanics`. Sims: build out the `spring-mass` placeholder (SHM); SHM as a projection of circular motion; damped and forced oscillation / resonance.
- [ ] **Class 11 · Physics · Gravitation.** Branch `mechanics`. Sims: build out the `planetary-orbits` placeholder (Kepler's laws); escape velocity launcher; satellite orbits and geostationary height.
- [ ] **Class 11 · Physics · Waves.** Branch `waves`. Sims: transverse vs longitudinal waves; standing waves on a string (harmonics); beats and the Doppler effect.
- [ ] **Class 12 · Physics · Electric charges and fields.** Branch `electricity`. Sims: build out the `electric-fields` placeholder (field lines); Coulomb's law explorer; electric dipole in a uniform field.
- [ ] **Class 12 · Physics · Wave optics.** Branch `optics`. Sims: build out the `wave-interference` placeholder; Young's double-slit fringes; single-slit diffraction.
- [ ] **Class 7 · Chemistry · Acids, bases and salts.** Subject `chemistry` (make the subject live on first use). Sims: natural indicators (turmeric, litmus, china rose); neutralisation titration; pH scale of everyday substances.
- [ ] **Class 9 · Chemistry · Matter in our surroundings.** Subject `chemistry`. Sims: particles in solids, liquids and gases; evaporation and cooling vs temperature, humidity and wind; change of state heating curve.
- [ ] **Class 7 · Mathematics · Lines, angles and triangles.** Subject `mathematics` (make it live on first use). Sims: angle pairs with parallel lines; angle sum of a triangle; Pythagoras by rearrangement.

## 💡 Proposed (needs a human decision; only for ideas outside the Class 7–12 India syllabus)
_None yet._

## 🧩 Capabilities (site features beyond new simulations; the weekly maintenance run builds ONE per week, from the top)
<!-- Format: - [ ] **Name.** What it adds and why. Touches: <files>. Auto-approved: additive, opt-in or per-page, no outside services, no data collection. Anything else goes to 💡 Proposed. -->
- [ ] **Check your understanding.** 3–4 multiple-choice questions at the end of each Learn panel with instant feedback and a short explanation; questions live in the page HTML, a small shared script in `common.js` handles them. Start with the 10 most-visited-looking simulations (featured ones), then the daily builder adds questions to every new simulation. Touches: `common.js`, `style.css`, `_template/index.html`, add-simulation skill.
- [ ] **Printable worksheet.** A "🖨 Print worksheet" button that prints the Learn panel, the current canvas picture, the readouts and blank answer lines (print stylesheet only, nothing new to maintain per page). Touches: `common.js`, `style.css`.
- [ ] **Embed for teachers.** "Embed" in the share menu gives an `<iframe>` code; `?embed=1` hides the header, footer and Learn panel so the simulation fits a school website or slide. Touches: `common.js`, `nav.js`, `style.css`.
- [ ] **Works offline.** A service worker that caches pages already visited, so a simulation opened once still works in a classroom with no internet. Network first for HTML so updates still arrive. Touches: new `sw.js`, `nav.js`, check.mjs (cache list sanity).
- [ ] **Keyboard shortcuts.** Space = play/pause, R = reset, F = fullscreen, ? = shortcut help; ignored while typing in a field. Touches: `common.js`.
- [ ] **Search and filter by class.** Class 7–12 chips on `/simulations/` and in search results, using each simulation's `level`. Touches: `subject.js`, `nav.js`.
- [ ] **Teacher guide per subject.** One page per subject listing simulations by class and chapter with a one-line classroom activity each, generated from the catalog. Touches: `subject.js`, new section on subject pages.
- [ ] **Accessibility pass.** Text alternative for each canvas state (live region describing key readouts), larger-text check at 200 % zoom, colour-blind-safe check of `--sim-1..4`. Touches: `common.js`, `style.css`.

## ✅ Done
- [x] **Class 9 · Physics · Work, energy and power.** 3 sims: work-done, energy-roller-coaster, power-race. Done 2026-10-02.
- [x] **Class 9 · Physics · Gravitation.** 3 sims: universal-gravitation, free-fall-planets, buoyancy-archimedes. Done 2026-10-01.
- [x] **Class 9 · Physics · Force and laws of motion.** 4 sims: inertia-coin-card, newtons-second-law, balloon-rocket, collisions. Done 2026-10-01.
- [x] **Class 9 · Physics · Motion.** 3 sims: distance-displacement, velocity-time-graph, circular-motion. Done 2026-09-30.
- [x] **Class 11 · Computer Science · Numbers and logic.** 3 sims: binary-counter, logic-gates, sorting-race. Done 2026-09-30.
- [x] **Class 11 · Economics · Demand and supply.** 3 sims: demand-curve, supply-equilibrium, price-controls. Done 2026-09-30.
- [x] **Class 7 · Geography · Earth's motions.** 3 sims: day-night-india, seasons-revolution, time-zones. Done 2026-09-29.
- [x] **Class 8 · Physics · Friction.** 3 sims: friction-surfaces, rolling-vs-sliding, ball-bearings-lubricants. Done 2026-09-29.
- [x] **Class 8 · Physics · Some natural phenomena.** 3 sims: charging-by-rubbing, electroscope, lightning-conductor. Done 2026-09-29.
- [x] **Class 7 · Physics · Sound (Sound Lab).** 14 sims: vibration, sound-media, bell-jar, amplitude-loudness, frequency-pitch, oscillation-counter, vocal-cords, human-ear, who-can-hear, music-or-noise, decibel-meter, noise-pollution, water-xylophone, guitar-string. Done 2026-09-25.
- [x] **Class 7 · Physics · Heat.** 6 sims: hot-and-cold, thermometer, conduction, convection, radiation, sea-land-breeze. Done 2026-09-27.
- [x] **Class 7 · Physics · Motion and time.** 3 sims: speed-race, distance-time-graph, pendulum-clock. Done 2026-09-27.
- [x] **Class 7 · Physics · Light.** 3 sims: pinhole-camera, plane-mirror, newtons-disc. Done 2026-09-28.
- [x] **Class 8 · Physics · Force and pressure.** 3 sims: pressure-area, balanced-forces, liquid-pressure. Done 2026-09-28.
- [x] **Class 7 · Physics · Electric current and its effects.** 3 sims: electric-circuit, heating-fuse, electromagnet. Done 2026-09-27.
- [x] **Class 11 · Physics · Kinematics and oscillation basics.** 2 sims: projectile, pendulum. Done 2026-09-25.
