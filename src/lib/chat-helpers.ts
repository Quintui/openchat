import type { MastraMemory, StorageThreadType } from "@mastra/core/memory";
import type { UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { DEFAULT_MODEL_ID, MODELS } from "@/config/models";
import { RESOURCE_ID } from "@/config/resource";
import { getTruncationIds } from "@/lib/chat-utils";
import { mastra } from "@/mastra";
import type { AgentUIMessage, MyUIMessage } from "@/types/ui-message";

const NEW_THREAD_TITLE = "New Chat";

const chatRequestSchema = z.object({
  threadId: z.string().min(1),
  messages: z.array(z.custom<AgentUIMessage>()).min(1),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
  modelId: z
    .string()
    .optional()
    .transform((id) => MODELS.find((m) => m.id === id)?.id ?? DEFAULT_MODEL_ID),
  webSearchEnabled: z.boolean().optional().default(false),
});

export type ChatRequest = z.output<typeof chatRequestSchema>;

/** Parse and validate the incoming chat request body. Throws on invalid input. */
export function parseChatRequest(body: unknown): ChatRequest {
  return chatRequestSchema.parse(body);
}

/** Get the assistant agent's memory, which every chat and thread operation relies on. */
export async function getAssistantMemory(): Promise<MastraMemory> {
  const memory = await mastra.getAgent("assistant").getMemory();
  if (!memory) {
    throw new Error("Memory is not configured for the assistant agent");
  }
  return memory;
}

/**
 * Get or create the thread for the given threadId.
 * A newly created thread is announced with a `data-new-thread-created` stream part.
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
    title: NEW_THREAD_TITLE,
  });

  writer.write({
    id: created.id,
    type: "data-new-thread-created",
    data: {
      threadId: created.id,
      title: created.title ?? NEW_THREAD_TITLE,
      resourceId: created.resourceId,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
  });

  return { thread: created, isNew: true };
}

/**
 * Before an edit or regenerate, delete the stored messages it replaces
 * (see `getTruncationIds`).
 */
export async function truncateHistory(memory: MastraMemory, params: ChatRequest): Promise<void> {
  if (params.trigger !== "regenerate-message" && !params.messageId) return;

  const { messages } = await memory.recall({ resourceId: RESOURCE_ID, threadId: params.threadId });
  const ids = getTruncationIds(
    messages.map((m) => m.id),
    params.messages,
    params.trigger,
    params.messageId,
  );
  if (ids.length > 0) {
    await memory.deleteMessages(ids);
  }
}

/**
 * Generate a short title for the thread with the titler agent, streaming it to the
 * client as it's generated, then persist it. Best-effort: failures are only logged.
 */
export async function generateThreadTitle(
  memory: MastraMemory,
  threadId: string,
  text: string,
  writer: UIMessageStreamWriter<MyUIMessage>,
): Promise<void> {
  try {
    const titleResponseStream = await mastra
      .getAgent("titler")
      .stream(`Context for the title: <context>${text}</context>`, {
        structuredOutput: { schema: z.object({ title: z.string() }) },
      });

    for await (const titleResponse of titleResponseStream.objectStream) {
      writer.write({
        id: `conversation-title-${threadId}`,
        type: "data-conversation-title",
        data: { title: titleResponse.title ?? "" },
      });
    }

    const finalTitle = await titleResponseStream.object;

    await memory.createThread({
      threadId,
      resourceId: RESOURCE_ID,
      title: finalTitle.title,
    });
  } catch (error) {
    console.error("Failed to generate thread title:", error);
  }
}
