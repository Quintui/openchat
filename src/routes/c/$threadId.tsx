import { createFileRoute } from "@tanstack/react-router";
import { ChatInterface } from "@/components/chat-interface";
import { getThreadMessages } from "@/server/messages";
import { MyUIMessage } from "@/types/ui-message";

export const Route = createFileRoute("/c/$threadId")({
  loader: async ({ params }) => {
    console.log("here");
    const { messages } = await getThreadMessages({
      data: { threadId: params.threadId },
    });
    return { messages };
  },

  component: ChatPage,
});

function ChatPage() {
  const { messages } = Route.useLoaderData();
  const { threadId } = Route.useParams();

  return (
    <ChatInterface
      initialMessages={messages as MyUIMessage[]}
      threadId={threadId}
    />
  );
}
