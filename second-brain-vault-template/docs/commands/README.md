# GitHub Actions + Claude Routines

Complete guide and templates for automating tasks with Claude in GitHub Actions.

## Overview

Run Claude-powered routines automatically via GitHub Actions with:
- **Scheduled execution** (cron): daily reports, periodic checks
- **Manual dispatch**: ad-hoc analysis with custom inputs  
- **Event-triggered**: PR reviews, commit analysis, etc
- **Full GitHub context**: access to repo data, secrets, environment variables

## Templates in This Directory

### 1. **daily-repository-summary.yml**
Daily digest of repository activity.
- Gathers commits, file changes, branch info
- Claude analyzes and provides summary + suggestions
- Scheduled: 9 AM UTC, weekdays
- Customizable cron expression

### 2. **pr-review-assistant.yml**
Automated code review on pull requests.
- Analyzes diffs with Claude
- Posts feedback as PR comment
- Triggered on PR opened/updated
- Filters by paths (src/, ai/, docs/)

### 3. **manual-claude-task.yml**
Run any Claude task on-demand from GitHub UI.
- Accepts task description via input
- Optional context (commits, files, repo snapshot)
- Output format selection (markdown/json/plain)
- Results saved as artifacts

## Setup Steps

### 1. Add API Key to GitHub Secrets

```bash
# Go to repo Settings > Secrets and variables > Actions
# Create new secret: ANTHROPIC_API_KEY
# Paste your Anthropic API key
```

### 2. Copy Template to `.github/workflows/`

```bash
cp docs/commands/daily-repository-summary.yml .github/workflows/
```

### 3. Commit and Test

```bash
git add .github/workflows/daily-repository-summary.yml
git commit -m "feat: add daily repository summary workflow"
git push
```

### 4. Test Manually (Optional)

Go to **Actions** tab → Select workflow → **Run workflow**

## Environment Variables

All templates have access to GitHub context:

```yaml
GITHUB_ACTOR          # User who triggered workflow
GITHUB_REF            # Branch/tag (e.g., refs/heads/main)
GITHUB_SHA            # Commit SHA
GITHUB_REPOSITORY     # owner/repo
GITHUB_RUN_ID         # Workflow run ID
GITHUB_RUN_NUMBER     # Sequential run number
GITHUB_EVENT_NAME     # Event type (schedule, pull_request, etc)
GITHUB_SERVER_URL     # GitHub server URL
```

Reference in Claude prompt: `${{ env.VAR_NAME }}`

## Customization Guide

### Change Schedule

Find `cron:` in the template and edit (use [crontab.guru](https://crontab.guru)):

```yaml
on:
  schedule:
    - cron: '0 9 * * 1-5'  # 9 AM UTC, weekdays only
```

### Modify Claude Prompt

Edit the `cat <<'EOF' | claude` section:

```yaml
- name: Generate summary with Claude
  run: |
    cat <<'EOF' | claude
    Your custom prompt here...
    Use ${{ env.VAR }} for interpolation
    EOF
```

### Add Environment Variables

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  MY_CUSTOM_VAR: value
  MY_SECRET: ${{ secrets.MY_SECRET }}
```

### Filter by File Paths

```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'docs/**'
      - '.github/workflows/**'
```

## Common Patterns

### Trigger on Schedule
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
```

### Trigger with Manual Input
```yaml
on:
  workflow_dispatch:
    inputs:
      my_param:
        description: 'Parameter'
        required: true
        type: string
```

### Trigger on Events
```yaml
on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: [main]
```

## Debugging

| Issue | Solution |
|-------|----------|
| Workflow doesn't run | Check cron syntax on crontab.guru; test with workflow_dispatch |
| API key error | Verify secret named `ANTHROPIC_API_KEY` exists in Settings |
| Claude not found | Add `npm install -g @anthropic-ai/claude-code` to setup |
| Timeout | Increase `timeout-minutes` in job config |
| Permissions error | Check job `permissions:` section (e.g., `pull-requests: write`) |

## Advanced: Post Results

### To Slack
Add step after Claude execution:
```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      text: "Claude task completed: ${{ github.event.inputs.task_description }}"
```

### To GitHub Issue Comment
```yaml
- name: Comment on issue
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: "✅ Task completed by Claude"
      })
```

### Save Artifacts
```yaml
- name: Upload results
  uses: actions/upload-artifact@v4
  with:
    name: claude-output
    path: output.txt
    retention-days: 30
```

## Reference: `/create-github-actions-routine` Command

For detailed setup guide, see the Claude Code command `/create-github-actions-routine` which provides:
- Step-by-step workflow setup
- Complete environment variable reference
- Troubleshooting guide
- Additional patterns and examples
