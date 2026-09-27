# CLAUDE.md

All project instructions live in AGENTS.md (the open standard shared by every AI coding tool). It is imported here:

@AGENTS.md

## Claude Code specifics
- A project hook in `.claude/settings.json` runs `node tools/check.mjs` before any `git push` and blocks the push if it fails. Fix the reported problems; never bypass the hook.
- Project skill: `.claude/skills/add-simulation/SKILL.md`. Use it whenever you add or build out a simulation.
- Keep token use low. Open only the files in the "Where things are" table that the task needs. Use Grep inside `style.css` and `common.js` rather than reading them whole.
