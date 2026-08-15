# Next.js `ai_demo` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold and verify a clean Next.js 16.2.12 project with shadcn/ui, Codex project guidance, Vitest coverage gates, and Lefthook-managed local quality checks.

**Architecture:** Generate the official Next.js scaffold in a dedicated temporary directory, then copy it into the already-versioned repository so the approved design history is preserved. Add shadcn/ui, testing, and Git-hook infrastructure as separate reviewable commits. Keep the starter free of product logic and sample components.

**Tech Stack:** Next.js 16.2.12, React, TypeScript, App Router, Tailwind CSS v4, shadcn/ui with Base UI, ESLint, Vitest with V8 coverage, Lefthook 2.x, Turbopack, pnpm, Git

## Global Constraints

- Scaffold directly into the current `ai_demo` repository; do not leave a nested application directory.
- Use Next.js 16.2.12, TypeScript, App Router, Tailwind CSS v4, ESLint, Turbopack, `src/`, and the `@/*` alias.
- Use pnpm exclusively and keep React Compiler disabled.
- Use shadcn/ui with Base UI primitives, Nova style, neutral CSS variables, and Lucide icons.
- Keep the standard Next.js starter page and do not add sample shadcn components or product features.
- Preserve the Next.js-managed block in the generated root `AGENTS.md`; add project rules only outside that block.
- Use Vitest for major framework-independent logic, with 80% per-file coverage for statements, branches, functions, and lines under `src/lib/`, excluding generated `src/lib/utils.ts`.
- Use Lefthook for staged-source ESLint on pre-commit and parallel lint, type-check, and coverage checks on pre-push.
- Do not add authentication, a database, an AI SDK, deployment configuration, CI/CD, or end-to-end test tooling.

## File Map

- `package.json`: framework dependencies and scripts for development, quality checks, tests, and hook installation.
- `pnpm-lock.yaml`: reproducible dependency resolution.
- `src/app/layout.tsx`: generated root layout.
- `src/app/page.tsx`: generated starter page.
- `src/app/globals.css`: Tailwind and shadcn theme tokens.
- `components.json`: shadcn/ui Base UI and alias configuration.
- `src/lib/utils.ts`: shadcn-generated `cn` utility; excluded from mandatory coverage.
- `AGENTS.md`: Next.js-managed agent rule plus repository-specific Codex working agreements.
- `CLAUDE.md`: Next.js-generated compatibility import that points to `AGENTS.md`; it contains no independent rules.
- `vitest.config.mts`: Node-based unit-test, alias, source-inclusion, and coverage-threshold configuration.
- `lefthook.yml`: pre-commit and pre-push quality gates.
- `.gitignore`: generated artifacts including `.next`, dependencies, environment overrides, and coverage output.

---

### Task 1: Create the Official Next.js Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `public/*`
- Create: `src/app/*`
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `.gitignore`
- Preserve: `docs/superpowers/specs/2026-08-15-nextjs-ai-demo-design.md`
- Preserve: `docs/superpowers/plans/2026-08-15-nextjs-ai-demo-implementation.md`

**Interfaces:**
- Consumes: the existing Git repository and approved documents.
- Produces: a buildable Next.js 16.2.12 application using `src/`, App Router, Tailwind, ESLint, and pnpm.

- [ ] **Step 1: Confirm the temporary scaffold target is unused**

Run: `test ! -e /private/tmp/ai-demo-nextjs-scaffold`

Expected: exit code 0 with no output. Stop rather than overwrite it if the check fails.

- [ ] **Step 2: Generate the exact official scaffold outside the repository**

Run:

```bash
pnpm dlx create-next-app@16.2.12 /private/tmp/ai-demo-nextjs-scaffold --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-pnpm --no-react-compiler --agents-md --disable-git
```

Expected: create-next-app reports success and installs a Next.js application in `/private/tmp/ai-demo-nextjs-scaffold` without creating another Git repository.

- [ ] **Step 3: Copy generated project files into the current repository**

Run:

```bash
rsync -a --exclude node_modules --exclude .git --exclude .next /private/tmp/ai-demo-nextjs-scaffold/ ./
```

Expected: the root now contains `package.json`, `src/`, `public/`, configuration files, the generated `AGENTS.md`, and the `CLAUDE.md` compatibility import; the existing `docs/` and `.git/` remain intact.

- [ ] **Step 4: Correct the package name for this repository**

Modify the generated `package.json` name with `apply_patch`:

```diff
-  "name": "ai-demo-nextjs-scaffold",
+  "name": "ai_demo",
```

- [ ] **Step 5: Install dependencies in the repository**

Run: `pnpm install`

Expected: installation succeeds and the root `pnpm-lock.yaml` matches `package.json`.

- [ ] **Step 6: Verify the generated framework choices**

Run:

```bash
pnpm exec next --version
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: Next.js prints `16.2.12`; type-checking, linting, and the production build all exit 0.

- [ ] **Step 7: Commit the framework scaffold**

```bash
git add .gitignore AGENTS.md CLAUDE.md README.md eslint.config.mjs next.config.ts package.json pnpm-lock.yaml postcss.config.mjs public src tsconfig.json
git commit -m "chore: scaffold Next.js 16 application"
```

- [ ] **Step 8: Remove only the generated temporary scaffold**

Run: `rm -rf /private/tmp/ai-demo-nextjs-scaffold`

Expected: the explicit temporary directory is gone; repository files are unchanged.

---

### Task 2: Initialize shadcn/ui and Codex Guidance

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `src/app/globals.css`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the Next.js scaffold, Tailwind CSS, `src/`, and the `@/*` alias from Task 1.
- Produces: shadcn/ui Base UI configuration, the `cn(...inputs: ClassValue[]): string` utility, and Codex repository rules.

- [ ] **Step 1: Read the generated Next.js agent instructions and relevant bundled docs**

Run:

```bash
sed -n '1,220p' AGENTS.md
rg -n "Tailwind|CSS|App Router" node_modules/next/dist/docs/index.mdx node_modules/next/dist/docs/01-app -g '*.mdx'
```

Expected: the managed rule is visible and the installed Next.js documentation is available locally.

- [ ] **Step 2: Initialize shadcn/ui with the approved defaults**

Run:

```bash
pnpm dlx shadcn@latest init --base base --defaults
```

Expected: the CLI configures Base UI with the Nova preset, neutral CSS-variable theme, Lucide icons, `components.json`, global tokens, and `src/lib/utils.ts`, without adding a sample component.

- [ ] **Step 3: Verify the generated shadcn configuration**

Run:

```bash
pnpm dlx shadcn@latest info
rg -n 'base-nova|neutral|lucide|@/components|@/lib/utils' components.json
```

Expected: project info succeeds and every approved shadcn setting is present.

- [ ] **Step 4: Append project-specific Codex rules outside the managed block**

Append this exact section to `AGENTS.md` with `apply_patch`, after the Next.js-managed end marker:

```markdown

## Repository working agreements

- Use pnpm exclusively for dependency and script commands.
- Follow TypeScript and App Router conventions. Prefer React Server Components unless browser-side state, effects, or event handling require a Client Component.
- Before changing Next.js behavior, read the relevant version-matched documentation under `node_modules/next/dist/docs/`.
- Use the configured shadcn/ui Base UI foundation and add components individually with the shadcn CLI.
- Put substantial framework-independent logic under `src/lib/` and add or update colocated `*.test.ts` unit tests whenever major logic changes.
- Do not bypass Lefthook checks unless the reason is explicit and exceptional.
- Explain why a new production dependency is needed before adding it.
- Keep secrets in uncommitted environment files such as `.env.local`; never commit credentials.
- Before declaring implementation complete, run `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, and `pnpm build`.
```

- [ ] **Step 5: Verify shadcn and agent-guidance changes**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit shadcn and Codex configuration**

```bash
git add AGENTS.md components.json package.json pnpm-lock.yaml src/app/globals.css src/lib/utils.ts
git commit -m "chore: configure shadcn and Codex guidance"
```

---

### Task 3: Add Enforced Vitest Unit-Test Coverage

**Files:**
- Create: `vitest.config.mts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`
- Temporary test only: `src/lib/coverage-probe.ts`

**Interfaces:**
- Consumes: TypeScript, pnpm scripts, the `@/*` alias, and `src/lib/utils.ts` from earlier tasks.
- Produces: `test`, `test:run`, and `test:coverage` scripts plus an 80% per-file coverage gate for non-generated `src/lib` logic.

- [ ] **Step 1: Install the unit-test dependencies**

Run:

```bash
pnpm add -D vitest @vitest/coverage-v8 vite-tsconfig-paths
```

Expected: the packages are added to `devDependencies` and the lockfile updates.

- [ ] **Step 2: Add the exact Vitest configuration**

Create `vitest.config.mts` with `apply_patch`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.{ts,tsx}"],
      exclude: ["src/lib/utils.ts", "src/lib/**/*.test.{ts,tsx}"],
      thresholds: {
        perFile: true,
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

- [ ] **Step 3: Add test scripts and ignore coverage output**

Modify `package.json` scripts with `apply_patch`:

```json
"test": "vitest",
"test:run": "vitest run --passWithNoTests",
"test:coverage": "vitest run --coverage --passWithNoTests"
```

Append `/coverage` to `.gitignore` with `apply_patch`.

- [ ] **Step 4: Prove an untested logic file fails the coverage gate**

Temporarily create `src/lib/coverage-probe.ts` with `apply_patch`:

```ts
export function coverageProbe(input: boolean): "yes" | "no" {
  return input ? "yes" : "no";
}
```

Run: `pnpm test:coverage`

Expected: FAIL because `coverage-probe.ts` has 0% coverage, below the 80% per-file thresholds.

- [ ] **Step 5: Remove the temporary probe and verify the empty starter passes**

Delete `src/lib/coverage-probe.ts` with `apply_patch`.

Run:

```bash
pnpm test:run
pnpm test:coverage
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all commands exit 0; Vitest reports that no test files exist yet and permits the approved empty logic set.

- [ ] **Step 6: Commit the unit-test infrastructure**

```bash
git add .gitignore package.json pnpm-lock.yaml vitest.config.mts
git commit -m "test: configure Vitest coverage gates"
```

---

### Task 4: Add Lefthook Quality Gates

**Files:**
- Create: `lefthook.yml`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `lint`, `typecheck`, and `test:coverage` pnpm scripts. The `typecheck` script is added in this task; test scripts come from Task 3.
- Produces: installed Git hooks and directly runnable `pre-commit` and `pre-push` hook groups.

- [ ] **Step 1: Install the pinned Lefthook dependency**

Run: `pnpm add -D -E lefthook@2.1.10`

Expected: `lefthook` is recorded as the exact version `2.1.10` in `devDependencies`.

- [ ] **Step 2: Add type-check and hook-install scripts**

Modify `package.json` scripts with `apply_patch`:

```json
"typecheck": "tsc --noEmit",
"prepare": "lefthook install"
```

- [ ] **Step 3: Create the shared hook configuration**

Create `lefthook.yml` with `apply_patch`:

```yaml
pre-commit:
  jobs:
    - name: eslint staged source files
      glob: "*.{js,jsx,ts,tsx}"
      run: pnpm exec eslint {staged_files}

pre-push:
  parallel: true
  jobs:
    - name: lint
      run: pnpm lint
    - name: typecheck
      run: pnpm typecheck
    - name: unit tests with coverage
      run: pnpm test:coverage
```

- [ ] **Step 4: Install and validate the Git hooks**

Run:

```bash
pnpm lefthook install
pnpm lefthook validate
```

Expected: hooks install into the repository and configuration validation exits 0.

- [ ] **Step 5: Run the pre-push quality group directly**

Run: `pnpm lefthook run pre-push`

Expected: lint, type-checking, and unit-test coverage all run in parallel and exit 0.

- [ ] **Step 6: Commit the hook manager**

```bash
git add lefthook.yml package.json pnpm-lock.yaml
git commit -m "chore: enforce local quality gates"
```

Expected: the installed pre-commit hook runs; it skips cleanly when no JavaScript or TypeScript file is staged.

---

### Task 5: Perform Final Project Verification

**Files:**
- Verify only: all project and configuration files

**Interfaces:**
- Consumes: every deliverable from Tasks 1-4.
- Produces: evidence that the approved starter is complete and the repository is clean.

- [ ] **Step 1: Run the complete quality suite**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm lefthook validate
pnpm lefthook run pre-push
pnpm dlx shadcn@latest info
```

Expected: every command exits 0; the shadcn report identifies Next.js, Base UI, Nova, neutral CSS variables, and Lucide.

- [ ] **Step 2: Confirm exact framework and tool versions**

Run:

```bash
pnpm exec next --version
pnpm exec lefthook version
node --version
pnpm --version
```

Expected: Next.js is `16.2.12`, Lefthook is `2.1.10`, and the available Node.js and pnpm versions are printed for the handoff.

- [ ] **Step 3: Confirm repository integrity**

Run:

```bash
git diff --check
git status --short --branch
git log --oneline --decorate -8
```

Expected: no whitespace errors, a clean `main` worktree, and separate commits for the scaffold, shadcn/Codex configuration, Vitest, and Lefthook after the design and plan commits.
