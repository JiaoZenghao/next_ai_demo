import { BuiltInAgent, convertMessagesToVercelAISDKMessages } from "@copilotkit/runtime/v2";
import { jsonSchema, modelMessageSchema, streamText, tool } from "ai";
import type { ModelBinding } from "../ai/model-factory";

export function createDataAssistantAgent({ model, timeoutMs, maxRetries }: ModelBinding) {
  // Use the application's AI SDK 7, not the runtime's bundled AI SDK 6.
  return new BuiltInAgent({
    type: "aisdk",
    factory: ({ input, abortSignal }) => {
      const result = streamText({
        model,
        messages: convertMessagesToVercelAISDKMessages(input.messages, {
          forwardSystemMessages: true,
          forwardDeveloperMessages: true,
        }).map(message => modelMessageSchema.parse(message)),
        system: input.context.map(context => `${context.description}:\n${context.value}`).join("\n\n"),
        tools: Object.fromEntries(input.tools.map(definition => [definition.name, tool({
          description: definition.description,
          inputSchema: jsonSchema(definition.parameters),
          // Frontend tools are rendered/executed by CopilotKit in the browser.
        })])),
        abortSignal: AbortSignal.any([abortSignal, AbortSignal.timeout(timeoutMs)]),
        maxRetries,
        // SDK defaults log APICallError, which includes request/response bodies.
        onError: () => {},
      });
      return { fullStream: (async function* () {
        try {
          for await (const part of result.fullStream) {
            yield part.type === "error" ? { type: "error", error: "Model request failed. Check provider configuration and availability." } : part;
          }
        } catch {
          yield { type: "error", error: "Model request failed. Check provider configuration and availability." };
        }
      })() };
    },
  });
}
