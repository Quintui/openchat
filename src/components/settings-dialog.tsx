import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { WorkingMemory } from "@/config/working-memory";
import { useTheme } from "@/hooks/use-theme";
import {
	getWorkingMemory,
	updateWorkingMemory,
	workingMemoryQueryOptions,
} from "@/server/memory";

const THEME_LABELS: Record<string, string> = {
	system: "System",
	light: "Light",
	dark: "Dark",
};

type SettingsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const { theme, setTheme } = useTheme();
	const queryClient = useQueryClient();

	const { data } = useQuery({
		...workingMemoryQueryOptions,
		enabled: open,
	});

	const [name, setName] = useState("");
	const [traits, setTraits] = useState("");
	const [anythingElse, setAnythingElse] = useState("");

	useEffect(() => {
		if (data?.workingMemory) {
			setName(data.workingMemory.name ?? "");
			setTraits(data.workingMemory.traits?.join(", ") ?? "");
			setAnythingElse(data.workingMemory.anythingElse ?? "");
		}
	}, [data]);

	const mutation = useMutation({
		mutationFn: (memory: WorkingMemory) =>
			updateWorkingMemory({ data: memory }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["working-memory"] });
			toast.success("Personalization saved");
		},
		onError: () => {
			toast.error("Failed to save personalization");
		},
	});

	function handleSave() {
		const parsedTraits = traits
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		mutation.mutate({
			name: name || undefined,
			traits: parsedTraits.length > 0 ? parsedTraits : undefined,
			anythingElse: anythingElse || undefined,
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
				<div className="space-y-1">
					<div className="border-border flex items-center justify-between border-t py-4">
						<span className="text-sm font-medium">Appearance</span>
						<Select
							value={theme}
							onValueChange={(value) => {
								if (value) setTheme(value);
							}}
						>
							<SelectTrigger>
								<SelectValue>{THEME_LABELS[theme ?? "system"]}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="light">Light</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<Separator />

				<div className="space-y-4">
					<h3 className="text-sm font-medium">Personalization</h3>
					<p className="text-muted-foreground text-xs">
						Information here is shared with the assistant across all
						conversations.
					</p>

					<div className="space-y-2">
						<Label htmlFor="wm-name">Name</Label>
						<Input
							id="wm-name"
							placeholder="What should OpenChat call you?"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="wm-traits">Traits</Label>
						<Input
							id="wm-traits"
							placeholder="concise, empathetic, curious"
							value={traits}
							onChange={(e) => setTraits(e.target.value)}
						/>
						<p className="text-muted-foreground text-xs">
							Comma-separated. Shapes the assistant's tone and style.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="wm-anything">
							Anything else OpenChat should know
						</Label>
						<Textarea
							id="wm-anything"
							placeholder="Preferences, project context, constraints..."
							value={anythingElse}
							onChange={(e) => setAnythingElse(e.target.value)}
							rows={3}
						/>
					</div>

					<Button
						onClick={handleSave}
						disabled={mutation.isPending}
						className="w-full"
					>
						{mutation.isPending ? "Saving..." : "Save"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
