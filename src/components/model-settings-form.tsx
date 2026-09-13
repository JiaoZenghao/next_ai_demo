"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, FlaskConical, LoaderCircle, Save, SlidersHorizontal } from "lucide-react";
import { saveSettingsAction, testSettingsAction, type SettingsActionState } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicModelSettings } from "@/lib/ai/settings";
import type { ConnectionTestResult } from "@/lib/ai/test-connection";

const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50";
type Draft = Omit<PublicModelSettings, "timeoutMs" | "maxRetries"> & { timeoutMs: number | string; maxRetries: number | string } & { apiKey: string; clearApiKey: boolean };

export function ModelSettingsForm({ initial }: { initial: PublicModelSettings }) {
  const [draft, setDraft] = useState<Draft>({ ...initial, apiKey: "", clearApiKey: false });
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [state, action, pending] = useActionState(async (previous: SettingsActionState, form: FormData) => {
    const result = await saveSettingsAction(previous, form);
    setSaveError(result.error);
    if (result.saved) {
      setDraft({ ...result.saved, apiKey: "", clearApiKey: false });
      setDirty(false);
    }
    return result;
  }, {});
  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setDirty(true);
    setSaveError(undefined);
    setTestResult(null);
  }
  return (
    <form action={action} onSubmit={() => setTestResult(null)}>
      <fieldset disabled={pending || testing} className="space-y-5">
        <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="mode-heading">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 id="mode-heading" className="font-semibold">问答模式</h2><span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">应用共享</span></div>
          <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center">
            <p className="text-sm leading-6 text-muted-foreground">仅影响 Data Assistant 的回答方式。<br />看板的数据获取和展示保持独立。</p>
            <div className="space-y-2"><Label htmlFor="mode" className="sr-only">运行模式</Label><select id="mode" name="mode" value={draft.mode} onChange={event => update("mode", event.target.value as Draft["mode"])} className={selectClass}><option value="mock">演示模式</option><option value="live">真实模型</option></select></div>
          </div>
          <div className="mt-4 flex gap-2 rounded-lg bg-dashboard-indigo-soft/50 px-3 py-2.5 text-sm text-dashboard-indigo"><FlaskConical className="mt-0.5 size-4 shrink-0" /><p>{draft.mode === "mock" ? "使用固定模拟回答，无需连接模型。" : "使用已配置的大模型回答问题，聊天上下文会发送至模型服务。"}</p></div>
        </section>
        <details key={draft.mode} open={draft.mode === "live" ? true : undefined} className="group rounded-xl border bg-card">
          <summary className="cursor-pointer px-5 py-5 text-sm font-semibold sm:px-6">模型连接<span className="ml-3 text-xs font-normal text-muted-foreground">{draft.mode === "mock" ? "可选 · 展开配置真实模型" : "填写服务地址与模型信息"}</span></summary>
          <div className="space-y-5 border-t p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="adapter">服务类型</Label><select id="adapter" name="adapter" value={draft.adapter} onChange={event => update("adapter", event.target.value as Draft["adapter"])} className={selectClass}><option value="ollama">Ollama</option><option value="openai-compatible">OpenAI 兼容接口</option></select></div>
              <div className="space-y-2"><Label htmlFor="model">模型名称</Label><Input id="model" name="model" className="h-10" required={draft.mode === "live"} maxLength={200} value={draft.model} onChange={event => update("model", event.target.value)} placeholder="例如 qwen-plus" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="baseURL">接口地址（Base URL）</Label><Input id="baseURL" name="baseURL" type="url" className="h-10 font-mono text-sm" required={draft.mode === "live"} maxLength={2048} value={draft.baseURL} onChange={event => update("baseURL", event.target.value)} placeholder="https://api.example.com/v1" aria-describedby="baseURL-help" /><p id="baseURL-help" className="text-xs leading-5 text-muted-foreground">包含 /v1 等接口路径，不追加 /chat/completions。</p></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="apiKey">API Key</Label><span className="text-xs text-muted-foreground">{draft.hasApiKey ? "已设置" : "未设置"}</span></div><Input id="apiKey" name="apiKey" type="password" className="h-10" autoComplete="new-password" maxLength={4096} value={draft.apiKey} onChange={event => update("apiKey", event.target.value)} placeholder={draft.hasApiKey ? "留空保留现有密钥" : "无需鉴权的服务可留空"} aria-describedby="key-help" /><p id="key-help" className="text-xs leading-5 text-muted-foreground">密钥不回显。更换服务类型或地址后，需要重新填写。</p>{draft.hasApiKey ? <label className="flex items-center gap-2 pt-1 text-sm"><input type="checkbox" name="clearApiKey" checked={draft.clearApiKey} onChange={event => update("clearApiKey", event.target.checked)} className="size-4 accent-[var(--dashboard-indigo)]" />清除已保存的 API Key</label> : null}</div>
            <p className="text-xs text-muted-foreground">如需在问答中生成图表，请选择支持工具调用的模型。</p>
          </div>
        </details>
        <details className="rounded-xl border bg-card">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium sm:px-6"><SlidersHorizontal className="mr-2 inline size-4 text-muted-foreground" />高级设置</summary>
          <div className="grid gap-5 border-t p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-2"><Label htmlFor="timeoutMs">请求超时（毫秒）</Label><Input id="timeoutMs" name="timeoutMs" type="number" min={1000} max={300000} required value={draft.timeoutMs} onChange={event => update("timeoutMs", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="maxRetries">重试次数</Label><Input id="maxRetries" name="maxRetries" type="number" min={0} max={3} required value={draft.maxRetries} onChange={event => update("maxRetries", event.target.value)} /></div>
          </div>
        </details>
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{pending ? "正在保存配置…" : dirty ? "有未保存的修改" : "配置对所有使用者生效"}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="lg" disabled={dirty} title={dirty ? "请先保存修改后再测试" : "测试已保存的配置"} onClick={() => { setTestResult(null); startTest(async () => { try { setTestResult(await testSettingsAction()); } catch { setTestResult({ ok: false, message: "测试请求失败，请检查网络后重试。" }); } }); }}>{testing ? <LoaderCircle className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}{testing ? "测试中…" : "测试连接"}</Button>
            <Button type="submit" size="lg" className="bg-dashboard-indigo text-white hover:bg-dashboard-indigo/90 dark:text-background">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "保存中…" : "保存配置"}</Button>
          </div>
        </div>
      </fieldset>
      <div className="mt-4 space-y-3 text-sm" aria-live="polite">
        {testing ? <p role="status" className="text-muted-foreground">正在测试模型连接，最长等待 30 秒…</p> : null}
        {testResult ? <div role={testResult.ok ? "status" : "alert"} className={`rounded-lg border p-4 ${testResult.ok ? "text-dashboard-teal" : "text-destructive"}`}><p>{testResult.message}{testResult.durationMs !== undefined ? `（耗时 ${testResult.durationMs} ms）` : ""}</p>{testResult.ok && !testResult.skipped ? <p className="mt-2 text-xs text-muted-foreground">仅验证基础文本请求，未验证流式输出和工具调用。</p> : null}</div> : null}
        {saveError ? <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-destructive">{saveError}</p> : null}
        {state.saved && !dirty && !testResult ? <p role="status" className="flex items-center gap-2 text-dashboard-teal"><Check className="size-4" />配置已保存，新请求立即生效。</p> : null}
      </div>
    </form>
  );
}
