import { describe, expect, it } from "vitest";
import type { MyUIMessage } from "@/types/ui-message";
import { getTextRun } from "./chat-utils";

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
