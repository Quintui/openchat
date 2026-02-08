import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { DEFAULT_MODEL_ID, MODELS } from "@/config/models";
import { mastra } from "@/mastra";
import type { MyUIMessage } from "@/types/ui-message";

const RESOURCE_ID = "user-id";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params = await request.json();
        const threadId = params.threadId;

        const rawModelId = params.modelId as string | undefined;
        const isValidModel = MODELS.some((m) => m.id === rawModelId);
        const modelId = isValidModel ? rawModelId! : DEFAULT_MODEL_ID;

        const requestContext = new RequestContext();
        requestContext.set("modelId", modelId);

        const stream = createUIMessageStream<MyUIMessage>({
          execute: async ({ writer }) => {
            const memory = await mastra.getAgent("assistant").getMemory();

            const thread = await memory?.createThread({
              threadId,
              resourceId: RESOURCE_ID,
            });

            const chatStream = await handleChatStream<MyUIMessage>({
              mastra,
              agentId: "assistant",
              params: {
                maxSteps: 20,
                ...params,
                requestContext,
                memory: {
                  ...params.memory,
                  thread: thread,
                  resource: RESOURCE_ID,
                },
              },

              sendReasoning: true,
            });

            writer.merge(chatStream);
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
