import { createFileRoute } from "@tanstack/react-router";
import { ChatInterface } from "@/components/chat-interface";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/")({
  loader: async () => {
    const threadId = nanoid();
    return { threadId };
  },
  component: () => {
    const { threadId } = Route.useLoaderData();
    return <ChatInterface initialMessages={[]} threadId={threadId} />;
  },
});
