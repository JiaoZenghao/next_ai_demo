<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository working agreements

- Use pnpm exclusively for dependency and script commands.
- Follow TypeScript and App Router conventions. Prefer React Server Components unless browser-side state, effects, or event handling require a Client Component.
- Before changing Next.js behavior, read the relevant version-matched documentation under `node_modules/next/dist/docs/`.
- For rendered or runtime behavior changes, keep `pnpm dev` running and use the repository's `next-dev-loop` skill after each coherent batch of related edits, and once more before completion. Pure tests, documentation, CI, and non-runtime configuration changes do not require a browser loop.
- Use the `next-devtools` MCP server configured in `.codex/config.toml` to inspect the running Next.js application.
- Use the configured shadcn/ui Base UI foundation and add components individually with the shadcn CLI.
- Put substantial framework-independent logic under `src/lib/` and add or update colocated `*.test.ts` unit tests whenever major logic changes.
- Do not bypass Lefthook checks unless the reason is explicit and exceptional.
- Explain why a new production dependency is needed before adding it.
- Keep secrets in uncommitted environment files such as `.env.local`; never commit credentials.
- Before declaring implementation complete, run `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, and `pnpm build`.

## Balanced development workflow

Use the balanced workflow by default unless the user explicitly requests a stricter review process.

### Work organization

- Group closely related changes into one coherent implementation batch.
- Use one isolated worktree per feature or bugfix, not one worktree per small implementation step.
- Do not spawn subagents for routine configuration, documentation, or low-risk code changes.
- Use an independent reviewer only for authentication, authorization, security, sensitive data boundaries, or explicitly requested reviews.

### Testing strategy

- Follow test-driven development for major logic and bug fixes.
- During implementation, run only tests directly related to the changed files.
- For component or UI changes, run the related component tests.
- For authentication, routing, or rendered behavior changes, run one relevant browser journey after a coherent batch of edits.
- Do not run the complete build or E2E suite after every small edit.

### Completion gates

Before committing a completed requirement, run once:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:coverage`

After the complete requirement is implemented, run once:

- `pnpm build`
- `pnpm test:e2e`

After a fast-forward merge where the tested commit is unchanged:

- Run a lightweight smoke check.
- Do not repeat the complete test, build, and E2E suite unless the merge changes files, dependencies, configuration, or generated output.

### Failure handling

- If a gate fails because of code, diagnose and fix it before completion.
- If a gate fails because of a confirmed sandbox or infrastructure restriction, record the evidence and use the documented equivalent fallback once.
- Do not retry an identical environment failure more than once without changing the diagnostic approach.

### User communication

- Ask for approval only when required for safety, permissions, destructive actions, external publication, or a decision that materially changes scope.
- Do not pause for confirmation between routine implementation steps.
