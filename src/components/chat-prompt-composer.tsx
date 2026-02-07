import type { ChatStatus } from "ai";
import { CheckIcon, GlobeIcon } from "lucide-react";
import type * as React from "react";
import { memo, useCallback, useState } from "react";
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
import {
	DEFAULT_MODEL_ID,
	MODEL_GROUPS,
	MODELS,
	type ModelOption,
} from "@/config/models";

type ChatPromptComposerProps = {
	className: string;
	onSubmitMessage: (message: PromptInputMessage) => void;
	placeholder: string;
	status: ChatStatus;
	textareaClassName: string;
};

const ModelItem = memo(function ModelItem({
	model,
	onSelect,
	selectedModelId,
}: {
	model: ModelOption;
	selectedModelId: string;
	onSelect: (id: string) => void;
}): React.JSX.Element {
	const handleSelect = useCallback((): void => {
		onSelect(model.id);
	}, [model.id, onSelect]);

	return (
		<ModelSelectorItem onSelect={handleSelect} value={model.id}>
			<ModelSelectorLogo provider={model.chefSlug} />
			<ModelSelectorName>{model.name}</ModelSelectorName>
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

export function ChatPromptComposer({
	className,
	onSubmitMessage,
	placeholder,
	status,
	textareaClassName,
}: ChatPromptComposerProps): React.JSX.Element {
	const [selectedModelId, setSelectedModelId] =
		useState<string>(DEFAULT_MODEL_ID);
	const [isModelSelectorOpen, setModelSelectorOpen] = useState<boolean>(false);
	const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);

	const selectedModel: ModelOption | undefined = MODELS.find(
		(model: ModelOption): boolean => model.id === selectedModelId,
	);

	const handleModelSelect = useCallback((id: string): void => {
		setSelectedModelId(id);
		setModelSelectorOpen(false);
	}, []);

	const handleToggleWebSearch = useCallback((): void => {
		setWebSearchEnabled((prev) => !prev);
	}, []);

	const handleSubmit = useCallback(
		(message: PromptInputMessage): void => {
			onSubmitMessage({
				...message,
				modelId: selectedModelId,
				webSearchEnabled,
			});
		},
		[onSubmitMessage, selectedModelId, webSearchEnabled],
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
						autoFocus
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

						<PromptInputButton
							onClick={handleToggleWebSearch}
							type="button"
							variant={webSearchEnabled ? "outline" : "ghost"}
						>
							<GlobeIcon size={16} />
							<span>Search</span>
						</PromptInputButton>

						<ModelSelector
							onOpenChange={setModelSelectorOpen}
							open={isModelSelectorOpen}
						>
							<ModelSelectorTrigger
								render={<PromptInputButton type="button" />}
							>
								{selectedModel?.chefSlug ? (
									<ModelSelectorLogo provider={selectedModel.chefSlug} />
								) : null}
								{selectedModel?.name ? (
									<ModelSelectorName>{selectedModel.name}</ModelSelectorName>
								) : null}
							</ModelSelectorTrigger>

							<ModelSelectorContent>
								<ModelSelectorInput placeholder="Search models..." />
								<ModelSelectorList>
									<ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
									{MODEL_GROUPS.map(
										(chef): React.JSX.Element => (
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
