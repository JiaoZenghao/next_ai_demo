# Demo Login Design

## Summary

Add a demo-only username/password login to the Next.js App Router application. Reuse the official shadcn `login-01` block, remove unsupported secondary authentication controls, validate one hardcoded user on the server, store login state in a 24-hour HTTP-only cookie, and redirect unauthenticated application requests to `/login`.

This implementation is intentionally not production authentication. It has no database, password hashing, account management, recovery flow, social login, authorization roles, or durable server-side session store.

## Approved Requirements

- Hardcode the demo username as `admin` and password as `admin123`.
- Reuse the official shadcn `login-01` block with the repository's Base Nova theme.
- Replace the block's email field with a username field.
- Remove Google login, forgot-password, and sign-up controls because those flows are not implemented.
- Show a generic inline error when credentials are invalid.
- Keep users logged in for 24 hours with an HTTP-only cookie.
- Redirect successful login to `/`.
- Redirect unauthenticated application requests to `/login`.
- Redirect authenticated requests for `/login` to `/`.
- Add a logout control on the home page that clears the session and redirects to `/login`.
- Add unit tests for credential validation and route-access decisions.

## Architecture

### Login UI

Install shadcn's `login-01` registry block so its Card, Field, Input, Label, and Button components are added as project-owned source. Adapt the generated page and form to the existing `src/` App Router layout and Base Nova component APIs.

The form is a Client Component only because it uses React `useActionState` to display Server Action state and pending status. It submits `username` and `password` to a Server Action. The submit button is disabled while pending. Invalid credentials produce one generic message without revealing which field was wrong.

### Credential Validation

Place the hardcoded credentials and a pure validation function in `src/lib/auth.ts`. The Server Action is the only application code that calls this function. The username and password are never embedded into the rendered page or client bundle.

The validator accepts strings and returns a boolean. It performs exact, case-sensitive comparisons. Empty or non-string form values are rejected.

### Session Cookie

Place cookie creation, inspection constants, and deletion in a focused server-side session module. A successful login sets a demo session marker with:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: process.env.NODE_ENV === "production"`
- `path: "/"`
- `maxAge: 86_400` seconds

The cookie marker is only a demo authentication flag; it is not a production-grade signed or encrypted session. Logout deletes the cookie and redirects to `/login`.

### Route Protection

Use `src/proxy.ts`, the Next.js 16 convention, for the optimistic route check. Proxy reads only the request cookie and performs no network or database work.

The route policy is centralized in a pure function so it can be unit tested:

- `/login` is public for unauthenticated users.
- An authenticated request to `/login` redirects to `/`.
- Any other matched application route without a valid demo session redirects to `/login`.
- Any other matched application route with a valid demo session continues.

The Proxy matcher excludes Next.js internals and static asset requests. Authentication is still demo-only; Proxy is not treated as a sufficient production authorization boundary.

## Data Flow

1. A visitor requests `/`.
2. Proxy sees no valid demo cookie and redirects to `/login`.
3. The visitor submits the shadcn login form.
4. The Server Action validates `admin` / `admin123` on the server.
5. Invalid credentials return generic form state and do not set a cookie.
6. Valid credentials set the 24-hour HTTP-only cookie and redirect to `/`.
7. Proxy sees the valid cookie and allows the home page to render.
8. Logout deletes the cookie and redirects to `/login`.

No requested-destination query parameter is preserved. Every successful login lands at `/`, keeping the demo scope small and deterministic.

## File Plan

- `src/app/login/page.tsx`: centered `login-01` page shell.
- `src/components/login-form.tsx`: adapted shadcn form without Google, recovery, or sign-up controls.
- `src/app/login/actions.ts`: login Server Action and typed action state.
- `src/app/actions/logout.ts`: logout Server Action.
- `src/lib/auth.ts`: hardcoded credential validation and pure route-policy decisions.
- `src/lib/auth.test.ts`: unit tests for valid, invalid, empty, authenticated, and unauthenticated cases.
- `src/lib/session.ts`: demo cookie constants and server-side cookie mutations.
- `src/proxy.ts`: optimistic cookie check and redirects.
- `src/app/page.tsx`: retain the starter content and add a small logout form.
- `src/components/ui/*`: shadcn-owned Button, Card, Field, Input, and Label source added by the registry block.

## Error Handling

- Missing or invalid form values return `Invalid username or password.`
- The form associates the error with the credential fields using shadcn Field validation attributes and accessible text.
- A failed login never sets or refreshes the cookie.
- Redirects occur only after cookie mutation completes.
- No credential value is logged or returned to the browser.

## Testing and Verification

Follow test-driven development for the pure authentication logic:

1. Write credential-validation tests and confirm they fail because the validator does not exist.
2. Implement the minimum validator and confirm those tests pass.
3. Write route-policy tests and confirm they fail because the policy does not exist.
4. Implement the minimum policy and confirm the complete unit test file passes.

Runtime verification uses the repository's `next-dev-loop` skill with `pnpm dev`:

- An unauthenticated visit to `/` redirects to `/login`.
- Invalid credentials keep the visitor on `/login`, show the generic error, and do not authenticate.
- Valid credentials redirect to `/` and render the protected page.
- An authenticated visit to `/login` redirects to `/`.
- Logout clears the session and returns to `/login`.
- Next.js MCP reports no compilation or runtime errors.
- Browser inspection confirms the intended form, pending state, redirects, and rendered result.

Before completion, run:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

## Sources

- Next.js bundled authentication guide: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- Next.js bundled Proxy guide: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- Next.js bundled cookies reference: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`
- Official shadcn login blocks: <https://ui.shadcn.com/blocks/login>
