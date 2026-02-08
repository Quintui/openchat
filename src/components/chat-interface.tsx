import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { GlobeIcon, RefreshCcwIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type * as React from "react";
import { useCallback } from "react";
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
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "@/components/ai-elements/sources";
import { WorkingMemoryUpdate } from "@/components/ai-elements/working-memory-update";
import { ChatPromptComposer } from "@/components/chat-prompt-composer";
import { shouldShowLoadingShimmer } from "@/lib/chat-utils";
import type { Thread } from "@/server/threads";
import type { MyUIMessage } from "@/types/ui-message";
import { CopyButton } from "./copy-button";

export function ChatInterface({
	initialMessages = [],
	threadId,
}: {
	initialMessages: MyUIMessage[];
	threadId: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { messages, sendMessage, status, regenerate } = useChat<MyUIMessage>({
		id: threadId,
		messages: initialMessages,
		onFinish: () => {
			queryClient.invalidateQueries({ queryKey: ["threads"] });
		},
		onData: (dataPart) => {
			if (dataPart.type === "data-new-thread-created") {
				queryClient.setQueryData<{ threads: Thread[] }>(["threads"], (old) => {
					const newThread: Thread = {
						id: dataPart.data.threadId,
						title: dataPart.data.title,
						resourceId: dataPart.data.resourceId,
						createdAt: dataPart.data.createdAt,
						updatedAt: dataPart.data.updatedAt,
					};
					if (!old) return { threads: [newThread] };
					return { threads: [newThread, ...old.threads] };
				});
			}
			if (dataPart.type === "data-conversation-title") {
				queryClient.setQueryData<{ threads: Thread[] }>(["threads"], (old) => {
					if (!old) return old;
					return {
						threads: old.threads.map((t) =>
							t.id === threadId ? { ...t, title: dataPart.data.title } : t,
						),
					};
				});
			}
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
				body: {
					modelId: message.modelId,
					webSearchEnabled: message.webSearchEnabled,
				},
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
			<AnimatePresence mode="wait" initial={false}>
				{isEmptyState ? (
					<motion.div
						key="empty"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
						className="mx-auto flex w-full max-w-[70ch] flex-1 flex-col items-center justify-center gap-14 px-6 pb-24"
					>
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
					</motion.div>
				) : (
					<motion.div
						key="conversation"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
						className="flex min-h-0 flex-1 flex-col"
					>
						<Conversation className="min-h-0 flex-1">
							<ConversationContent className="mx-auto w-full max-w-[70ch] gap-8 px-6 py-6">
								{messages.map(
									(message, index): React.JSX.Element => (
										<motion.div
											key={message.id}
											initial={{ opacity: 0, y: 6 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												duration: 0.2,
												delay: Math.min(index * 0.04, 0.2),
												ease: [0.25, 0.1, 0.25, 1],
											}}
										>
											<Message from={message.role}>
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
															case "tool-webSearch":
																return part.state === "output-available" ? (
																	<Sources key={`${message.id}-${i}`}>
																		<SourcesTrigger
																			count={part.output.length}
																		/>
																		<SourcesContent>
																			{part.output.map((source) => (
																				<Source
																					key={source.url}
																					href={source.url}
																					title={source.title ?? source.url}
																				/>
																			))}
																		</SourcesContent>
																	</Sources>
																) : (
																	<div
																		key={`${message.id}-${i}`}
																		className="flex items-center gap-1.5"
																	>
																		<GlobeIcon className="text-muted-foreground size-3.5" />
																		<Shimmer as="p" className="text-sm">
																			{`Searching for: ${part.state === "input-available" ? part.input.query : "..."}`}
																		</Shimmer>
																	</div>
																);
															case "tool-updateWorkingMemory":
																return (
																	<WorkingMemoryUpdate
																		key={`${message.id}-${i}`}
																		state={part.state}
																		input={
																			part.state !== "input-streaming"
																				? part.input
																				: undefined
																		}
																	/>
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
																regenerate({ messageId: message.id });
															}}
														>
															<RefreshCcwIcon className="size-3" />
														</MessageAction>
													</MessageActions>
												)}
											</Message>
										</motion.div>
									),
								)}

								{shouldShowLoadingShimmer(status, messages) && (
									<motion.div
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.15,
											ease: [0.25, 0.1, 0.25, 1],
										}}
									>
										<Message from="assistant">
											<MessageContent>
												<Shimmer as="p" className="text-sm">
													Thinking...
												</Shimmer>
											</MessageContent>
										</Message>
									</motion.div>
								)}
							</ConversationContent>
							<ConversationScrollButton />
						</Conversation>

						<div className="mx-auto w-full max-w-[70ch] px-6 pb-8 pt-4">
							<ChatPromptComposer
								className="w-full"
								onSubmitMessage={handleSubmitMessage}
								placeholder="Say something..."
								status={status}
								textareaClassName="min-h-14"
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
