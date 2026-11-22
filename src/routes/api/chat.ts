import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createFileRoute } from "@tanstack/react-router";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type InferUIMessageChunk,
  type UIMessageStreamWriter,
} from "ai";
import { RESOURCE_ID } from "@/config/resource";
import {
  type ChatRequest,
  generateThreadTitle,
  getAssistantMemory,
  handleRegeneration,
  parseChatRequest,
  resolveThread,
} from "@/lib/chat-helpers";
import { mastra } from "@/mastra";
import type { AgentUIMessage, MyUIMessage } from "@/types/ui-message";

async function streamChat(params: ChatRequest, writer: UIMessageStreamWriter<MyUIMessage>) {
  const memory = await getAssistantMemory();
  const { thread, isNew } = await resolveThread(memory, params.threadId, writer);

  if (params.trigger === "regenerate-message" && params.messageId) {
    await handleRegeneration(memory, params.threadId, params.messageId);
  }

  const requestContext = new RequestContext();
  requestContext.set("modelId", params.modelId);
  requestContext.set("webSearchEnabled", params.webSearchEnabled);

  const chatStream = await handleChatStream<AgentUIMessage>({
    mastra,
    agentId: "assistant",
    version: "v7",
    sendReasoning: true,
    params: {
      messages: params.messages,
      maxSteps: 20,
      requestContext,
      memory: { thread, resource: RESOURCE_ID },
      onFinish: isNew
        ? ({ text }) => generateThreadTitle(memory, params.threadId, text, writer)
        : undefined,
    },
  });

  // @mastra/ai-sdk types its v7 stream with an older bundled copy of the AI SDK
  // types, so the chunk type has to be bridged to the installed `ai` version.
  writer.merge(chatStream as ReadableStream<InferUIMessageChunk<MyUIMessage>>);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params = parseChatRequest(await request.json());

        const stream = createUIMessageStream<MyUIMessage>({
          execute: ({ writer }) => streamChat(params, writer),
          onError: (error) => {
            console.error("Chat stream error:", error);
            // Same text as the AI SDK's default onError.
            return "An error occurred.";
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
