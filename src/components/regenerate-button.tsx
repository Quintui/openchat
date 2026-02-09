import { RefreshCcwIcon } from "lucide-react";
import { useCallback } from "react";
import { MessageAction } from "@/components/ai-elements/message";
import type { MyUIMessage } from "@/types/ui-message";

export function RegenerateButton({
  message,
  messages,
  setMessages,
  regenerate,
}: {
  message: MyUIMessage;
  messages: MyUIMessage[];
  setMessages: (messages: MyUIMessage[]) => void;
  regenerate: () => void;
}) {
  const handleRegenerate = useCallback(() => {
    const idx = messages.findIndex((m) => m.id === message.id);
    const precedingMessages = messages.slice(0, idx);

    setMessages(precedingMessages);
    regenerate();
  }, [messages, message.id, setMessages, regenerate]);

  return (
    <MessageAction tooltip="Regenerate" onClick={handleRegenerate}>
      <RefreshCcwIcon className="size-3" />
    </MessageAction>
  );
}
