# Configurable AI Providers Implementation Plan

**Goal:** Switch Data Assistant between Ollama and remote OpenAI-compatible Qwen through server configuration only.

**Architecture:** YAML configuration selects a model alias. Zod validates configuration and environment references, provider factories return AI SDK 7 models, and a provider-independent BuiltInAgent handles context/tools/streaming. Runtime assembly and mock transport stay outside the authenticated route.

**Constraints:** Preserve existing uncommitted work. Default to mock; never silently fall back to cloud. Secrets stay in server environment variables. No model requests during discovery. Keep mutable agents request-local. No commits requested.

## Batch 1: Configuration and model factory

- [x] Add failing tests for alias selection, missing references/secrets, URL validation, capabilities, and malformed YAML.
- [x] Implement `src/lib/ai/config.ts`, `model-factory.ts`, and provider registry using existing AI SDK and new YAML parser.
- [x] Supply `config/ai.yaml` with local Ollama and remote Qwen profiles. Preserve existing Ollama environment configuration through explicit environment references.
- [x] Verify with `pnpm test:run src/lib/ai`.

## Batch 2: Agent and runtime integration

- [x] Extend streamed text/tool tests to cover both providers and ensure Ollama request options do not leak into Qwen.
- [x] Move generic agent logic into `src/lib/copilot/data-assistant-agent.ts`; remove Ollama-specific agent entry point.
- [x] Extract runtime/mock composition from route. Add tests for invalid requests, missing configuration, provider-free discovery and mock mode.
- [x] Configure UI mock/live mode server-side; disable resource operations for the stateless transport to avoid the v2 relative-URL issue.
- [x] Update documentation with local and remote configurations, restart instructions and privacy limits.

## Verification

- [x] Inspect Next MCP compilation/runtime issues and browser mock journey/React props.
- [x] Run `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm build`, and `pnpm test:e2e:run` (the same build + Playwright gates as `pnpm test:e2e`, without building twice).
- [x] Report whether real remote Qwen was tested separately from protocol fixtures.
