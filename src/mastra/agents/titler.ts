import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { DEFAULT_MODEL_ID } from "@/config/models";

export const titler = new Agent({
  id: "titler",
  name: "Titler",
  instructions:
    "You are a conversation titler. Given context from a conversation, generate a very short, concise title that captures the essence of the conversation. The title should be a few words at most — like a chat label or subject line. Respond with only the title, nothing else.",
  model: "openrouter/moonshotai/kimi-k2-0905",
  memory: new Memory(),
});
