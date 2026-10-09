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
| 7 | 29 (Sound 14, Heat 6, Motion 3, Electricity 3, Light 3) | 3 (Acids, bases and salts 3) | 3 (Lines, angles and triangles 3) | 0 | 3 (Earth's motions 3) | 0 | 0 |
| 8 | 9 (Force and pressure 3, Friction 3, Natural phenomena 3) | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 13 (Motion 3, Force and laws of motion 4, Gravitation 3, Work and energy 3) | 3 (Matter in our surroundings 3) | 0 | 0 | 0 | 0 | 0 |
| 10 | 12 (Light: reflection and refraction 3, Human eye and the colourful world 3, Electricity 3, Magnetic effects of current 3) | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | 12 (projectile, pendulum, Oscillations 3, Gravitation 3, Waves 4) | 0 | 0 | 0 | 0 | 3 (Demand and supply 3) | 3 (Numbers and logic 3) |
| 12 | 7 (Electric charges and fields 3, Wave optics 3, Current electricity 1) | 0 | 0 | 0 | 0 | 0 | 0 |

**Total live simulations: 100**

## 🔨 In progress
<!-- Format: - [~] **Class · Subject · Sub-topic**. Done: <ids>. Next: <what remains>. Started <YYYY-MM-DD>. -->
- [~] **Class 12 · Physics · Current electricity.** Branch `electricity`. Done: drift-velocity. Next: Kirchhoff's laws in a two-loop circuit (`kirchhoffs-laws`); Wheatstone bridge and meter bridge balance (`wheatstone-bridge`). Started 2026-10-09.

## 📋 Next (auto-approved; take items from the top. Each item plans ~3 simulations; each run builds 4)
- [ ] **Class 11 · Physics · Kinetic theory of gases.** Branch `thermodynamics`. Sims: gas molecules in a box (pressure from collisions); Boyle's and Charles's laws with a piston; speed distribution of molecules vs temperature.
- [ ] **Class 9 · Mathematics · Statistics and probability.** Subject `mathematics` (branch `probability`). Sims: histogram and frequency polygon from class marks data; mean, median and mode with draggable data points; experimental probability with coins and dice approaching the theoretical value.
- [ ] **Class 7 · Geography · Weather and climate.** Branch `climate`. Sims: monsoon winds (land and sea heating, June vs December winds over India); humidity, evaporation and rainfall; reading a rainfall and temperature graph for Indian cities.
- [ ] **Class 10 · Chemistry · Chemical reactions and equations.** Branch `reactions`. Sims: balancing an equation by counting atoms on both sides; types of reactions (combination, decomposition, displacement, double displacement) with particle pictures; rusting of iron (air, water and oil-coated nails over days).
- [ ] **Class 10 · Mathematics · Introduction to trigonometry.** Subject `mathematics` (new branch `trigonometry`). Sims: sin, cos and tan as ratios in a right triangle you can resize; the unit circle and the graphs of sin and cos; heights and distances (angle of elevation to a tower or the Qutub Minar).
- [ ] **Class 9 · Biology · The fundamental unit of life.** Subject `biology` (make it live on first use). Sims: explore plant and animal cells (tap the organelles); osmosis (raisin and potato strips in water and salt solution); diffusion across a membrane.

## 💡 Proposed (needs a human decision; only for ideas outside the Class 7–12 India syllabus)
_None yet._

## 🧩 Capabilities (site features beyond new simulations; chosen fresh by each weekly maintenance run, ONE per week)
<!-- No fixed list. Each weekly run picks one idea and logs it here as Done or Skipped (with the reason). Format: - [x] **Name** (YYYY-MM-DD). What it adds. | - [ ] skipped: **Name**. Reason. -->
- [x] **Class filter** (2026-10-04). Subject pages and All Simulations can be filtered by school class (Class 7–12, from the `class N` catalog tags, shareable as `?class=9`); `check.mjs` requires a class tag on live simulations.

## ✅ Done
- [x] **Class 7 · Mathematics · Lines, angles and triangles.** 3 sims (Mathematics now live, branch `geometry`): parallel-lines-angles (8 numbered angles, corresponding/alternate/co-interior/vertically opposite/linear pair, tilt line m to break parallelism, tap an angle, drag the transversal), triangle-angle-sum (drag the apex, tear the corners onto a straight line, parallel line through C, exterior angle = A + C), pythagoras-proof (four triangles slide inside an (a + b) square from c² to a² + b², squares on the sides with a 1 cm grid, non-right corners show c² ≠ a² + b²). Done 2026-10-09.
- [x] **Class 9 · Chemistry · Matter in our surroundings.** 3 sims (new branch `matter`): states-of-matter (solid, liquid and gas particles side by side; jar shape, piston squeeze, temperature, colour diffusion, followed-particle paths), evaporation-cooling (plate or glass in a room; air temperature, humidity, fan; evaporation rate and cooling to a steady temperature below the air), heating-curve (ice at −20 °C to steam; flat parts at 0 °C and the boiling point, latent heat, particle zoom window, Mumbai/Shimla/Leh boiling points). Done 2026-10-08.
- [x] **Class 7 · Chemistry · Acids, bases and salts.** 3 sims: natural-indicators, neutralisation, ph-scale (universal indicator on 8 everyday solutions, H⁺ vs pure water, 10× dilution for strong and weak acids/bases, guess mode). Done 2026-10-08.
- [x] **Class 12 · Physics · Wave optics.** 3 sims: wave-interference (placeholder built out, branch `waves`: two-source ripple tank, path difference probe), youngs-double-slit (fringe width β = λD/d, white light, cover one slit, slit-width envelope and missing orders), single-slit-diffraction (central band 2λD/a, dark bands at a sin θ = nλ, faint bands ×10, compare with two slits). Done 2026-10-07.
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
