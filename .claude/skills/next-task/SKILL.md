---
name: next-task
description: Pick up a task from Linear and work it through to a PR. Use when asked to work on the next task, or on a specific Linear issue like PUL-12.
argument-hint: "[issue id]"
---

Work one task, then stop. Issue id, if one was given: $ARGUMENTS

Read the Tasks and Deploys sections of CLAUDE.md first. They say whose words to trust and what not to run.

Use the Linear tools from the `linear-server` MCP server. If they aren't available, say Ronaldo needs to sign in with `/mcp`, and stop.

## 1. Pick the task

With no id, list the Pulse team's issues in Todo. Take the highest priority, in the order Urgent, High, Medium, Low, then no priority. Break ties with the oldest. If Todo is empty, say so and stop.

With an id, work on that issue, unless it's already Done or Canceled. Then say so and stop.

## 2. Read it

Read the issue and its comments.

If you can't tell what to build or how to check it without guessing, post your question as a comment, move the issue to Backlog, and stop.

## 3. Start

If the working tree isn't clean, stop and say so. It's someone's work in progress, so don't stash it.

```bash
git checkout main && git pull
git checkout -b <issue-id>-<short-name>   # e.g. pul-12-doodle-badge
```

The issue id in the branch name is what links it in Linear. Move the issue to In Progress.

## 4. Do the work

Stay inside the task. Anything else you notice goes in the PR description, not the diff.

If you get stuck, comment on the issue with what's blocking you, move it to Backlog, and stop.

## 5. Check it

There are no automated tests, so:

- `npm run build` has to pass.
- App changes: run it in a browser and check every "Done when" line, in light and dark.
- Migrations and functions: test against a local Supabase stack, never the live project.

## 6. Open the PR

Commit, push, and run `gh pr create`. The description needs:

- `Closes <issue id>`, so merging moves the issue to Done.
- What changed, and how you checked each "Done when" line. Say plainly if you couldn't check one.
- If there's a migration or function change, the exact deploy commands in order.

Don't merge it. Finish by giving the PR link and anything you couldn't check.
