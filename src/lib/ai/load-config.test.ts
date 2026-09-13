import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { loadAIConfig, loadEditableSettings } from "./load-config";
import { readModelSettings } from "./settings-store";
import { defaultSettings } from "./settings";

vi.mock("server-only", () => ({}));
vi.mock("./settings-store", () => ({ readModelSettings: vi.fn(() => null) }));
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
});
afterEach(() => { vi.mocked(readFileSync).mockReset(); vi.mocked(readModelSettings).mockReset(); vi.unstubAllEnvs(); });
it("loads the legacy configuration before the first page save", () => {
  expect(loadAIConfig()).toMatchObject({ mode: "mock", assignments: { "data-assistant": "local-bi" } });
});
it("prefers saved settings over project configuration", () => {
  vi.mocked(readModelSettings).mockReturnValue({ ...defaultSettings, model: "saved-model", apiKey: "key" });
  expect(loadEditableSettings()).toMatchObject({ model: "saved-model", apiKey: "key" });
});
it("works without any project model configuration", () => {
  vi.mocked(readFileSync).mockImplementation(() => { throw Object.assign(new Error(), { code: "ENOENT" }); });
  expect(loadAIConfig().mode).toBe("mock");
});
it("does not expose filesystem diagnostics", () => {
  vi.mocked(readFileSync).mockImplementation(() => { throw new Error("sensitive path"); });
  expect(() => loadAIConfig()).toThrow("Unable to read config/ai.yaml.");
});
it("imports legacy environment values for the settings page", () => {
  vi.stubEnv("OLLAMA_MODEL", "local-model");
  vi.stubEnv("OLLAMA_BASE_URL", "http://localhost:11434/v1");
  expect(loadEditableSettings()).toMatchObject({ model: "local-model", baseURL: "http://localhost:11434/v1", apiKey: "" });
});
it("handles incomplete legacy profiles", () => {
  vi.mocked(readFileSync).mockReturnValue("providers: {}\nmodels: {}\nassignments: {data-assistant: unused}");
  expect(loadEditableSettings()).toEqual(defaultSettings);
});
