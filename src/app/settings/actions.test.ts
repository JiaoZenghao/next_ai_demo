import { afterEach, expect, it, vi } from "vitest";
import { getDemoSession } from "@/data/auth";
import { loadEditableSettings } from "@/lib/ai/load-config";
import { saveModelSettings } from "@/lib/ai/settings-store";
import { defaultSettings } from "@/lib/ai/settings";
import { testModelConnection } from "@/lib/ai/test-connection";
import { saveSettingsAction, testSettingsAction } from "./actions";
vi.mock("@/data/auth", () => ({ getDemoSession: vi.fn() }));
vi.mock("@/lib/ai/load-config", () => ({ loadEditableSettings: vi.fn() }));
vi.mock("@/lib/ai/settings-store", () => ({ saveModelSettings: vi.fn() }));
vi.mock("@/lib/ai/test-connection", () => ({ testModelConnection: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
afterEach(() => vi.resetAllMocks());
it("blocks unauthenticated writes", async () => {
  vi.mocked(getDemoSession).mockResolvedValue(null);
  expect(await saveSettingsAction({}, new FormData())).toEqual({ error: "登录已过期，请重新登录后保存。" });
  expect(saveModelSettings).not.toHaveBeenCalled();
});
it("never returns secrets in successful action payloads", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadEditableSettings).mockReturnValue(defaultSettings);
  vi.mocked(saveModelSettings).mockReturnValue({ ...defaultSettings, apiKey: "secret" });
  const result = await saveSettingsAction({}, new FormData());
  expect(result.saved?.hasApiKey).toBe(true);
  expect(JSON.stringify(result)).not.toContain('secret');
});
it("sanitizes unexpected failure messages", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadEditableSettings).mockImplementation(() => { throw new Error("secret"); });
  expect(await saveSettingsAction({}, new FormData())).toEqual({ error: "配置保存失败，请稍后重试。" });
});

it("blocks unauthenticated connection tests", async () => {
  vi.mocked(getDemoSession).mockResolvedValue(null);
  expect((await testSettingsAction()).ok).toBe(false);
  expect(testModelConnection).not.toHaveBeenCalled();
});
it("tests server-owned configuration without saving it", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadEditableSettings).mockReturnValue(defaultSettings);
  vi.mocked(testModelConnection).mockResolvedValue({ ok: true, message: "连接成功" });
  expect((await testSettingsAction()).ok).toBe(true);
  expect(saveModelSettings).not.toHaveBeenCalled();
});
it("hides configuration read errors during testing", async () => {
  vi.mocked(getDemoSession).mockResolvedValue({ isAuthenticated: true });
  vi.mocked(loadEditableSettings).mockImplementation(() => { throw new Error("secret"); });
  expect(await testSettingsAction()).toEqual({ ok: false, message: "无法读取模型配置，请先检查并保存配置。" });
});
