# Code Prompt — Remove stale git worktree `.claude/worktrees/agent-a6d2dd5a8ac74cde9`

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-14
**Canonical location:** `docs/cowork/2026-06-14/llv_remove_stale_worktree.md` (this file). Authored by Cowork; kept in the repo per the Source-of-Truth Map.
**Branch:** create `chore/remove-stale-worktree` off `main` (only needed if any tracked file changes; see note).
**Workflow:** feature branch → push → PR → CI (`verify` + `build`) → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit out of credits — self-review.)

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-14/llv_remove_stale_worktree.md`, create that folder and save this prompt there verbatim, then proceed.

## Problem

A stale git worktree exists at `.claude/worktrees/agent-a6d2dd5a8ac74cde9/`. It is a full duplicate of the repo (including `CLAUDE.md`, `AGENTS.md`, `DIVISION_OF_LABOR.md`, `README.md`, and `docs/`), left over from an agent run. Cowork's document audit flagged it as a duplicate source of truth — it can confuse greps, audits, and humans who open the wrong copy.

## Goal

Remove the stale worktree cleanly using git's worktree machinery (not a blind `rm`), and make sure agent worktrees can't pollute future audits.

## Steps (verify before acting)

1. **Inspect.** Run `git worktree list`. Confirm whether `.claude/worktrees/agent-a6d2dd5a8ac74cde9` is a registered worktree.
2. **Confirm it's safe to drop.** In that worktree path, run `git -C .claude/worktrees/agent-a6d2dd5a8ac74cde9 status` and `git -C .claude/worktrees/agent-a6d2dd5a8ac74cde9 log --oneline -5`. If there are **uncommitted changes or unmerged commits not present on `main`**, STOP and report back to Cowork/Jim with what you found — do not delete.
3. **Remove.**
   - If registered and clean: `git worktree remove .claude/worktrees/agent-a6d2dd5a8ac74cde9` (add `--force` only if it refuses due to the dir being non-empty but you've confirmed step 2 is clean).
   - If NOT registered (orphaned dir): `rm -rf .claude/worktrees/agent-a6d2dd5a8ac74cde9` then `git worktree prune`.
4. **Prune.** Run `git worktree prune` and re-run `git worktree list` to confirm it's gone.
5. **Prevent recurrence.** Ensure `.claude/worktrees/` is git-ignored. Check `.gitignore` (and `.git/info/exclude`); if `.claude/worktrees/` (or `.claude/`) is not already ignored, add `.claude/worktrees/` to `.gitignore`. Do not ignore anything else under `.claude/` that is currently tracked and intended to be — check `git status` first.

## Do NOT touch

- The real working tree, `main`, or any other registered worktree.
- Anything under `.claude/` other than the `worktrees/` directory.
- Do not run the local dev server (`npm run dev`) — founder owns it. Verify with `npm run verify` only if you changed a tracked file (e.g. `.gitignore`).

## Acceptance criteria

1. `git worktree list` no longer shows `agent-a6d2dd5a8ac74cde9`; the directory is gone.
2. No commits or uncommitted work were lost (step 2 confirmed clean before removal).
3. `.claude/worktrees/` is git-ignored so future agent worktrees don't get committed or duplicated.
4. If `.gitignore` was the only change, `npm run verify` still passes.

## Commit / PR

If only the worktree dir was removed and nothing tracked changed, no commit/PR is needed — just report what you did. If `.gitignore` changed, commit `chore: ignore .claude/worktrees to prevent stale repo duplicates`, open a PR against `main`, let CI run, self-review, hand back for QA. Do not auto-merge.
