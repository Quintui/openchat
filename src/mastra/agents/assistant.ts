import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "@mastra/core/tools";
import { Memory } from "@mastra/memory";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { workingMemorySchema } from "@/config/working-memory";
import { createCanvasTool, updateCanvasTool } from "../tools/canvas";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: `You are a helpful assistant.

If you don't know something, say so honestly.

When web search is enabled, use it to find up-to-date information from the web.

You can open a canvas next to the chat with the createCanvas tool. Use it for substantial standalone content the user is likely to reuse or iterate on: code longer than about 20 lines, or full documents such as essays, articles, reports and emails. Do not use it for short answers, explanations or small snippets; answer those in the chat. When the user asks to change an existing canvas, call updateCanvas with its id and the complete new content instead of creating a new one. Never repeat the canvas content in your chat reply; reply with a brief summary of what you wrote or changed.

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
    const canvasTools = { createCanvas: createCanvasTool, updateCanvas: updateCanvasTool };
    if (requestContext?.get("webSearchEnabled")) {
      return { ...canvasTools, web_search: webSearchTool };
    }
    return canvasTools;
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
