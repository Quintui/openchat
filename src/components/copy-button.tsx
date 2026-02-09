import { CheckIcon, CopyIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MessageAction } from "@/components/ai-elements/message";

export function CopyButton({ text }: { text: string }) {
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
      {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
    </MessageAction>
  );
}
