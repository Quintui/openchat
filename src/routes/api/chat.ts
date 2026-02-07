import { mastra } from "@/mastra";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { handleChatStream } from "@mastra/ai-sdk";

const RESOURCE_ID = "user-id";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params = await request.json();
        const id = params.id;

        const chatStream = await handleChatStream({
          mastra,
          agentId: "scenario-architector",
          params: {
            maxSteps: 20,
            ...params,
            memory: {
              ...params.memory,
              thread: id,
              resource: RESOURCE_ID,
            },
          },
          sendReasoning: true,
        });

        return createUIMessageStreamResponse({ stream: chatStream });
      },
    },
  },
});
