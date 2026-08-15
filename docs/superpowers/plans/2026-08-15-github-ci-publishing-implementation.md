# GitHub CI and Repository Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verified GitHub Actions quality workflow, create the public `JiaoZenghao/next_ai_demo` repository, push the complete local `main` history, and confirm the initial CI run succeeds.

**Architecture:** Keep CI in one least-privilege GitHub Actions job that installs the pinned pnpm toolchain, restores the pnpm cache, and runs the same authoritative checks used locally. Publish only after the workflow commit is verified, then create an empty GitHub repository, add it as `origin`, push `main`, and monitor the first workflow run to completion.

**Tech Stack:** GitHub Actions, actions/checkout v6, pnpm/action-setup v6, actions/setup-node v6, Node.js 24, pnpm 10.33.2, GitHub CLI, Git

## Global Constraints

- Create the public repository `JiaoZenghao/next_ai_demo` with default branch `main`.
- Preserve the complete local commit history; do not squash, rebase, amend, or force-push.
- Configure the GitHub remote as `origin` and push local `main` with upstream tracking.
- Trigger CI for pull requests targeting `main` and pushes to `main`.
- Use one `quality` job on `ubuntu-latest` with `timeout-minutes: 15`.
- Set `permissions: contents: read`, concurrency cancellation, and `NEXT_TELEMETRY_DISABLED: 1`.
- Use `actions/checkout@v6`, `pnpm/action-setup@v6` with pnpm `10.33.2`, and `actions/setup-node@v6` with Node.js `24` and pnpm caching.
- Run `pnpm install --frozen-lockfile`, lint, type-check, unit-test coverage, and build in that order.
- Do not add deployment, branch protection, coverage uploads, artifacts, a Node matrix, dependency bots, release automation, or a pull request for initial publication.
- Stop without force-pushing if repository creation, remote setup, push, or CI verification fails.

## File Map

- `.github/workflows/ci.yml`: least-privilege CI triggers, toolchain setup, dependency caching, and the complete quality command sequence.
- `docs/superpowers/specs/2026-08-15-github-ci-publishing-design.md`: approved design and remote-publishing contract.
- `docs/superpowers/plans/2026-08-15-github-ci-publishing-implementation.md`: this executable plan.

---

### Task 1: Add and Verify the GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/ci.yml`
- Verify: `package.json`
- Verify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: existing pnpm scripts `lint`, `typecheck`, `test:coverage`, and `build`.
- Produces: a workflow named `CI` with one `quality` job that GitHub executes for `main` pushes and pull requests.

- [ ] **Step 1: Confirm the required package scripts and clean starting state**

Run:

```bash
git status --short --branch
node -e 'const p=require("./package.json"); for (const s of ["lint","typecheck","test:coverage","build"]) { if (!p.scripts?.[s]) throw new Error(`missing script: ${s}`) } console.log("required scripts present")'
```

Expected: worktree is clean on `main`; script validation prints `required scripts present`.

- [ ] **Step 2: Create the exact CI workflow**

Create `.github/workflows/ci.yml` with `apply_patch`:

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NEXT_TELEMETRY_DISABLED: 1

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Set up pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 10.33.2

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type-check
        run: pnpm typecheck

      - name: Test with coverage
        run: pnpm test:coverage

      - name: Build
        run: pnpm build
```

- [ ] **Step 3: Parse and inspect the workflow**

Run:

```bash
ruby -e 'require "yaml"; YAML.safe_load(File.read(".github/workflows/ci.yml"), aliases: true); puts "valid yaml"'
rg -n 'pull_request|push:|contents: read|cancel-in-progress|ubuntu-latest|timeout-minutes|checkout@v6|action-setup@v6|setup-node@v6|10\.33\.2|node-version: 24|cache: pnpm|frozen-lockfile|pnpm lint|pnpm typecheck|pnpm test:coverage|pnpm build' .github/workflows/ci.yml
```

Expected: YAML parsing prints `valid yaml`; every required trigger, permission, version, cache setting, and quality command is present in the intended order.

- [ ] **Step 4: Run the complete local quality suite**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
git diff --check
```

Expected: every command exits 0. The approved empty starter may report no Vitest test files, but the coverage command must exit successfully.

- [ ] **Step 5: Commit the workflow**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions quality workflow"
```

Expected: Lefthook pre-commit skips cleanly because the staged workflow is YAML; the commit succeeds.

---

### Task 2: Create the Public Repository, Push Main, and Verify CI

**Files:**
- Modify external state: create `JiaoZenghao/next_ai_demo`
- Modify local Git configuration: add `origin`
- Push Git refs: local `main` to `origin/main`

**Interfaces:**
- Consumes: a clean local `main` whose head contains `.github/workflows/ci.yml`, valid GitHub CLI authentication for `JiaoZenghao`, and no existing `origin` remote.
- Produces: public repository `https://github.com/JiaoZenghao/next_ai_demo`, tracked branch `main...origin/main`, and a completed initial `CI` run.

- [ ] **Step 1: Perform a non-mutating publication preflight**

Run:

```bash
gh auth status
git status --short --branch
git remote -v
gh repo view JiaoZenghao/next_ai_demo --json nameWithOwner,url,visibility,defaultBranchRef
```

Expected: authentication succeeds for `JiaoZenghao`; worktree is clean on `main`; no `origin` exists; repository lookup exits non-zero because the requested repository does not yet exist. If the repository exists, stop rather than changing it.

- [ ] **Step 2: Create the empty public GitHub repository**

Run:

```bash
gh repo create JiaoZenghao/next_ai_demo --public --description "Next.js AI demo with shadcn/ui, Vitest, Lefthook, and GitHub Actions"
```

Expected: GitHub returns `https://github.com/JiaoZenghao/next_ai_demo`. Do not initialize the remote with a README, license, or `.gitignore` because the local repository already owns those files and history.

- [ ] **Step 3: Add the SSH remote explicitly**

Run:

```bash
git remote add origin git@github.com:JiaoZenghao/next_ai_demo.git
git remote get-url origin
```

Expected: the printed origin is exactly `git@github.com:JiaoZenghao/next_ai_demo.git`.

- [ ] **Step 4: Push the complete main history with upstream tracking**

Run:

```bash
git push -u origin main
```

Expected: push succeeds without force; local `main` is configured to track `origin/main` and the push triggers `CI`.

- [ ] **Step 5: Verify local and remote repository state**

Run:

```bash
git status --short --branch
git remote -v
gh repo view JiaoZenghao/next_ai_demo --json nameWithOwner,url,visibility,defaultBranchRef
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Expected: worktree is clean; status shows `main...origin/main`; repository JSON reports `PUBLIC` and default branch `main`; local and remote head SHAs are identical.

- [ ] **Step 6: Locate and wait for the initial CI run**

Run:

```bash
gh run list --repo JiaoZenghao/next_ai_demo --workflow CI --branch main --limit 1 --json databaseId,url,status,conclusion,headSha,event
```

Expected: one `push` run exists and its `headSha` matches local `HEAD`. Resolve that run's numeric ID and wait for it:

```bash
ci_run_id="$(gh run list --repo JiaoZenghao/next_ai_demo --workflow CI --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
test -n "$ci_run_id"
gh run watch "$ci_run_id" --repo JiaoZenghao/next_ai_demo --exit-status
```

Expected: the workflow completes successfully and `gh run watch` exits 0. If it fails, inspect the failed job logs without force-pushing or rewriting history.

- [ ] **Step 7: Record the final remote handoff**

Run:

```bash
gh run list --repo JiaoZenghao/next_ai_demo --workflow CI --branch main --limit 1 --json url,status,conclusion,headSha
git status --short --branch
```

Expected: the workflow reports `completed` and `success`, its head SHA matches local `HEAD`, and local `main` remains clean and synchronized with `origin/main`.
