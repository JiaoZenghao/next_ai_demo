import { setTimeout } from "node:timers/promises";
import { z } from "zod";
import { revenueDemoEvents } from "@/lib/revenue-demo";

const inputSchema = z.object({
  threadId: z.string().min(1).max(200),
  runId: z.string().min(1).max(200),
  messages: z.array(z.object({ role: z.string() })).max(200),
});

export function demoStream(body: unknown, requestSignal: AbortSignal) {
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid demo request" }, { status: 400 });
  const events = revenueDemoEvents(parsed.data);
  const abort = new AbortController();
  const signal = AbortSignal.any([requestSignal, abort.signal]);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async pull(controller) {
      const next = events.next();
      if (next.done) { controller.close(); return; }
      try {
        const delay = next.value.type === "TOOL_CALL_ARGS" ? 650 : next.value.type === "TEXT_MESSAGE_CONTENT" ? 100 : 0;
        await setTimeout(delay, undefined, { signal });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
      } catch {
        if (!abort.signal.aborted) controller.close();
      }
    },
    cancel() { abort.abort(); },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  } });
}
