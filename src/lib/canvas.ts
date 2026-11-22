import type { MyUIMessage } from "@/types/ui-message";

type Part = MyUIMessage["parts"][number];
export type CanvasPart = Extract<Part, { type: "tool-createCanvas" | "tool-updateCanvas" }>;

export type Canvas = {
  id: string;
  title: string;
  kind: "code" | "document";
  language?: string;
  content: string;
  isStreaming: boolean;
};

export function isCanvasPart(part: Part): part is CanvasPart {
  return part.type === "tool-createCanvas" || part.type === "tool-updateCanvas";
}

/**
 * The id of the canvas a part creates or updates. A create uses the id from its output
 * once the tool has run, and its tool call id until then.
 */
export function getCanvasId(part: CanvasPart): string | undefined {
  if (part.type === "tool-createCanvas") {
    return part.state === "output-available" ? part.output.id : part.toolCallId;
  }
  return part.input?.id;
}

/** Every canvas in the conversation, with updates applied in order. */
export function getCanvases(messages: MyUIMessage[]): Map<string, Canvas> {
  const canvases = new Map<string, Canvas>();

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isCanvasPart(part) || part.state === "output-error") continue;
      const isStreaming = part.state === "input-streaming" || part.state === "input-available";
      const id = getCanvasId(part);
      if (!id) continue;

      if (part.type === "tool-createCanvas") {
        if (part.state === "output-available") canvases.delete(part.toolCallId);
        canvases.set(id, {
          id,
          title: part.input?.title ?? "",
          kind: part.input?.kind ?? "document",
          language: part.input?.language,
          content: part.input?.content ?? "",
          isStreaming,
        });
      } else {
        const canvas = canvases.get(id);
        if (!canvas) continue;
        canvases.set(id, {
          ...canvas,
          title: part.input?.title ?? canvas.title,
          // Keep the old content until the replacement starts arriving.
          content: part.input?.content ?? canvas.content,
          isStreaming,
        });
      }
    }
  }

  return canvases;
}

/** Markdown for rendering a canvas: documents as-is, code inside a fence it cannot break out of. */
export function getCanvasMarkdown(canvas: Canvas): string {
  if (canvas.kind === "document") return canvas.content;
  const longestRun = Math.max(0, ...(canvas.content.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  return `${fence}${canvas.language ?? ""}\n${canvas.content}\n${fence}`;
}

const extensions: Record<string, string> = {
  bash: "sh",
  shell: "sh",
  sh: "sh",
  javascript: "js",
  js: "js",
  jsx: "jsx",
  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  python: "py",
  py: "py",
  ruby: "rb",
  rust: "rs",
  go: "go",
  java: "java",
  kotlin: "kt",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  csharp: "cs",
  "c#": "cs",
  php: "php",
  html: "html",
  css: "css",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  markdown: "md",
};

export function getCanvasFilename(canvas: Canvas): string {
  const base =
    canvas.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "canvas";
  if (canvas.kind === "document") return `${base}.md`;
  return `${base}.${extensions[canvas.language?.toLowerCase() ?? ""] ?? "txt"}`;
}
