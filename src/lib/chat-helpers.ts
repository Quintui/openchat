import type { MastraMemory, StorageThreadType } from "@mastra/core/memory";
import type { UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { DEFAULT_MODEL_ID, MODELS } from "@/config/models";
import { mastra } from "@/mastra";
import type { MyUIMessage } from "@/types/ui-message";

const RESOURCE_ID = "user-id"; // TODO: Replace with real auth

const chatRequestSchema = z.object({
  threadId: z.string().min(1),
  messages: z.array(z.any()).min(1),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
  modelId: z.string().optional(),
  webSearchEnabled: z.boolean().optional().default(false),
});

export type ChatRequest = {
  threadId: string;
  messages: MyUIMessage[];
  trigger?: string;
  regenerateMessageId?: string;
  modelId: string;
  webSearchEnabled: boolean;
};

/**
 * Parse and validate the incoming chat request body.
 * Returns a typed, sanitized ChatRequest or throws on invalid input.
 */
export function parseChatRequest(params: unknown): ChatRequest {
  const parsed = chatRequestSchema.parse(params);

  const isValidModel = MODELS.some((m) => m.id === parsed.modelId);

  return {
    threadId: parsed.threadId,
    messages: parsed.messages as MyUIMessage[],
    trigger: parsed.trigger,
    regenerateMessageId: parsed.messageId,
    modelId: isValidModel ? parsed.modelId! : DEFAULT_MODEL_ID,
    webSearchEnabled: parsed.webSearchEnabled,
  };
}

/**
 * Resolve (get or create) a thread for the given threadId.
 * If the thread is newly created, emits a `data-new-thread-created` stream part.
 * Returns the thread and whether it was just created.
 */
export async function resolveThread(
  memory: MastraMemory,
  threadId: string,
  writer: UIMessageStreamWriter<MyUIMessage>,
): Promise<{ thread: StorageThreadType; isNew: boolean }> {
  const existing = await memory.getThreadById({ threadId });

  if (existing) {
    return { thread: existing, isNew: false };
  }

  const created = await memory.createThread({
    threadId,
    resourceId: RESOURCE_ID,
    title: "New Chat",
  });

  writer.write({
    id: created.id,
    type: "data-new-thread-created",
    data: {
      threadId: created.id,
      title: created.title ?? "New Chat",
      resourceId: created.resourceId,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
  });

  return { thread: created, isNew: true };
}

/**
 * Handle message regeneration by deleting the target message
 * and all subsequent messages so the new response replaces them.
 */
export async function handleRegeneration(
  memory: MastraMemory,
  threadId: string,
  messageId: string,
): Promise<void> {
  const { messages: storedMessages } = await memory.recall({
    resourceId: RESOURCE_ID,
    threadId,
  });

  if (!storedMessages) return;

  const targetIdx = storedMessages.findIndex((m) => m.id === messageId);
  if (targetIdx === -1) return;

  const idsToDelete = storedMessages
    .slice(targetIdx)
    .map((m) => m.id)
    .filter(Boolean) as string[];

  if (idsToDelete.length > 0) {
    await memory.deleteMessages(idsToDelete);
  }
}

/**
 * Generate a short title for the thread using the titler agent.
 * Streams the title to the client as it's generated, then persists it.
 */
export async function generateThreadTitle(
  memory: MastraMemory,
  threadId: string,
  text: string,
  writer: UIMessageStreamWriter<MyUIMessage>,
): Promise<void> {
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
      id: `conversation-title-${threadId}`,
      type: "data-conversation-title",
      data: {
        title: titleResponse.title ?? "",
      },
    });
  }

  const finalTitle = await titleResponseStream.object;

  await memory.createThread({
    threadId,
    resourceId: RESOURCE_ID,
    title: finalTitle.title,
  });
}
