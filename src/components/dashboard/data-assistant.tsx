"use client";

import { CopilotKit, useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui";
import { useCopilotKit } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { RevenueChart } from "./revenue-chart";
import { revenueData, type RevenuePoint } from "@/data/revenue";

type AssistantProps = { children: ReactNode; mode: "mock" | "live" };

function AssistantLauncher() {
  const { open, setOpen } = useChatContext();
  if (open) return null;
  return <Button onClick={() => setOpen(true)} aria-label="打开数据助手" className="fixed right-5 bottom-5 z-40 h-12 rounded-full bg-dashboard-indigo px-5 text-white shadow-lg hover:bg-dashboard-indigo/90"><MessageSquare className="size-4" />数据助手</Button>;
}

function AssistantHeader() {
  const { labels, setOpen } = useChatContext();
  return <div className="flex min-h-16 items-center justify-between border-b bg-card px-5 text-foreground"><div><p className="text-sm font-semibold">数据助手</p><p className="mt-1 text-xs text-muted-foreground">{labels.title}</p></div><Button variant="ghost" size="icon" aria-label="关闭数据助手" onClick={() => setOpen(false)}><X className="size-4" /></Button></div>;
}

function AssistantSidebar({ children, mode }: AssistantProps) {
  const { copilotkit } = useCopilotKit();
  const ready = copilotkit.runtimeConnectionStatus === "connected";
  useCopilotReadable({
    description: "Lumina dashboard demo data. All values are mock data in USD. Monthly revenue is a separate example series; do not reconcile it with the summary KPI.",
    value: {
      revenue: revenueData,
      summary: { revenue: 428600, customers: 24892, conversionPercent: 6.84, averageOrder: 86.4 },
      channels: { direct: 186400, organicSearch: 132700, paidSocial: 68300, partners: 41200 },
    },
  });

  useCopilotAction({
    name: "streamRevenueChart",
    description: "Render monthly mock revenue points as they stream in.",
    parameters: [{ name: "points", type: "object[]", attributes: [
      { name: "month", type: "string" },
      { name: "revenue", type: "number" },
      { name: "previousPeriod", type: "number" },
    ] }],
    handler: async () => "Mock revenue chart complete.",
    render: ({ args, status }) => {
      const points = (args.points ?? []).filter((point): point is RevenuePoint =>
        typeof point?.month === "string" && typeof point.revenue === "number" && typeof point.previousPeriod === "number",
      );
      return (
        <section aria-label="Streaming revenue chart" className="my-3 min-w-0 rounded-xl border bg-card p-3">
          <p className="text-sm font-semibold">收入趋势 · Mock data</p>
          <p role="status" className="my-2 text-xs text-muted-foreground">
            {status === "complete" ? "生成完成" : "正在生成图表"} · {points.length} / 8 个月
          </p>
          <RevenueChart data={points} />
        </section>
      );
    },
  });

  useCopilotAction({
    name: "showRevenueChart",
    description: "Display the dashboard's January–August 2026 mock revenue comparison chart in the conversation.",
    parameters: [],
    handler: async () => "Displayed mock revenue chart. July revenue is $78,400.",
    render: () => (
      <section aria-label="Revenue chart answer" className="my-3 rounded-xl border bg-card p-3">
        <p className="mb-2 text-sm font-semibold">Revenue performance · Mock data</p>
        <RevenueChart />
      </section>
    ),
  });

  return (
    <CopilotSidebar
      defaultOpen={false}
      Button={AssistantLauncher}
      Header={AssistantHeader}
      clickOutsideToClose={false}
      ErrorMessage={() => (
        <p role="alert" className="m-4 rounded-lg border p-4 text-sm text-muted-foreground">
          {mode === "mock" ? "演示连接暂时中断，请重试。" : "模型请求失败，请检查服务端模型配置、密钥和服务可用性。"}
        </p>
      )}
      instructions="You are Lumina's Data Assistant. Answer in the user's language. Answer general questions using your knowledge and reasoning. For questions about this dashboard, ground all figures and trends in the provided dashboard context and identify its data source accurately. The current dashboard context contains mock data; using a live model does not make that data real. Never invent business figures, causes, database access or actions. If the context is insufficient, say what information is missing. The monthly revenue series and summary KPI are separate demo fixtures. When asked for a revenue chart, call showRevenueChart. For progressive or streaming chart requests call streamRevenueChart with the eight provided monthly points in order. Give concise, helpful answers with correctly formatted currency."
      suggestions={ready ? [
        { title: mode === "mock" ? "▶ 收入趋势流式演示" : "分析收入趋势并生成图表", message: mode === "mock" ? "请用 mock 数据演示流式回答，并逐月生成收入趋势图。" : "请根据当前看板数据分析收入趋势，并生成收入趋势图。" },
      ] : []}
      labels={{
        title: mode === "mock" ? "演示问答 · 固定模拟回复" : "真实模型 · 基于当前看板",
        initial: mode === "mock"
          ? "点击下方示例，体验收入趋势分析与动态图表。演示问答使用固定回复，不调用模型。"
          : "你好，可以向我询问当前看板的指标与趋势。当前看板使用示例数据；聊天内容与看板上下文会发送至配置的模型服务。",
        placeholder: "询问收入、趋势或关键指标…",
      }}
    >
      {children}
    </CopilotSidebar>
  );
}

export function DataAssistant({ children, mode }: AssistantProps) {
  return (
    <CopilotKit key={mode} runtimeUrl={mode === "mock" ? "/api/copilotkit?demo=true" : "/api/copilotkit"} useSingleEndpoint showDevConsole={false} enableInspector={false}>
      <AssistantSidebar mode={mode}>{children}</AssistantSidebar>
    </CopilotKit>
  );
}
