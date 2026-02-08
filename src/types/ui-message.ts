import type { UIMessage } from "ai";

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
	{}
>;
