# Data Assistant

The dashboard uses CopilotKit's sidebar and frontend chart tools. All business
figures are mock data, including in Live mode. Monthly revenue and summary KPIs
are separate demo fixtures.

## Configuration

Edit `config/ai.yaml` and restart the application. No route or Agent changes
are needed to switch between the integrated adapters:

- `ollama`: OpenAI-compatible Ollama endpoint, with Ollama-specific request options.
- `openai-compatible`: remote Qwen (DashScope), or another service implementing
  OpenAI Chat Completions with streaming and tool calls. Responses-only APIs and
  native Anthropic/Gemini protocols require a new adapter.

The file defines providers, model profiles, and the `data-assistant` assignment.
`mode: mock` is the safe default. Only `mode: live` invokes the selected model.
Unused provider secrets are not required. No automatic provider/cloud fallback.

### Local Ollama

Keep `assignments.data-assistant: local-bi`, set `mode: live`, and put these
values in the uncommitted `.env.local`:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=your-installed-model-name
```

Use the exact installed model name and a model supporting tool calling.
The shipped profile uses `modelEnv: OLLAMA_MODEL`; alternatively replace it
with `model: your-installed-model-name` (not both).
`baseURLEnv` is an optional endpoint override, falling back to `baseURL`.

### Remote Qwen on Alibaba Cloud

In `config/ai.yaml`, change:

```yaml
mode: live
# Keep the existing providers and models sections.
assignments:
  data-assistant: qwen-bi
```

Set the secret in `.env.local`:

```dotenv
DASHSCOPE_API_KEY=your-api-key
```

The shipped `aliyun` provider uses
`https://dashscope.aliyuncs.com/compatible-mode/v1` (Beijing) and `qwen-plus`.
Use the endpoint and model available for your API key's region/account.
Do not append `/chat/completions` to the configured base URL.
See [Alibaba Cloud endpoint documentation](https://www.alibabacloud.com/help/en/model-studio/base-url).

For self-hosted remote Qwen, change the provider's `baseURL`, `apiKeyEnv`,
and profile's `model` to match that server. Omit `apiKeyEnv` only for a service
that requires no authentication. Prefer HTTPS for remote services.

### Policy and security

- `capabilities.toolCalling: true` is a declaration, not a capability upgrade.
  Verify actual model streaming and tool support.
- `timeoutMs`: positive integer, maximum 300000, default 60000.
- `maxRetries`: integer 0–3, default 0.
- API keys must be referenced by environment name, never placed in YAML or
  `NEXT_PUBLIC_*` variables. Only the mode is passed to the browser.
- Live mode sends chat, page context and tool results to the configured service.
- Configuration failures return a 503 on generation. Provider stream errors are
  sanitized so upstream response bodies and request context are not logged.
- Configuration is server-side and included in Next output tracing. Ship the
  file with the server. Restart after edits; hot configuration reload is not
  a supported contract.

## Architecture

```text
authenticated route → runtime assembly → provider-independent Data Assistant Agent
                                            ↓
                           YAML + environment → model factory → provider adapter
```

The Agent uses a BuiltInAgent factory with the application's AI SDK 7, avoiding
the runtime's bundled SDK 6 model types. Message conversion is validated.
Ollama-specific parameters stay in the provider registry, not the route/Agent.

Transport is intentionally stateless: browser-owned history, fresh Runtime and
Agent for each run, no shared thread resource operations or server persistence.
Discovery/connect do not contact a model. This also avoids CopilotKit's relative
URL resource-operation issue. Refreshing the page resets the chat.

## Streaming demo and verification

Mock mode uses `/api/copilotkit?demo=true`. It remains callable independently
of model credentials, even when Live is configured. The base endpoint also
honors `mode: mock`, preventing accidental model calls.

Click **收入趋势流式演示** to replay deterministic text followed by eight chart
points. SSE text/tool events are real; timing is simulated (100 ms text fragments,
650 ms chart arguments). Stop cancels the stream.

In Live mode ask “请逐月生成收入趋势图” to exercise `streamRevenueChart`, or
“请展示收入趋势图” for the fixed chart tool. Streaming timing and tool choice
depend on the actual model; a model may deliver several points in one chunk.

Tests exercise both adapters with controlled OpenAI-compatible SSE fixtures,
including the authenticated route. These fixtures are not proof that a specific
remote account/model works; run a real-provider smoke test after adding credentials.
