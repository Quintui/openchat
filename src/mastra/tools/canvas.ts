import { createTool } from "@mastra/core/tools";
import { nanoid } from "nanoid";
import { z } from "zod";

export const createCanvasTool = createTool({
  id: "createCanvas",
  description:
    "Open a canvas next to the chat with substantial standalone content the user is likely to reuse or iterate on: code longer than about 20 lines, or a full document such as an essay, article, report or email. Do not use it for short answers or snippets.",
  inputSchema: z.object({
    title: z.string().describe("Short title shown in the canvas header"),
    kind: z.enum(["code", "document"]),
    language: z
      .string()
      .optional()
      .describe("Programming language for code canvases, e.g. python or typescript"),
    content: z.string().describe("The full code, or the document in Markdown"),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async () => ({ id: nanoid(10) }),
});

export const updateCanvasTool = createTool({
  id: "updateCanvas",
  description:
    "Replace the content of an existing canvas when the user asks for changes to it. Always send the complete new content, not a diff.",
  inputSchema: z.object({
    id: z.string().describe("The id returned by createCanvas"),
    title: z.string().optional(),
    content: z.string().describe("The complete new content"),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ id }) => ({ id }),
});
