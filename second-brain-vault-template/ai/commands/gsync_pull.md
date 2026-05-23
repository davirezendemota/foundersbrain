**Use this command to commit, push, and open a pull request. It runs the gsync flow first (branch, commit, push), then creates the PR.**

1. **Run gsync flow first**

   * **Check current branch:** `git branch --show-current`
   * **If the current branch is `main`, `master`, or `develop`:**
     * If there are **uncommitted changes**, create a new branch before committing (e.g. `git checkout -b feat/sync-faturas-docs`). Use a descriptive name following `type/description` (e.g. `feat/add-login`, `docs/sync-api-docs`). Derive the name from the changes when possible.
     * If there are **no uncommitted changes**, do not create a PR on main/master/develop. Tell the user to switch to a feature branch, make their changes, then run gsync_pull again.
   * **If there are uncommitted changes** (on any branch):
     * **Atomic commits:** Break changes into the smallest logical units. Each commit = one intention. Use Conventional Commits in **English** via the script (from repo root):
       ```
       core/scripts/gsync-commit.sh <type> <scope> <summary>
       ```
       Example: `core/scripts/gsync-commit.sh docs faturas add attachment view endpoint to api`. Never use aliases or paths outside the repo.
     * Derive type/scope/summary from the diff (e.g. docs, feat, fix) and the files changed. If multiple logical units, make multiple commits.
   * **Sync and push:**
     ```
     git fetch --all
     git rebase
     git push
     ```
     Do not use `--force` or `--force-with-lease`. If push fails (e.g. no upstream), use `git push -u origin $(git branch --show-current)`.
   * **After a successful push** (when the current branch is not the default base — `main`, `master`, or `develop`): return to the default base branch so the working tree matches the integration branch. Save the feature branch name first, then check out the base (use whichever the repo uses as default, usually `main`):
     ```
     FEATURE_BRANCH=$(git branch --show-current)
     git checkout main
     ```
     Replace `main` with `master` or `develop` if that is the repo’s integration branch. Skip this checkout if **push was skipped** (no new commits to push); stay on the feature branch for PR creation.
   * **If there are no uncommitted changes and the branch is already pushed:** skip commit/push and go straight to creating the PR (do not run the checkout above).

2. **Check for a pull request template**

   * Look for a template: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/pull_request_template.md`, or `.github/PULL_REQUEST_TEMPLATE`.
   * If a template exists, fill each section (Description, Changes made, How to test, etc.) with the generated content. Keep checkboxes and structure; replace placeholders with the actual description.
   * If no template exists, use a short free-form description (bullets or paragraph).

3. **PR description (content to generate)**

   * Build from: commits on the feature branch (e.g. `git log main..FEATURE_BRANCH --oneline` or `git log main..HEAD --oneline` if still on that branch) and/or the task or changes completed. If you already ran `git checkout main`, use `FEATURE_BRANCH` (saved before checkout) instead of `HEAD` for the log range.
   * Write in **English**.
   * If using a template: map content into the sections (Description, Changes made, How to test when relevant).
   * If no template: use a few clear bullets or a short paragraph.

4. **Create the PR with GitHub CLI**

   * If you are on `main` (or `master`/`develop`) after the post-push checkout, pass the pushed branch explicitly:
     ```
     gh pr create --head "$FEATURE_BRANCH" --title "<short title from main change>" --body "<body: template filled in or free-form>"
     ```
   * If you stayed on the feature branch (push was skipped), omit `--head`:
     ```
     gh pr create --title "<short title from main change>" --body "<body: template filled in or free-form>"
     ```
   * Use explicit `--title` and `--body`. Specify `--base main` (or `master`/`develop`) only if the repo does not have a default base.
   * **Title:** single line, English, summarizing the main change (e.g. same idea as the main commit or the task).

5. **After the PR is created**

   * Tell the user the PR was opened. If a push ran, they are already on the default base branch (`main` or equivalent).
