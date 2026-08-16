# AI Demo

AI Demo is a Next.js application for exploring agentic AI development on a small, well-tested foundation.

> [!WARNING]
> Authentication is intentionally demo-only. The hardcoded credentials and forgeable session cookie are not suitable for production, and this project must not be used to protect real data.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- shadcn/ui with Base UI primitives
- Vitest and Testing Library for unit and component tests
- Playwright for production-mode end-to-end tests
- Lefthook for local quality checks

## Prerequisites

- Node.js 24
- pnpm 10.33.2

## Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated requests to the home page redirect to `/login`.

## Demo credentials

- Username: `admin`
- Password: `admin123`

These credentials are public by design. Replace the entire demo authentication model before adapting this application for production use.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Turbopack development server. |
| `pnpm build` | Create the production build. |
| `pnpm start` | Start the production server. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm test` | Run Vitest in watch mode. |
| `pnpm test:run` | Run the Vitest suite once. |
| `pnpm test:coverage` | Run Vitest with per-file coverage thresholds. |
| `pnpm test:e2e` | Build the app and run the production-mode Playwright suite. |
| `pnpm test:e2e:run` | Run Playwright against an existing production build. |

## Proxy and DAL boundary

`src/proxy.ts` is a lightweight, optimistic routing boundary. It redirects requests based on the demo session cookie, but it is not an authorization layer.

`src/data/auth.ts` is the server-only data access layer (DAL). Protected Server Components call `verifySession()` so the application validates the session again even if a request bypasses Proxy. Future Server Actions and data operations must perform their own DAL authorization at the point of access.

## Test pyramid

- Unit tests cover credential rules, session cookies, the authentication DAL, redirect policy, and Proxy behavior.
- Component tests exercise the login form through accessible user-facing controls.
- Proxy matcher tests cover application routes and static asset exclusions.
- Playwright tests exercise the complete login and logout journey against a production server.

Run the full local quality suite with:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm test:e2e:run
```

## Codex and Next.js MCP workflow

Before changing framework behavior, read the version-matched guides under `node_modules/next/dist/docs/`. Keep `pnpm dev` running for rendered changes and use the repository's `next-dev-loop` skill after every edit.

The loop checks both sides of the running application: the Next.js MCP endpoint at `/_next/mcp` reports routes, compilation issues, runtime errors, and render metadata, while `agent-browser` verifies browser behavior and the React tree. Run the lint, typecheck, coverage, and production build gates before declaring implementation complete.
