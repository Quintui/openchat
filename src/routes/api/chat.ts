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

        const rawModelId = params.modelId as string | undefined;
        const isValidModel = MODELS.some((m) => m.id === rawModelId);
        const modelId = isValidModel ? rawModelId! : DEFAULT_MODEL_ID;

        const requestContext = new RequestContext();
        requestContext.set("modelId", modelId);

        const stream = createUIMessageStream<MyUIMessage>({
          execute: async ({ writer }) => {
            const agent = await mastra.getAgent("assistant");
            const memory = await agent.getMemory();

            let thread = await memory?.getThreadById({
              threadId,
            });

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
