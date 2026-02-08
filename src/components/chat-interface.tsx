import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { CheckIcon, CopyIcon, RefreshCcwIcon } from "lucide-react";
import type * as React from "react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatPromptComposer } from "@/components/chat-prompt-composer";
import { shouldShowLoadingShimmer } from "@/lib/chat-utils";
import type { MyUIMessage } from "@/types/ui-message";

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	return (
		<MessageAction
			tooltip="Copy"
			onClick={() => {
				navigator.clipboard.writeText(text);
				toast.success("Copied to clipboard");
				setCopied(true);
				if (timeoutRef.current) clearTimeout(timeoutRef.current);
				timeoutRef.current = setTimeout(() => setCopied(false), 2000);
			}}
		>
			{copied ? (
				<CheckIcon className="size-3" />
			) : (
				<CopyIcon className="size-3" />
			)}
		</MessageAction>
	);
}

export function ChatInterface({
	initialMessages = [],
	threadId,
}: {
	initialMessages: MyUIMessage[];
	threadId: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { messages, sendMessage, status, regenerate, setMessages } =
		useChat<MyUIMessage>({
			id: threadId,
			messages: initialMessages,
			onFinish: () => {
				queryClient.invalidateQueries({ queryKey: ["threads"] });
			},
			transport: new DefaultChatTransport({
				api: "/api/chat",
				body: {
					threadId,
				},
			}),
		});

	const isEmptyState = messages.length === 0;

	const handleSubmitMessage = useCallback(
		(message: PromptInputMessage): void => {
			const hasText = Boolean(message.text);
			const hasAttachments = Boolean(message.files?.length);

			if (!(hasText || hasAttachments)) {
				return;
			}

			sendMessage(message, {
				body: { modelId: message.modelId },
			});

			if (isEmptyState) {
				router.history._ignoreSubscribers = true;
				window.history.replaceState({}, "", `/c/${threadId}`);
				router.history._ignoreSubscribers = false;
			}
		},
		[sendMessage, threadId, isEmptyState],
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
														case "reasoning":
															return (
																<Reasoning
																	key={`${message.id}-${i}`}
																	isStreaming={part.state === "streaming"}
																>
																	<ReasoningTrigger />
																	<ReasoningContent>
																		{part.text}
																	</ReasoningContent>
																</Reasoning>
															);
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
											{message.role === "assistant" && (
												<MessageActions className="opacity-0 transition-opacity group-hover:opacity-100">
													<CopyButton
														text={message.parts
															.filter((p) => p.type === "text")
															.map((p) => p.text)
															.join("\n")}
													/>
													<MessageAction
														tooltip="Regenerate"
														onClick={() => {
															const idx = messages.findIndex(
																(m) => m.id === message.id,
															);
															setMessages(messages.slice(0, idx));
															regenerate();
														}}
													>
														<RefreshCcwIcon className="size-3" />
													</MessageAction>
												</MessageActions>
											)}
										</Message>
									),
								)}

								{shouldShowLoadingShimmer(status, messages) && (
									<Message from="assistant">
										<MessageContent>
											<Shimmer as="p" className="text-sm">
												Thinking...
											</Shimmer>
										</MessageContent>
									</Message>
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
