import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const assistant = new Agent({
	id: "assistant",
	name: "Assistant",
	instructions:
		"You are a helpful assistant. Answer questions clearly and concisely. If you don't know something, say so honestly.",
	model: "openai/gpt-4o",
	memory: new Memory(),
});
