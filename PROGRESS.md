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
