import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { getDemoSession } from "@/data/auth";
import { POST } from "./route";
import { parseAIConfig } from "@/lib/ai/config";
import { loadAIConfig } from "@/lib/ai/load-config";

vi.mock("@/data/auth", () => ({ getDemoSession: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/load-config", () => ({ loadAIConfig: vi.fn() }));
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function request(method: string) {
  return new NextRequest("http://localhost:3000/api/copilotkit", {
    method: "POST", body: JSON.stringify({ method }),
    headers: { "Content-Type": "application/json" },
  });
}

it("keeps unauthenticated runtime requests blocked", async () => {
  vi.mocked(getDemoSession).mockResolvedValue(null);
  expect((await POST(request("info"))).status).toBe(401);
});

it("provides v2 single-route discovery without contacting Ollama", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.stubEnv("OLLAMA_MODEL", "");
  const response = await POST(request("info"));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ agents: { default: expect.any(Object) }, mode: "sse" });
});

it("reports missing Ollama configuration before starting a run", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.stubEnv("OLLAMA_MODEL", "");
  vi.mocked(loadAIConfig).mockReturnValue(parseAIConfig(`mode: live
providers: {}
models: {}
assignments: { data-assistant: missing }`));
  expect((await POST(request("agent/run"))).status).toBe(503);
});

it("rejects malformed request envelopes", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  const response = await POST(new NextRequest("http://localhost:3000/api/copilotkit", { method: "POST", body: "null" }));
  expect(response.status).toBe(400);
  expect((await POST(new NextRequest("http://localhost:3000/api/copilotkit", { method: "POST", body: "{" }))).status).toBe(400);
});

it("serves the explicit mock transport without loading model configuration", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadAIConfig).mockImplementation(() => { throw new Error("must not load"); });
  const response = await POST(new NextRequest("http://localhost:3000/api/copilotkit?demo=true", {
    method: "POST", body: JSON.stringify({ method: "info" }),
  }));
  expect(await response.json()).toMatchObject({ singleRoute: { resourceOperations: false } });
});

it("accepts stateless connect and rejects unsupported resource operations", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  expect((await POST(request("agent/connect"))).headers.get("content-type")).toBe("text/event-stream");
  expect((await POST(request("threads/list"))).status).toBe(400);
});

it.each([true, false])("streams mock without any model configuration (explicit=%s)", async explicit => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadAIConfig).mockReturnValue(parseAIConfig("providers: {}\nmodels: {}\nassignments: {data-assistant: unused}"));
  const response = await POST(new NextRequest(`http://localhost:3000/api/copilotkit${explicit ? "?demo=true" : ""}`, {
    method: "POST", body: JSON.stringify({ method: "agent/run", body: { threadId: "t", runId: "r", messages: [] } }),
  }));
  const reader = response.body!.getReader();
  expect(new TextDecoder().decode((await reader.read()).value)).toContain("RUN_STARTED");
  await reader.cancel();
});

it("runs the configured remote model through the authenticated runtime", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadAIConfig).mockReturnValue(parseAIConfig(`mode: live
providers:
  cloud: { adapter: openai-compatible, baseURL: "https://example.com/v1", apiKeyEnv: TEST_QWEN_KEY }
models:
  qwen: { provider: cloud, model: qwen-plus, capabilities: {toolCalling: true} }
assignments: {data-assistant: qwen}`));
  vi.stubEnv("TEST_QWEN_KEY", "private-test-key");
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    expect(String(url)).toBe("https://example.com/v1/chat/completions");
    expect(JSON.parse(init.body as string).model).toBe("qwen-plus");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer private-test-key");
    return new Response('data: {"choices":[{"index":0,"delta":{"content":"Qwen test answer"},"finish_reason":null}]}\n\ndata: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', { headers: { "Content-Type": "text/event-stream" } });
  });
  const response = await POST(new NextRequest("http://localhost:3000/api/copilotkit", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method: "agent/run", params: { agentId: "default" }, body: {
      threadId: "remote-test", runId: "remote-run", state: {}, tools: [], context: [], forwardedProps: {},
      messages: [{ id: "u", role: "user", content: "test" }],
    } }),
  }));
  expect(response.status).toBe(200);
  const body = await response.text();
  expect(body).toContain("Qwen test answer");
  expect(body).not.toContain("private-test-key");
});
