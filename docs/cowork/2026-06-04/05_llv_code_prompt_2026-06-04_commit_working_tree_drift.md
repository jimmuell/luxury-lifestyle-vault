# Code Prompt — Commit the remaining working-tree drift (docs reorg, .nvmrc, config dirs)

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Context:** The Vercel build is green again. But the local working tree still has a large set of **uncommitted** changes that have nothing to do with the build — they've just never been committed, which is the same kind of local↔origin drift that caused the broken deploy earlier today. Commit them deliberately (in logical commits) so the repo matches the disk and nothing else is lurking. **No `src/` changes are pending**, so this is docs + config only — zero build risk.

Current `git status` (after the build fix) is below. Group it into clean commits as described.

## Group 1 — Docs single-source-of-truth reorg (the June-3 work)

These are the intentional doc reorganization: business/strategy docs moved to Google Drive, repo keeps only Code-facing docs, the rest archived to `docs/_archive/`, plus the `CLAUDE.md` "Document authority" directive and updated handoff. All of it should be committed together.

Modified: `CLAUDE.md`, `DIVISION_OF_LABOR.md`, `llv_session_handoff.md`, `docs/testing/llv_platform_test_plan.docx`
Deleted: `llv_needs_chat_review.md`, `docs/archive/Tech Stack Claude Code.docx`, and many `docs/strategy/*` + `docs/cowork/*` files (moved to Drive/archive)
Added: `docs/_archive/` and the new `docs/cowork/*.md` Code prompts + `docs/testing/*` from recent sessions

```bash
git add -A docs/ CLAUDE.md DIVISION_OF_LABOR.md llv_session_handoff.md llv_needs_chat_review.md
git commit -m "docs: commit single-source-of-truth reorg (archive to docs/_archive, Drive is canonical) + recent Code prompts"
```

## Group 2 — Commit `.nvmrc`

`.nvmrc` is untracked but is referenced throughout `CLAUDE.md` (Node 20.19.5 is the pinned version) and should be in the repo so everyone — and Vercel — uses the right Node. Confirm it reads `20.19.5`, then:

```bash
git add .nvmrc
git commit -m "chore: track .nvmrc (pin Node 20.19.5)"
```

## Group 3 — Decide on the editor/agent config dirs

These untracked dirs are AI-tool / editor scratch config: `.agents/`, `.claude/`, `.continue/`, `.junie/`, `.kiro/`, and `skills-lock.json`. **Inspect each briefly and decide** — don't blindly commit:

- **`.claude/`** — if it holds shared *project* config meant for the team (e.g. committed slash-commands, `settings.json` without secrets), commit it. If it's local/personal session state, gitignore it. **Check it doesn't contain any secrets/tokens before committing.**
- **`.agents/`, `.continue/`, `.junie/`, `.kiro/`** — these are per-developer tool dirs; default to **gitignore** unless you find shared project config.
- **`skills-lock.json`** — commit if it's meant to pin shared skills/plugins for the project; otherwise gitignore.

For anything you choose to ignore, add it to `.gitignore` and commit that:

```bash
# example — adjust to what you actually decide to ignore
printf '\n# editor/agent local config\n.agents/\n.continue/\n.junie/\n.kiro/\n' >> .gitignore
# (add .claude/ and/or skills-lock.json here too if you decide to ignore them)
git add .gitignore
git commit -m "chore: gitignore local editor/agent config dirs"
```

## Finish

```bash
npm run verify        # sanity (should be clean — no code changed)
git push origin main
git status            # must be clean afterward — nothing untracked/modified left
```

## Acceptance criteria

- `git status` is **completely clean** after — no modified, deleted, or untracked files remain (everything is either committed or gitignored).
- No secrets/tokens were committed (especially from `.claude/` or any config dir).
- Commits are logically grouped (docs reorg / .nvmrc / gitignore), not one giant blob.
- `npm run verify` clean; pushed to `origin/main`. (No new Vercel build risk — docs/config only.)

## Report back

- The commit hashes, what you decided to commit vs gitignore for the config dirs (and why), confirmation `git status` is clean, and that the push succeeded.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Don't run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`.
- Node **20.19.5** (`.nvmrc`). Never hand-edit `node_modules`.
