import { describe, expect, it } from "vitest";
import { mergeSettings, publicSettings, settingsToConfig } from "./settings";
import { resolveModelConfig } from "./config";

const current = { mode: "live" as const, adapter: "openai-compatible" as const, baseURL: "https://example.com/v1", model: "qwen-plus", apiKey: "private-key", timeoutMs: 60000, maxRetries: 0 };
describe("model settings", () => {
  it("preserves a key only for an unchanged provider endpoint", () => {
    expect(mergeSettings({ ...current, apiKey: "" }, current).apiKey).toBe("private-key");
    expect(mergeSettings({ ...current, baseURL: "https://other.example/v1", apiKey: "" }, current).apiKey).toBe("");
    expect(mergeSettings({ ...current, adapter: "ollama", apiKey: "" }, current).apiKey).toBe("");
  });
  it("allows replacing and explicitly removing the key", () => {
    expect(mergeSettings({ ...current, apiKey: "new-key" }, current).apiKey).toBe("new-key");
    expect(mergeSettings({ ...current, apiKey: "", clearApiKey: true }, current).apiKey).toBe("");
  });
  it("returns only public fields to the browser", () => {
    expect(publicSettings(current)).toMatchObject({ hasApiKey: true, model: "qwen-plus" });
    expect(JSON.stringify(publicSettings(current))).not.toContain("private-key");
  });
  it("resolves page settings without environment variables", () => {
    expect(resolveModelConfig(settingsToConfig(current), {})).toMatchObject({ apiKey: "private-key", model: "qwen-plus" });
  });
  it.each([{ baseURL: "file:///tmp/model" }, { baseURL: "https://user:secret@example.com" }, { baseURL: "https://example.com/?key=secret" }, { model: "" }, { timeoutMs: 0 }, { maxRetries: 4 }, { adapter: "invalid" }])("rejects invalid live settings without echoing input", change => {
    expect(() => mergeSettings({ ...current, ...change }, current)).toThrow("请检查模型配置");
  });
  it("allows mock mode before entering a model", () => {
    expect(mergeSettings({ ...current, mode: "mock", model: "", baseURL: "", apiKey: "" }).mode).toBe("mock");
  });
});
