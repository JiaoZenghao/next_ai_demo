# Demo Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shadcn-based demo login with server-side hardcoded credential validation, a 24-hour HTTP-only cookie, protected routes, and logout.

**Architecture:** Keep credential and route-policy decisions in a small pure module with Vitest coverage. Server Actions mutate the cookie, Next.js 16 Proxy performs optimistic redirects, and the adapted shadcn `login-01` form uses `useActionState` for pending and error feedback.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, shadcn/ui Base Nova, Tailwind CSS v4, Server Actions, Next.js Proxy, Vitest, next-dev-loop, agent-browser

## Global Constraints

- Hardcode the demo username as `admin` and password as `admin123`.
- Treat this as demo-only authentication, not a production security boundary.
- Reuse shadcn `login-01`; do not recreate its Card, Field, Input, Label, or Button primitives manually.
- Remove Google login, forgot-password, and sign-up controls.
- Validate credentials only on the server and never log or return them.
- Use a 24-hour cookie with `httpOnly`, `sameSite: "lax"`, production-only `secure`, and `path: "/"`.
- Redirect unauthenticated application routes to `/login`, authenticated `/login` requests to `/`, successful login to `/`, and logout to `/login`.
- Use pnpm exclusively and add no authentication dependency or database.
- Follow TDD for credential validation and route-policy decisions.
- After rendered or runtime edits, verify with the repository's `next-dev-loop` skill.
- Before completion, run lint, type-checking, coverage, and a production build.

## File Map

- `src/lib/auth.ts`: demo credentials, cookie identity, credential validation, and pure redirect policy.
- `src/lib/auth.test.ts`: exhaustive unit tests for credential and redirect decisions.
- `src/lib/session.ts`: server-only cookie creation and deletion.
- `src/proxy.ts`: request-cookie inspection and optimistic redirects.
- `src/app/login/actions.ts`: login Server Action and generic error state.
- `src/app/login/page.tsx`: centered shadcn `login-01` page shell and metadata.
- `src/components/login-form.tsx`: adapted username/password form with pending and invalid states.
- `src/app/actions/logout.ts`: logout Server Action.
- `src/app/page.tsx`: existing protected starter page plus logout control.
- `src/components/ui/{button,card,field,input,label}.tsx`: generated shadcn primitives installed by `login-01`.

---

### Task 1: Build the Pure Authentication Policy with TDD

**Files:**
- Create: `src/lib/auth.test.ts`
- Create: `src/lib/auth.ts`

**Interfaces:**
- Produces: `DEMO_SESSION_COOKIE: string`
- Produces: `DEMO_SESSION_VALUE: string`
- Produces: `validateCredentials(username: unknown, password: unknown): boolean`
- Produces: `getAuthRedirect(pathname: string, isAuthenticated: boolean): "/" | "/login" | null`

- [ ] **Step 1: Write the failing authentication-policy tests**

Create `src/lib/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  getAuthRedirect,
  validateCredentials,
} from "./auth";

describe("validateCredentials", () => {
  it("accepts the exact demo credentials", () => {
    expect(validateCredentials("admin", "admin123")).toBe(true);
  });

  it.each([
    ["Admin", "admin123"],
    ["admin", "Admin123"],
    ["admin", "wrong"],
    ["wrong", "admin123"],
    ["", "admin123"],
    ["admin", ""],
    [null, "admin123"],
    ["admin", null],
  ])("rejects invalid credentials %#", (username, password) => {
    expect(validateCredentials(username, password)).toBe(false);
  });
});

describe("getAuthRedirect", () => {
  it("allows an unauthenticated request for the login page", () => {
    expect(getAuthRedirect("/login", false)).toBeNull();
  });

  it("redirects an authenticated login-page request home", () => {
    expect(getAuthRedirect("/login", true)).toBe("/");
  });

  it.each(["/", "/settings", "/nested/path"])(
    "redirects unauthenticated access to %s",
    (pathname) => {
      expect(getAuthRedirect(pathname, false)).toBe("/login");
    },
  );

  it.each(["/", "/settings", "/nested/path"])(
    "allows authenticated access to %s",
    (pathname) => {
      expect(getAuthRedirect(pathname, true)).toBeNull();
    },
  );
});

describe("demo session constants", () => {
  it("uses stable non-empty cookie identifiers", () => {
    expect(DEMO_SESSION_COOKIE).toBe("ai_demo_session");
    expect(DEMO_SESSION_VALUE).toBe("authenticated");
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm exec vitest run src/lib/auth.test.ts
```

Expected: FAIL because `src/lib/auth.ts` does not exist. Confirm the failure is caused by the missing production module, not a test syntax error.

- [ ] **Step 3: Implement the minimum pure policy**

Create `src/lib/auth.ts`:

```ts
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin123";

export const DEMO_SESSION_COOKIE = "ai_demo_session";
export const DEMO_SESSION_VALUE = "authenticated";

export function validateCredentials(
  username: unknown,
  password: unknown,
): boolean {
  return username === DEMO_USERNAME && password === DEMO_PASSWORD;
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
): "/" | "/login" | null {
  if (pathname === "/login") {
    return isAuthenticated ? "/" : null;
  }

  return isAuthenticated ? null : "/login";
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
pnpm exec vitest run src/lib/auth.test.ts
```

Expected: PASS with all credential, redirect, and cookie-constant cases green.

- [ ] **Step 5: Confirm per-file coverage for the policy**

Run:

```bash
pnpm test:coverage
```

Expected: PASS and `src/lib/auth.ts` meets the configured 80% per-file thresholds.

- [ ] **Step 6: Commit the pure policy**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat: add demo authentication policy"
```

---

### Task 2: Add Cookie Session Management and Route Protection

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/proxy.ts`
- Test: `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: `DEMO_SESSION_COOKIE`, `DEMO_SESSION_VALUE`, and `getAuthRedirect()` from `@/lib/auth`.
- Produces: `createDemoSession(): Promise<void>`
- Produces: `deleteDemoSession(): Promise<void>`
- Produces: Next.js `proxy(request: NextRequest): NextResponse`

- [ ] **Step 1: Implement server-side cookie mutations**

Create `src/lib/session.ts`:

```ts
import { cookies } from "next/headers";

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth";

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export async function createDemoSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
```

- [ ] **Step 2: Implement the Next.js 16 Proxy**

Create `src/proxy.ts`:

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  getAuthRedirect,
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  const sessionValue = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const isAuthenticated = sessionValue === DEMO_SESSION_VALUE;
  const redirectTo = getAuthRedirect(
    request.nextUrl.pathname,
    isAuthenticated,
  );

  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 3: Verify policy tests, lint, and types**

Run:

```bash
pnpm exec vitest run src/lib/auth.test.ts
pnpm lint
pnpm typecheck
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit session and route protection**

```bash
git add src/lib/session.ts src/proxy.ts
git commit -m "feat: protect routes with demo session"
```

---

### Task 3: Install and Adapt the shadcn Login Block

**Files:**
- Create via shadcn: `src/components/ui/button.tsx`
- Create via shadcn: `src/components/ui/card.tsx`
- Create via shadcn: `src/components/ui/field.tsx`
- Create via shadcn: `src/components/ui/input.tsx`
- Create via shadcn: `src/components/ui/label.tsx`
- Create/replace: `src/app/login/page.tsx`
- Create/replace: `src/components/login-form.tsx`
- Create: `src/app/login/actions.ts`

**Interfaces:**
- Consumes: `validateCredentials(username, password)` and `createDemoSession()`.
- Produces: `LoginState = { error: string | null }`
- Produces: `login(previousState: LoginState, formData: FormData): Promise<LoginState>`
- Produces: accessible `/login` page without Google, recovery, or sign-up controls.

- [ ] **Step 1: Install the official `login-01` block**

Run:

```bash
pnpm dlx shadcn@latest add login-01 --yes
```

Expected: the login page, login form, and Base Nova UI dependencies are generated under the configured `src/` aliases. Review `git status --short` and stop if the CLI overwrites any file outside the listed task scope.

- [ ] **Step 2: Add the login Server Action**

Create `src/app/login/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";

import { validateCredentials } from "@/lib/auth";
import { createDemoSession } from "@/lib/session";

export type LoginState = {
  error: string | null;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!validateCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  await createDemoSession();
  redirect("/");
}
```

- [ ] **Step 3: Replace the generated form with the approved username form**

Replace `src/components/login-form.tsx` with:

```tsx
"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: LoginState = { error: null };

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const invalid = Boolean(state.error);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your demo username and password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  aria-invalid={invalid}
                  required
                />
              </Field>
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={invalid}
                  required
                />
                {state.error ? (
                  <FieldDescription role="alert">
                    {state.error}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Signing in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Set the login page shell and metadata**

Replace `src/app/login/page.tsx` with:

```tsx
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login | AI Demo",
  description: "Sign in to the AI Demo application.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Confirm unsupported controls are absent**

Run:

```bash
rg -n "Google|Forgot|Sign up|email" src/app/login src/components/login-form.tsx
```

Expected: no matches.

- [ ] **Step 6: Verify the login slice statically**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run src/lib/auth.test.ts
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 7: Commit the login UI**

```bash
git add src/app/login src/components/login-form.tsx src/components/ui
git commit -m "feat: add shadcn demo login"
```

---

### Task 4: Add Logout to the Protected Home Page

**Files:**
- Create: `src/app/actions/logout.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `deleteDemoSession(): Promise<void>`.
- Produces: `logoutAction(): Promise<never>` and a visible `Log out` submit button.

- [ ] **Step 1: Add the logout Server Action**

Create `src/app/actions/logout.ts`:

```ts
"use server";

import { redirect } from "next/navigation";

import { deleteDemoSession } from "@/lib/session";

export async function logoutAction(): Promise<never> {
  await deleteDemoSession();
  redirect("/login");
}
```

- [ ] **Step 2: Add the logout form to the existing home page**

Replace `src/app/page.tsx` with:

```tsx
import Image from "next/image";

import { logoutAction } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
        <div className="flex w-full items-center justify-between gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            You are signed in to the protected AI Demo application.
          </p>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify the logout slice statically**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run src/lib/auth.test.ts
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 4: Commit logout**

```bash
git add src/app/actions/logout.ts src/app/page.tsx
git commit -m "feat: add demo logout"
```

---

### Task 5: Verify the Complete Login Flow at Runtime

**Files:**
- Verify: `src/app/login/page.tsx`
- Verify: `src/components/login-form.tsx`
- Verify: `src/proxy.ts`
- Verify: `src/app/page.tsx`
- Verify: `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: the complete login, session, redirect, and logout flow from Tasks 1-4.
- Produces: runtime evidence from Next.js MCP and agent-browser plus a clean full quality suite.

- [ ] **Step 1: Start the Turbopack development server**

Run in a persistent terminal:

```bash
pnpm dev
```

Expected: Next.js 16.3+ reports `Ready` and prints the local URL, normally `http://localhost:3000`.

- [ ] **Step 2: Initialize an isolated browser session**

Run:

```bash
agent-browser skills get core
SESSION="$(agent-browser session id --scope worktree --prefix next-dev-loop)"
export AGENT_BROWSER_SESSION="$SESSION"
export AGENT_BROWSER_RESTORE="$SESSION"
agent-browser --session "$SESSION" --restore --headed --enable react-devtools open http://localhost:3000/
```

Expected: a headed browser opens. If a restored authenticated session lands on `/`, click logout before continuing:

```bash
agent-browser find role button click --name "Log out"
agent-browser wait --url "**/login"
```

- [ ] **Step 3: Verify unauthenticated redirect and form contents**

Run:

```bash
agent-browser --session "$SESSION" --restore open http://localhost:3000/
agent-browser wait --url "**/login"
agent-browser snapshot -i
agent-browser get url
```

Expected: URL ends in `/login`; the snapshot contains Username, Password, and Login, with no Google, forgot-password, or sign-up control.

- [ ] **Step 4: Verify an invalid login**

Run:

```bash
agent-browser find label "Username" fill "admin"
agent-browser find label "Password" fill "wrong"
agent-browser find role button click --name "Login"
agent-browser wait --text "Invalid username or password."
agent-browser get url
```

Expected: the generic error is visible and the URL remains `/login`.

- [ ] **Step 5: Verify a valid login and authenticated redirect policy**

Run:

```bash
agent-browser find label "Username" fill "admin"
agent-browser find label "Password" fill "admin123"
agent-browser find role button click --name "Login"
agent-browser wait --url "http://localhost:3000/"
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser --session "$SESSION" --restore open http://localhost:3000/login
agent-browser wait --url "http://localhost:3000/"
```

Expected: valid credentials render the protected home page with `Log out`; a later `/login` navigation redirects back to `/`.

- [ ] **Step 6: Verify React and logout behavior**

Run:

```bash
agent-browser react tree
agent-browser find role button click --name "Log out"
agent-browser wait --url "**/login"
agent-browser --session "$SESSION" --restore open http://localhost:3000/
agent-browser wait --url "**/login"
```

Expected: the React tree is available, logout returns to `/login`, and a new `/` request is protected again.

- [ ] **Step 7: Query the framework view through Next.js MCP**

Run:

```bash
curl -sS -X POST http://localhost:3000/_next/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | sed -n 's/^data: //p'

curl -sS -X POST http://localhost:3000/_next/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_compilation_issues","arguments":{}}}' \
  | sed -n 's/^data: //p'

curl -sS -X POST http://localhost:3000/_next/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_errors","arguments":{}}}' \
  | sed -n 's/^data: //p'
```

Expected: `tools/list` includes `get_compilation_issues`; compilation and runtime error calls report no application errors.

- [ ] **Step 8: Close the isolated browser session**

Run:

```bash
agent-browser --session "$SESSION" --restore close
```

Expected: the browser closes and its state is saved under the worktree-scoped session key.

- [ ] **Step 9: Run the complete quality suite**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
git diff --check
git status --short --branch
```

Expected: lint and type-check exit 0; all unit tests pass; `src/lib/auth.ts` meets the 80% per-file coverage gate; the production build succeeds; no whitespace errors exist; the worktree is clean except for intentional plan checkbox updates, if tracked.
