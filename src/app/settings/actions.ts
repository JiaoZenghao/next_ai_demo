"use server";

import { testModelConnection } from "@/lib/ai/test-connection";
import { revalidatePath } from "next/cache";
import { getDemoSession } from "@/data/auth";
import { AIConfigError } from "@/lib/ai/config";
import { loadEditableSettings } from "@/lib/ai/load-config";
import { publicSettings, type PublicModelSettings } from "@/lib/ai/settings";
import { saveModelSettings } from "@/lib/ai/settings-store";

export type SettingsActionState = { error?: string; saved?: PublicModelSettings };

export async function saveSettingsAction(_previous: SettingsActionState, form: FormData): Promise<SettingsActionState> {
  if (!(await getDemoSession())) return { error: "登录已过期，请重新登录后保存。" };
  try {
    const saved = saveModelSettings({
      mode: form.get("mode"), adapter: form.get("adapter"), baseURL: form.get("baseURL"),
      model: form.get("model"), apiKey: form.get("apiKey"), clearApiKey: form.get("clearApiKey") === "on",
      timeoutMs: Number(form.get("timeoutMs")), maxRetries: Number(form.get("maxRetries")),
    }, loadEditableSettings());
    revalidatePath("/");
    revalidatePath("/settings");
    return { saved: publicSettings(saved) };
  } catch (error) {
    return { error: error instanceof AIConfigError ? error.message : "配置保存失败，请稍后重试。" };
  }
}

export async function testSettingsAction(): Promise<import("@/lib/ai/test-connection").ConnectionTestResult> {
  if (!(await getDemoSession())) return { ok: false, message: "登录已过期，请重新登录后测试。" };
  try {
    return await testModelConnection(loadEditableSettings());
  } catch {
    return { ok: false, message: "无法读取模型配置，请先检查并保存配置。" };
  }
}
