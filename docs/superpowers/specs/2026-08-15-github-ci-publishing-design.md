# GitHub CI and Repository Publishing Design

## Objective

Add a GitHub Actions quality workflow, create the public repository `JiaoZenghao/next_ai_demo`, push the complete local `main` history, and verify the initial CI run.

## Scope

This change adds one CI workflow and publishes the existing repository. It does not add deployment, release automation, dependency-update bots, branch-protection rules, artifact uploads, or pull-request automation.

## Repository Publishing

- Owner: `JiaoZenghao`
- Repository: `next_ai_demo`
- Visibility: public
- Default branch: `main`
- Local source: the current `ai_demo` Git repository
- Remote name: `origin`

Create the empty GitHub repository from the authenticated `JiaoZenghao` account, configure it as `origin`, and push the complete local `main` history with upstream tracking. Do not squash or rewrite the existing commits.

Before creation, confirm that `JiaoZenghao/next_ai_demo` does not already exist and that the local worktree contains only intended changes. After pushing, verify the remote URL, upstream branch, visible head commit, and initial Actions run.

## Continuous Integration Workflow

Create `.github/workflows/ci.yml` with one job named `quality`.

### Triggers

- Pull requests targeting `main`
- Pushes to `main`

Use concurrency grouping by workflow and Git ref, with `cancel-in-progress: true`, so superseded runs do not consume unnecessary runner time.

### Permissions and Runner

- Set workflow permissions to `contents: read`.
- Run on `ubuntu-latest`.
- Set `timeout-minutes: 15`.
- Disable Next.js telemetry for CI through `NEXT_TELEMETRY_DISABLED: 1`.

### Toolchain

- `actions/checkout@v6`
- `pnpm/action-setup@v6` with pnpm `10.33.2`
- `actions/setup-node@v6` with Node.js `24` and pnpm caching

The workflow uses maintained major-version tags rather than commit-SHA pins. This keeps the starter concise while allowing compatible security and runtime updates within each major release.

### Quality Steps

Run these commands sequentially after toolchain setup:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test:coverage`
5. `pnpm build`

The test command may report no test files in the approved empty starter. Its configured coverage gate will begin enforcing 80% per-file coverage when qualifying logic is added under `src/lib/`.

Run project checks directly rather than invoking Lefthook inside CI. Lefthook is the local feedback mechanism; the workflow independently repeats the authoritative commands so CI does not depend on Git-hook installation.

## Failure Behavior

GitHub Actions stops the job when any setup or quality command exits non-zero. Failed pushes remain visible in repository history, while failed pull-request checks prevent a clean CI status. No automatic rollback, force push, issue creation, or notification integration is included.

If repository creation fails because the name becomes unavailable, stop without changing `origin` and report the conflict. If pushing fails, preserve the local commits and diagnose authentication, remote, or branch state without force-pushing.

## Verification

Before committing the workflow:

1. Parse the workflow as YAML.
2. Confirm its triggers, permissions, concurrency, action versions, Node/pnpm versions, and command order.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, and `pnpm build` locally.
4. Run `git diff --check`.

After repository creation and push:

1. Confirm `origin` resolves to `JiaoZenghao/next_ai_demo`.
2. Confirm local `main` tracks `origin/main`.
3. Confirm the GitHub repository is public and its default branch is `main`.
4. Confirm the remote `main` head matches the local head commit.
5. Wait for the initial `CI` workflow run to complete and report its conclusion and URL.

## Explicit Non-Goals

- Application deployment or preview environments
- Branch protection or rulesets
- Codecov or third-party coverage uploads
- Build artifact uploads
- Node-version matrix testing
- Dependabot or Renovate
- Release, package-publishing, or tagging automation
- Pull-request creation for the initial repository publication

