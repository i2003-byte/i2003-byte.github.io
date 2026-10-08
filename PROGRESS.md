# SimLab Progress Log

> Every session that changes the site (human-requested, scheduled routine or bug fix) adds an entry at the **top** of the log.
> The next session reads the latest entries first, to know exactly where work stopped.
> Keep each entry short. Keep only the latest ~30 entries (delete older ones; git history keeps them).

<!-- Entry template:
## YYYY-MM-DD HH:MM IST · <kind: routine | maintenance | request | fix> · <roadmap item or task>
- Built/changed: <simulation ids or files>
- Checks: ✅ check.mjs passed · ✅/⏭ browser-test
- Roadmap: <item> → Done | still In progress
- Next time: <what remains, or "take next item from 📋 Next">
- Problems/notes: <anything the next session must know, or "none">
-->

## 2026-10-08 · fix · Phone simulation pages start with the simulation
- Built/changed: `style.css` (≤ 767px): simulation pages hide the breadcrumbs, badges and description (the Learn panel and the menu cover them), the title is one compact line (2 at most) and Fullscreen / Share / Sound become 44px icon buttons beside it. The picture, key numbers, tabs and the first control now fit the first screen
- Checks: ✅ check.mjs passed · ✅ browser-test (sample pages, phone + desktop) · screenshots at 412×915
- Roadmap: unchanged
- Next time: nothing extra
- Problems/notes: from the owner's phone screenshot of the double-slit page

## 2026-10-08 · request · Original home hero restored
- Built/changed: removed the tap-to-throw ball experiment from the home hero (the owner preferred the original); the original hero is back (moving dots, headline, Start Exploring, Surprise Me, stats strip). "Start Exploring" now jumps to the Tap & play cards. Tap & play row, class chips and compact subject tiles stay
- Checks: ✅ check.mjs passed · ✅ browser-test (home + sample pages, phone + desktop) · phone screenshot reviewed
- Roadmap: unchanged
- Next time: don't put interactive experiments behind the hero text; the owner wants the hero clean
- Problems/notes: none

## 2026-10-08 · fix · Home hero on real phones (reduce motion, larger text)
- Built/changed: `main.js`: with reduce-motion on, a ball the visitor throws still flies and fades (before: dashed still paths piled up over the text); the demo throw and background drift stay off. `style.css`: the hero experiment bar is now in normal flow under the buttons, so larger phone text can't overlap them. `common.js`: links ending in `#play` start the simulation even with reduce-motion (the visitor asked by tapping)
- Checks: ✅ check.mjs passed · ✅ browser-test (home + sample sims, phone + desktop) · screenshots at 390×844 with reduce-motion and 122% text
- Roadmap: unchanged
- Next time: nothing extra
- Problems/notes: found from the owner's phone screenshot

## 2026-10-08 · request · Phone app layout for simulations + exciting home page
- Built/changed:
  - every simulation on phones/tablets (`common.js`, `style.css`): picture + key-number chips + tab bar pinned at the top; tabs Controls · Numbers · Graph · Try this (challenges from each page's try-list, one at a time); big start button on the picture; tap picture to play/pause; slider −/+ buttons with hold-to-repeat; site header scrolls away; sideways-phone layout. Desktop keeps its layout (plus the start button and a Try-this panel)
  - home page: hero is a live experiment (tap to throw a ball; Earth / Moon / Jupiter gravity with real heights, distances and times); "Tap & play" row of big cards whose links end in `#play` so the simulation starts running at once; "I'm in Class 7–12" chips; compact subject tiles on phones; removed the Featured and Browse-by-level sections; fixed the old "Physics is open now" text
  - harness: `check.mjs` now requires a try-list (≥ 2) and `key: true` readouts on every live sim and warns on bad `SimLab.site.showcase` ids; `browser-test.mjs` opens every phone tab; AGENTS.md cheat-sheet, Where things are and Gotchas; add-simulation, roadmap-run and site-maintenance skills; README features
- Checks: ✅ check.mjs passed · ✅ browser-test (all pages, phone + desktop) · screenshots reviewed: phone 390×844 and 360×640, sideways 844×390, desktop 1366
- Roadmap: unchanged
- Next time: build as usual; new sims need 3–5 do-able Try-this challenges and key readouts (with `short` labels when long)
- Problems/notes: the Moon throw is meant to fly off the top of the screen (77 m); it lands after about 12 s on screen

## 2026-10-07 · routine · Class 12 Wave optics (finished) + Class 7 Chemistry: Acids, bases and salts (started)
- Built/changed: `youngs-double-slit` (lamp → S → S₁/S₂ drawing with moving wavefronts and the path-difference segment; to-scale screen strip in mm with true colours and a brightness graph; drag P; λ presets, d, D; white light; cover S₁; slit width 0.05/0.1 mm adds the diffraction envelope and missing orders); `single-slit-diffraction` (plane waves through one slit, wavelets drawn brighter where more light goes; edge path difference; central band 2λD/a; faint bands ×10; compare with two slits d = 4a; white light); `natural-indicators` (8 everyday solutions, blue/red litmus and turmeric paper strips, china rose drops; record dots per tube; the sim says what the combined results prove; mystery bottles); `neutralisation` (burette of NaOH into 10 mL HCl or the reverse; phenolphthalein/china rose/turmeric; drop/1 mL buttons and a tap; auto-close at the colour change; thermometer, salt formed, pH bar and pH-vs-volume graph). Chemistry made live with new branch `acids-bases`; chemistry page meta updated. Catalog, 4 thumbnails, README, AGENTS updated. Added 2 items to 📋 Next (Class 9 Maths statistics and probability, Class 7 Geography weather and climate).
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /chemistry/ and /, phone + desktop) · combined canvas screenshots at 375px and 1366px in dark and light reviewed (fixed the flask label hitting the burette on phones, a clipped "brightness ×10" label, faint probe line and burette liquid in light theme) · numbers checked in the browser: β = 3.00 mm at 600 nm/0.3 mm/1.5 m with 600 nm = 1.00 λ at the first bright fringe; single slit first dark ±9.00 mm, 4.5 % at 1.5 λ; titration auto-stops at 10.05 mL, pH 11.4, 33.8 °C, 584 mg salt; lemon juice + blue litmus → red, "acidic"
- Roadmap: Class 12 Wave optics → Done; Class 7 Chemistry: Acids, bases and salts → 🔨 In progress (2 of 3 done)
- Next time: build `ph-scale` (see the Next note in ROADMAP) to finish the chemistry item, then take Class 9 Chemistry: Matter in our surroundings
- Problems/notes: feedback: no open issues. Neutralisation uses 1 mol/L solutions so the warming is visible; heat loss is ignored and china rose colours are a simple model (both stated in Learn). Wave-optics drawings are not to scale; the screen strips are (stated on the canvas and in Learn)

## 2026-10-06 · routine · Class 12 Electric charges and fields (finished) + Class 12 Wave optics (started)
- Built/changed: `coulombs-law` (two charges on a ruler, drag q₂ to change r; equal and opposite force arrows to scale; |F| vs r graph with the 2r → F/4 marker; vacuum/kerosene/glass/water; three-charge mode with draggable q₃ and the vector sum as a parallelogram); `electric-fields` (placeholder built out: six layouts, draggable charges, add/remove charges, field lines traced from + (and in from far away onto −), arrow-grid view, dashed equipotentials by marching squares, test point with E, direction, V and force on 1 nC); `electric-dipole` (pivoted dipole between charged plates, RK4 swing with I = 2ma², ±qE forces, torque arc, θ graph, U(θ) curve with stable/unstable labels, drag an end to set the angle); `wave-interference` (placeholder built out: two-source ripple tank rendered per cell, moving ripples or time-averaged energy, bright/calm lines, in-step or opposite-step dippers, path-difference probe, exact intensity on a screen strip, β ≈ λD/d). Catalog (2 placeholders replaced, 2 new entries), 2 new thumbnails, README, AGENTS updated.
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /, /physics/, /simulations/, phone + desktop) · combined screenshots at 375px and 1366px in light and dark reviewed (fixed the dipole's U-curve dot being upside down, overlapping τ/p/force labels, the interference probe sitting off the centre line, small Coulomb arrows) · numbers checked in the browser: 2 μC and −3 μC at 10 cm = 5.40 N (1.35 N at 20 cm); three-charge net 5.09 N = 2 × 3.60 cos 45°; 10 nC at 5.5 cm = 29.7 kN/C and 1.64 kV; dipole p = 8 × 10⁻¹⁰ C·m, τ(60°) = 34.6 μN·m, T = 0.89 s; d = 3λ gives 7 bright / 6 calm lines
- Roadmap: Class 12 Electric charges and fields → Done; Class 12 Wave optics → 🔨 In progress (wave-interference done)
- Next time: finish Class 12 Wave optics: `youngs-double-slit` and `single-slit-diffraction` in branch `optics` (see the Next note in ROADMAP), then take the next 📋 Next item (Class 7 Chemistry: Acids, bases and salts, which makes Chemistry live)
- Problems/notes: feedback: no open issues. `wave-interference` stays in branch `waves` (its catalog placeholder was there); its ripples are slowed down and the tank has no reflections (stated in Learn). Glass is given as K ≈ 6 (real glass 4–10, stated in Learn)

## 2026-10-05 · routine · Class 11 Waves (finished)
- Built/changed: `wave-types` (one vibrator drives a transverse row of beads and a longitudinal row of coils; wave front advances at v; crests/troughs and C/R labels; λ bracket; tap to mark a particle, its displacement graph); `standing-waves` (Melde-style string over a pulley with a hanging mass, v = √(T/μ); exact damped steady-state shape; nodes/antinodes at harmonics; amplitude-vs-frequency curve with peaks at nf₁; harmonic buttons; optional sound); `beats` (two forks 200–300 Hz; 25 ms window keeping fork A still so B slides in/out of step; loudness envelope over 1/3/6 s; meter; real audio beats with sound on); `doppler-effect` (siren driving past a listener in still air; wavefronts every 0.1 s; heard frequency from the retarded-time solution, graphed vs time; ahead/behind formula readouts; tap to move the listener; presets ambulance to jet). Catalog, 4 thumbnails, README (new Waves row), AGENTS (also removed the stale placeholder list) updated.
- Checks: ✅ check.mjs passed · ✅ browser-test (4 pages, phone + desktop) · combined screenshot at 375px and 1366px after pressing Play reviewed (fixed overlapping labels on standing-waves, beats and doppler-effect) · numbers checked in the browser: f₁ = 49.5 Hz at 1 kg/1 g/m/1 m; 4 kg makes 99 Hz the fundamental; beats 4 Hz/0.25 s; Doppler 540/466 Hz at 25 m/s and 1889/288 Hz at 250 m/s
- Roadmap: Class 11 Waves → Done (4 sims, Doppler split from beats)
- Next time: take the next 📋 Next item: Class 12 · Physics · Electric charges and fields (build out the `electric-fields` placeholder first)
- Problems/notes: feedback: no open issues. Standing-wave motion is drawn slowed down with the sideways size enlarged, and Doppler circles are one per 0.1 s (both stated in Learn)

## 2026-10-04 · routine · Class 11 Oscillations (finished) + Class 11 Gravitation
- Built/changed: `resonance` (motor shakes the top of a spring; RK4 driven damped oscillator; steady amplitude measured per drive cycle and added to an amplitude–frequency plot beside the formula curve; phase lag; jump-to-resonance button; light/medium/heavy damping); `planetary-orbits` (placeholder built out: Newtonian orbit in AU/years with exact dashed conic, star at a focus, empty focus and axes, 12 equal-time sectors with measured area vs πab/12, T²/a³, Earth/Mercury/Mars/Halley starts, escape above 42.1 km/s); `escape-velocity` (radial launch from Earth/Moon/Mars/Jupiter, auto zoom, highest point from energy, KE/PE/total bars per kg, flight-time graph); `satellite-orbits` (view from above the North Pole, turning Earth with India's longitude marked, circular orbit at any height, ISS/GPS/geostationary presets and comparison orbit, drift per day, line of sight). Catalog (placeholder replaced), 4 thumbnails, README, AGENTS updated.
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /, /physics/, /simulations/, phone + desktop) · combined screenshots at 375px and 1366px reviewed (fixed overlapping labels, a clipped phone header, the planet name and the India shape) · numbers checked in the browser: sector area = πab/12 to 4 decimals, Halley T = 74.8 yr and T²/a³ = 1.000, resonance measured amplitude = formula (2.57 cm at 0.8 Hz), geostationary T = 23 h 56 min with 0° drift, Jupiter escape run conserves energy
- Roadmap: Class 11 Oscillations → Done; Class 11 Gravitation → Done
- Next time: take the next 📋 Next item: Class 11 · Physics · Waves (branch `waves` already exists in catalog.js)
- Problems/notes: feedback: no open issues. Satellites are drawn in the equatorial plane only (the India marker sits on the equator at India's longitude; stated in Learn). Escape speeds ignore air and planet spin (stated in Learn)

## 2026-10-04 · maintenance · Weekly health check + Class filter
- Built/changed: phone layouts fixed where the pinned, height-capped canvas squeezed the drawing: `buoyancy-archimedes` (force bars beside the scene unless the canvas is tall), `liquid-pressure` (one line per hole on short canvases), `day-night-india` (city names fit the rows), `eye-defects` (caption no longer under the message), `speed-race` (start prompt only when there is room), `time-zones` (New Delhi label moves below its pin when a nearby city is chosen). README "Share link" wording. Roadmap 📋 Next refilled to 9 (Class 12 Current electricity, Class 11 Kinetic theory of gases).
- Capability: **Class filter** on subject pages and All Simulations (Class 7–12 from `class N` catalog tags, `?class=9` in the URL). Added `class 11` to projectile and pendulum; `check.mjs` now requires a class tag on live sims; add-simulation skill and AGENTS recipe updated.
- Checks: ✅ check.mjs passed · ✅ browser-test all 89 pages, phone + desktop (before and after the capability) · canvas contact sheet of all 76 sims at 375px plus 8 page screenshots (top and scrolled) reviewed · science spot-check: solenoid-field loop field matches μ₀I/2r at the centre and μ₀Ia²/2(a²+z²)^3/2 on the axis exactly; spring-mass T = 2π√(m/k); motor-generator 3000 rpm = 50 Hz
- Harness: settings.json valid with generic attribution · pre-push hook exits 2 with a model name in a file, 0 without · referenced files exist · skills agree (4 sims per run) · CI "Site check" green on main · daily runs present (10-02, 10-03)
- Feedback: no open issues
- Lessons: Gotchas line on the short, wide phone canvas (choose layouts by height too); add-simulation skill no longer implies `mobileAspect` gives a tall phone canvas
- Roadmap: 🔨 Class 11 Oscillations (started 10-03) not stuck; next is `resonance`
- Next time: small phone nits seen but not fixed: distance-displacement header banner clipped at the edges, velocity-time-graph area formula clipped on the right, sorting-race legend ends; liquid-pressure landing letters slightly cut at the bottom on desktop
- Problems/notes: none

## 2026-10-03 · routine · Class 10 Magnetic effects of current (finished) + Class 11 Oscillations (started)
- Built/changed: `solenoid-field` (cut-away view of a circular loop or solenoid; exact 3-D field of every turn from elliptic integrals, checked against a numerical Biot–Savart sum; N/S ends by the clock rule; draggable compass; centre B vs μ₀NI/2r or μ₀nI); `motor-generator` (end-on coil between magnets: DC motor with back emf and split ring, AC generator with slip rings, DC generator with split ring; F = BIl and velocity arrows, side view of rings and brushes, meter and bulb; 50× slow motion, graph in real ms, 3000 rpm = 50 Hz); `spring-mass` (placeholder built out: horizontal spring on a smooth table, Hooke's law, T = 2π√(m/k), measured period, energy bars, damping, drag the block); `shm-circular` (reference circle, shadow on the diameter, block on a spring in step, paper-strip trace, x/A, v/Aω, a/Aω² graph). Catalog, thumbnails (new spring-mass thumb), README, AGENTS updated.
- Checks: ✅ check.mjs passed · ✅ browser-test (4 pages, phone + desktop) · combined screenshots reviewed at 375px, 360×640 and 1366px, light and dark (fixed: phone horizontal scroll from long graph legend, hidden circuit panel on phones, label clashes)
- Roadmap: Class 10 Magnetic effects of current → Done; Class 11 Oscillations → In progress (2 of 3)
- Next time: finish Oscillations with `resonance` (damped and forced oscillation), then Class 11 Gravitation (build out `planetary-orbits`)
- Problems/notes: feedback: no open issues. Motor no-load speed is set by back emf (≈ proportional to V; a stronger magnet gives more starting torque but a lower top speed), explained in Learn. On 640px-tall phones the shm-circular paper strip is hidden (not enough height)

## 2026-10-03 · fix · Phone experience: simulation stays in view
- Built/changed: `style.css` + `common.js` (all simulations at once): on phones and tablets the canvas is pinned under the header while controls, readouts and buttons scroll beneath it, so every slider change is seen live; small Play/Pause + Restart buttons beside the status line; canvas height capped at 46% of the screen at full width; compact title on phones (2-line description, no repeated breadcrumb); keyboard tips hidden on touch screens; "Copy share link" → "Share link" so the buttons fit one row. Desktop layout unchanged.
- Checks: ✅ check.mjs passed · ✅ browser-test (all pages, phone + desktop); screenshots reviewed at 390×844 and 360×640 (projectile, guitar-string, sorting-race, demand-curve) and 1366 desktop
- Roadmap: unchanged
- Next time: weekly maintenance should look at the phone screenshots while scrolled to the controls (canvas pinned)
- Problems/notes: the sorting-race legend line is a little clipped at its ends on narrow phones (sim-specific, small)

## 2026-10-03 · routine · Class 10 Electricity (finished) + Magnetic effects of current (started)
- Built/changed: `ohms-law` (record V–I readings for nichrome/constantan/manganin, least-squares line through O gives R; R = ρL/A with length and thickness; non-Ohmic torch bulb that burns out above 3.8 V); `series-parallel` (2 or 3 resistors, moving charges with speed ∝ current, V and I for each, break R₂); `power-bill` (7 home appliances × hours a day, meter runs a month, units and ₹ per appliance, LED vs 60 W bulbs); `magnetic-field-lines` (traced field lines for one bar magnet, attracting and repelling pairs with neutral point, straight wire with circles every 5 μT, iron filings, draggable compass). Catalog, thumbnails, README, AGENTS updated.
- Checks: ✅ check.mjs passed · ✅ browser-test (4 pages, phone + desktop) · combined screenshots of 15 states reviewed at 375px and 1366px (fixed graph caption overlap, series layout, cut-off footnotes)
- Roadmap: Class 10 Electricity → Done; Class 10 Magnetic effects of current → In progress (1 of 3)
- Next time: finish Magnetic effects of current (solenoid field, motor and generator), then Class 11 Oscillations
- Problems/notes: feedback: no open issues. Power bill uses one flat ₹/unit rate (slabs mentioned in Learn). Bar magnets are modelled as two poles; Earth's field ignored (stated in Learn)

## 2026-10-02 · routine · Class 10 Light (finished) + Human eye and the colourful world
- Built/changed: `lens-images` (convex/concave lens ray diagrams, lens formula, m = v/u, power in D, uses for each object position); `eye-accommodation` (reduced eye, ciliary muscles, near point, ages); `eye-defects` (myopia/hypermetropia with concave/convex glasses, power in D); `prism-dispersion` (exact Snell ray trace through a prism for 7 colours, Newton's second prism, plus a sky mode for Rayleigh scattering and red sunsets). Catalog, thumbnails, README, AGENTS updated.
- Checks: ✅ check.mjs passed · ✅ browser-test (4 pages, phone + desktop) · combined screenshot reviewed at 375px and 1366px
- Roadmap: Class 10 Light: reflection and refraction → Done; Class 10 Human eye and the colourful world → Done
- Next time: take the next 📋 Next item: Class 10 · Physics · Electricity (Ohm's law, series/parallel, power bill)
- Problems/notes: eye sims draw the ray spread at the retina 3× larger so the blur is visible (stated in the Learn panels); prism "exaggerate" (on by default) multiplies the index difference by 4

## 2026-10-02 · request · Weekly harness health check
- Built/changed: `site-maintenance` step 4b (settings valid, pre-push hook still blocks a bad push, referenced files exist, skills agree, CI green, daily runs happening, AGENTS.md stays short); AGENTS.md roadmap note and a Gotcha (tags cannot be pushed; use a branch)
- Checks: ✅ check.mjs passed · harness tested by hand: hook exit 2 on a bad file and 0 otherwise, settings valid, all references exist, CI and Pages green
- Roadmap: unchanged
- Next time: weekly run follows step 4b
- Problems/notes: none

## 2026-10-02 · request · Capabilities chosen weekly, no fixed list
- Built/changed: removed the starter list from `ROADMAP.md` → 🧩 Capabilities (now a log of done/skipped ideas); `site-maintenance` step 5b picks one idea fresh each week and skips anything costly, disruptive or platform-heavy (adding none is fine); AGENTS.md note updated
- Checks: ✅ check.mjs passed
- Roadmap: unchanged for simulations
- Next time: weekly run follows the new step 5b
- Problems/notes: none

## 2026-10-02 · request · Weekly capabilities
- Built/changed: new 🧩 Capabilities list in `ROADMAP.md` (8 starter ideas: quizzes, printable worksheet, embed, offline, keyboard shortcuts, class filter, teacher guide, accessibility pass); `site-maintenance` skill step 5b (after a fully green maintenance, build ONE capability per week, separate commit, all-pages browser test, drop it if it fails); AGENTS.md roadmap workflow note. Branch `before-capabilities` keeps the site exactly as it was just before this (download: /archive/refs/heads/before-capabilities.zip).
- Checks: ✅ check.mjs passed
- Roadmap: unchanged for simulations
- Next time: daily runs as usual (they never take capability items); the next weekly run builds "Check your understanding"
- Problems/notes: capabilities with outside services, tracking, data collection, accounts, ads, redesigns or removals go to 💡 Proposed for a human

## 2026-10-02 · routine · Class 9 · Physics · Work, energy and power (finished) + Class 10 · Light: reflection and refraction (part 1)
- Built/changed: `physics/energy-roller-coaster` (cart released from 5–40 m on a track with an 18 m hump; arc-length dynamics with speed corrected from the energy total; PE / KE / heat / total bars and graph, no / low / high friction, "start height" and "highest it can now reach" lines, cart settles in a valley with friction), `physics/power-race` (walker, runner and motor lift raise the same mass the same height; W = m g h, P = W ÷ t bars, work–time graph whose slope is power, hp, and a 1 h/day × 30 days kWh and ₹ bill line), `physics/ray-optics` (built out the placeholder as "Spherical Mirrors: Ray Diagrams": concave/convex, drag the object, P/F/C, three standard rays plus optional pole ray, mirror formula with New Cartesian signs, nature and position of the image, buttons for each textbook object position), `physics/refraction-glass-slab` (water / acrylic / crown glass / dense flint / diamond slab, drag the ray, i, r, e arcs, lateral shift, speed c ÷ n, record readings onto a sin i vs sin r chart whose slope is n); 3 new thumbnails and a new mirror thumbnail for ray-optics, catalog, README, AGENTS, ROADMAP. `common.js`: graph series can now use any CSS colour variable (e.g. `--danger`), not only `--sim-1..4`
- Feedback: no open issues
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages at phone + desktop); combined canvas screenshots in both themes, with Play pressed and readings recorded, reviewed: fixed the drag hint colliding with the F/C labels (mirrors), the slab name under the r label and the d label on top of the e label (slab), the chart hint over the axis label, and the hump label under the speed label (roller coaster)
- Roadmap: Work, energy and power → Done · Light: reflection and refraction → In progress (2 of 3)
- Next time: build `lens-images` (see the item's Next note) to finish Light: reflection and refraction, then start Class 10 · Physics · Human eye and the colourful world with the remaining 3 simulations
- Problems/notes: mirror rays bend at the pole line and heights are stretched (stated, as in textbooks). The roller coaster keeps the cart on the rails and uses μ g cos α friction (stated). The power race treats the motor as 100% efficient (stated). 📋 Next has 11 items, so no roadmap evolution needed.

## 2026-10-01 · routine · Class 9 · Physics · Gravitation (finished) + Work, energy and power (part 1)
- Built/changed: `physics/universal-gravitation` (five real pairs: two students, two trucks, Earth and an apple, Earth and Moon, Sun and Earth; ×0.5–4 sliders for m₁, m₂ and r, drag the second body; F = G m₁ m₂ ÷ r² in scientific notation, equal and opposite F arrows, accelerations F ÷ m of each body, "same as the weight of" readout, F vs r inverse-square chart with ÷4/÷9/÷16 marks and the real-mass curve in grey), `physics/free-fall-planets` (heavy iron ball of mass m and a 10 g marble dropped together on the Moon, Mars, the Earth and Jupiter, g from G M ÷ R², strobe ghosts every 0.25 s, landing times, v–t graph for all four, spring-balance box per lane showing W = m g with the same mass), `physics/buoyancy-archimedes` (200 cm³ block of iron / aluminium / PVC / ice / teak on a spring balance lowered into an overflow can of water / sea water / kerosene / glycerine / mercury; displaced liquid in a measuring cylinder, bars for weight in air, balance reading, upthrust and weight of liquid displaced; floating with a slack string, "let go" to sink or float), `physics/work-done` (box moved at 1 m/s with one force F at angle θ, F cos θ and F sin θ parts, positive / zero / negative work, F cos θ–distance chart with the work area shaded, four situation buttons including the porter and friction); thumbnails, catalog, README, AGENTS, ROADMAP
- Feedback: no open issues
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages at phone + desktop); combined canvas screenshots (both themes) reviewed: fixed overlapping body names and force labels when bodies are close and a cut-off chart caption on phones (gravitation), a JS error from a theme fix that stopped the free-fall lanes from running (caught by pressing Play in the screenshot script, not by browser-test), Moon text unreadable in the light theme and the mass label touching the g label (free fall), a wide gap before the force bars on desktop (buoyancy), force arrows hidden behind the box and labels colliding at obtuse angles (work)
- Roadmap: Gravitation → Done · Work, energy and power → In progress (1 of 3)
- Next time: build `energy-roller-coaster` and `power-race` (see the item's Next note), finish Work, energy and power, then start Class 10 · Physics · Light: reflection and refraction (begin with the `ray-optics` placeholder) with the remaining 2 simulations
- Problems/notes: free fall ignores air (stated); Jupiter's lane uses g at the equatorial cloud tops. Buoyancy shows the liquid displaced at this moment rather than keeping overflow when the block is raised (stated). The work sim moves the box kinematically and only counts the work of the one force (stated). browser-test does not press Play, so a bug inside `update` can pass it; pressing Play in a screenshot check is worth doing. 📋 Next has 12 items, so no roadmap evolution needed.

## 2026-10-01 · request · Visitor feedback via GitHub Issues
- Built/changed:
  - feedback box ("💬 How was this simulation?") on every simulation page
  - `feedback.md` issue template
  - `FEEDBACK.md` log
  - `.claude/skills/feedback-triage`, wired into roadmap-run (step 1) and site-maintenance
  - AGENTS.md rule
- Checks: ✅ check.mjs passed · ✅ browser-test
- Roadmap: unchanged
- Next time: each run starts by triaging new issues (valid ideas go near the top of 📋 Next), then builds as usual
- Problems/notes: runs can read issues but cannot close them; FEEDBACK.md records what is handled

## 2026-10-01 · routine · Class 9 · Physics · Force and laws of motion (finished)
- Built/changed: `physics/inertia-coin-card` (side view of a card on a glass with a ₹5 coin, eraser or plastic counter stacked 1–5 high; the flick sends the card off at v, friction can give the object at most μg; slips, rides along or drops in, decided by v t − ½μg t² = L/2 and the glass mouth; slow motion ×10/×30, real-time clock, card vs coin speed graph in ms, √(μgL) threshold readout), `physics/newtons-second-law` (cart + 0–5 kg of bricks pulled by a spring balance, air track / smooth / rough floor with static check, a = (F − f) ÷ m headline, ticker tape with a dot every 0.2 s and the previous run's tape faded underneath, v–t graph, momentum readout), `physics/balloon-rocket` (balloon on a straw and 5 m string, thrust = ṁu with ṁ = ρAu, three nozzle sizes, 1–6 L of air, air drag and string friction or ideal mode; equal and opposite action/reaction arrows, momentum bars and graph of balloon vs air thrown back, equal in ideal mode), `physics/collisions` (built out the placeholder: two carts with masses, velocities and e = 1 / 0.5 / 0 (Velcro), momentum and KE before/after bars, impulse flash, five preset buttons); 3 new thumbnails (collisions kept its existing one), catalog, README, AGENTS, ROADMAP
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /physics/ + / at phone + desktop); combined canvas screenshots reviewed: fixed overlapping action/reaction labels and the footnote over the momentum label (balloon), cart labels too wide for small carts, bar totals running off the right edge and two speed labels on stuck carts (collisions), and a cut-off subtitle on phones (inertia)
- Roadmap: Force and laws of motion → Done
- Next time: take the next 📋 Next item, Class 9 · Physics · Gravitation (3 sims), then start Class 9 · Physics · Work, energy and power with the remaining simulation
- Problems/notes: balloon numbers are a teaching model (exhaust 30 m/s, 1.2 g of air per litre, sphere drag, fixed string friction), stated in its Learn panel; the balloon is drawn larger than scale. The inertia flick is treated as instant with one μ for sliding and gripping (stated). 📋 Next has 14 items, so no roadmap evolution needed.

## 2026-09-30 · routine · Class 11 · Computer Science · Numbers and logic (finished) + Class 9 · Physics · Motion (finished)
- Built/changed: `computer-science/sorting-race` (bubble with early exit, selection and merge sort replay recorded compare/swap/write operations on the same array, one step per tick for every lane; 8–64 bars; shuffled / nearly sorted / reversed; compare, move and final-place colours, merge band, finishing places, comparisons graph, n(n − 1)/2 and n log₂ n readouts), `physics/distance-displacement` (top-view map, five paths plus draw-your-own by tapping, walked path vs start→walker arrow, compass direction, average speed vs average velocity, distance and displacement graph in real walking time), `physics/velocity-time-graph` (speed up / cruise / brake plan, car on a road above a v–t graph with the area shaded as trapezium + rectangle + triangle, slope labels, area working, metro / signal / uniform / emergency-stop presets), `physics/circular-motion` (stone on a string, v = 2πr ÷ T, tangent velocity arrow, 8 fixed arrows, vₓ/vᵧ/speed graph, optional v²/r arrow, cut the string to fly off along the tangent); thumbnails, catalog, README, AGENTS, ROADMAP
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /physics/ + /computer-science/ + / at phone + desktop); combined canvas screenshots reviewed: fixed the v–t working line overlapping the time-axis label, 0.5 s ticks shown as "0 1 1 2", the Start label on the map scale bar, bar numbers touching the progress bar, lane headers colliding with the counts on phones, and highlights left on bars after a lane finished
- Roadmap: Numbers and logic → Done · Motion → Done
- Next time: take the next 📋 Next item, Class 9 · Physics · Force and laws of motion (4 sims including the `collisions` placeholder), which fills the whole run
- Problems/notes: the walk and drive animations are sped up to about 10–12 s on screen while clocks and graphs use real time (stated in both Learn panels). Sorting counts each compare, swap or write as one equal step (stated). 📋 Next has 15 items, so no roadmap evolution needed.

## 2026-09-30 · routine · Class 11 · Economics · Demand and supply (finished) + Class 11 · Computer Science · Numbers and logic (part 1)
- Built/changed: new subject `computer-science` (💻, red, branches data / logic / algorithms) with subject page; `economics/supply-equilibrium` (mango market Qd = 400 − 2P, Qs = 3P − 50 with cost, cyclone/bumper-crop and festival shifters, ghost curves, shortage/surplus band, Play runs price adjustment dP/dt = 0.12 (Qd − Qs) with a price-over-time graph, drag the price line, market report), `economics/price-controls` (wheat market Qd = 520 − 10P, Qs = 20P − 140, P* = ₹22; price ceiling with black-market price or ration-shop stock, MSP floor with unsold surplus or procurement cost in ₹ lakh per day, binding vs not binding, drag the control line), `computer-science/binary-counter` (4 or 8 tappable bit lamps with place values, Play counts with carry highlights and overflow, place-value sum, hex nibbles and octal groups, divide-by-2 working, make-a-number challenges), `computer-science/logic-gates` (AND/OR/NOT/NAND/NOR/XOR symbols, tappable switches and lamp, two-gate circuits (A ▢ B) ▢ C, Boolean expression, tappable truth table, staircase and burglar-alarm presets); thumbnails, catalog, README, AGENTS, ROADMAP (coverage table gained a Computer Science column)
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /computer-science/ + / at phone + desktop); combined canvas screenshot reviewed: fixed a shortage label overlapping the equilibrium label and the price-direction arrow sitting on the price tag (supply), and the surplus label colliding with the equilibrium label (price controls)
- Roadmap: Demand and supply → Done · Numbers and logic → In progress (2 of 3)
- Next time: build `sorting-race` (see the item's Next note), finish Numbers and logic, then start Class 9 · Physics · Motion with the remaining 3 simulations
- Problems/notes: price-controls uses a wheat market instead of the mango market from the plan, because ration shops and MSP apply to wheat and rice, not mangoes (stated in its Learn panel with the invented numbers). The price-adjustment speed in supply-equilibrium is a simple model (stated). 📋 Next has 17 items, so no roadmap evolution needed.

## 2026-09-29 · routine · Class 7 · Geography · Earth's motions (finished) + Class 11 · Economics · Demand and supply (part 1)
- Built/changed: new subjects `geography` (🌏, teal, branches earth-motions / climate / maps) and `economics` (📈, orange, branches markets / money) with subject pages; `geography/day-night-india` (northern hemisphere seen from above the North Pole with a night wedge computed from the Sun's height, India patch and 82.5° E meridian, daylight bars on the IST clock for 8 cities with sunrise and sunset from latitude, declination, the −0.83° horizon and the equation of time; six dates), `geography/seasons-revolution` (tilted Earth on a slanted orbit plus a noon cross-section with tropics, the place's day circle and the noon Sun height; tilt slider down to 0°, Earth–Sun distance, IMD seasons for Indian places, day-length graph), `geography/time-zones` (rough world map with day and night shading for three dates, 15° zone bands, subsolar point, 12 world clock cards with weekday and UTC offset, IST vs Greenwich), `economics/demand-curve` (mango market Qd = 400 − 2P + income, apple-price and taste shifters, drag along the curve, ghost curve and shift arrow, spending rectangle, point elasticity, demand schedule); thumbnails, catalog, README, AGENTS, ROADMAP (coverage table gained Geography and Economics columns)
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages + /geography/ + /economics/ at phone + desktop); combined canvas screenshot reviewed: fixed a cut-off phone headline and an overlapping spending label (demand), a clock label running into the bar title and a "sunrise side" label over India (day-night), orbit date labels over the orbit dots on phones (seasons), faint night shading and a crowded UTC label (time zones)
- Roadmap: Earth's motions → Done · Demand and supply → In progress (1 of 3)
- Next time: build `supply-equilibrium` and `price-controls` (see the item's Next note), finish Demand and supply, then start Class 11 · Computer Science · Numbers and logic (new subject `computer-science`) with the remaining 2 simulations
- Problems/notes: sunrise times were checked against almanac values for Delhi (5:24 am / 7:22 pm on 21 June, 7:11 am / 5:30 pm on 22 December) and agree within about a minute. The seasons sim ignores refraction (12 h days at the equinox) while the day-night sim includes it (about 12 h 6 min); both Learn panels say so. The mango demand numbers are an invented teaching model, stated in its Learn panel. The time-zone map uses hand-drawn rough coastlines and ignores daylight saving time. 📋 Next has 17 items, so no roadmap evolution needed.

## 2026-09-29 · routine · Class 8 · Physics · Friction (finished) + Some natural phenomena (finished)
- Built/changed: `physics/ball-bearings-lubricants` (potter's wheel on a pivot: dry / graphite powder / oil / ball bearings / greased bearings, clay load 0–20 kg, friction μN at a 1 cm pivot radius plus light air drag, predicted stop time, heat made and pivot temperature, motor mode showing the power lost, magnified top view with rolling balls, results table), `physics/charging-by-rubbing` (drag a balloon, comb, glass rod, polythene or steel spoon over hair or cloth; equal and opposite charges, electron count, humidity-dependent leakage, paper bits lifted above 80 kV/m, a −80 nC hanging balloon swinging by Coulomb's law, hair pulled towards the object), `physics/electroscope` (gold-leaf electroscope: induction as the rod nears, conduction on touch, earthing with a finger and electron-flow arrows, charging by induction), `physics/lightning-conductor` (cloud charges to 20 C, zig-zag stepped leader with a 15 m striking-distance rule, house / three-tip conductor with copper strip and earth plate / tree / person inside, under the tree, standing or crouching; tally and "20 quick strikes"; thunder delay = distance ÷ 343 m/s with optional sound); thumbnails, catalog, README, AGENTS, ROADMAP
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages at phone + desktop); combined canvas screenshot reviewed: fixed a cut-off phone headline (all four sims now shrink long headlines to fit), an rpm label overlapping the clay label, a lumpy cloud and tiny buildings in the lightning scene (world height reduced), and the hanging balloon disappearing when the sim updated before the canvas was measured (guarded)
- Roadmap: Friction → Done · Some natural phenomena → Done
- Next time: take the next 📋 Next item, Class 7 · Geography · Earth's motions (new subject `geography`: add the SUBJECTS entry and folder first), then start Class 11 · Economics · Demand and supply with the remaining simulation
- Problems/notes: a single conductor rod left the roof edges exposed in testing, so the conductor has three tips along the roof (as real systems do). Monte-Carlo check: without it the roof takes ~45 % of flashes, with it 0 %. Crouching only lowers the person's hits by ~15 % in this model; the Learn panel says nowhere outdoors is safe. Charges, leak times, pivot μ values and the leaf-angle rule are simple typical values; each Learn panel says so. 📋 Next has 18 items, so no roadmap evolution needed.

## 2026-09-28 · routine · Class 8 · Physics · Force and pressure (finished) + Friction (part 1)
- Built/changed: `physics/balanced-forces` (loaded trolley pulled by two teams, net force = right − left, balanced vs unbalanced headline, a = F ÷ m, camera follows the trolley over metre marks, "balance the forces" and "left team lets go" buttons, velocity–time graph; forces can change mid-run to show constant speed when balanced), `physics/liquid-pressure` (bottle on a stool with holes A/B/C, P = h ρ g bars, v = √(2gh) jets landing at R = 2√(hz), four liquids, tap on/off draining, low-stool case where the middle jet lands farthest), `physics/friction-surfaces` (spring balance pulling a block on 5 surfaces, μs/μk, static friction matching the pull, slow pull test showing the drop from static to sliding friction, magnified bumps), `physics/rolling-vs-sliding` (30° ramp, block vs toy car on glass/tile/cloth/sand, d = v² ÷ 2μg, fair-test results table per height); thumbnails, catalog, README, AGENTS, ROADMAP
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages at phone + desktop); combined canvas screenshot reviewed: fixed overlapping text rows in the liquid-pressure panel on phones (taller canvas), a cut-off phone headline, overlapping landing letters, the missing magnified view on phones (friction) and a distance label running into the results table (ramp)
- Roadmap: Force and pressure → Done · Friction → still In progress (2 of 3)
- Next time: build `ball-bearings-lubricants` (see the item's Next note), finish Friction, then start Class 8 · Some natural phenomena with the remaining 3 simulations
- Problems/notes: friction coefficients (surfaces, rolling toy car) are typical classroom values, and the ramp model keeps the speed at the turn; both Learn panels say so. The trolley floor is frictionless on purpose (stated in its Learn panel). 📋 Next has 19 items, so no roadmap evolution needed.

## 2026-09-28 · routine · Class 7 · Physics · Light (finished) + Class 8 · Force and pressure (part 1)
- Built/changed: `physics/pinhole-camera` (true-scale side view with ray cones through the hole, h' = h × v ÷ u, inset of the screen showing the image turned through 180°, blur patch d × (u + v) ÷ u and relative brightness, candle or lit letter F), `physics/plane-mirror` (top view, drag the object and the eye, i = r with normal and angle arcs, image as far behind as the object is in front, "many rays" fan meeting at I, short-mirror case, word card vs its mirror image for lateral inversion), `physics/newtons-disc` (VIBGYOR and colour-pair discs, rpm → rev/s, blending between 4 and 16 rev/s, angle-weighted linear-light mixed colour), `physics/pressure-area` (23 × 11 × 7 cm, 3 kg brick on three faces, 1–4 bricks, P = F ÷ A in Pa, dent depth model, pressure bars for every face); new `optics` content; thumbnails, catalog, README, AGENTS, ROADMAP
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages and /physics/ at phone + desktop); combined canvas screenshot reviewed: fixed a cut-off phone headline and crowded angle labels (plane mirror), mirror-word overflow on phones, clipped colour swatch and a pinkish rainbow mix (Newton's disc: colours and sector sizes retuned to mix to near-neutral grey #9e9da3), small footprints (pressure)
- Roadmap: Light → Done · Force and pressure → still In progress (1 of 3)
- Next time: build `balanced-forces` and `liquid-pressure` (see the item's Next note), finish Force and pressure, then start Class 8 · Friction with the remaining 2 simulations
- Problems/notes: the pressure dent depth (P ÷ 300 mm) and Newton's disc blending thresholds are simple models; both Learn panels say so. 📋 Next has 20 items, so no roadmap evolution needed.

## 2026-09-27 · routine · Class 7 · Physics · Motion and time (finished) + Electric current and its effects
- Built/changed: `physics/pendulum-clock` (time n oscillations, T = t ÷ n, observation table that spots the length/mass pattern, tick per swing, seconds-pendulum preset), `physics/electric-circuit` (battery/switch/bulbs loop, picture ↔ circuit-symbol view, fused bulb, reversed cell, series bulbs, tap the switch), `physics/heating-fuse` (220 V house circuit with 6 tappable appliances, fuse wire heats and melts on overload or short circuit, unsafe copper-wire option sets the wiring on fire, temperature graph), `physics/electromagnet` (turns, cells, iron/wood/air core, pins lifted, N/S poles by right-hand grip rule, compass deflection from a two-pole field); thumbnails, catalog, README, AGENTS, ROADMAP
- Checks: ✅ check.mjs passed · ✅ browser-test (4 new pages, /physics/ and / at phone + desktop); combined canvas screenshot reviewed: fixed a 24px phone overflow (long graph legend), tiny pendulum scale, switch label over the wire, and fuse not melting just above its rating
- Roadmap: Motion and time → Done · Electric current and its effects → Done (3 sims each item; the circuit item was completed in one go)
- Next time: take the next 📋 Next item, Class 7 · Physics · Light (branch `optics`: pinhole camera, plane mirror and lateral inversion, Newton's disc / prism), then start Class 8 · Force and pressure
- Problems/notes: the electricity models are relative/simplified (10 Ω bulbs, 0.5 A per cell, fuse temperature formula); each Learn panel states this. 📋 Next still has 22 items, so no roadmap evolution needed.

## 2026-09-27 · request · 4 simulations per run; new subjects approved
- Built/changed: roadmap-run skill, AGENTS.md, ROADMAP.md
  - each run builds 4 simulations: finish the current item, then start the next
  - approved new subjects: Economics, Geography, Computer Science
  - languages are out of scope for now
  - seeded one starter item for each new subject in 📋 Next
- Checks: ✅ check.mjs passed
- Roadmap: 3 items added to 📋 Next
- Next time: finish Motion and time (pendulum-clock), then start the next 📋 Next item (3 more simulations)
- Problems/notes: none

## 2026-09-27 · routine · Class 7 · Physics · Motion and time (part 1 of 2)
- Built/changed: `physics/speed-race` (two-lane race, km/h → m/s, time = d ÷ v, d–t graph in race time with auto fast-forward), `physics/distance-time-graph` (4-leg bus trip drawing its own d–t graph, "guess first" toggle, ready-made trips); thumbnails, catalog, README, AGENTS
- Checks: ✅ check.mjs passed · ✅ browser-test (both pages, /physics/ and / at phone + desktop); combined screenshot reviewed, label overlaps fixed
- Roadmap: Motion and time → still In progress (2 of 3)
- Next time: build `pendulum-clock` (see the item's Next note), then move Motion and time to ✅ Done; that run builds only that 1 simulation
- Problems/notes: `SimLab.current` is undefined; projectile's graph `xMax` uses it and silently falls back (harmless, graph still auto-extends). Added a Gotcha.

## 2026-09-27 · request · 2 simulations per run, quality first
- Built/changed: roadmap-run skill, AGENTS.md, ROADMAP.md (2 simulations per run, quality first)
- Checks: ✅ check.mjs passed
- Roadmap: unchanged
- Next time: take the first item in 📋 Next (Class 7 · Physics · Motion and time) and build 2 of its 3 simulations
- Problems/notes: none

## 2026-09-27 · request · Add weekly maintenance
- Built/changed: `.claude/skills/site-maintenance`, AGENTS.md rules (learn from mistakes, NEEDS HUMAN flag), weekly routine (Sunday ≈10 AM IST)
- Checks: ✅ check.mjs passed
- Roadmap: unchanged
- Next time: daily builders continue with 📋 Next; maintenance runs on Sunday
- Problems/notes: none

## 2026-09-27 · request · Set up roadmap-driven autonomous building
- Built/changed: ROADMAP.md, PROGRESS.md, `.claude/skills/roadmap-run`, AGENTS.md "Roadmap workflow", two daily routines (≈8 AM and 12 AM IST)
- Checks: ✅ check.mjs passed
- Roadmap: seeded 📋 Next with 22 Class 7–12 items; Done holds Sound, Heat and Mechanics basics
- Next time: take the first item in 📋 Next (Class 7 · Physics · Motion and time)
- Problems/notes: none

## 2026-09-27 · request · Heat batch
- Built/changed: 6 Class 7 Heat simulations (hot-and-cold, thermometer, conduction, convection, radiation, sea-land-breeze)
- Checks: ✅ check.mjs passed
- Roadmap: Class 7 · Physics · Heat → Done
- Next time: n/a (before the roadmap existed)
- Problems/notes: none
