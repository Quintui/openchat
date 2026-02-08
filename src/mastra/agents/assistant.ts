import type { ToolsInput } from "@mastra/core/agent";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { webSearchTool } from "@/mastra/tools/web-search";

export const assistant = new Agent({
	id: "assistant",
	name: "Assistant",
	instructions:
		"You are a helpful assistant. Answer questions clearly and concisely. If you don't know something, say so honestly. When web search is enabled, use it to find up-to-date information from the web.",
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
	memory: new Memory(),
});
