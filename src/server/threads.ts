import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mastra } from "@/mastra";

const RESOURCE_ID = "user-id";

const cloneThreadSchema = z.object({
	sourceThreadId: z.string().min(1, "sourceThreadId is required"),
	upToMessageId: z.string().optional(),
});

export const cloneThread = createServerFn({ method: "POST" })
	.inputValidator(cloneThreadSchema)
	.handler(async ({ data }) => {
		const memory = await mastra.getAgent("assistant").getMemory();

		if (!memory) {
			throw new Error("Memory not available");
		}

		let messageFilter: { messageIds: string[] } | undefined;

		if (data.upToMessageId) {
			const response = await memory.recall({
				resourceId: RESOURCE_ID,
				threadId: data.sourceThreadId,
			});

			const allMessages = response?.messages ?? [];
			const idx = allMessages.findIndex((m) => m.id === data.upToMessageId);

			if (idx !== -1) {
				const idsUpTo = allMessages
					.slice(0, idx + 1)
					.map((m) => m.id)
					.filter(Boolean) as string[];

				messageFilter = { messageIds: idsUpTo };
			}
		}

		const result = await memory.cloneThread({
			sourceThreadId: data.sourceThreadId,
			...(messageFilter ? { options: { messageFilter } } : {}),
		});

		return {
			thread: {
				id: result.thread.id,
				title: result.thread.title ?? null,
				resourceId: result.thread.resourceId,
				createdAt: new Date(result.thread.createdAt).toISOString(),
				updatedAt: new Date(result.thread.updatedAt).toISOString(),
			} satisfies Thread,
		};
	});

export type Thread = {
	id: string;
	title: string | null;
	resourceId: string;
	createdAt: string;
	updatedAt: string;
};

export const getThreads = createServerFn({ method: "GET" }).handler(
	async () => {
		const memory = await mastra.getAgent("assistant").getMemory();

		if (!memory) {
			return { threads: [] as Thread[] };
		}

		const result = await memory.listThreads({
			filter: { resourceId: RESOURCE_ID },
			perPage: false,
		});

		const rawThreads = result?.threads ?? [];

		// Map to a plain serializable shape and sort by most recent first
		const threads: Thread[] = rawThreads
			.map((t) => ({
				id: t.id,
				title: t.title ?? null,
				resourceId: t.resourceId,
				createdAt: new Date(t.createdAt).toISOString(),
				updatedAt: new Date(t.updatedAt).toISOString(),
			}))
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			);

		return { threads };
	},
);

const deleteThreadSchema = z.object({
	threadId: z.string().min(1, "threadId is required"),
});

export const deleteThread = createServerFn({ method: "POST" })
	.inputValidator(deleteThreadSchema)
	.handler(async ({ data }) => {
		const memory = await mastra.getAgent("assistant").getMemory();

		if (!memory) {
			throw new Error("Memory not available");
		}

		await memory.deleteThread(data.threadId);

		return { success: true };
	});

export const threadsQueryOptions = queryOptions({
	queryKey: ["threads"],
	queryFn: () => getThreads(),
});
