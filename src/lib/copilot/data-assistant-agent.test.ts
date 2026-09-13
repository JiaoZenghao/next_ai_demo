import { afterEach, expect, it, vi } from "vitest";
import { createDataAssistantAgent } from "./data-assistant-agent";
import { createModelBinding } from "../ai/model-factory";

function makeAgent(adapter: "ollama" | "openai-compatible" = "ollama", timeoutMs = 60000, apiKey: string | undefined = "test-secret") {
  return createDataAssistantAgent(createModelBinding({
    model: "test-model", provider: { adapter, baseURL: "http://localhost:11434/v1" },
    apiKey, timeoutMs, maxRetries: 0,
  }));
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each(["ollama", "openai-compatible"] as const)("streams %s text and forwards tools/context without leaking adapter options", async adapter => {
  let sent: Record<string, unknown> = {};
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    expect(String(url)).toBe("http://localhost:11434/v1/chat/completions");
    sent = JSON.parse(init.body as string);
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer test-secret");
    const chunks = [
      { choices: [{ index: 0, delta: { role: "assistant", content: "收入" }, finish_reason: null }] },
      { choices: [{ index: 0, delta: { content: "增长" }, finish_reason: null }] },
      { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
    ];
    return new Response(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
  });
  const agent = makeAgent(adapter);
  agent.setMessages([{ id: "u", role: "user", content: "收入怎么样" }]);
  const result = await agent.runAgent({
    context: [{ description: "Dashboard", value: "mock revenue 46000" }],
    tools: [{ name: "showRevenueChart", description: "Show chart", parameters: { type: "object", properties: {} } }],
  });
  expect(sent.model).toBe("test-model");
  expect(sent.parallel_tool_calls).toBe(adapter === "ollama" ? false : undefined);
  expect(JSON.stringify(sent.messages)).toContain("mock revenue 46000");
  expect(JSON.stringify(sent.tools)).toContain("showRevenueChart");
  expect(result.newMessages).toEqual(expect.arrayContaining([expect.objectContaining({ role: "assistant", content: "收入增长" })]));
});

it.each(["timeout", "cancel"])("aborts an in-flight provider request on %s", async kind => {
  const agent = makeAgent("ollama", kind === "timeout" ? 30 : 60000);
  let signal: AbortSignal | undefined;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    signal = init.signal as AbortSignal;
    if (kind === "cancel") queueMicrotask(() => agent.abortRun());
    return new Promise((_resolve, reject) => {
      signal!.addEventListener("abort", () => reject(signal!.reason), { once: true });
    });
  });
  agent.setMessages([{ id: "u", role: "user", content: "test" }]);
  await agent.runAgent({});
  expect(signal?.aborted).toBe(true);
});

it("uses the Ollama placeholder key when the local service needs no secret", async () => {
  let authorization: string | null = null;
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    authorization = new Headers(init.headers).get("authorization");
    return new Response('data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', { headers: { "Content-Type": "text/event-stream" } });
  });
  const agent = createDataAssistantAgent(createModelBinding({
    model: "test", provider: { adapter: "ollama", baseURL: "http://localhost:11434/v1" },
    apiKey: undefined, timeoutMs: 60000, maxRetries: 0,
  }));
  agent.setMessages([{ id: "u", role: "user", content: "test" }]);
  await agent.runAgent({});
  expect(authorization).toBe("Bearer ollama");
});

it.each(["ollama", "openai-compatible"] as const)("converts %s streamed tool arguments into a frontend chart call", async adapter => {
  vi.stubGlobal("fetch", async () => new Response([
    { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "chart-1", type: "function", function: { name: "showRevenueChart", arguments: "{" } }] }, finish_reason: null }] },
    { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: "}" } }] }, finish_reason: null }] },
    { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
  ].map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n", {
    headers: { "Content-Type": "text/event-stream" },
  }));
  const agent = makeAgent(adapter);
  agent.setMessages([{ id: "u", role: "user", content: "展示收入图表" }]);
  const result = await agent.runAgent({
    tools: [{ name: "showRevenueChart", description: "Show chart", parameters: { type: "object", properties: {} } }],
  });
  expect(JSON.stringify(result.newMessages)).toContain('"name":"showRevenueChart"');
  expect(JSON.stringify(result.newMessages)).toContain('"arguments":"{}"');
});

it("does not leak provider error bodies or chat context into logs or stream errors", async () => {
  const logs = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", async () => new Response("private-upstream-body", { status: 401 }));
  const agent = makeAgent("openai-compatible");
  agent.setMessages([{ id: "u", role: "user", content: "private-chat-context" }]);
  const errors: string[] = [];
  await agent.runAgent({}, { onRunErrorEvent: ({ event }) => { errors.push(event.message); } }).catch(error => errors.push(String(error)));
  expect(JSON.stringify(logs.mock.calls)).not.toMatch(/private-upstream-body|private-chat-context/);
  expect(errors.join(" ")).not.toMatch(/private-upstream-body|private-chat-context/);
  expect(errors.join(" ")).toContain("Model request failed");
});
