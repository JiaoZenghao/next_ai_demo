import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AIConfigError, parseAIConfig } from "./config";

export function loadAIConfig() {
  let source: string;
  try {
    source = readFileSync(join(process.cwd(), "config/ai.yaml"), "utf8");
  } catch {
    throw new AIConfigError("Unable to read config/ai.yaml.");
  }
  return parseAIConfig(source);
}
