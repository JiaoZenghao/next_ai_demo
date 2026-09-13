import { z } from "zod";
import { AIConfigError, type AIConfig } from "./config";

const schema = z.object({
  mode: z.enum(["mock", "live"]),
  adapter: z.enum(["ollama", "openai-compatible"]),
  baseURL: z.string().trim().max(2048),
  model: z.string().trim().max(200),
  apiKey: z.string().trim().max(4096),
  timeoutMs: z.number().int().min(1000).max(300000),
  maxRetries: z.number().int().min(0).max(3),
}).superRefine((value, ctx) => {
  if (value.mode === "live" && !value.model) ctx.addIssue({ code: "custom", message: "Model required" });
  if (value.baseURL || value.mode === "live") {
    try {
      const url = new URL(value.baseURL);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    } catch { ctx.addIssue({ code: "custom", message: "Invalid endpoint" }); }
  }
});

export type ModelSettings = z.infer<typeof schema>;
export type PublicModelSettings = Omit<ModelSettings, "apiKey"> & { hasApiKey: boolean };
export const defaultSettings: ModelSettings = { mode: "mock", adapter: "ollama", baseURL: "", model: "", apiKey: "", timeoutMs: 60000, maxRetries: 0 };

export function mergeSettings(input: unknown, previous?: ModelSettings): ModelSettings {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new AIConfigError("请检查模型配置：真实模式需要模型名称和有效的 HTTP(S) 接口地址，超时范围为 1000–300000 毫秒，重试次数为 0–3。");
  const value = parsed.data;
  const clear = typeof input === "object" && input !== null && "clearApiKey" in input && input.clearApiKey === true;
  const sameEndpoint = previous?.adapter === value.adapter && previous?.baseURL === value.baseURL;
  return { ...value, apiKey: clear ? "" : value.apiKey || (sameEndpoint ? previous.apiKey : "") };
}

export function publicSettings(settings: ModelSettings): PublicModelSettings {
  const { apiKey, ...values } = settings;
  return { ...values, hasApiKey: Boolean(apiKey) };
}

export function settingsToConfig(settings: ModelSettings): AIConfig {
  return {
    mode: settings.mode,
    providers: { configured: { adapter: settings.adapter, baseURL: settings.baseURL, apiKey: settings.apiKey || undefined } },
    models: { configured: { provider: "configured", model: settings.model, capabilities: { toolCalling: true }, timeoutMs: settings.timeoutMs, maxRetries: settings.maxRetries } },
    assignments: { "data-assistant": "configured" },
  };
}
