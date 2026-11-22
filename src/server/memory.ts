import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { RESOURCE_ID } from "@/config/resource";
import { type WorkingMemory, workingMemorySchema } from "@/config/working-memory";
import { getAssistantMemory } from "@/lib/chat-helpers";
import { mastra } from "@/mastra";

export const getWorkingMemory = createServerFn({ method: "GET" }).handler(async () => {
  const memory = await mastra.getAgent("assistant").getMemory();

  if (!memory) {
    return { workingMemory: null as WorkingMemory | null };
  }

  const raw = await memory.getWorkingMemory({
    threadId: "",
    resourceId: RESOURCE_ID,
  });

  if (!raw) {
    return { workingMemory: null as WorkingMemory | null };
  }

  try {
    const parsed = workingMemorySchema.parse(JSON.parse(raw));
    return { workingMemory: parsed };
  } catch {
    return { workingMemory: null as WorkingMemory | null };
  }
});

export const updateWorkingMemory = createServerFn({ method: "POST" })
  .validator(workingMemorySchema)
  .handler(async ({ data }) => {
    const memory = await getAssistantMemory();

    await memory.updateWorkingMemory({
      threadId: "",
      resourceId: RESOURCE_ID,
      workingMemory: JSON.stringify(data),
    });

    return { success: true };
  });

export const workingMemoryQueryOptions = queryOptions({
  queryKey: ["working-memory"],
  queryFn: () => getWorkingMemory(),
});
