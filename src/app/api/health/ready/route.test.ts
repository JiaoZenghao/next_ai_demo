import { afterEach, expect, it, vi } from "vitest";
import { parseAIConfig } from "@/lib/ai/config";
import { loadAIConfig } from "@/lib/ai/load-config";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/load-config", () => ({ loadAIConfig: vi.fn() }));
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("is ready in mock mode without credentials or a model service", async () => {
  vi.mocked(loadAIConfig).mockReturnValue(parseAIConfig("mode: mock\nproviders: {}\nmodels: {}\nassignments: {data-assistant: unused}"));
  const response = GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({ status: "ready" });
});

it("returns an opaque 503 for invalid configuration", async () => {
  vi.mocked(loadAIConfig).mockImplementation(() => { throw new Error("private configuration content"); });
  const response = GET();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "not-ready" });
});

it("checks Live credentials locally without calling the provider", async () => {
  vi.mocked(loadAIConfig).mockReturnValue(parseAIConfig(`mode: live
providers:
  qwen: {adapter: openai-compatible, baseURL: "https://example.com/v1", apiKeyEnv: TEST_HEALTH_KEY}
models:
  bi: {provider: qwen, model: qwen-plus, capabilities: {toolCalling: true}}
assignments: {data-assistant: bi}`));
  vi.stubGlobal("fetch", () => { throw new Error("Probe must not contact provider"); });
  vi.stubEnv("TEST_HEALTH_KEY", "");
  expect(GET().status).toBe(503);
  vi.stubEnv("TEST_HEALTH_KEY", "private-health-key");
  const response = GET();
  expect(response.status).toBe(200);
  expect(await response.text()).not.toContain("private-health-key");
});
