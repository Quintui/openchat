export function OpenChatLogo({
	className,
}: {
	className?: string;
}): React.JSX.Element {
	return (
		<svg
			viewBox="0 0 316.8 316.8"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<rect width="316.8" height="316.8" className="fill-background" />
			<polygon
				points="79.2 198 79.2 148.5 128.7 148.5 79.2 198"
				className="fill-foreground"
			/>
			<polygon
				points="237.6 118.8 237.6 168.3 188.1 168.3 237.6 118.8"
				className="fill-foreground"
			/>
			<polygon
				points="237.6 118.8 198 79.2 89.1 79.2 128.7 118.8 237.6 118.8"
				className="fill-foreground"
			/>
			<polygon
				points="227.7 237.6 188.1 198 79.2 198 118.8 237.6 227.7 237.6"
				className="fill-foreground"
			/>
		</svg>
	);
}
