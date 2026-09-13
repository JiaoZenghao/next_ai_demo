# Data Assistant

The dashboard uses CopilotKit's sidebar and frontend chart tools. All business
figures currently come from independent demo fixtures. Monthly revenue and summary KPIs
are separate demo fixtures. Model mode affects only Data Assistant question answering:
Mock uses a deterministic scripted reply, while Live invokes the configured model
for the actual question. Neither mode switches, fetches, or replaces dashboard data.
Live answers may use dashboard context, but must preserve its source attribution.

## Configuration

登录后，从仪表盘的 **模型配置** 进入 `/settings`，填写：

- **运行模式**：演示模式不调用模型；真实模型模式使用下方配置。
- **服务类型**：Ollama 或 OpenAI 兼容接口（支持 Chat Completions、流式输出和工具调用）。
- **接口地址**：包括 `/v1` 等服务要求的路径，不追加 `/chat/completions`。
- **模型名称**：服务实际提供且支持工具调用的模型名称。
- **API Key**：无需鉴权时可留空。已设置的密钥不回显，留空保留；切换接口地址或服务类型后需要重新填写。可勾选清除密钥。
- **高级设置**：超时 1000–300000 毫秒，重试 0–3 次。

保存后新请求立即生效，无需修改项目文件或重启。保存只校验配置格式，不测试远端连接。保存后点击 **测试连接**，演示模式会提示无需测试，不校验真实模型信息，也不发送请求；真实模型模式会使用服务端已保存的共享配置发送一次简短文本请求。测试最长等待 30 秒或所设超时，以较短者为准，不重试；结果显示耗时或脱敏后的错误类别，不回显密钥与远端响应内容。测试通过不代表流式输出或工具调用已验证。
配置对当前应用共享；当前登录仍为演示认证。

### 持久化与部署

默认保存在运行目录下 `.local/model-settings.json`，目录权限为 `0700`，文件权限为 `0600`，文件包含明文密钥，仅供服务端读取，已排除 Git 和 Docker 构建上下文。
生产环境可用 `AI_SETTINGS_DIR` 指定服务进程可写的持久化目录；这只是存储位置，模型信息仍从页面填写。
容器需要挂载持久化卷到该目录，并赋予运行用户写权限，否则容器重建会丢失页面配置。多个实例需要使用同一个共享存储目录；目前采用完整配置的原子替换，最后一次保存生效。

首次使用时兼容现有 `config/ai.yaml` 与环境变量；首次保存后页面配置优先，旧配置不再参与模型选择。没有旧配置文件时默认使用演示模式。
API Key 不应放入 `NEXT_PUBLIC_*` 变量。模型调用仍由服务端执行；真实模式会将聊天、页面上下文和工具结果发送给选定服务。

## Architecture

```text
authenticated route → runtime assembly → provider-independent Data Assistant Agent
                                            ↓
                           saved page settings → model factory → provider adapter
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

本地端到端测试默认使用 3100 端口；端口被占用时可运行 `E2E_PORT=3201 pnpm test:e2e:run`（先完成 `pnpm build`）。测试配置存储与开发环境隔离。
