import { revenueData } from "@/data/revenue";

type DemoInput = { threadId: string; runId: string; messages: { role: string }[] };
type DemoEvent = { type: string; [key: string]: unknown };

/** Deterministic AG-UI demo, not a model response or a live business data feed. */
export function* revenueDemoEvents(input: DemoInput): Generator<DemoEvent> {
  const { threadId, runId } = input;
  const messageId = `${runId}-answer`;
  const toolCallId = `${runId}-chart`;
  yield { type: "RUN_STARTED", threadId, runId };
  yield { type: "TEXT_MESSAGE_START", messageId, role: "assistant" };
  const isFollowUp = input.messages.at(-1)?.role === "tool";
  const answer = isFollowUp
    ? "图表已生成。你可以悬停查看每个月的收入与上一期对比，或再次发送问题重播演示。"
    : "这是 **Mock 流式演示**，不调用真实模型。\n\n收入从 1 月的 **$46,000** 增长到 8 月的 **$73,100**，增幅约 **58.9%**。7 月达到峰值 **$78,400**，8 月较峰值回落约 **6.8%**。\n\n下面逐月传入数据，实时绘制收入趋势图：\n";
  for (const delta of answer.match(/.{1,7}|\n/g) || []) {
    yield { type: "TEXT_MESSAGE_CONTENT", messageId, delta };
  }
  yield { type: "TEXT_MESSAGE_END", messageId };
  if (!isFollowUp) {
    yield { type: "TOOL_CALL_START", toolCallId, toolCallName: "streamRevenueChart", parentMessageId: messageId };
    yield { type: "TOOL_CALL_ARGS", toolCallId, delta: '{"points":[' };
    for (const [index, point] of revenueData.entries()) {
      yield { type: "TOOL_CALL_ARGS", toolCallId, delta: `${index ? "," : ""}${JSON.stringify(point)}` };
    }
    yield { type: "TOOL_CALL_ARGS", toolCallId, delta: "]}" };
    yield { type: "TOOL_CALL_END", toolCallId };
  }
  yield { type: "RUN_FINISHED", threadId, runId };
}
