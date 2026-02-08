import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";

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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>General</DialogTitle>
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
			</DialogContent>
		</Dialog>
	);
}
