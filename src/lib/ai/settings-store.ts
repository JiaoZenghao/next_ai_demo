import "server-only";
import { mkdirSync, readFileSync, renameSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { AIConfigError } from "./config";
import { mergeSettings, type ModelSettings } from "./settings";

function settingsPath() {
  return join(process.env.AI_SETTINGS_DIR || join(process.cwd(), ".local"), "model-settings.json");
}

export function readModelSettings(): ModelSettings | null {
  try {
    return mergeSettings(JSON.parse(readFileSync(settingsPath(), "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new AIConfigError("无法读取已保存的模型配置，请检查服务端配置存储。");
  }
}

export function saveModelSettings(input: unknown, fallback?: ModelSettings): ModelSettings {
  const settings = mergeSettings(input, readModelSettings() ?? fallback);
  const path = settingsPath();
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(temporary, JSON.stringify(settings), { mode: 0o600, flag: "wx" });
    renameSync(temporary, path);
  } catch {
    throw new AIConfigError("配置保存失败，请检查服务端存储目录是否可写。");
  } finally {
    rmSync(temporary, { force: true });
  }
  return settings;
}
