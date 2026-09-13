import type { LanguageModel } from "ai";
import type { ResolvedModelConfig } from "./config";
import { providerRegistry } from "./providers/registry";

export type ModelBinding = { model: LanguageModel; timeoutMs: number; maxRetries: number };

export function createModelBinding(config: ResolvedModelConfig): ModelBinding {
  return {
    model: providerRegistry[config.provider.adapter](config),
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
  };
}
