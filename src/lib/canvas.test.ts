import { describe, expect, it } from "vitest";
import type { MyUIMessage } from "@/types/ui-message";
import { type Canvas, getCanvases, getCanvasFilename, getCanvasMarkdown } from "./canvas";

type Part = MyUIMessage["parts"][number];

const assistant = (id: string, parts: Part[]): MyUIMessage => ({ id, role: "assistant", parts });

const created = (toolCallId: string, id: string, content: string): Part => ({
  type: "tool-createCanvas",
  toolCallId,
  state: "output-available",
  input: { title: "Script", kind: "code", language: "python", content },
  output: { id },
});

const updated = (toolCallId: string, id: string, content: string): Part => ({
  type: "tool-updateCanvas",
  toolCallId,
  state: "output-available",
  input: { id, content },
  output: { id },
});

const canvas = (overrides: Partial<Canvas>): Canvas => ({
  id: "c1",
  title: "Script",
  kind: "code",
  content: "",
  isStreaming: false,
  ...overrides,
});

describe("getCanvases", () => {
  it("applies updates from later messages to the canvas they target", () => {
    const canvases = getCanvases([
      assistant("a1", [created("t1", "c1", "v1")]),
      assistant("a2", [updated("t2", "c1", "v2")]),
    ]);
    expect(canvases.get("c1")).toMatchObject({
      content: "v2",
      title: "Script",
      isStreaming: false,
    });
    expect(canvases.size).toBe(1);
  });

  it("keys a streaming create by its tool call id until it has an id", () => {
    const canvases = getCanvases([
      assistant("a1", [
        {
          type: "tool-createCanvas",
          toolCallId: "t1",
          state: "input-streaming",
          input: { title: "Draft", content: "Hel" },
        },
      ]),
    ]);
    expect(canvases.get("t1")).toMatchObject({ title: "Draft", content: "Hel", isStreaming: true });
  });

  it("keeps the old content while an update is still streaming its input", () => {
    const canvases = getCanvases([
      assistant("a1", [
        created("t1", "c1", "v1"),
        {
          type: "tool-updateCanvas",
          toolCallId: "t2",
          state: "input-streaming",
          input: { id: "c1" },
        },
      ]),
    ]);
    expect(canvases.get("c1")).toMatchObject({ content: "v1", isStreaming: true });
  });

  it("ignores failed calls and updates to unknown canvases", () => {
    const canvases = getCanvases([
      assistant("a1", [
        created("t1", "c1", "v1"),
        updated("t2", "missing", "x"),
        {
          type: "tool-updateCanvas",
          toolCallId: "t3",
          state: "output-error",
          input: { id: "c1", content: "bad" },
          errorText: "boom",
        },
      ]),
    ]);
    expect([...canvases.keys()]).toEqual(["c1"]);
    expect(canvases.get("c1")?.content).toBe("v1");
  });
});

describe("getCanvasMarkdown", () => {
  it("returns documents unchanged", () => {
    expect(getCanvasMarkdown(canvas({ kind: "document", content: "# Hi" }))).toBe("# Hi");
  });

  it("fences code with a fence longer than any backtick run inside it", () => {
    expect(getCanvasMarkdown(canvas({ language: "md", content: "````\nx\n````" }))).toBe(
      "`````md\n````\nx\n````\n`````",
    );
    expect(getCanvasMarkdown(canvas({ language: "py", content: "print(1)" }))).toBe(
      "```py\nprint(1)\n```",
    );
  });
});

describe("getCanvasFilename", () => {
  it("builds a file name from the title and language", () => {
    expect(getCanvasFilename(canvas({ title: "Word Count!", language: "Python" }))).toBe(
      "word-count.py",
    );
    expect(getCanvasFilename(canvas({ title: "Notes", kind: "document" }))).toBe("notes.md");
    expect(getCanvasFilename(canvas({ title: "???", language: "cobol" }))).toBe("canvas.txt");
  });
});
