import { mastra } from "@/mastra";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { handleChatStream } from "@mastra/ai-sdk";
import { MyUIMessage } from "@/types/ui-message";

const RESOURCE_ID = "user-id";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params = await request.json();
        let threadId = params.threadId;


        const stream = createUIMessageStream<MyUIMessage>({
          execute: async ({ writer }) => {


            const memory = await mastra.getAgent("assistant").getMemory();

            const thread = await memory?.createThread({
              threadId,
              resourceId: RESOURCE_ID,
            }) ;


            const chatStream = await handleChatStream<MyUIMessage>({
              mastra,
              agentId: "assistant",
              params: {
                maxSteps: 20,
                ...params,
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
