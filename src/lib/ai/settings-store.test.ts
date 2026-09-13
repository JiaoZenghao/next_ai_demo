import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readModelSettings, saveModelSettings } from "./settings-store";
import { defaultSettings } from "./settings";
vi.mock("server-only", () => ({}));
let directory: string;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "ai-settings-test-")); vi.stubEnv("AI_SETTINGS_DIR", directory); });
afterEach(() => { vi.unstubAllEnvs(); rmSync(directory, { recursive: true, force: true }); });
it("returns null for a fresh installation", () => { expect(readModelSettings()).toBeNull(); });
it("persists settings with private file permissions and retains a key on subsequent saves", () => {
  saveModelSettings({ ...defaultSettings, apiKey: "private-key" });
  expect(readModelSettings()?.apiKey).toBe("private-key");
  saveModelSettings({ ...defaultSettings, apiKey: "" });
  expect(readModelSettings()?.apiKey).toBe("private-key");
  expect(statSync(join(directory, "model-settings.json")).mode & 0o777).toBe(0o600);
});
it("preserves the last valid file when submitted settings are invalid", () => {
  saveModelSettings(defaultSettings);
  expect(() => saveModelSettings({ ...defaultSettings, mode: "live" })).toThrow();
  expect(readModelSettings()).toEqual(defaultSettings);
});
it("does not reveal corrupt file content", () => {
  writeFileSync(join(directory, "model-settings.json"), 'private-secret');
  expect(() => readModelSettings()).toThrow("无法读取已保存的模型配置");
});
it("reports write failure without revealing storage paths", () => {
  const file = join(directory, "not-a-directory");
  writeFileSync(file, "x");
  vi.stubEnv("AI_SETTINGS_DIR", file);
  expect(() => saveModelSettings(defaultSettings)).toThrow("无法读取已保存的模型配置");
  expect(readFileSync(file, "utf8")).toBe("x");
});
