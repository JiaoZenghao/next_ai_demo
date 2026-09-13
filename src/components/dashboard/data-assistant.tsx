"use client";

import { CopilotKit, useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotKit } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

import { RevenueChart } from "./revenue-chart";
import { revenueData, type RevenuePoint } from "@/data/revenue";

type AssistantProps = { children: ReactNode; mode: "mock" | "live" };

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
      defaultOpen
      clickOutsideToClose={false}
      ErrorMessage={() => (
        <p role="alert" className="m-4 rounded-lg border p-4 text-sm text-muted-foreground">
          {mode === "mock" ? "演示连接暂时中断，请重试。" : "模型请求失败，请检查服务端模型配置、密钥和服务可用性。"}
        </p>
      )}
      instructions="You are Lumina's Data Assistant. Answer in the user's language. Use only the provided dashboard mock data. State that the figures are mock data. Never invent trends, causes, database access or actions. The monthly revenue series and summary KPI are separate demo fixtures. When asked for a revenue chart, call showRevenueChart. For progressive or streaming chart requests call streamRevenueChart with the eight provided monthly points in order. Give concise, helpful answers with correctly formatted currency."
      suggestions={ready ? [
        { title: mode === "mock" ? "▶ 收入趋势流式演示" : "分析收入趋势并生成图表", message: "请用 mock 数据演示流式回答，并逐月生成收入趋势图。" },
      ] : []}
      labels={{
        title: "Data Assistant",
        initial: mode === "mock"
          ? "**收入趋势 · Mock 流式演示**\n\n点击下方按钮，观看文字逐段输出，以及 1–8 月收入数据逐点绘制成图。\n\n这是固定脚本和模拟数据，不调用模型，也不代表真实实时业务数据。发送任意问题均可重播。"
          : "**Data Assistant · Live 模型**\n\n由服务端配置的模型实时回答，可分析收入趋势并生成图表。看板数据仍为 Mock 数据。\n\n聊天内容和看板上下文会发送给配置的模型服务。",
        placeholder: "询问收入、趋势或关键指标…",
      }}
    >
      {children}
    </CopilotSidebar>
  );
}

export function DataAssistant({ children, mode }: AssistantProps) {
  return (
    <CopilotKit runtimeUrl={mode === "mock" ? "/api/copilotkit?demo=true" : "/api/copilotkit"} useSingleEndpoint showDevConsole={false} enableInspector={false}>
      <AssistantSidebar mode={mode}>{children}</AssistantSidebar>
    </CopilotKit>
  );
}
