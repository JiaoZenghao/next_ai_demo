<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository working agreements

- Use pnpm exclusively for dependency and script commands.
- Follow TypeScript and App Router conventions. Prefer React Server Components unless browser-side state, effects, or event handling require a Client Component.
- Before changing Next.js behavior, read the relevant version-matched documentation under `node_modules/next/dist/docs/`.
- For rendered or runtime behavior changes, keep `pnpm dev` running and use the repository's `next-dev-loop` skill after every edit to check compilation, runtime errors, browser behavior, and React-level behavior.
- Use the `next-devtools` MCP server configured in `.codex/config.toml` to inspect the running Next.js application.
- Use the configured shadcn/ui Base UI foundation and add components individually with the shadcn CLI.
- Put substantial framework-independent logic under `src/lib/` and add or update colocated `*.test.ts` unit tests whenever major logic changes.
- Do not bypass Lefthook checks unless the reason is explicit and exceptional.
- Explain why a new production dependency is needed before adding it.
- Keep secrets in uncommitted environment files such as `.env.local`; never commit credentials.
- Before declaring implementation complete, run `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, and `pnpm build`.
