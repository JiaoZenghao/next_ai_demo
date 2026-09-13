import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { ResolvedModelConfig } from "../config";

type ProviderFactory = (config: ResolvedModelConfig) => LanguageModel;

export const providerRegistry: Record<ResolvedModelConfig["provider"]["adapter"], ProviderFactory> = {
  ollama: ({ provider, model, apiKey }) => createOpenAICompatible({
    name: "ollama", baseURL: provider.baseURL, apiKey: apiKey ?? "ollama",
    transformRequestBody: body => ({ ...body, parallel_tool_calls: false }),
  }).chatModel(model),
  "openai-compatible": ({ provider, model, apiKey }) => createOpenAICompatible({
    name: "openai-compatible", baseURL: provider.baseURL, apiKey,
  }).chatModel(model),
};
