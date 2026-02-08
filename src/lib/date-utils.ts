export type DateGroup<T> = {
	label: string;
	items: T[];
};

/**
 * Groups items by date into human-readable buckets:
 * "Today", "Yesterday", "Previous 7 days", "Previous 30 days",
 * then "Month Year" (e.g. "January 2026") for anything older.
 *
 * Items are expected to already be sorted (most recent first).
 * Empty groups are omitted from the result.
 */
export function groupByDate<T>(
	items: T[],
	getDate: (item: T) => string | Date,
): DateGroup<T>[] {
	const now = new Date();

	const startOfToday = startOfDay(now);
	const startOfYesterday = addDays(startOfToday, -1);
	const startOf7DaysAgo = addDays(startOfToday, -7);
	const startOf30DaysAgo = addDays(startOfToday, -30);

	const buckets = new Map<string, T[]>();

	// Ordered keys so we can preserve insertion order
	const orderedKeys: string[] = [];

	for (const item of items) {
		const raw = getDate(item);
		const date = raw instanceof Date ? raw : new Date(raw);

		let key: string;

		if (date >= startOfToday) {
			key = "Today";
		} else if (date >= startOfYesterday) {
			key = "Yesterday";
		} else if (date >= startOf7DaysAgo) {
			key = "Previous 7 days";
		} else if (date >= startOf30DaysAgo) {
			key = "Previous 30 days";
		} else {
			key = formatMonthYear(date);
		}

		if (!buckets.has(key)) {
			buckets.set(key, []);
			orderedKeys.push(key);
		}
		buckets.get(key)!.push(item);
	}

	return orderedKeys.map((key) => ({
		label: key,
		items: buckets.get(key)!,
	}));
}

// ── Internal helpers ──────────────────────────────────────

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	year: "numeric",
});

function formatMonthYear(date: Date): string {
	return monthYearFormatter.format(date);
}
