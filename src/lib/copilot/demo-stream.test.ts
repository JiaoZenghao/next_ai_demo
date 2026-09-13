import { describe, expect, it } from "vitest";
import { demoStream } from "./demo-stream";

describe("mock streaming transport", () => {
  it("closes when the request is aborted", async () => {
    const abort = new AbortController();
    abort.abort();
    const response = demoStream({ threadId: "t", runId: "r", messages: [] }, abort.signal);
    expect(await response.text()).toBe("");
  });
  it("completes the short tool acknowledgement stream", async () => {
    const response = demoStream({ threadId: "t", runId: "r", messages: [{ role: "tool" }] }, new AbortController().signal);
    expect(await response.text()).toContain("RUN_FINISHED");
  });
  it("streams all chart arguments before completing", async () => {
    const response = demoStream({ threadId: "t", runId: "r", messages: [] }, new AbortController().signal);
    const text = await response.text();
    expect(text).toContain("TOOL_CALL_ARGS");
    expect(text).toContain("RUN_FINISHED");
  }, 20000);
  it("rejects malformed input", () => {
    expect(demoStream({}, new AbortController().signal).status).toBe(400);
  });
  it("emits an SSE event before completion and supports cancellation", async () => {
    const response = demoStream({ threadId: "t", runId: "r", messages: [] }, new AbortController().signal);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    const reader = response.body!.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('"type":"RUN_STARTED"');
    expect(first.done).toBe(false);
    await reader.cancel();
    expect((await reader.read()).done).toBe(true);
  });
});
