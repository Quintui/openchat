import { createFileRoute } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { ChatInterface } from "@/components/chat-interface";

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
