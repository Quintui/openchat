import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { RESOURCE_ID } from "@/config/resource";
import { getAssistantMemory } from "@/lib/chat-helpers";
import { mastra } from "@/mastra";

const cloneThreadSchema = z.object({
  sourceThreadId: z.string().min(1, "sourceThreadId is required"),
  upToMessageId: z.string().optional(),
});

export const cloneThread = createServerFn({ method: "POST" })
  .validator(cloneThreadSchema)
  .handler(async ({ data }) => {
    const memory = await getAssistantMemory();

    let messageFilter: { messageIds: string[] } | undefined;

    if (data.upToMessageId) {
      const response = await memory.recall({
        resourceId: RESOURCE_ID,
        threadId: data.sourceThreadId,
      });

      const allMessages = response?.messages ?? [];
      const idx = allMessages.findIndex((m) => m.id === data.upToMessageId);

      if (idx !== -1) {
        messageFilter = { messageIds: allMessages.slice(0, idx + 1).map((m) => m.id) };
      }
    }

    const result = await memory.cloneThread({
      sourceThreadId: data.sourceThreadId,
      ...(messageFilter ? { options: { messageFilter } } : {}),
    });

    return {
      thread: {
        id: result.thread.id,
        title: result.thread.title ?? null,
        resourceId: result.thread.resourceId,
        createdAt: new Date(result.thread.createdAt).toISOString(),
        updatedAt: new Date(result.thread.updatedAt).toISOString(),
      } satisfies Thread,
    };
  });

export type Thread = {
  id: string;
  title: string | null;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
};

export const getThreads = createServerFn({ method: "GET" }).handler(async () => {
  const memory = await mastra.getAgent("assistant").getMemory();

  if (!memory) {
    return { threads: [] as Thread[] };
  }

  const result = await memory.listThreads({
    filter: { resourceId: RESOURCE_ID },
    perPage: false,
  });

  const rawThreads = result?.threads ?? [];

  // Map to a plain serializable shape and sort by most recent first
  const threads: Thread[] = rawThreads
    .map((t) => ({
      id: t.id,
      title: t.title ?? null,
      resourceId: t.resourceId,
      createdAt: new Date(t.createdAt).toISOString(),
      updatedAt: new Date(t.updatedAt).toISOString(),
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return { threads };
});

const deleteThreadSchema = z.object({
  threadId: z.string().min(1, "threadId is required"),
});

export const deleteThread = createServerFn({ method: "POST" })
  .validator(deleteThreadSchema)
  .handler(async ({ data }) => {
    const memory = await getAssistantMemory();

    await memory.deleteThread(data.threadId);

    return { success: true };
  });

export const threadsQueryOptions = queryOptions({
  queryKey: ["threads"],
  queryFn: () => getThreads(),
});
