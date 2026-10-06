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
| 10 | 12 (Light: reflection and refraction 3, Human eye and the colourful world 3, Electricity 3, Magnetic effects of current 3) | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | 12 (projectile, pendulum, Oscillations 3, Gravitation 3, Waves 4) | 0 | 0 | 0 | 0 | 3 (Demand and supply 3) | 3 (Numbers and logic 3) |
| 12 | 4 (Electric charges and fields 3, Wave optics 1) | 0 | 0 | 0 | 0 | 0 | 0 |

**Total live simulations: 88**

## 🔨 In progress
<!-- Format: - [~] **Class · Subject · Sub-topic**. Done: <ids>. Next: <what remains>. Started <YYYY-MM-DD>. -->
- [~] **Class 12 · Physics · Wave optics.** Done: wave-interference (placeholder built out, branch `waves`: two-source ripple tank, path difference probe, bright/calm lines, screen pattern). Next: Young's double-slit fringes (`youngs-double-slit`, branch `optics`: slit separation, screen distance, colour of light, β = λD/d, fringe pattern on a screen); single-slit diffraction (`single-slit-diffraction`, branch `optics`: central maximum width 2λD/a, compare with double slit). Started 2026-10-06.

## 📋 Next (auto-approved; take items from the top. Each item plans ~3 simulations; each run builds 4)
- [ ] **Class 7 · Chemistry · Acids, bases and salts.** Subject `chemistry` (make the subject live on first use). Sims: natural indicators (turmeric, litmus, china rose); neutralisation titration; pH scale of everyday substances.
- [ ] **Class 9 · Chemistry · Matter in our surroundings.** Subject `chemistry`. Sims: particles in solids, liquids and gases; evaporation and cooling vs temperature, humidity and wind; change of state heating curve.
- [ ] **Class 7 · Mathematics · Lines, angles and triangles.** Subject `mathematics` (make it live on first use). Sims: angle pairs with parallel lines; angle sum of a triangle; Pythagoras by rearrangement.
- [ ] **Class 12 · Physics · Current electricity.** Branch `electricity`. Sims: drift velocity of electrons in a wire; Kirchhoff's laws in a two-loop circuit; Wheatstone bridge and meter bridge balance.
- [ ] **Class 11 · Physics · Kinetic theory of gases.** Branch `thermodynamics`. Sims: gas molecules in a box (pressure from collisions); Boyle's and Charles's laws with a piston; speed distribution of molecules vs temperature.

## 💡 Proposed (needs a human decision; only for ideas outside the Class 7–12 India syllabus)
_None yet._

## 🧩 Capabilities (site features beyond new simulations; chosen fresh by each weekly maintenance run, ONE per week)
<!-- No fixed list. Each weekly run picks one idea and logs it here as Done or Skipped (with the reason). Format: - [x] **Name** (YYYY-MM-DD). What it adds. | - [ ] skipped: **Name**. Reason. -->
- [x] **Class filter** (2026-10-04). Subject pages and All Simulations can be filtered by school class (Class 7–12, from the `class N` catalog tags, shareable as `?class=9`); `check.mjs` requires a class tag on live simulations.

## ✅ Done
- [x] **Class 12 · Physics · Electric charges and fields.** 3 sims: coulombs-law (force vs distance with inverse-square graph, media, three-charge vector sum), electric-fields (placeholder built out: draggable charges, field lines, equipotentials, test point E and V), electric-dipole (pivoted dipole in a uniform field, torque, U = −pE cos θ, stable and unstable equilibrium). Done 2026-10-06.
- [x] **Class 11 · Physics · Waves.** 4 sims: wave-types (transverse and longitudinal rows from one vibrator, v = fλ), standing-waves (Melde-style string, harmonics, nodes and antinodes, response curve), beats (two forks, real audio beats, loudness envelope), doppler-effect (siren driving past a listener, wavefronts, heard pitch vs time). Done 2026-10-05.
- [x] **Class 11 · Physics · Gravitation.** 3 sims: planetary-orbits (placeholder built out: Kepler's three laws, equal-time sectors, Earth/Mercury/Mars/Halley), escape-velocity (Earth, Moon, Mars, Jupiter; energy bars), satellite-orbits (orbital speed and period vs height, geostationary orbit above India). Done 2026-10-04.
- [x] **Class 11 · Physics · Oscillations.** 3 sims: spring-mass, shm-circular, resonance (driven spring, resonance curve with measured points, damping). Done 2026-10-04.
- [x] **Class 10 · Physics · Magnetic effects of current.** 3 sims: magnetic-field-lines, solenoid-field (exact loop/solenoid field, cut-away view), motor-generator (DC motor with back emf, AC and DC generators, split ring and slip rings). Done 2026-10-03.
- [x] **Class 10 · Physics · Electricity.** 3 sims: ohms-law (with resistivity and a non-Ohmic bulb), series-parallel, power-bill. Done 2026-10-03.
- [x] **Class 10 · Physics · Human eye and the colourful world.** 3 sims: eye-accommodation, eye-defects, prism-dispersion (prism dispersion and Rayleigh scattering in one, with a mode switch). Done 2026-10-02.
- [x] **Class 10 · Physics · Light: reflection and refraction.** 3 sims: ray-optics (spherical mirrors), refraction-glass-slab, lens-images. Done 2026-10-02.
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
