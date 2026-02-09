import type { ToolsInput } from "@mastra/core/agent";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { workingMemorySchema } from "@/config/working-memory";
import { webSearchTool } from "@/mastra/tools/web-search";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: `You are a helpful assistant.

If you don't know something, say so honestly.

When web search is enabled, use it to find up-to-date information from the web.

You have working memory that persists across conversations. Use it to remember:
- The user's name (use it naturally in conversation when appropriate)
- Their communication traits (adapt your tone and style accordingly)
- Anything else they want you to remember

When the user shares personal details, preferences, or asks you to remember something, update your working memory. Always check working memory before asking for information the user has already provided.`,
  model: ({ requestContext }) => {
    const modelId = requestContext?.get("modelId") as string | undefined;
    return modelId || DEFAULT_MODEL_ID;
  },
  tools: ({ requestContext }) => {
    const isWebSearchEnabled = requestContext?.get("webSearchEnabled");
    if (isWebSearchEnabled) {
      return { webSearch: webSearchTool };
    }
    return {} as ToolsInput;
  },
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        scope: "resource",
        schema: workingMemorySchema,
      },
    },
  }),
});
