import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mastra } from "@/mastra";
import { MyUIMessage } from "@/types/ui-message";

const RESOURCE_ID = "user-id";

const getThreadMessagesSchema = z.object({
	threadId: z.string().min(1, "threadId is required"),
});

export const getThreadMessages = createServerFn({ method: "GET" })
	.inputValidator(getThreadMessagesSchema)
	.handler(async ({ data }) => {
		const memory = await mastra.getAgent("assistant").getMemory();

		if (!memory) {
			return { messages: [] };
		}

		const response = await memory.recall({
			resourceId: RESOURCE_ID,
			threadId: data.threadId,
		});

		const mastraMessages = response?.messages || [];
		const uiMessages = toAISdkV5Messages(mastraMessages);

		return { messages: uiMessages };
	});
