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

/**
 * Ids of stored messages to delete before an edit or regenerate is streamed, so the
 * new message replaces the old one instead of being added after it.
 *
 * - Regenerate: the client list ends at the user message being answered again; delete
 *   everything stored after it (an assistant turn can be several stored messages).
 * - Edit (`submit-message` with the id of a user message): delete the edited message and
 *   everything after it. If its id isn't stored, delete everything after the previous
 *   user message.
 */
export function getTruncationIds(
  storedIds: string[],
  clientMessages: Pick<MyUIMessage, "id" | "role">[],
  trigger: string | undefined,
  messageId: string | undefined,
): string[] {
  const lastUserIndex = (before: number) => {
    for (let i = before - 1; i >= 0; i--) {
      if (clientMessages[i].role === "user") return i;
    }
    return -1;
  };
  const deleteAfterUser = (clientIndex: number) => {
    if (clientIndex === -1) return storedIds;
    const storedIndex = storedIds.indexOf(clientMessages[clientIndex].id);
    return storedIndex === -1 ? [] : storedIds.slice(storedIndex + 1);
  };

  if (trigger === "regenerate-message") {
    return deleteAfterUser(lastUserIndex(clientMessages.length));
  }

  if (trigger === "submit-message" && messageId) {
    const editedIndex = clientMessages.findIndex((m) => m.id === messageId);
    if (editedIndex === -1 || clientMessages[editedIndex].role !== "user") return [];
    const storedIndex = storedIds.indexOf(messageId);
    if (storedIndex !== -1) return storedIds.slice(storedIndex);
    return deleteAfterUser(lastUserIndex(editedIndex));
  }

  return [];
}

/** The message's text as rendered: each text run joined, runs separated by newlines. */
export function getMessageText(parts: Part[]): string {
  return parts
    .map((part, i) => (part.type === "text" ? getTextRun(parts, i) : null))
    .filter((text) => text !== null)
    .join("\n");
}
