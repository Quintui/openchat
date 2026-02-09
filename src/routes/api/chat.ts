import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import {
  generateThreadTitle,
  handleRegeneration,
  parseChatRequest,
  resolveThread,
} from "@/lib/chat-helpers";
import { mastra } from "@/mastra";
import type { MyUIMessage } from "@/types/ui-message";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const params = parseChatRequest(await request.json());

        const requestContext = new RequestContext();
        requestContext.set("modelId", params.modelId);
        requestContext.set("webSearchEnabled", params.webSearchEnabled);

        const stream = createUIMessageStream<MyUIMessage>({
          execute: async ({ writer }) => {
            try {
              const agent = await mastra.getAgent("assistant");
              const memory = await agent.getMemory();

              if (!memory) {
                throw new Error(
                  "Memory is not configured for the assistant agent",
                );
              }

              const { thread, isNew } = await resolveThread(
                memory,
                params.threadId,
                writer,
              );

              if (
                params.trigger === "regenerate-message" &&
                params.regenerateMessageId
              ) {
                await handleRegeneration(
                  memory,
                  params.threadId,
                  params.regenerateMessageId,
                );
              }

              const chatStream = await handleChatStream<MyUIMessage>({
                mastra,
                agentId: "assistant",
                params: {
                  onFinish: async ({ text }) => {
                    if (!isNew) return;

                    try {
                      await generateThreadTitle(
                        memory,
                        params.threadId,
                        text,
                        writer,
                      );
                    } catch (error) {
                      console.error("Failed to generate thread title:", error);
                    }
                  },
                  maxSteps: 20,
                  messages: params.messages,
                  requestContext,
                  memory: {
                    thread,
                    resource: "user-id", // TODO: Replace with real auth
                  },
                },
                sendReasoning: true,
              });

              writer.merge(chatStream);
            } catch (error) {
              console.error("Chat stream error:", error);
              throw error;
            }
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
