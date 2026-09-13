import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession } from "@/data/auth";
import { loadEditableSettings } from "@/lib/ai/load-config";
import { publicSettings } from "@/lib/ai/settings";
import { ModelSettingsForm } from "@/components/model-settings-form";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "模型配置" };

export default async function SettingsPage() {
  await verifySession();
  const settings = publicSettings(loadEditableSettings());
  return (
    <AppShell active="settings">
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">模型配置</h1><p className="mt-1.5 text-sm text-muted-foreground">管理数据助手的回答方式与模型连接。</p></div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />返回仪表盘</Link>
          </header>
          <div className="max-w-3xl"><ModelSettingsForm initial={settings} /></div>
        </div>
      </main>
    </AppShell>
  );
}
