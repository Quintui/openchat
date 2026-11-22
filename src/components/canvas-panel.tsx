import { CodeIcon, DownloadIcon, FileTextIcon, XIcon } from "lucide-react";
import { MessageAction, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Canvas, getCanvasFilename, getCanvasMarkdown } from "@/lib/canvas";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

export function CanvasCard({
  canvas,
  action,
  isOpen,
  onOpen,
}: {
  canvas: Canvas;
  action: "created" | "updated";
  isOpen: boolean;
  onOpen: () => void;
}) {
  const Icon = canvas.kind === "code" ? CodeIcon : FileTextIcon;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "not-prose hover:bg-muted/60 flex w-full max-w-sm items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isOpen && "border-foreground/30",
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{canvas.title || "Untitled"}</div>
        {canvas.isStreaming ? (
          <Shimmer as="div" className="text-xs">
            {action === "created" ? "Writing..." : "Updating..."}
          </Shimmer>
        ) : (
          <div className="text-muted-foreground text-xs">
            {action === "created" ? "Canvas" : "Canvas updated"} · Click to open
          </div>
        )}
      </div>
    </button>
  );
}

function download(canvas: Canvas) {
  const url = URL.createObjectURL(new Blob([canvas.content], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = getCanvasFilename(canvas);
  link.click();
  URL.revokeObjectURL(url);
}

function CanvasView({ canvas, onClose }: { canvas: Canvas; onClose: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="canvas-panel">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
          {canvas.title || "Untitled"}
        </h2>
        {canvas.isStreaming && (
          <Shimmer as="span" className="text-xs">
            Writing...
          </Shimmer>
        )}
        <CopyButton text={canvas.content} />
        <MessageAction tooltip="Download" onClick={() => download(canvas)}>
          <DownloadIcon className="size-3" />
        </MessageAction>
        <MessageAction tooltip="Close" onClick={onClose}>
          <XIcon className="size-3" />
        </MessageAction>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <MessageResponse
          codeBlockMaxHeight={0}
          // The panel header already has copy and download for code canvases.
          controls={canvas.kind === "code" ? { code: false } : undefined}
        >
          {getCanvasMarkdown(canvas)}
        </MessageResponse>
      </div>
    </div>
  );
}

export function CanvasPanel({ canvas, onClose }: { canvas: Canvas | null; onClose: () => void }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={canvas !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-full"
        >
          <SheetTitle className="sr-only">{canvas?.title ?? "Canvas"}</SheetTitle>
          {canvas && <CanvasView canvas={canvas} onClose={onClose} />}
        </SheetContent>
      </Sheet>
    );
  }

  if (!canvas) return null;
  return (
    <aside className="bg-background flex h-full w-1/2 min-w-0 shrink-0 flex-col border-l">
      <CanvasView canvas={canvas} onClose={onClose} />
    </aside>
  );
}
