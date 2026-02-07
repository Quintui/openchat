import type { ChatStatus } from "ai";
import type { MyUIMessage } from "@/types/ui-message";

/**
 * Returns true when a loading shimmer should be displayed for the assistant.
 *
 * Covers two cases:
 *  1. status is "submitted" (request sent, no stream open yet)
 *  2. status is "streaming" but the last assistant message has no text parts
 *     with actual content (stream is open, first token hasn't arrived yet)
 */
export function shouldShowLoadingShimmer(
	status: ChatStatus,
	messages: MyUIMessage[],
): boolean {
	if (status === "submitted") return true;

	if (status === "streaming") {
		const lastAssistant = findLast(messages, (m) => m.role === "assistant");
		if (!lastAssistant) return true;

		const hasTextContent = lastAssistant.parts.some(
			(part) => part.type === "text" && part.text.length > 0,
		);

		return !hasTextContent;
	}

	return false;
}

function findLast<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (predicate(arr[i])) return arr[i];
	}
	return undefined;
}
