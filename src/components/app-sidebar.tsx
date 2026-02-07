import { Search, SquarePen } from "lucide-react";
import type * as React from "react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";

type SidebarActionItem = {
	id: "new-chat" | "search-chats";
	label: string;
	icon: React.ComponentType<{ className?: string }>;
};

type ChatItem = {
	id: string;
	title: string;
};

const SIDEBAR_ACTIONS: ReadonlyArray<SidebarActionItem> = [
	{
		id: "new-chat",
		label: "New chat",
		icon: SquarePen,
	},
	{
		id: "search-chats",
		label: "Search chats",
		icon: Search,
	},
];

const YOUR_CHATS: ReadonlyArray<ChatItem> = [
	{ id: "chat-1", title: "Self-recording for language learning" },
	{ id: "chat-2", title: "Athena Neurology Query Builder" },
	{ id: "chat-3", title: "Monday planning notes" },
	{ id: "chat-4", title: "Learning GPT prompts" },
];

export function AppSidebar(
	props: React.ComponentProps<typeof Sidebar>,
): React.JSX.Element {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="px-3 pt-3 group-data-[collapsible=icon]:px-0">
				<div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
					<div className="bg-foreground text-background flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold group-data-[collapsible=icon]:size-8">
						GC
					</div>
					<SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
				</div>
			</SidebarHeader>

			<SidebarContent className="pt-1">
				<SidebarGroup>
					<SidebarMenu>
						{SIDEBAR_ACTIONS.map((action: SidebarActionItem) => {
							const ActionIcon: React.ComponentType<{ className?: string }> =
								action.icon;

							return (
								<SidebarMenuItem key={action.id}>
									<SidebarMenuButton
										tooltip={action.label}
										type="button"
										aria-label={action.label}
									>
										<ActionIcon className="size-5 shrink-0" />
										<span>{action.label}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				<SidebarGroup className="mt-4 group-data-[collapsible=icon]:hidden">
					<SidebarGroupLabel>Your chats</SidebarGroupLabel>
					<SidebarMenu>
						{YOUR_CHATS.map((chat: ChatItem) => (
							<SidebarMenuItem key={chat.id}>
								<SidebarMenuButton type="button" aria-label={chat.title}>
									<span>{chat.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-sidebar-border border-t p-3">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							type="button"
							aria-label="Kristian Veter account"
						>
							<div className="bg-orange-500 text-white flex size-9 items-center justify-center rounded-full text-lg font-medium group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:text-base">
								KR
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
								<span className="truncate font-medium">Kristian Veter</span>
								<span className="text-muted-foreground truncate text-xs">
									Plus
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
