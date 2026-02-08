import { createTool } from "@mastra/core/tools";
import Exa from "exa-js";
import { z } from "zod";

const exa = new Exa(process.env.EXA_API_KEY);

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "Search the web for up-to-date information. Use this when the user asks about current events, recent news, or needs information that may have changed recently.",
  inputSchema: z.object({
    query: z.string().min(1).describe("The search query"),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string().nullable(),
      url: z.string(),
      content: z.string(),
    }),
  ),
  execute: async (inputData) => {
    const { results } = await exa.searchAndContents(inputData.query, {
      type: "auto",
      livecrawl: "always",
      numResults: 3,
      text: true,
    });

    return results.map((result) => {
      return {
        title: result.title,
        content: result.text,
        url: result.url,
      };
    });
  },
});
