import type { UIMessage } from "ai";
import type { WorkingMemory } from "@/config/working-memory";

export type MyUIMessage = UIMessage<
  unknown,
  {
    "conversation-title": {
      title: string;
    };
    "new-thread-created": {
      threadId: string;
      title: string;
      resourceId: string;
      createdAt: string;
      updatedAt: string;
    };
  },
  {
    web_search: {
      input: { query: string };
      output: Array<{
        url: string;
        title?: string | null;
        pageAge?: string | null;
      }>;
    };
    createCanvas: {
      input: { title: string; kind: "code" | "document"; language?: string; content: string };
      output: { id: string };
    };
    updateCanvas: {
      input: { id: string; title?: string; content: string };
      output: { id: string };
    };
    updateWorkingMemory: {
      input: { memory: WorkingMemory };
      output: { success: boolean };
    };
  }
>;

/**
 * MyUIMessage without the `steering-message` part. @mastra/ai-sdk bundles AI SDK v7
 * types from before that part existed, so its handlers only accept messages without it.
 */
export type AgentUIMessage = Omit<MyUIMessage, "parts"> & {
  parts: Exclude<MyUIMessage["parts"][number], { type: "steering-message" }>[];
};
