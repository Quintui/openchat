import { describe, expect, it } from "vitest";
import type { MyUIMessage } from "@/types/ui-message";
import { getMessageText, getTextRun, getTruncationIds } from "./chat-utils";

type Part = MyUIMessage["parts"][number];

const text = (t: string): Part => ({ type: "text", text: t });
const source = (url: string): Part => ({ type: "source-url", sourceId: url, url });
const reasoning: Part = { type: "reasoning", text: "thinking" };

describe("getTextRun", () => {
  it("joins citation text blocks split by source parts into one run", () => {
    const parts = [text("Node.js "), text("26.13.1"), source("https://a"), text(" is out.")];
    expect(getTextRun(parts, 0)).toBe("Node.js 26.13.1 is out.");
    expect(getTextRun(parts, 1)).toBeNull();
    expect(getTextRun(parts, 3)).toBeNull();
  });

  it("starts a new run after a non-text part", () => {
    const parts = [text("Before."), reasoning, text("After.")];
    expect(getTextRun(parts, 0)).toBe("Before.");
    expect(getTextRun(parts, 2)).toBe("After.");
  });

  it("returns a single text part unchanged", () => {
    expect(getTextRun([text("Hello")], 0)).toBe("Hello");
  });
});

describe("getMessageText", () => {
  it("joins citation fragments without separators and runs with newlines", () => {
    const parts = [
      text("Node.js "),
      text("26.13.1"),
      source("https://a"),
      text(" is out."),
      reasoning,
      text("Done."),
    ];
    expect(getMessageText(parts)).toBe("Node.js 26.13.1 is out.\nDone.");
  });
});

describe("getTruncationIds", () => {
  const user = (id: string) => ({ id, role: "user" as const });
  const assistant = (id: string) => ({ id, role: "assistant" as const });
  // Stored ids differ from client assistant ids; an assistant turn can be several messages.
  const stored = ["u1", "a1-step1", "a1-step2", "u2", "a2"];

  it("regenerate deletes everything stored after the last user message", () => {
    const client = [user("u1"), assistant("client-a1"), user("u2")];
    expect(getTruncationIds(stored, client, "regenerate-message", "client-a2")).toEqual(["a2"]);
    expect(getTruncationIds(stored, [user("u1")], "regenerate-message", "client-a1")).toEqual([
      "a1-step1",
      "a1-step2",
      "u2",
      "a2",
    ]);
  });

  it("regenerate without a message id still truncates after the last user message", () => {
    expect(getTruncationIds(stored, [user("u1")], "regenerate-message", undefined)).toHaveLength(4);
  });

  it("edit deletes the edited message and everything after it", () => {
    const client = [user("u1"), assistant("client-a1"), user("u2")];
    expect(getTruncationIds(stored, client, "submit-message", "u2")).toEqual(["u2", "a2"]);
  });

  it("edit of an unstored message falls back to the previous user message", () => {
    const client = [user("u1"), assistant("client-a1"), user("u2-unsaved")];
    expect(getTruncationIds(stored, client, "submit-message", "u2-unsaved")).toEqual([
      "a1-step1",
      "a1-step2",
      "u2",
      "a2",
    ]);
  });

  it("deletes nothing for a plain send or a non-user message id", () => {
    const client = [user("u1"), assistant("client-a1"), user("u3")];
    expect(getTruncationIds(stored, client, "submit-message", undefined)).toEqual([]);
    expect(getTruncationIds(stored, client, "submit-message", "client-a1")).toEqual([]);
  });
});
