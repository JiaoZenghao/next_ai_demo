# Next.js Foundation Hardening Design

## Goal

Strengthen the current Next.js 16 AI Demo foundation without replacing the intentionally hardcoded demo authentication. The work isolates Codex worktrees from quality tools, adds a server-only authentication DAL, expands the test pyramid, improves CI, removes build-time Google Fonts access, and replaces the remaining create-next-app content and metadata.

## Scope

This change will:

- keep the demo credentials `admin` / `admin123` and clearly document that they are not production authentication;
- keep Proxy as a lightweight optimistic redirect layer;
- add server-side session verification at the protected page boundary;
- add unit, component, Proxy matcher, and browser end-to-end coverage;
- make CI exercise the same quality gates and production login flow;
- self-host the official Geist Sans and Geist Mono variable fonts;
- replace scaffold metadata, page content, README content, and unused public assets.

This change will not:

- add a database, password hashing, user registration, social login, roles, or a production authentication library;
- add client-side state management or a client data-fetching library;
- enable Cache Components or introduce application data caching;
- change GitHub repository settings such as branch protection.

## Architecture

### Authentication boundaries

Authentication uses defense in depth:

1. `src/proxy.ts` reads the session cookie and performs fast redirects between protected routes and `/login`. It remains free of database or other slow I/O.
2. A new `src/data/auth.ts` module is marked with `import "server-only"`. It reads and strictly validates the session cookie at the server application boundary.
3. `getDemoSession()` returns either a minimal immutable demo-session DTO or `null`.
4. `verifySession()` redirects unauthenticated requests to `/login` and returns the minimal DTO for authenticated requests.
5. The protected home Server Component calls `verifySession()` before rendering. A request that bypasses or no longer matches Proxy is therefore still rejected by the application.
6. Logout remains idempotent: it deletes the cookie and redirects to `/login`, including when the cookie is already absent or invalid.

The demo session remains deliberately forgeable and must not be represented as production security. Future data mutations must call `verifySession()` or a resource-specific authorization function inside their Server Action or DAL operation; page and Proxy checks do not authorize Server Actions.

### Module responsibilities

- `src/lib/auth.ts`: framework-independent credential validation, cookie identifiers, and redirect policy.
- `src/lib/session.ts`: server-side cookie creation/deletion primitives.
- `src/data/auth.ts`: server-only session reading and enforcement.
- `src/proxy.ts`: optimistic request routing only.
- `src/app/page.tsx`: protected Server Component that consumes the DAL.
- `src/app/login/actions.ts`: credential validation and session creation.
- `src/app/actions/logout.ts`: idempotent session deletion.

## Worktree and tool isolation

Quality tools must never inspect a nested Codex worktree from the main checkout.

- ESLint globally ignores `.worktrees/**`, `playwright-report/**`, and `test-results/**` in addition to existing generated directories.
- TypeScript excludes `.worktrees/**` while continuing to type-check application tests and E2E tests.
- Vitest excludes `.worktrees/**` and `e2e/**` so it runs only unit and component tests owned by the active checkout.
- Playwright uses `e2e/` as its explicit test directory and writes reports outside source directories.
- Vite's native `resolve.tsconfigPaths` option replaces the now-redundant `vite-tsconfig-paths` plugin and removes its migration warning.

These exclusions prevent generated `.next` files from being linted and prevent identical tests in a nested worktree from being counted twice.

## Test pyramid

### Unit tests

Vitest continues to test framework-independent authentication and session policy. Coverage expands to include the new DAL where practical, using narrowly scoped mocks only for Next.js request APIs and redirects.

Required cases include:

- exact and invalid demo credentials;
- cookie security attributes in production and non-production;
- valid, invalid, and missing DAL sessions;
- `verifySession()` returning the minimal DTO or redirecting;
- authenticated and unauthenticated redirect policy;
- Proxy behavior for protected and public routes;
- Proxy matcher inclusion/exclusion using `unstable_doesProxyMatch`, including Next.js assets, favicon, public font/image assets, and application routes.

### Component tests

The login form uses Testing Library with jsdom and `user-event`. Component tests cover:

- accessible username and password fields;
- generic error association with both invalid fields;
- absence of an error association in the initial state;
- disabled and updated submit copy while the action is pending;
- absence of Google, forgot-password, and sign-up controls.

The component test environment is selected only for browser-oriented test files; server logic remains in the Node test environment.

### End-to-end tests

Playwright runs Chromium against the production application. Tests use an isolated browser context and cover:

- unauthenticated `/` requests redirecting to `/login`;
- invalid credentials staying on `/login` with the generic error;
- `admin` / `admin123` reaching the protected home page;
- authenticated `/login` requests redirecting to `/`;
- logout returning to `/login` and reprotecting `/`;
- required login controls and removal of unsupported alternatives.

Playwright configuration builds and starts the production server automatically for local `pnpm test:e2e`. CI may reuse the same web-server configuration. Traces, screenshots, and video are retained on failure only.

## CI design

The GitHub Actions workflow keeps read-only repository permissions and cancellation of superseded runs.

The workflow will:

1. use the pnpm and Node versions declared by the repository;
2. restore pnpm's dependency cache through `actions/setup-node`;
3. restore `.next/cache` with a key derived from the OS, lockfile, and relevant source/configuration files;
4. install dependencies with `pnpm install --frozen-lockfile`;
5. run lint, TypeScript, and unit/component coverage;
6. run the normal `pnpm build` command;
7. install Playwright Chromium and required system dependencies;
8. run the production-mode E2E suite;
9. upload Playwright reports and test artifacts only when E2E fails.

The workflow does not perform deployments or mutate GitHub repository configuration.

## Local fonts

The official Geist Sans and Geist Mono variable WOFF2 files will be committed under `src/app/fonts/` together with the applicable upstream license notice. `src/app/layout.tsx` will use `next/font/local` and preserve these CSS variables:

- `--font-geist-sans`
- `--font-geist-mono`

The existing Tailwind theme mappings remain valid. No font request or download is allowed during `pnpm build`; the build must succeed without access to `fonts.googleapis.com`.

## Page content and metadata

Root metadata will use:

- default title `AI Demo`;
- title template `%s | AI Demo`;
- a project-specific description for the Next.js AI Demo.

The login page declares the title `Login`, producing `Login | AI Demo`, and sets `robots` to `noindex, nofollow`.

The protected home page remains a Server Component and renders:

- the `AI Demo` heading;
- a concise authenticated-state message;
- the existing shadcn `Log out` action button.

It removes the Next.js logo and all create-next-app instructional copy without adding client-side JavaScript.

## Scaffold and repository cleanup

- Remove unused create-next-app assets from `public/`: `next.svg`, `vercel.svg`, `globe.svg`, `window.svg`, and `file.svg`.
- Replace the default README with project-specific setup, stack, scripts, demo credentials, architecture, test pyramid, and production-security warnings.
- Add `packageManager: pnpm@10.33.2` so local development and CI resolve the same pnpm release.
- Remove `vite-tsconfig-paths` after adopting Vite's native TypeScript path resolution.
- Retain shadcn as a production dependency because `src/app/globals.css` imports `shadcn/tailwind.css`.
- Do not remove other dependencies unless repository search proves they are unused and the removal is covered by the normal quality gates.

## Error handling and security behavior

- Invalid login attempts always return the existing generic error and never reveal which credential was incorrect.
- Missing, malformed, or unexpected session cookie values are unauthenticated.
- DAL enforcement uses Next.js `redirect()` and does not expose session internals to Client Components.
- No secret is added to committed environment files.
- The README and UI must continue to label this authentication as demo-only.

## Verification and acceptance

Implementation is complete only when all of the following pass from the main checkout with no nested-worktree duplication:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:e2e
```

Coverage must retain the configured 80% per-file floor for substantial framework-independent logic. The runtime verification must also use the repository's `next-dev-loop` process to confirm:

- `get_compilation_issues` returns no issues;
- Next.js reports no configuration, server, or browser runtime errors;
- the `/` and `/login` routes are present;
- the unauthenticated, valid-login, invalid-login, authenticated-login-page, and logout flows behave as specified;
- React introspection returns a populated tree for the rendered page;
- the build no longer attempts to fetch Google Fonts.
