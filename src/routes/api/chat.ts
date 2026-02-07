import { mastra } from "@/mastra";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { handleChatStream } from "@mastra/ai-sdk";
import { nanoid } from "nanoid";
import { MyUIMessage } from "@/types/ui-message";

const RESOURCE_ID = "user-id";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params = await request.json();
        let threadId = params.threadId;

        console.log(
          "Received chat request with params:",
          params.messages.length,
        );

        const stream = createUIMessageStream<MyUIMessage>({
          execute: async ({ writer }) => {
            if (!threadId) {
              threadId = nanoid();
              writer.write({
                type: "data-new-thread-created",
                data: {
                  threadId,
                },
              });
            }

            const chatStream = await handleChatStream<MyUIMessage>({
              mastra,
              agentId: "assistant",
              params: {
                maxSteps: 20,
                ...params,
                memory: {
                  ...params.memory,
                  thread: threadId,
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
