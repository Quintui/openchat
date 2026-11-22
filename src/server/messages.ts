import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mastra } from "@/mastra";

const RESOURCE_ID = "user-id";

const getThreadMessagesSchema = z.object({
  threadId: z.string().min(1, "threadId is required"),
});

// UI message metadata is typed `unknown`, which the static serializability check rejects;
// it is plain JSON from storage, so only the output check is relaxed.
export const getThreadMessages = createServerFn({ method: "GET", strict: { output: false } })
  .validator(getThreadMessagesSchema)
  .handler(async ({ data }) => {
    const memory = await mastra.getAgent("assistant").getMemory();

    if (!memory) {
      return { messages: [] };
    }

    const response = await memory.recall({
      resourceId: RESOURCE_ID,
      threadId: data.threadId,
    });

    const mastraMessages = response?.messages || [];
    const uiMessages = toAISdkMessages(mastraMessages, { version: "v7" });

    return { messages: uiMessages };
  });
