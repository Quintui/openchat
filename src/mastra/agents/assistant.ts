import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { DEFAULT_MODEL_ID } from "@/config/models";

export const assistant = new Agent({
	id: "assistant",
	name: "Assistant",
	instructions:
		"You are a helpful assistant. Answer questions clearly and concisely. If you don't know something, say so honestly.",
	model: ({ requestContext }) => {
		const modelId = requestContext?.get("modelId") as string | undefined;
		return modelId || DEFAULT_MODEL_ID;
	},
	memory: new Memory(),
});
