import "server-only";
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { AIConfigError, resolveModelConfig } from "../ai/config";
import { loadAIConfig } from "../ai/load-config";
import { createModelBinding } from "../ai/model-factory";
import { createDataAssistantAgent } from "./data-assistant-agent";
import { demoStream } from "./demo-stream";

export async function handleCopilotRequest(request: Request) {
  const envelope = await request.clone().json().catch(() => null);
  if (!envelope || typeof envelope.method !== "string") {
    return Response.json({ error: "Invalid request envelope" }, { status: 400 });
  }
  // Stateless transport: browser-owned history, no cross-user resource store.
  // Discovery works even before the selected provider is configured.
  if (envelope.method === "info") {
    return Response.json({
      version: "1.71.1",
      agents: { default: { name: "default", description: "Data Assistant" } },
      mode: "sse",
      singleRoute: { resourceOperations: false },
    });
  }
  if (envelope.method === "agent/connect") {
    return new Response("", { headers: { "Content-Type": "text/event-stream" } });
  }
  if (envelope.method !== "agent/run") {
    return Response.json({ error: "Unsupported operation" }, { status: 400 });
  }
  if (new URL(request.url).searchParams.get("demo") === "true") {
    return demoStream(envelope.body, request.signal);
  }
  try {
    const config = loadAIConfig();
    if (config.mode === "mock") return demoStream(envelope.body, request.signal);
    const binding = createModelBinding(resolveModelConfig(config, process.env));
    // Never share mutable messages, runner state or abort controllers between requests.
    const handler = createCopilotRuntimeHandler({
      runtime: new CopilotRuntime({ agents: { default: createDataAssistantAgent(binding) } }),
      basePath: "/api/copilotkit",
      mode: "single-route",
    });
    return handler(request);
  } catch (error) {
    if (error instanceof AIConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
