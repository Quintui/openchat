import type { ChatStatus } from "ai";
import type { MyUIMessage } from "@/types/ui-message";

/**
 * Returns true when a loading shimmer should be displayed for the assistant.
 *
 * Covers two cases:
 *  1. status is "submitted" (request sent, no stream open yet)
 *  2. status is "streaming" but the last assistant message has no text or
 *     reasoning parts with actual content (stream is open, first token
 *     hasn't arrived yet)
 */
export function shouldShowLoadingShimmer(status: ChatStatus, messages: MyUIMessage[]): boolean {
  if (status === "submitted") return true;
  if (status !== "streaming") return false;

  const lastAssistant = findLast(messages, (m) => m.role === "assistant");
  if (!lastAssistant) return true;

  return !lastAssistant.parts.some(
    (part) => (part.type === "text" || part.type === "reasoning") && part.text.length > 0,
  );
}

function findLast<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return arr[i];
  }
  return undefined;
}

type Part = MyUIMessage["parts"][number];

/**
 * Claude's web search answers arrive as many text parts (one per citation),
 * with `source-url` parts in between. Returns the text of the run of text parts
 * starting at `index` (skipping interleaved `source-url` parts), so it renders as
 * one response. Returns null when the part at `index` continues an earlier run.
 */
export function getTextRun(parts: Part[], index: number): string | null {
  const isRunPart = (part: Part | undefined) =>
    part?.type === "text" || part?.type === "source-url";

  for (let i = index - 1; i >= 0 && isRunPart(parts[i]); i--) {
    if (parts[i].type === "text") return null;
  }

  let text = "";
  for (let i = index; i < parts.length && isRunPart(parts[i]); i++) {
    const part = parts[i];
    if (part.type === "text") text += part.text;
  }
  return text;
}
