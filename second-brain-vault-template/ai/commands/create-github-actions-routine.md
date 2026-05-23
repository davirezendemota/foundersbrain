# /create-github-actions-routine — Setup GitHub Actions + Claude Routine

Create a GitHub Actions workflow that executes Claude automated routines with environment variables, secrets, and conditional triggers.

## What this does

Generates a complete GitHub Actions workflow file (`.github/workflows/`) that:
- Triggers on schedule (cron), manual dispatch, or events
- Passes GitHub environment variables and secrets to Claude via stdin/env
- Logs Claude execution with structured output
- Handles failures and retries

## Prerequisites

1. **Anthropic API key** stored in GitHub secrets as `ANTHROPIC_API_KEY`
2. **Claude CLI installed** in the workflow environment
3. **Repository permissions** for workflow read/write access

## Workflow setup

### 1. Define the routine parameters

Gather these before creating the workflow:

```
Routine name:       my-routine               (kebab-case, alphanumeric + dash)
Trigger type:       schedule|dispatch|event  (cron, manual, or on push/PR)
Trigger schedule:   0 2 * * *                (cron expression, if schedule)
Claude prompt:      (the instruction for Claude)
Timeout:            300                      (seconds; 300 = 5 min default)
Environment vars:   GITHUB_REF, MY_VAR=val   (space-separated; prefix secrets with 'secrets.')
```

### 2. Generate workflow file

The workflow file should be named `.github/workflows/<routine-name>.yml`. Structure:

```yaml
name: routine-name
on:
  schedule:
    - cron: '0 2 * * *'            # (if schedule-based)
  workflow_dispatch:               # manual trigger via GitHub UI
    inputs:
      extra_input:
        description: 'Extra param'
        required: false
        default: ''

env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

jobs:
  routine:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - name: Install Claude CLI
        run: |
          npm install -g @anthropic-ai/claude-code || \
          pip install anthropic-cli

      - name: Run Claude routine
        env:
          GITHUB_ACTOR: ${{ github.actor }}
          GITHUB_REF: ${{ github.ref }}
          GITHUB_RUN_ID: ${{ github.run_id }}
          # Add more GitHub context variables as needed
        run: |
          claude --version
          cat <<'EOF' | claude --prompt -
          [Your Claude prompt here]

          Context variables:
          - GITHUB_ACTOR: ${{ env.GITHUB_ACTOR }}
          - GITHUB_REF: ${{ env.GITHUB_REF }}
          - GITHUB_RUN_ID: ${{ env.GITHUB_RUN_ID }}
          EOF

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: routine-output
          path: |
            routine-output.txt
            routine-log.json
```

### 3. Common patterns

#### Pattern A: Scheduled report/check (daily digest)

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC every day
```

Use case: Generate nightly reports, run security scans, validate configs.

#### Pattern B: Manual dispatch with inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      scope:
        description: 'Scope (all|changed|specific)'
        required: true
        default: 'all'
      target:
        description: 'Target resource'
        required: false
```

Use case: Ad-hoc analyses, manual data processing.

#### Pattern C: On pull request / push events

```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - '.github/workflows/routine.yml'
  push:
    branches: [ main ]
```

Use case: Code review automation, CI/CD steps.

### 4. Environment variables & secrets

Pass GitHub context to Claude:

```yaml
env:
  # GitHub-provided
  GITHUB_ACTOR: ${{ github.actor }}
  GITHUB_REF: ${{ github.ref }}
  GITHUB_SHA: ${{ github.sha }}
  GITHUB_REPOSITORY: ${{ github.repository }}
  GITHUB_RUN_ID: ${{ github.run_id }}
  GITHUB_RUN_NUMBER: ${{ github.run_number }}
  GITHUB_EVENT_NAME: ${{ github.event_name }}

  # Your secrets (store in GitHub Settings > Secrets > Actions)
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  CUSTOM_SECRET: ${{ secrets.MY_SECRET_NAME }}

  # Inputs (from workflow_dispatch)
  USER_PARAM: ${{ github.event.inputs.user_param }}
```

In Claude prompt, reference via `${{ env.VAR_NAME }}` or read from shell environment.

### 5. Example routine: "Daily code summary"

File: `.github/workflows/daily-summary.yml`

```yaml
name: daily-code-summary

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC weekdays (use crontab.guru to adjust)
  workflow_dispatch:

env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

jobs:
  summary:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate summary
        env:
          GITHUB_REF: ${{ github.ref }}
          GITHUB_REPO: ${{ github.repository }}
        run: |
          # Get commits since yesterday
          git log --oneline --since="24 hours ago" > commits.txt || echo "No commits" > commits.txt
          
          # Get changed files
          git diff --name-only HEAD~7...HEAD > files.txt || echo "No files" > files.txt
          
          # Call Claude
          cat <<'EOF' | claude --prompt -
          Summarize the recent activity in this repository:
          
          Commits:
          $(cat commits.txt)
          
          Changed files:
          $(cat files.txt)
          
          Repo: $GITHUB_REPO
          Ref: $GITHUB_REF
          
          Provide: 1. Key changes 2. Potential issues 3. Next steps
          EOF

      - name: Comment on latest PR (optional)
        if: always()
        run: |
          # Find latest open PR and add comment with summary
          # (requires GH_TOKEN from secrets, GitHub CLI)
          gh pr comment --body "📊 Automated summary generated"
```

### 6. Debugging & monitoring

- **View logs**: GitHub Actions > Workflows > [routine name] > [run] > [job]
- **Manual trigger**: Click "Run workflow" on the Actions tab
- **Upload artifacts**: Use `actions/upload-artifact` to save Claude output for review
- **Notifications**: Add workflow status badge, use GitHub notifications, or post to Slack/Discord

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ANTHROPIC_API_KEY` not found | Check GitHub Settings > Secrets > Actions; key must be named exactly |
| Claude CLI not in PATH | Use `npm install -g @anthropic-ai/claude-code` in setup step |
| Workflow never triggers | Verify cron syntax on [crontab.guru](https://crontab.guru); test with `workflow_dispatch` first |
| Timeout | Increase `timeout-minutes`; split long routines into parallel jobs |
| Secrets exposed in logs | Use `::add-mask::` or store sensitive output in artifacts (not stdout) |

## Next steps

1. Create the workflow file (`.github/workflows/<name>.yml`)
2. Add `ANTHROPIC_API_KEY` to GitHub repo secrets
3. Test manually via "Run workflow" button
4. Check Actions tab for logs and output
5. Adjust schedule/prompt/environment variables as needed
6. (Optional) Post results to Slack/Discord/email via additional workflow steps
