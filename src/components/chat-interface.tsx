import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { CheckIcon, CopyIcon, GlobeIcon, RefreshCcwIcon } from "lucide-react";
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
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
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
        console.log("Received conversation title:", dataPart.data.title);
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

  console.log("Current messages:", messages);

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
                            case "tool-webSearch":
                              return part.state === "output-available" ? (
                                <Sources key={`${message.id}-${i}`}>
                                  <SourcesTrigger count={part.output.length} />
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
