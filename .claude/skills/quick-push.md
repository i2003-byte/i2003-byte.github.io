---
name: quick-push
description: Quickly commit and push changes to current branch
---

# Quick Push Skill

When this skill is invoked:

1. Check git status to see what files have changed
2. Add all changed files to staging
3. Create a descriptive commit message based on the changes
4. Push to the current branch (must be a claude/* branch for safety)
5. Show confirmation with the commit hash

This skill is useful for quickly saving and pushing your work during development.
