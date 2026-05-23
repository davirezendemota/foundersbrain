# Conventional Commits

## Format

```
type(scope): summary
```

- **type** — required. See types below.
- **scope** — optional. The area of the codebase affected, e.g. `auth`, `api`, `ui`.
- **summary** — required. Short, imperative, English, no period at the end.

## Types

| Type       | When to use                                      |
|------------|--------------------------------------------------|
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `refactor` | Code change that neither adds a feature nor fixes a bug |
| `chore`    | Build, tooling, dependency updates, config       |
| `docs`     | Documentation only                               |
| `style`    | Formatting, whitespace — no logic change         |
| `perf`     | Performance improvement                          |
| `test`     | Adding or fixing tests                           |

## Rules

- **Atomic commits**: one intention per commit. Multiple intentions = multiple commits.
- **English only** in commit messages.
- **No trailers**: do not add `Co-authored-by`, `Signed-off-by`, or similar.
- **Never commit directly** to `main`, `master`, or `develop`. Branch off with `type/short-description` (kebab-case), e.g. `docs/update-company-core`.
- **No force pushes**: `--force` and `--force-with-lease` are forbidden.

## Examples

```
feat(auth): add OAuth2 login with Google
fix(api): handle null response from payment gateway
refactor(db): extract query builder into separate module
chore: update dependencies to latest patch versions
docs: add conventional commits guide
```

## Commit via heredoc (avoid quoting issues)

```bash
git commit -m "$(cat <<'EOF'
feat(scope): summary here

Optional longer body explaining the why, not the what.
EOF
)"
```

## Branch naming

Branches must follow `type/short-description` in kebab-case:

```
feat/user-profile-page
fix/payment-null-crash
docs/update-api-reference
```

## Workflow summary

See `/gsync` command (`ai/commands/gsync.md`) for the full stage → commit → rebase → push workflow.
