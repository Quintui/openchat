import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Search, SquarePen } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { ChatSearch } from "@/components/chat-search";
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
import { threadsQueryOptions } from "@/server/threads";

type SidebarActionItem = {
	id: "new-chat" | "search-chats";
	label: string;
	icon: React.ComponentType<{ className?: string }>;
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

export function AppSidebar(
	props: React.ComponentProps<typeof Sidebar>,
): React.JSX.Element {
	const navigate = useNavigate();
	const [searchOpen, setSearchOpen] = useState(false);
	const { threadId: activeThreadId } = useParams({ strict: false });
	const { data } = useQuery(threadsQueryOptions);
	const threads = data?.threads ?? [];

	const handleAction = (actionId: SidebarActionItem["id"]) => {
		if (actionId === "new-chat") {
			navigate({ to: "/" });
		} else if (actionId === "search-chats") {
			setSearchOpen(true);
		}
	};

	return (
		<>
			<ChatSearch open={searchOpen} onOpenChange={setSearchOpen} />
			<Sidebar collapsible="icon" {...props}>
				<SidebarHeader className="px-3 pt-3 group-data-[collapsible=icon]:px-0">
					<div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
						<div className="bg-foreground text-background flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold group-data-[collapsible=icon]:size-8">
							GC
						</div>
						<SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
					</div>
				</SidebarHeader>

				<SidebarGroup className="pt-1">
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
										onClick={() => handleAction(action.id)}
									>
										<ActionIcon className="size-5 shrink-0" />
										<span>{action.label}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				<SidebarContent>
					<SidebarGroup className="group-data-[collapsible=icon]:hidden">
						<SidebarGroupLabel>Your chats</SidebarGroupLabel>
						<SidebarMenu>
							{threads.map((thread) => (
								<SidebarMenuItem key={thread.id}>
									<SidebarMenuButton
										render={
											<Link
												to="/c/$threadId"
												params={{ threadId: thread.id }}
											/>
										}
										isActive={thread.id === activeThreadId}
										aria-label={thread.title ?? "Untitled chat"}
									>
										<span>{thread.title ?? "Untitled chat"}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
							{threads.length === 0 && (
								<p className="text-muted-foreground px-2 py-1 text-xs">
									No chats yet
								</p>
							)}
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
		</>
	);
}
