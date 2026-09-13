import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AIConfigError, parseAIConfig } from "./config";
import { readModelSettings } from "./settings-store";
import { defaultSettings, settingsToConfig, type ModelSettings } from "./settings";

export function loadAIConfig() {
  const saved = readModelSettings();
  if (saved) return settingsToConfig(saved);
  let source: string;
  try {
    source = readFileSync(join(process.cwd(), "config/ai.yaml"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return settingsToConfig(defaultSettings);
    throw new AIConfigError("Unable to read config/ai.yaml.");
  }
  return parseAIConfig(source);
}

// For the authenticated settings page only; never serialize this value directly.
export function loadEditableSettings(): ModelSettings {
  const config = loadAIConfig();
  const selected = config.models[config.assignments["data-assistant"]];
  const provider = selected && config.providers[selected.provider];
  if (!selected || !provider) return { ...defaultSettings, mode: config.mode };
  return {
    mode: config.mode, adapter: provider.adapter,
    baseURL: (provider.baseURLEnv && process.env[provider.baseURLEnv]?.trim()) || provider.baseURL,
    model: selected.model ?? process.env[selected.modelEnv!]?.trim() ?? "",
    apiKey: provider.apiKey ?? (provider.apiKeyEnv ? process.env[provider.apiKeyEnv]?.trim() : "") ?? "",
    timeoutMs: selected.timeoutMs, maxRetries: selected.maxRetries,
  };
}
