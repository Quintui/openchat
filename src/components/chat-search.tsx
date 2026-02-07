import { useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ChatSearchProps = ComponentProps<typeof Dialog>;

export function ChatSearch({ onOpenChange, ...props }: ChatSearchProps) {
	const navigate = useNavigate();

	const handleSelect = (threadId: string) => {
		onOpenChange?.(false);
		navigate({ to: "/c/$threadId", params: { threadId } });
	};

	return (
		<Dialog onOpenChange={onOpenChange} {...props}>
			<DialogContent
				aria-describedby={undefined}
				className={cn(
					"outline! border-none! p-0 outline-border! outline-solid!",
				)}
			>
				<DialogTitle className="sr-only">Search chats</DialogTitle>
				<Command className="**:data-[slot=command-input-wrapper]:h-auto">
					<CommandInput
						placeholder="Search chats..."
						className="h-auto py-3.5"
					/>
					<CommandList>
						<CommandEmpty>No chats found.</CommandEmpty>
						<CommandGroup>{/* TODO: wire up thread data */}</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}

export type ChatSearchTriggerProps = ComponentProps<typeof DialogTrigger>;

export const ChatSearchTrigger = (props: ChatSearchTriggerProps) => (
	<DialogTrigger {...props} />
);
