import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function UserMessageEditor({
  initialText,
  onCancel,
  onSend,
}: {
  initialText: string;
  onCancel: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const canSend = text.trim().length > 0 && text !== initialText;

  const send = () => {
    if (canSend) onSend(text);
  };

  return (
    <div className="bg-secondary flex w-full flex-col gap-2 rounded-lg p-3">
      <Textarea
        aria-label="Edit message"
        autoFocus
        className="max-h-80 min-h-12 resize-none border-none bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.currentTarget.setSelectionRange(text.length, text.length)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSend} onClick={send}>
          Send
        </Button>
      </div>
    </div>
  );
}
