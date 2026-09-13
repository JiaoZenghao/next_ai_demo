import { afterEach, expect, it, vi } from "vitest";
import { testModelConnection } from "./test-connection";
import { defaultSettings } from "./settings";
vi.mock("server-only", () => ({}));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const settings = { ...defaultSettings, mode: "live" as const, adapter: "openai-compatible" as const, baseURL: "https://example.com/v1", model: "test-model", apiKey: "private-key" };
it("makes a real request in live mode and returns no provider text", async () => {
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer private-key");
    expect(JSON.parse(init.body as string).model).toBe("test-model");
    return Response.json({ id: "test", created: 0, model: "test-model", choices: [{ index: 0, message: { role: "assistant", content: "OK private-key" }, finish_reason: "stop" }] });
  });
  const result = await testModelConnection(settings);
  expect(result.ok).toBe(true);
  expect(result.durationMs).toBeGreaterThanOrEqual(0);
  expect(JSON.stringify(result)).not.toContain("private-key");
});
it.each([401, 403, 404, 429, 500])("sanitizes HTTP %i failures", async status => {
  vi.stubGlobal("fetch", async () => new Response("private-key", { status }));
  const result = await testModelConnection(settings);
  expect(result.ok).toBe(false);
  expect(result.message).toContain(String(status));
  expect(JSON.stringify(result)).not.toContain("private-key");
});
it("reports invalid config before sending a request", async () => {
  vi.stubGlobal("fetch", () => { throw new Error("must not fetch"); });
  expect((await testModelConnection({ ...defaultSettings, mode: "live" })).message).toContain("请检查模型配置");
});
it("sanitizes network errors", async () => {
  vi.stubGlobal("fetch", async () => { throw new Error("private-key"); });
  const result = await testModelConnection(settings);
  expect(result.ok).toBe(false);
  expect(result.message).toContain("网络");
});

it("reports timeout without leaking provider errors", async () => {
  const controller = new AbortController();
  controller.abort();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  const result = await testModelConnection(settings);
  expect(result.ok).toBe(false);
  expect(result.message).toContain("超时");
});

it.each([defaultSettings, { ...settings, mode: "mock" as const }])("skips real model validation and network calls in mock mode", async config => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const result = await testModelConnection(config);
  expect(result).toMatchObject({ ok: true, skipped: true });
  expect(result.message).toContain("演示模式无需连接测试");
  expect(fetch).not.toHaveBeenCalled();
});
