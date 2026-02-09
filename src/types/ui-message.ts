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
    webSearch: {
      input: { query: string };
      output: Array<{
        title: string | null;
        url: string;
        content: string;
        publishedDate?: string;
      }>;
    };
    updateWorkingMemory: {
      input: { memory: WorkingMemory };
      output: { success: boolean };
    };
  }
>;
