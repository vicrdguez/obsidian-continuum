export interface LiveNoteEntry {
	readonly id: string;
	readonly type: 'live-note';
	readonly sourcePath: string;
}

export interface PersistedContinuum {
	readonly entries: readonly LiveNoteEntry[];
	readonly focusedId?: string;
	readonly foldedIds?: readonly string[];
}

export type ContinuumAction =
	| { type: 'add-entry'; entry: LiveNoteEntry }
	| { type: 'focus-entry'; id: string }
	| { type: 'focus-next' }
	| { type: 'focus-previous' }
	| { type: 'toggle-fold'; id: string }
	| { type: 'toggle-all-folds' };

export interface ContinuumChange {
	readonly focusedEntry: LiveNoteEntry | undefined;
}

export interface Continuum {
	dispatch(action: ContinuumAction): ContinuumChange;
	snapshot(): PersistedContinuum;
}

export function createContinuum(saved?: PersistedContinuum): Continuum {
	const entries = uniqueEntries(saved?.entries ?? []);
	const has = (id: string | undefined): boolean =>
		entries.some((entry) => entry.id === id);
	// A remembered entry can disappear between sessions; the newest one stands in.
	let focusedId = has(saved?.focusedId) ? saved?.focusedId : entries.at(-1)?.id;
	const foldedIds = new Set((saved?.foldedIds ?? []).filter(has));

	const step = (offset: number): void => {
		const index = entries.findIndex(({ id }) => id === focusedId);
		focusedId = entries[index + offset]?.id ?? focusedId;
	};

	const snapshot = (): PersistedContinuum => {
		const folded = entries.filter(({ id }) => foldedIds.has(id)).map(({ id }) => id);
		return {
			entries: entries.map((entry) => ({ ...entry })),
			...(focusedId ? { focusedId } : {}),
			...(folded.length ? { foldedIds: folded } : {}),
		};
	};

	return {
		dispatch(action) {
			switch (action.type) {
				case 'add-entry': {
					const existing = entries.find(
						(entry) => entry.sourcePath === action.entry.sourcePath,
					);
					if (existing) focusedId = existing.id;
					else {
						entries.push({ ...action.entry });
						focusedId = action.entry.id;
					}
					break;
				}
				case 'focus-entry':
					if (has(action.id)) focusedId = action.id;
					break;
				case 'focus-next':
					step(1);
					break;
				case 'focus-previous':
					step(-1);
					break;
				case 'toggle-fold':
					if (has(action.id) && !foldedIds.delete(action.id)) {
						foldedIds.add(action.id);
					}
					break;
				case 'toggle-all-folds': {
					const foldEverything = foldedIds.size < entries.length;
					foldedIds.clear();
					if (foldEverything) for (const { id } of entries) foldedIds.add(id);
					break;
				}
			}

			return {
				focusedEntry: entries.find(({ id }) => id === focusedId),
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
