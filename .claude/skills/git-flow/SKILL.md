---
name: git-flow
description: Git workflow operations including commits, branches, PRs, and conflict resolution. Use when user says "commit", "提交", "push", "branch", "merge", "PR", "pull request", or needs Git help.
allowed-tools: Bash(git:*), Bash(gh:*), Read
---

# Git Workflow

## Overview

Manage Git operations following best practices. Includes commit conventions, branching strategy, and PR workflows.

## When to Use

Use this skill when:
- Creating commits with proper messages
- Managing branches
- Creating/reviewing PRs
- Resolving merge conflicts
- Checking repository status

## Commit Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting, no code change |
| `refactor` | Code restructure |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Build, tools, deps |

### Examples
```bash
git commit -m "feat(recipe): add cook mode modal"
git commit -m "fix(api): handle null image URL"
git commit -m "docs: update README with setup steps"
```

## Branch Strategy

### Branch Naming
```
feature/add-dark-mode
fix/recipe-image-loading
hotfix/security-patch
release/v1.2.0
```

### Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work, commit, push
git add .
git commit -m "feat: description"
git push -u origin feature/new-feature

# Create PR
gh pr create --title "feat: description" --body "..."
```

## Common Operations

### Status Check
```bash
git status
git log --oneline -10
git diff
```

### Branching
```bash
# List branches
git branch -a

# Create and switch
git checkout -b new-branch

# Delete branch
git branch -d branch-name
git push origin --delete branch-name
```

### Stashing
```bash
git stash
git stash pop
git stash list
```

### Undoing
```bash
# Unstage file
git reset HEAD file

# Discard changes
git checkout -- file

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

## PR Workflow

### Create PR
```bash
gh pr create \
  --title "feat: add new feature" \
  --body "## Summary
- Added feature X
- Fixed issue Y

## Test Plan
- [ ] Manual testing
- [ ] Unit tests pass"
```

### Review PR
```bash
# List PRs
gh pr list

# View PR
gh pr view 123

# Check out PR locally
gh pr checkout 123

# Approve PR
gh pr review 123 --approve

# Merge PR
gh pr merge 123 --squash
```

## Conflict Resolution

### Steps
1. Pull latest changes
```bash
git fetch origin
git merge origin/main
```

2. Resolve conflicts in files
3. Stage resolved files
```bash
git add .
```

4. Complete merge
```bash
git commit -m "merge: resolve conflicts with main"
```

## Safety Rules

- NEVER force push to main/master
- NEVER commit secrets or .env files
- ALWAYS pull before push
- ALWAYS review changes before commit
- Use `--no-verify` only when explicitly requested
