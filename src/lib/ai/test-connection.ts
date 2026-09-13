import "server-only";
import { APICallError, generateText } from "ai";
import { AIConfigError, resolveModelConfig } from "./config";
import { createModelBinding } from "./model-factory";
import { mergeSettings, settingsToConfig, type ModelSettings } from "./settings";

export type ConnectionTestResult = { ok: boolean; message: string; durationMs?: number; skipped?: boolean };

export async function testModelConnection(settings: ModelSettings): Promise<ConnectionTestResult> {
  if (settings.mode === "mock") {
    return { ok: true, skipped: true, message: "演示模式无需连接测试，不会调用真实模型。若需测试，请切换为真实模型并保存配置。" };
  }
  const start = Date.now();
  let signal: AbortSignal | undefined;
  try {
    const validated = mergeSettings(settings);
    const binding = createModelBinding(resolveModelConfig(settingsToConfig(validated), {}));
    signal = AbortSignal.timeout(Math.min(binding.timeoutMs, 30000));
    const result = await generateText({
      model: binding.model,
      prompt: "Reply with OK only.",
      maxOutputTokens: 32,
      maxRetries: 0,
      abortSignal: signal,
    });
    return { ok: true, durationMs: Date.now() - start, message: result.text.trim() ? "连接成功，模型已返回文本响应。" : "接口连接成功，但模型未返回文本，请检查模型输出设置。" };
  } catch (error) {
    let message = "连接失败，请检查接口地址、网络或模型服务是否可用。";
    if (error instanceof AIConfigError) message = error.message;
    else if (signal?.aborted) message = "测试超时，请检查网络或模型服务状态（最长等待 30 秒）。";
    else if (APICallError.isInstance(error) && error.statusCode) {
      const status = error.statusCode;
      const reason = status === 401 || status === 403 ? "鉴权失败，请检查 API Key 和访问权限。"
        : status === 404 ? "接口或模型不存在，请检查接口地址与模型名称。"
        : status === 429 ? "请求受限，请检查额度或稍后重试。"
        : "模型服务请求失败，请检查服务状态与配置。";
      message = `测试失败（HTTP ${status}）：${reason}`;
    }
    return { ok: false, message, durationMs: Date.now() - start };
  }
}
