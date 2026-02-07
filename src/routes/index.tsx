import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, GlobeIcon } from "lucide-react";
import type * as React from "react";
import { memo, useCallback, useState } from "react";

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
import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorEmpty,
	ModelSelectorGroup,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorLogoGroup,
	ModelSelectorName,
	ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachmentPreview,
	PromptInputAttachmentRemove,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputHeader,
	type PromptInputMessage,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

export const Route = createFileRoute("/")({ component: App });

type ChatStatus = "error" | "ready" | "streaming" | "submitted";
type ChatRole = "assistant" | "user";

type ChatMessage = {
	id: string;
	role: ChatRole;
	text: string;
};

type ModelOption = {
	chef: "Anthropic" | "Google" | "OpenAI";
	chefSlug: "anthropic" | "google" | "openai";
	id: string;
	name: string;
	providers: ReadonlyArray<string>;
};

type ModelItemProps = {
	model: ModelOption;
	selectedModelId: string;
	onSelect: (id: string) => void;
};

type ChatPromptComposerProps = {
	className: string;
	onSubmitMessage: (message: PromptInputMessage) => void;
	placeholder: string;
	status: ChatStatus;
	textareaClassName: string;
};

const MODELS: ReadonlyArray<ModelOption> = [
	{
		chef: "OpenAI",
		chefSlug: "openai",
		id: "gpt-4o",
		name: "GPT-4o",
		providers: ["openai", "azure"],
	},
	{
		chef: "OpenAI",
		chefSlug: "openai",
		id: "gpt-4o-mini",
		name: "GPT-4o Mini",
		providers: ["openai", "azure"],
	},
	{
		chef: "Anthropic",
		chefSlug: "anthropic",
		id: "claude-sonnet-4-20250514",
		name: "Claude 4 Sonnet",
		providers: ["anthropic", "google", "amazon-bedrock"],
	},
	{
		chef: "Google",
		chefSlug: "google",
		id: "gemini-2.0-flash-exp",
		name: "Gemini 2.0 Flash",
		providers: ["google"],
	},
];

const SUBMITTING_TIMEOUT_MS: number = 180;
const STREAMING_TIMEOUT_MS: number = 1000;

const createAssistantReply = (text: string): string => `You said: ${text}`;

const ModelItem = memo(function ModelItem({
	model,
	onSelect,
	selectedModelId,
}: ModelItemProps): React.JSX.Element {
	const handleSelect = useCallback((): void => {
		onSelect(model.id);
	}, [model.id, onSelect]);

	return (
		<ModelSelectorItem onSelect={handleSelect} value={model.id}>
			<ModelSelectorLogo provider={model.chefSlug} />
			<ModelSelectorName>{model.name}</ModelSelectorName>
			<ModelSelectorLogoGroup>
				{model.providers.map(
					(provider: string): React.JSX.Element => (
						<ModelSelectorLogo key={provider} provider={provider} />
					),
				)}
			</ModelSelectorLogoGroup>
			{selectedModelId === model.id ? (
				<CheckIcon className="ml-auto size-4" />
			) : (
				<div className="ml-auto size-4" />
			)}
		</ModelSelectorItem>
	);
});

function PromptInputAttachmentsHeader(): React.JSX.Element | null {
	const attachments = usePromptInputAttachments();

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<PromptInputHeader>
			<PromptInputAttachments>
				{(attachment): React.JSX.Element => (
					<PromptInputAttachment data={attachment} key={attachment.id}>
						<PromptInputAttachmentPreview />
						<PromptInputAttachmentRemove />
					</PromptInputAttachment>
				)}
			</PromptInputAttachments>
		</PromptInputHeader>
	);
}

function ChatPromptComposer({
	className,
	onSubmitMessage,
	placeholder,
	status,
	textareaClassName,
}: ChatPromptComposerProps): React.JSX.Element {
	const [selectedModelId, setSelectedModelId] = useState<string>(
		MODELS[0]?.id ?? "gpt-4o",
	);
	const [isModelSelectorOpen, setModelSelectorOpen] = useState<boolean>(false);

	const selectedModel: ModelOption | undefined = MODELS.find(
		(model: ModelOption): boolean => model.id === selectedModelId,
	);

	const handleModelSelect = useCallback((id: string): void => {
		setSelectedModelId(id);
		setModelSelectorOpen(false);
	}, []);

	const handleSubmit = useCallback(
		(message: PromptInputMessage): void => {
			onSubmitMessage(message);
		},
		[onSubmitMessage],
	);

	return (
		<PromptInputProvider>
			<PromptInput
				className={className}
				globalDrop
				multiple
				onSubmit={handleSubmit}
			>
				<PromptInputAttachmentsHeader />

				<PromptInputBody>
					<PromptInputTextarea
						className={textareaClassName}
						placeholder={placeholder}
					/>
				</PromptInputBody>

				<PromptInputFooter>
					<PromptInputTools>
						<PromptInputActionMenu>
							<PromptInputActionMenuTrigger />
							<PromptInputActionMenuContent className="min-w-48 w-auto">
								<PromptInputActionAddAttachments />
							</PromptInputActionMenuContent>
						</PromptInputActionMenu>

						<PromptInputButton type="button">
							<GlobeIcon size={16} />
							<span>Search</span>
						</PromptInputButton>

						<ModelSelector
							onOpenChange={setModelSelectorOpen}
							open={isModelSelectorOpen}
						>
							<ModelSelectorTrigger asChild>
								<PromptInputButton type="button">
									{selectedModel?.chefSlug ? (
										<ModelSelectorLogo provider={selectedModel.chefSlug} />
									) : null}
									{selectedModel?.name ? (
										<ModelSelectorName>{selectedModel.name}</ModelSelectorName>
									) : null}
								</PromptInputButton>
							</ModelSelectorTrigger>

							<ModelSelectorContent>
								<ModelSelectorInput placeholder="Search models..." />
								<ModelSelectorList>
									<ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
									{["OpenAI", "Anthropic", "Google"].map(
										(chef: string): React.JSX.Element => (
											<ModelSelectorGroup heading={chef} key={chef}>
												{MODELS.filter(
													(model: ModelOption): boolean => model.chef === chef,
												).map(
													(model: ModelOption): React.JSX.Element => (
														<ModelItem
															key={model.id}
															model={model}
															onSelect={handleModelSelect}
															selectedModelId={selectedModelId}
														/>
													),
												)}
											</ModelSelectorGroup>
										),
									)}
								</ModelSelectorList>
							</ModelSelectorContent>
						</ModelSelector>
					</PromptInputTools>

					<PromptInputSubmit status={status} />
				</PromptInputFooter>
			</PromptInput>
		</PromptInputProvider>
	);
}

function App(): React.JSX.Element {
	const [messages, setMessages] = useState<Array<ChatMessage>>([]);
	const [status, setStatus] = useState<ChatStatus>("ready");
	const isEmptyState: boolean = messages.length === 0;

	const handleSubmitMessage = useCallback(
		(message: PromptInputMessage): void => {
			const trimmedText: string = message.text.trim();
			const hasText: boolean = trimmedText.length > 0;
			const attachmentCount: number = message.files.length;
			const hasAttachments: boolean = attachmentCount > 0;

			if (!hasText && !hasAttachments) {
				return;
			}

			const seed: string = crypto.randomUUID();
			const userText: string = hasText
				? trimmedText
				: `Sent ${attachmentCount} attachment${attachmentCount > 1 ? "s" : ""}`;

			const userMessage: ChatMessage = {
				id: `${seed}-user`,
				role: "user",
				text: userText,
			};

			setMessages(
				(previousMessages: Array<ChatMessage>): Array<ChatMessage> => [
					...previousMessages,
					userMessage,
				],
			);

			setStatus("submitted");

			setTimeout((): void => {
				setStatus("streaming");
			}, SUBMITTING_TIMEOUT_MS);

			setTimeout((): void => {
				const assistantText: string = hasText
					? createAssistantReply(trimmedText)
					: "Received your attachment.";
				const assistantMessage: ChatMessage = {
					id: `${seed}-assistant`,
					role: "assistant",
					text: assistantText,
				};

				setMessages(
					(previousMessages: Array<ChatMessage>): Array<ChatMessage> => [
						...previousMessages,
						assistantMessage,
					],
				);
				setStatus("ready");
			}, STREAMING_TIMEOUT_MS);
		},
		[],
	);

	return (
		<main className="flex min-h-svh flex-1">
			<div className="mx-auto flex w-full max-w-[70ch] flex-1 flex-col px-6 pb-8">
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
									(message: ChatMessage): React.JSX.Element => (
										<Message from={message.role} key={message.id}>
											<MessageContent>
												<MessageResponse>{message.text}</MessageResponse>
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
		</main>
	);
}
