# Next.js Foundation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the current Next.js 16 AI Demo foundation with isolated tooling, a server-only authentication DAL, a complete test pyramid, faster CI, local Geist fonts, and project-specific content and metadata.

**Architecture:** Proxy remains a lightweight optimistic redirect boundary, while a new `server-only` DAL validates the demo session again inside protected Server Components. Vitest owns unit and component tests, Playwright owns production-mode browser flows, and all scanners explicitly exclude nested Codex worktrees.

**Tech Stack:** Next.js 16.3.1 App Router and Proxy, React 19.2.8, TypeScript 5, pnpm 10.33.2, Tailwind CSS 4, shadcn/Base UI, Vitest 4, Testing Library, Playwright Chromium, Lefthook, GitHub Actions.

## Global Constraints

- Use pnpm exclusively for dependency and script commands.
- Keep the hardcoded demo credentials exactly `admin` / `admin123`; do not present them as production authentication.
- Read the relevant version-matched guides under `node_modules/next/dist/docs/` before changing Next.js behavior.
- Keep Proxy free of slow I/O and treat it only as an optimistic redirect layer.
- Mark the DAL with `import "server-only"` and enforce the session again in the protected Server Component.
- Use TDD for new production behavior. Configuration, binary assets, documentation, and CI use explicit before/after probes because they do not expose a stable production-code unit boundary.
- Keep the login page free of Google login, forgot-password, and sign-up controls.
- Do not bypass Lefthook.
- Explain every new production dependency before adding it.
- Do not add a database, production auth library, state manager, or client data-fetching library.
- After every rendered/runtime edit, use the running `pnpm dev` server and the repository `next-dev-loop` skill.
- Final acceptance requires `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm build`, and `pnpm test:e2e`.

---

## File structure

### New files

- `src/data/auth.ts` — server-only demo session reading and enforcement.
- `src/data/auth.test.ts` — DAL unit tests for valid, invalid, missing, and redirect behavior.
- `src/proxy.test.ts` — Proxy matcher and full redirect response tests.
- `src/test/setup.ts` — shared Testing Library matcher setup.
- `playwright.config.ts` — isolated production-mode Chromium configuration.
- `e2e/auth.spec.ts` — complete browser authentication journey.
- `src/app/fonts/Geist-Variable.woff2` — pinned official Geist Sans variable font.
- `src/app/fonts/GeistMono-Variable.woff2` — pinned official Geist Mono variable font.
- `src/app/fonts/OFL.txt` — upstream SIL Open Font License.

### Modified files

- `eslint.config.mjs` — ignore nested worktrees and Playwright output.
- `tsconfig.json` — exclude nested worktrees while type-checking E2E sources.
- `vitest.config.mts` — native tsconfig path resolution, isolated excludes, setup, and DAL coverage.
- `package.json` / `pnpm-lock.yaml` — scripts, pinned pnpm version, Testing Library, Playwright, and `server-only`.
- `src/app/page.tsx` — DAL enforcement and project-specific protected home content.
- `src/components/login-form.test.tsx` — Testing Library interaction/accessibility tests.
- `src/app/layout.tsx` — local fonts and root metadata.
- `src/app/login/page.tsx` — title template compatibility and noindex metadata.
- `.github/workflows/ci.yml` — Next cache and E2E execution/artifacts.
- `README.md` — project-specific setup, architecture, scripts, tests, and warnings.

### Removed files

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

---

### Task 1: Isolate worktrees and modernize Vitest path resolution

**Files:**
- Modify: `eslint.config.mjs`
- Modify: `tsconfig.json`
- Modify: `vitest.config.mts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: existing pnpm, ESLint, TypeScript, and Vitest scripts.
- Produces: quality commands that inspect only the active checkout; Vitest resolves `@/*` without `vite-tsconfig-paths`.

- [ ] **Step 1: Record the existing isolation failure with a temporary nested-worktree probe**

Create `.worktrees/isolation-probe/.next/generated.ts` with:

```ts
const generatedModule = require("generated-module");

export { generatedModule };
```

Create `.worktrees/isolation-probe/src/duplicate.test.ts` with:

```ts
import { expect, it } from "vitest";

it("must never be discovered from a nested worktree", () => {
  expect(true).toBe(false);
});
```

Use `apply_patch` for both temporary text fixtures.

Run:

```bash
pnpm lint
pnpm test:run
```

Expected: lint inspects the generated probe and Vitest discovers the nested failing test, proving the isolation gap.

- [ ] **Step 2: Add explicit scanner exclusions**

Update ESLint ignores to contain:

```ts
globalIgnores([
  ".next/**",
  ".worktrees/**",
  "out/**",
  "build/**",
  "coverage/**",
  "playwright-report/**",
  "test-results/**",
  "next-env.d.ts",
])
```

Update TypeScript:

```json
"exclude": ["node_modules", ".worktrees"]
```

Update Vitest using its own defaults plus repository exclusions:

```ts
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, ".worktrees/**", "e2e/**"],
    setupFiles: ["./src/test/setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/{lib,data}/**/*.{ts,tsx}"],
      exclude: [
        "src/lib/utils.ts",
        "src/{lib,data}/**/*.test.{ts,tsx}",
      ],
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

Create an initially empty `src/test/setup.ts` so the shared setup path exists before component dependencies are installed.

- [ ] **Step 3: Remove the obsolete plugin**

Run:

```bash
pnpm remove -D vite-tsconfig-paths
```

Reason: Vitest/Vite already emits a migration notice directing this project to native `resolve.tsconfigPaths`; retaining the plugin adds redundant configuration and warning output.

- [ ] **Step 4: Verify the probe is ignored and aliases still resolve**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm test:coverage
```

Expected: every command exits 0, no `vite-tsconfig-paths` migration warning appears, and the deliberately failing nested test is not discovered.

- [ ] **Step 5: Remove the temporary probe and commit**

Remove only `.worktrees/isolation-probe`, then run `git diff --check` and commit:

```bash
git add eslint.config.mjs tsconfig.json vitest.config.mts package.json pnpm-lock.yaml src/test/setup.ts
git commit -m "chore: isolate worktree quality checks"
```

---

### Task 2: Add the server-only authentication DAL with TDD

**Files:**
- Create: `src/data/auth.test.ts`
- Create: `src/data/auth.ts`
- Modify: `src/app/page.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `DEMO_SESSION_COOKIE`, `DEMO_SESSION_VALUE`, async `cookies()`, and Next.js `redirect()`.
- Produces: `DemoSession`, `getDemoSession(): Promise<DemoSession | null>`, and `verifySession(): Promise<DemoSession>`.

- [ ] **Step 1: Read version-matched security documentation**

Read completely:

```text
node_modules/next/dist/docs/01-app/02-guides/authentication.md
node_modules/next/dist/docs/01-app/02-guides/data-security.md
node_modules/next/dist/docs/01-app/02-guides/server-actions.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
```

Confirm the implementation keeps Proxy optimistic and performs secure checks close to protected application/data access.

- [ ] **Step 2: Add the justified production dependency**

Run:

```bash
pnpm add server-only
```

Reason: the Next.js-recommended marker makes client imports of the DAL fail during compilation and protects future secrets or privileged data access from environment poisoning.

- [ ] **Step 3: Write failing DAL tests**

Create `src/data/auth.test.ts` with hoisted mocks for `next/headers`, `next/navigation`, and the marker module. The tests must express this public contract:

```ts
vi.mock("server-only", () => ({}));

it("returns the minimal session for the exact demo cookie", async () => {
  cookieGetMock.mockReturnValue({ value: DEMO_SESSION_VALUE });
  await expect(getDemoSession()).resolves.toEqual({ isAuthenticated: true });
});

it.each([undefined, { value: "" }, { value: "forged" }])(
  "rejects a missing or invalid cookie %#",
  async (cookie) => {
    cookieGetMock.mockReturnValue(cookie);
    await expect(getDemoSession()).resolves.toBeNull();
  },
);

it("returns the verified session", async () => {
  cookieGetMock.mockReturnValue({ value: DEMO_SESSION_VALUE });
  await expect(verifySession()).resolves.toEqual({ isAuthenticated: true });
  expect(redirectMock).not.toHaveBeenCalled();
});

it("redirects an invalid session to login", async () => {
  cookieGetMock.mockReturnValue(undefined);
  await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
  expect(redirectMock).toHaveBeenCalledWith("/login");
});
```

Run:

```bash
pnpm exec vitest run src/data/auth.test.ts
```

Expected: FAIL because `src/data/auth.ts` does not exist.

- [ ] **Step 4: Implement the minimal DAL**

Create `src/data/auth.ts`:

```ts
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth";

export type DemoSession = Readonly<{ isAuthenticated: true }>;

const DEMO_SESSION: DemoSession = Object.freeze({ isAuthenticated: true });

export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEMO_SESSION_COOKIE)?.value;

  return value === DEMO_SESSION_VALUE ? DEMO_SESSION : null;
}

export async function verifySession(): Promise<DemoSession> {
  const session = await getDemoSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
```

- [ ] **Step 5: Verify DAL green, then enforce it in the home page**

Run the focused test and expect PASS:

```bash
pnpm exec vitest run src/data/auth.test.ts
```

Make `Home` async and call `await verifySession()` before returning JSX. Do not pass the session into a Client Component.

- [ ] **Step 6: Run static and runtime checks**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
```

Then use `next-dev-loop` against the already running server to confirm `/` still redirects while unauthenticated, valid login reaches `/`, `get_compilation_issues` is empty, and React introspection identifies `Server(Home)`.

- [ ] **Step 7: Commit**

```bash
git add src/data/auth.ts src/data/auth.test.ts src/app/page.tsx package.json pnpm-lock.yaml
git commit -m "feat: enforce sessions through auth DAL"
```

---

### Task 3: Upgrade component tests to Testing Library

**Files:**
- Modify: `src/test/setup.ts`
- Modify: `src/components/login-form.test.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `LoginForm`, its existing `useActionState` boundary, and Vitest's per-file environment directive.
- Produces: browser-oriented component tests with accessible DOM queries and interaction-ready utilities.

- [ ] **Step 1: Install browser-test development dependencies**

Run:

```bash
pnpm add -D @testing-library/jest-dom @testing-library/react @testing-library/user-event jsdom
```

Reason: these packages provide DOM rendering, accessible queries, user-level interaction, and DOM assertions for Client Components without changing the production bundle.

- [ ] **Step 2: Configure matchers and write the upgraded tests before replacing the old test implementation**

Put this in `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Start `src/components/login-form.test.tsx` with:

```ts
// @vitest-environment jsdom
```

Replace static-markup assertions with Testing Library cases that assert:

```ts
render(<LoginForm />);

expect(screen.getByRole("textbox", { name: "Username" })).toBeRequired();
expect(screen.getByLabelText("Password")).toBeRequired();
expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
expect(screen.queryByText(/google|forgot password|sign up/i)).not.toBeInTheDocument();
```

For the invalid state, assert both fields have `aria-describedby="login-error"` and the error has `role="alert"`. For the pending state, assert the button is disabled and named `Signing in...`.

- [ ] **Step 3: Run the focused tests**

```bash
pnpm exec vitest run src/components/login-form.test.tsx
```

Expected: PASS with at least initial, invalid, and pending cases; failures must be fixed in the test harness unless they expose a genuine component bug, in which case follow a new RED/GREEN cycle for that behavior.

- [ ] **Step 4: Run the quality suite and commit**

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
git diff --check
git add src/test/setup.ts src/components/login-form.test.tsx package.json pnpm-lock.yaml
git commit -m "test: strengthen login component coverage"
```

---

### Task 4: Add Proxy matcher regression coverage

**Files:**
- Create: `src/proxy.test.ts`
- Modify: `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: `proxy`, exported `config`, `NextRequest`, and `unstable_doesProxyMatch`.
- Produces: regression coverage for both matcher selection and redirect/allow responses.

- [ ] **Step 1: Read the Proxy unit-testing section**

Read the `Unit testing (experimental)` section in:

```text
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
```

- [ ] **Step 2: Write matcher tests**

Create `src/proxy.test.ts` and assert:

```ts
it.each(["/", "/login", "/settings", "/nested/path"])(
  "matches application route %s",
  (url) => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(true);
  },
);

it.each([
  "/_next/static/chunk.js",
  "/_next/image?url=%2Flogo.png&w=64&q=75",
  "/favicon.ico",
  "/logo.svg",
  "/photo.png",
  "/font.woff2",
])("does not match static asset %s", (url) => {
  expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(false);
});
```

Move the existing direct `proxy()` tests from `src/lib/auth.test.ts` into this file and add the authenticated `/login` redirect case.

- [ ] **Step 3: Run RED and adjust the matcher minimally**

```bash
pnpm exec vitest run src/proxy.test.ts
```

Expected: the font case fails because the current matcher does not exclude WOFF/WOFF2 assets.

Extend only the matcher extension group required by the tests, including `ico`, `svg`, common raster images, `woff`, and `woff2`. Do not exclude application routes or Server Action POSTs.

- [ ] **Step 4: Verify green and commit**

```bash
pnpm exec vitest run src/proxy.test.ts src/lib/auth.test.ts
pnpm lint
pnpm typecheck
pnpm test:coverage
git diff --check
git add src/proxy.ts src/proxy.test.ts src/lib/auth.test.ts
git commit -m "test: cover proxy matching boundaries"
```

---

### Task 5: Self-host Geist and remove scaffold content

**Files:**
- Create: `src/app/fonts/Geist-Variable.woff2`
- Create: `src/app/fonts/GeistMono-Variable.woff2`
- Create: `src/app/fonts/OFL.txt`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `README.md`
- Modify: `package.json`
- Remove: `public/file.svg`
- Remove: `public/globe.svg`
- Remove: `public/next.svg`
- Remove: `public/vercel.svg`
- Remove: `public/window.svg`

**Interfaces:**
- Consumes: existing Geist CSS variable names and shadcn logout button.
- Produces: local `next/font` classes, `AI Demo` metadata, protected project-specific home content, and project documentation.

- [ ] **Step 1: Read version-matched font, metadata, and production guides**

Read completely:

```text
node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md
node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md
node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md
node_modules/next/dist/docs/01-app/02-guides/production-checklist.md
```

- [ ] **Step 2: Download pinned official font assets and license**

Download exactly Vercel Geist release `v1.7.1`:

```text
https://raw.githubusercontent.com/vercel/geist-font/v1.7.1/packages/next/dist/fonts/geist-sans/Geist-Variable.woff2
https://raw.githubusercontent.com/vercel/geist-font/v1.7.1/packages/next/dist/fonts/geist-mono/GeistMono-Variable.woff2
https://raw.githubusercontent.com/vercel/geist-font/v1.7.1/OFL.txt
```

Write them respectively to:

```text
src/app/fonts/Geist-Variable.woff2
src/app/fonts/GeistMono-Variable.woff2
src/app/fonts/OFL.txt
```

Verify the two WOFF2 files are non-empty binary font files and the license identifies SIL Open Font License 1.1.

- [ ] **Step 3: Replace Google fonts with `next/font/local`**

Use:

```ts
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});
```

Set root metadata to:

```ts
export const metadata: Metadata = {
  title: {
    default: "AI Demo",
    template: "%s | AI Demo",
  },
  description: "A Next.js application for exploring agentic AI development.",
};
```

- [ ] **Step 4: Clean page metadata and content**

Set login metadata to:

```ts
export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to the AI Demo application.",
  robots: { index: false, follow: false },
};
```

Replace the home scaffold with a server-rendered layout containing the `AI Demo` heading, the message `You are signed in to the protected AI Demo application.`, and the existing logout form/button. Remove the Next.js image import and logo.

- [ ] **Step 5: Clean repository scaffolding**

Delete only the five listed create-next-app SVGs. Replace README with exact sections for:

- overview and demo-only warning;
- stack;
- prerequisites (`Node.js 24`, `pnpm 10.33.2`);
- install and `pnpm dev`;
- demo credentials;
- scripts including E2E;
- Proxy versus DAL boundary;
- test pyramid;
- Codex/Next.js MCP workflow.

Add to `package.json`:

```json
"packageManager": "pnpm@10.33.2"
```

- [ ] **Step 6: Verify no remote font build dependency**

Run:

```bash
rg "next/font/google|fonts.googleapis.com|Create Next App|edit the page.tsx" src README.md
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

Expected: `rg` returns no matches and the normal build succeeds without a Google Fonts fetch.

Run `next-dev-loop` to verify titles `Login | AI Demo` and `AI Demo`, updated home content, clean compilation/runtime state, and a populated React tree.

- [ ] **Step 7: Commit**

```bash
git add src/app/fonts src/app/layout.tsx src/app/login/page.tsx src/app/page.tsx README.md package.json public
git commit -m "chore: self-host fonts and remove scaffolding"
```

---

### Task 6: Add production-mode Playwright E2E coverage

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/auth.spec.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: production `next build`/`next start`, `/login`, `/`, and demo credentials.
- Produces: `pnpm test:e2e` for local build-plus-browser verification and `pnpm test:e2e:run` for CI after an existing build.

- [ ] **Step 1: Install Playwright as a development dependency**

Run:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

Reason: Playwright verifies real navigation, cookies, Proxy, Server Actions, and Server Components in Chromium without affecting the production bundle.

- [ ] **Step 2: Add scripts**

Add:

```json
"test:e2e": "pnpm build && pnpm test:e2e:run",
"test:e2e:run": "playwright test"
```

- [ ] **Step 3: Configure an isolated production server**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm exec next start -p 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
```

Ignore `/playwright-report/` and `/test-results/` in `.gitignore`.

- [ ] **Step 4: Write the complete auth journey**

Create `e2e/auth.spec.ts` using role/label locators. The suite must:

```ts
test("protects the app and completes the demo login journey", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

  await page.getByRole("textbox", { name: "Username" }).fill("admin");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toHaveText("Invalid username or password.");

  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "AI Demo" })).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
```

Also assert the page title and that Google, forgot-password, and sign-up controls are absent.

- [ ] **Step 5: Run E2E and commit**

```bash
pnpm test:e2e
git diff --check
git add playwright.config.ts e2e/auth.spec.ts package.json pnpm-lock.yaml .gitignore
git commit -m "test: add production auth journey"
```

Expected: Chromium passes the complete production flow and no report artifacts are tracked.

---

### Task 7: Optimize GitHub Actions for Next.js and E2E

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `pnpm-lock.yaml`, `.next/cache`, `pnpm build`, and `pnpm test:e2e:run`.
- Produces: cached builds, browser flow validation, and failure-only Playwright artifacts.

- [ ] **Step 1: Read the Next.js CI build caching guide**

Read `node_modules/next/dist/docs/01-app/02-guides/ci-build-caching.md` completely and preserve existing least-privilege permissions and concurrency cancellation.

- [ ] **Step 2: Add Next build caching**

After dependency installation, add `actions/cache@v4` for:

```yaml
path: ${{ github.workspace }}/.next/cache
key: ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('src/**/*', 'e2e/**/*', 'next.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'playwright.config.ts') }}
restore-keys: |
  ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-
```

- [ ] **Step 3: Add browser verification and artifacts**

After `pnpm build`, add:

```yaml
- name: Install Playwright Chromium
  run: pnpm exec playwright install --with-deps chromium

- name: End-to-end tests
  run: pnpm test:e2e:run

- name: Upload Playwright artifacts
  if: failure()
  uses: actions/upload-artifact@v6
  with:
    name: playwright-report-${{ github.run_attempt }}
    path: |
      playwright-report/
      test-results/
    if-no-files-found: ignore
    retention-days: 7
```

- [ ] **Step 4: Validate workflow syntax and local command parity**

Inspect the final YAML and run:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:e2e:run
```

Expected: all local equivalents of CI pass; `pnpm test:e2e:run` reuses the build produced immediately before it.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: cache builds and run auth e2e"
```

---

### Task 8: Final runtime, quality, and repository verification

**Files:**
- Review only: complete feature diff from the design-doc commit to HEAD.

**Interfaces:**
- Consumes: every prior task.
- Produces: evidence that the complete implementation meets the approved design.

- [ ] **Step 1: Run the complete fresh quality suite**

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:e2e
git diff --check
```

Expected: all commands exit 0; coverage meets the configured per-file 80% floors; the build contains no Google Fonts network request.

- [ ] **Step 2: Verify active-checkout isolation**

Confirm test counts correspond only to the active checkout, ESLint does not print any `.worktrees` path, and `git status --short` contains no Playwright, coverage, or Next.js output.

- [ ] **Step 3: Run the full `next-dev-loop` acceptance journey**

With `pnpm dev` running, verify both views:

- `/_next/mcp` lists `get_compilation_issues` and returns `issues: []`;
- `get_errors` returns no configuration or session errors;
- `get_routes` includes `/` and `/login`;
- browser session proves unauthenticated redirect, invalid error, valid login, authenticated `/login` redirect, and logout reprotection;
- login controls and titles match the spec;
- React introspection returns the Root, layout, protected Home, login form, and generated shadcn button boundaries as appropriate.

Close only the verification browser and leave `next dev` running for the next development loop.

- [ ] **Step 4: Review documentation and security claims**

Confirm README and UI call authentication demo-only, no committed secret exists, no scaffold wording/assets remain, and DAL/Proxy responsibilities match the design.

- [ ] **Step 5: Request final code review**

Generate the complete diff range and request an independent review focused on:

- session enforcement and Server Action security assumptions;
- worktree exclusions;
- test quality and E2E determinism;
- CI cache/artifact correctness;
- font license and build independence;
- metadata, accessibility, and absence of scaffold content.

Resolve all Critical and Important findings, re-run scoped checks, then re-run the complete suite before integration.
