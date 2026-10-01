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
