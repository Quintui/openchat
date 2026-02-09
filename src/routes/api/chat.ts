import { write } from "node:fs";
import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import z from "zod";
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
        const trigger = params.trigger as string | undefined;
        const regenerateMessageId = params.messageId as string | undefined;
        const rawModelId = params.modelId as string | undefined;
        const isValidModel = MODELS.some((m) => m.id === rawModelId);
        const modelId = isValidModel ? rawModelId! : DEFAULT_MODEL_ID;
        const webSearchEnabled = params.webSearchEnabled === true;

        const requestContext = new RequestContext();
        requestContext.set("modelId", modelId);
        requestContext.set("webSearchEnabled", webSearchEnabled);

        const stream = createUIMessageStream<MyUIMessage>({
          execute: async ({ writer }) => {
            const agent = await mastra.getAgent("assistant");
            const memory = await agent.getMemory();

            let thread = await memory?.getThreadById({
              threadId,
            });

            // On regeneration, delete the target message and everything after it
            // so the new response replaces the old one in the DB
            if (trigger === "regenerate-message" && regenerateMessageId && memory && thread) {
              const { messages: storedMessages } = await memory.recall({
                resourceId: RESOURCE_ID,
                threadId,
              });

              if (storedMessages) {
                const targetIdx = storedMessages.findIndex((m) => m.id === regenerateMessageId);

                if (targetIdx !== -1) {
                  const idsToDelete = storedMessages
                    .slice(targetIdx)
                    .map((m) => m.id)
                    .filter(Boolean) as string[];

                  if (idsToDelete.length > 0) {
                    await memory.deleteMessages(idsToDelete);
                  }
                }
              }
            }

            if (!thread) {
              const createdThread = await memory?.createThread({
                threadId,
                resourceId: RESOURCE_ID,
                title: "New Chat",
              });

              if (!createdThread) {
                throw new Error("Failed to create thread");
              }

              thread = createdThread;

              writer.write({
                id: createdThread.id,
                type: "data-new-thread-created",
                data: {
                  threadId: createdThread.id,
                  title: createdThread.title ?? "New Chat",
                  resourceId: createdThread.resourceId,
                  createdAt: createdThread.createdAt.toISOString(),
                  updatedAt: createdThread.updatedAt.toISOString(),
                },
              });
            }

            const chatStream = await handleChatStream<MyUIMessage>({
              mastra,
              agentId: "assistant",

              params: {
                onFinish: async ({ text }) => {
                  const titlerAgent = mastra.getAgent("titler");

                  const titleResponseStream = await titlerAgent.stream(
                    `Context for the title: <context>${text}</context>`,
                    {
                      structuredOutput: {
                        schema: z.object({
                          title: z.string(),
                        }),
                      },
                    },
                  );

                  for await (const titleResponse of titleResponseStream.objectStream) {
                    writer.write({
                      id: `conversation-title-${thread?.id}`,
                      type: "data-conversation-title",
                      data: {
                        title: titleResponse.title ?? "",
                      },
                    });
                  }

                  const finalTitle = await titleResponseStream.object;

                  await memory?.createThread({
                    threadId,
                    resourceId: RESOURCE_ID,
                    title: finalTitle.title,
                  });
                },
                maxSteps: 20,
                messages: params.messages,
                requestContext,
                memory: {
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
