## /gsync — stage, commit (Conventional Commits), rebase, push (safe)

You are operating inside Cursor (non-interactive). Follow this exact workflow to sync local changes to remote safely.

### Guardrails

- **Atomic commits**: one intention per commit. If there are multiple intentions, produce multiple commits.
- **Conventional Commits (English only)**: `feat|fix|refactor|chore|docs|style|perf|test` with optional scope: `type(scope): summary`.
- **No trailers**: do not add `Co-authored-by`, `Signed-off-by`, etc.
- **Branch protection**: never commit directly to `main`, `master`, or `develop`.
- **No force pushes**: never use `--force` or `--force-with-lease`.
- **Non-interactive only**: do not use interactive commands (e.g. `git add -p`, interactive rebase).

### What to do

1. **Inspect changes (always)**:
   - Run: `git status`, `git diff`, `git diff --staged`, `git log -5 --oneline`, `git branch --show-current`.

2. **Ensure a safe branch**:
   - If on `main`/`master`/`develop`, create a new branch named `type/short-description` (kebab-case), e.g. `docs/update-company-core`.

3. **Plan commits**:
   - If multiple commits are needed, list the planned commits first (title + what files belong to each).

4. **Stage changes (non-interactive)**:
   - Prefer staging only the intended files for the commit (`git add <paths...>`).
   - Add new files deliberately (never stage secrets like `.env`).

5. **Commit**:
   - Use a Conventional Commit message in English.
   - Pass the message via a heredoc to avoid formatting issues, e.g.:

```bash
git commit -m "$(cat <<'EOF'
docs: update company core references

EOF
)"
```

6. **Sync with remote**:
   - `git fetch --all`
   - If the current branch tracks an upstream, rebase onto it (`git rebase`).
   - If rebase conflicts occur: resolve, `git add <resolved files>`, `git rebase --continue`.

7. **Push**:
   - If no upstream yet: `git push -u origin HEAD`
   - Otherwise: `git push`

8. **Post-check**:
   - `git status` (should be clean)
   - If you created a feature branch, optionally switch back to the previous branch.

### Output requirements

- Summarize: branch name, commits created (hash + message), and push result.
- If something is ambiguous (what to include, commit granularity), **default to smaller, safer commits**.