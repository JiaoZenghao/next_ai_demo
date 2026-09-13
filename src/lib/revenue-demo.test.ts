import { describe, expect, it } from "vitest";
import { revenueDemoEvents } from "./revenue-demo";

describe("revenue demo stream", () => {
  const input = { threadId: "thread", runId: "run", messages: [{ role: "user" }] };
  it("streams text before incremental chart arguments with balanced lifecycle events", () => {
    const events = [...revenueDemoEvents(input)];
    expect(events[0].type).toBe("RUN_STARTED");
    expect(events.at(-1)?.type).toBe("RUN_FINISHED");
    const text = events.filter(e => e.type === "TEXT_MESSAGE_CONTENT");
    expect(text.length).toBeGreaterThan(5);
    expect(text.map(e => e.delta).join("")).toContain("Mock");
    const args = events.filter(e => e.type === "TOOL_CALL_ARGS");
    const data = JSON.parse(args.map(e => e.delta).join(""));
    expect(data.points).toHaveLength(8);
    expect(data.points[6].revenue).toBe(78400);
    expect(args.length).toBeGreaterThan(8);
  });
  it("finishes tool follow-up without recursively emitting another chart", () => {
    const events = [...revenueDemoEvents({ ...input, messages: [{ role: "tool" }] })];
    expect(events.some(e => e.type === "TOOL_CALL_START")).toBe(false);
    expect(events.at(-1)?.type).toBe("RUN_FINISHED");
  });
});
