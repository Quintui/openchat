import { useChat } from "@ai-sdk/react";
import { useRouter } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import type * as React from "react";
import { useCallback } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatPromptComposer } from "@/components/chat-prompt-composer";
import type { MyUIMessage } from "@/types/ui-message";

export function ChatInterface({
	initialMessages = [],
	threadId,
}: {
	initialMessages: MyUIMessage[];
	threadId: string | null;
}) {
	const router = useRouter();

	const { messages, sendMessage, status } = useChat<MyUIMessage>({
		onData: ({ type, data }) => {
			if (type !== "data-new-thread-created") {
				return;
			}

			if (window.location.pathname === "/") {
				// Update the URL without triggering TanStack Router's loader.
				// The router monkey-patches window.history.replaceState and listens
				// for changes. Setting _ignoreSubscribers suppresses the notification
				// so the /c/$threadId loader doesn't fire (messages don't exist yet).
				router.history._ignoreSubscribers = true;
				window.history.replaceState({}, "", `/c/${data.threadId}`);
				router.history._ignoreSubscribers = false;
			}
		},
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			body: {
				threadId,
			},
		}),
	});

	const isEmptyState: boolean = messages.length === 0;

	const handleSubmitMessage = useCallback(
		(message: PromptInputMessage): void => {
			const hasText = Boolean(message.text);
			const hasAttachments = Boolean(message.files?.length);

			if (!(hasText || hasAttachments)) {
				return;
			}

			sendMessage(message);
		},
		[sendMessage],
	);

	return (
		<div className="flex h-full flex-1 flex-col">
			<div className="mx-auto flex w-full max-w-[70ch] flex-1 flex-col overflow-hidden px-6 pb-8">
				{isEmptyState ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-14 pb-24">
						<h1 className="text-foreground text-5xl font-medium tracking-tight">
							What can I help with?
						</h1>
						<ChatPromptComposer
							className="w-full"
							onSubmitMessage={handleSubmitMessage}
							placeholder="Ask anything"
							status={status}
							textareaClassName="min-h-16 text-lg"
						/>
					</div>
				) : (
					<div className="flex min-h-0 flex-1 flex-col">
						<Conversation className="min-h-0 flex-1">
							<ConversationContent className="w-full py-6">
								{messages.map(
									(message): React.JSX.Element => (
										<Message from={message.role} key={message.id}>
											<MessageContent>
												{message.parts.map((part, i) => {
													switch (part.type) {
														case "text":
															return (
																<MessageResponse key={`${message.id}-${i}`}>
																	{part.text}
																</MessageResponse>
															);
														default:
															return null;
													}
												})}
											</MessageContent>
										</Message>
									),
								)}
							</ConversationContent>
							<ConversationScrollButton />
						</Conversation>

						<ChatPromptComposer
							className="mt-4 w-full"
							onSubmitMessage={handleSubmitMessage}
							placeholder="Say something..."
							status={status}
							textareaClassName="min-h-14"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
