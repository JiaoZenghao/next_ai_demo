import { describe, expect, it } from "vitest";
import { parseAIConfig, resolveModelConfig } from "./config";

const config = `
providers:
  local:
    adapter: ollama
    baseURL: http://localhost:11434/v1
  cloud:
    adapter: openai-compatible
    baseURL: https://example.com/v1
    apiKeyEnv: QWEN_KEY
models:
  local-bi:
    provider: local
    modelEnv: OLLAMA_MODEL
    capabilities: { toolCalling: true }
  qwen-bi:
    provider: cloud
    model: qwen-plus
    capabilities: { toolCalling: true }
assignments:
  data-assistant: local-bi
`;

describe("AI configuration", () => {
  it("defaults to mock and resolves local model environment references", () => {
    const parsed = parseAIConfig(config);
    expect(parsed.mode).toBe("mock");
    expect(resolveModelConfig(parsed, { OLLAMA_MODEL: "qwen-local" })).toMatchObject({
      model: "qwen-local", timeoutMs: 60000, maxRetries: 0,
      provider: { adapter: "ollama", baseURL: "http://localhost:11434/v1" },
    });
  });
  it("switches to remote Qwen using only the assignment", () => {
    const parsed = parseAIConfig(config.replace("data-assistant: local-bi", "data-assistant: qwen-bi"));
    expect(resolveModelConfig(parsed, { QWEN_KEY: "secret" })).toMatchObject({
      model: "qwen-plus", apiKey: "secret", provider: { adapter: "openai-compatible" },
    });
  });
  it.each([
    [config.replace("local-bi\n", "missing\n"), "assignment"],
    [config.replace("provider: local", "provider: missing"), "provider"],
    [config.replace("toolCalling: true", "toolCalling: false"), "tool"],
  ])("rejects unresolved references or unsupported tools", (source, message) => {
    expect(() => resolveModelConfig(parseAIConfig(source), { OLLAMA_MODEL: "test" })).toThrow(new RegExp(message, "i"));
  });
  it("requires the selected model and secret, but not inactive provider secrets", () => {
    expect(() => resolveModelConfig(parseAIConfig(config), {})).toThrow(/OLLAMA_MODEL/);
    expect(() => resolveModelConfig(parseAIConfig(config.replace("data-assistant: local-bi", "data-assistant: qwen-bi")), {})).toThrow(/QWEN_KEY/);
  });
  it("resolves base URL overrides and rejects invalid override URLs", () => {
    const parsed = parseAIConfig(config.replace("adapter: ollama", "adapter: ollama\n    baseURLEnv: LOCAL_URL"));
    expect(resolveModelConfig(parsed, { OLLAMA_MODEL: "test", LOCAL_URL: "https://example.com/v1" }).provider.baseURL).toBe("https://example.com/v1");
    expect(() => resolveModelConfig(parsed, { OLLAMA_MODEL: "test", LOCAL_URL: "file:///tmp/model" })).toThrow(/Invalid provider base URL/);
  });
  it.each([
    "[invalid", config.replace("adapter: ollama", "adapter: unknown"),
    config.replace("http://localhost:11434/v1", "file:///tmp/model"),
    config.replace("http://localhost:11434/v1", "http://user:secret@localhost/v1"),
    config + "\nmode: invalid", config.replace("model: qwen-plus", "model: qwen-plus\n    timeoutMs: -1"),
  ])("rejects invalid YAML/schema without leaking source content", source => {
    expect(() => parseAIConfig(source)).toThrow(/Invalid AI configuration/);
    expect(() => parseAIConfig(source)).not.toThrow(/user:secret/);
  });
});
