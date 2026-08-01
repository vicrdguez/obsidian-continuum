export interface LiveNoteEntry {
	readonly id: string;
	readonly type: 'live-note';
	readonly sourcePath: string;
}

export interface PersistedContinuum {
	readonly entries: readonly LiveNoteEntry[];
	readonly focusedId?: string;
}

export type ContinuumAction =
	| { type: 'add-entry'; entry: LiveNoteEntry }
	| { type: 'focus-entry'; id: string };

export interface ContinuumChange {
	readonly snapshot: PersistedContinuum;
	readonly focusedEntry: LiveNoteEntry | undefined;
}

export interface Continuum {
	dispatch(action: ContinuumAction): ContinuumChange;
	snapshot(): PersistedContinuum;
}

export function createContinuum(saved?: PersistedContinuum): Continuum {
	const entries = uniqueEntries(saved?.entries ?? []);
	let focusedId = entries.some(({ id }) => id === saved?.focusedId)
		? saved?.focusedId
		: undefined;

	const snapshot = (): PersistedContinuum => ({
		entries: entries.map((entry) => ({ ...entry })),
		...(focusedId ? { focusedId } : {}),
	});

	return {
		dispatch(action) {
			if (action.type === 'add-entry') {
				const existing = entries.find(
					(entry) => entry.sourcePath === action.entry.sourcePath,
				);
				if (existing) focusedId = existing.id;
				else {
					entries.push({ ...action.entry });
					focusedId = action.entry.id;
				}
			} else if (entries.some(({ id }) => id === action.id)) {
				focusedId = action.id;
			}

			const current = snapshot();
			return {
				snapshot: current,
				focusedEntry: current.entries.find(({ id }) => id === focusedId),
			};
		},
		snapshot,
	};
}

function uniqueEntries(entries: readonly LiveNoteEntry[]): LiveNoteEntry[] {
	const sourcePaths = new Set<string>();
	const ids = new Set<string>();
	return entries.filter(({ id, sourcePath }) => {
		if (ids.has(id) || sourcePaths.has(sourcePath)) return false;
		ids.add(id);
		sourcePaths.add(sourcePath);
		return true;
	}).map((entry) => ({ ...entry }));
}
