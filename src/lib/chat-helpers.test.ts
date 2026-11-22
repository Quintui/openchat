import { InMemoryStore } from "@mastra/core/storage";
import { Memory } from "@mastra/memory";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { RESOURCE_ID } from "@/config/resource";
import type { AgentUIMessage } from "@/types/ui-message";
import { type ChatRequest, truncateHistory } from "./chat-helpers";

vi.mock("@/mastra", () => ({ mastra: {} }));

const threadId = "thread-1";
// 8 turns, 16 stored messages: more than recall returns by default.
const ids = Array.from({ length: 8 }, (_, i) => [`u${i + 1}`, `a${i + 1}`]).flat();

let memory: Memory;

beforeEach(async () => {
  memory = new Memory({ storage: new InMemoryStore() });
  await memory.createThread({ threadId, resourceId: RESOURCE_ID });
  await memory.saveMessages({
    messages: ids.map((id, i) => ({
      id,
      threadId,
      resourceId: RESOURCE_ID,
      role: id.startsWith("u") ? "user" : "assistant",
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
      content: { format: 2, parts: [{ type: "text", text: id }] },
    })),
  });
});

const storedIds = async () => {
  const { messages } = await memory.recall({ resourceId: RESOURCE_ID, threadId, perPage: false });
  return messages.map((m) => m.id);
};

const request = (clientIds: string[], trigger: string, messageId?: string): ChatRequest => ({
  threadId,
  trigger,
  messageId,
  modelId: DEFAULT_MODEL_ID,
  webSearchEnabled: false,
  messages: clientIds.map(
    (id) =>
      ({
        id,
        role: id.startsWith("u") ? "user" : "assistant",
        parts: [{ type: "text", text: id }],
      }) as AgentUIMessage,
  ),
});

describe("truncateHistory", () => {
  it("removes an early edited message and everything after it in a long thread", async () => {
    await truncateHistory(memory, request(["u1", "a1", "u2"], "submit-message", "u2"));
    expect(await storedIds()).toEqual(["u1", "a1"]);
  });

  it("removes an early answer and everything after it on regenerate in a long thread", async () => {
    await truncateHistory(memory, request(["u1", "a1", "u2"], "regenerate-message", "a2"));
    expect(await storedIds()).toEqual(["u1", "a1", "u2"]);
  });

  it("leaves history alone for a normal new message", async () => {
    await truncateHistory(memory, request([...ids, "u9"], "submit-message"));
    expect(await storedIds()).toEqual(ids);
  });
});
