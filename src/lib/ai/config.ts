import { z } from "zod";
import { parse } from "yaml";

export class AIConfigError extends Error {}

const envName = z.string().regex(/^[A-Z][A-Z0-9_]*$/).refine(name => !name.startsWith("NEXT_PUBLIC_"));
const endpoint = z.url().refine(value => {
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
});
const providerSchema = z.object({
  adapter: z.enum(["ollama", "openai-compatible"]),
  baseURL: endpoint,
  baseURLEnv: envName.optional(),
  apiKeyEnv: envName.optional(),
}).strict();
const modelSchema = z.object({
  provider: z.string().min(1),
  model: z.string().trim().min(1).optional(),
  modelEnv: envName.optional(),
  capabilities: z.object({ toolCalling: z.boolean() }).strict(),
  timeoutMs: z.number().int().positive().max(300000).default(60000),
  maxRetries: z.number().int().min(0).max(3).default(0),
}).strict().refine(value => Boolean(value.model) !== Boolean(value.modelEnv));
const schema = z.object({
  mode: z.enum(["mock", "live"]).default("mock"),
  providers: z.record(z.string(), providerSchema),
  models: z.record(z.string(), modelSchema),
  assignments: z.object({ "data-assistant": z.string().min(1) }).strict(),
}).strict();

export type AIConfig = z.infer<typeof schema>;
export type ProviderConfig = z.infer<typeof providerSchema>;

export function parseAIConfig(source: string): AIConfig {
  try {
    return schema.parse(parse(source));
  } catch {
    // Parser diagnostics can contain the source, including accidentally pasted secrets.
    throw new AIConfigError("Invalid AI configuration. Check config/ai.yaml schema and YAML syntax.");
  }
}

export function resolveModelConfig(config: AIConfig, env: Record<string, string | undefined>) {
  const selected = config.models[config.assignments["data-assistant"]];
  if (!selected) throw new AIConfigError("Unknown data-assistant model assignment.");
  const provider = config.providers[selected.provider];
  if (!provider) throw new AIConfigError("Unknown model provider.");
  if (!selected.capabilities.toolCalling) throw new AIConfigError("Data Assistant requires tool calling support.");
  const model = selected.model ?? env[selected.modelEnv!]?.trim();
  if (!model) throw new AIConfigError(`Missing model environment variable: ${selected.modelEnv}.`);
  const apiKey = provider.apiKeyEnv ? env[provider.apiKeyEnv]?.trim() : undefined;
  if (provider.apiKeyEnv && !apiKey) throw new AIConfigError(`Missing API key environment variable: ${provider.apiKeyEnv}.`);
  const baseURL = (provider.baseURLEnv && env[provider.baseURLEnv]?.trim()) || provider.baseURL;
  if (!endpoint.safeParse(baseURL).success) throw new AIConfigError("Invalid provider base URL.");
  return { model, provider: { ...provider, baseURL }, apiKey, timeoutMs: selected.timeoutMs, maxRetries: selected.maxRetries };
}

export type ResolvedModelConfig = ReturnType<typeof resolveModelConfig>;
