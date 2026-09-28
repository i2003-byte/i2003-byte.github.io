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
