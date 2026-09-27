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

## 2026-09-27 · request · Routines switched to Opus 5.5, 2 simulations per run
- Built/changed: roadmap-run skill, AGENTS.md, ROADMAP.md (2 simulations per run, quality first); all routines use claude-opus-5-5
- Checks: ✅ check.mjs passed
- Roadmap: unchanged. A manual Sonnet test run was stopped before pushing.
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
