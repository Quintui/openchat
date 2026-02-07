import type { UIMessage } from "ai";

export type MyUIMessage = UIMessage<
  unknown,
  {
    "new-thread-created": {
      threadId: string;
    };
  },
  {}
>;
