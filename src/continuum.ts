export interface LiveNoteEntry {
	readonly id: string;
	readonly type: 'live-note';
	readonly sourcePath: string;
	readonly sourceContext?: string;
}

export interface LiveContentEntry {
	readonly id: string;
	readonly type: 'live-content';
	readonly sourcePath: string;
	readonly sourceAddress: string;
	readonly sourceContext?: string;
	readonly markdown: string;
}

export interface SnapshotEntry {
	readonly id: string;
	readonly type: 'snapshot';
	readonly sourcePath: string;
	readonly sourceContext?: string;
	readonly sourceRange: {
		readonly from: { readonly line: number; readonly ch: number };
		readonly to: { readonly line: number; readonly ch: number };
	};
	readonly markdown: string;
}

export type Entry = LiveNoteEntry | LiveContentEntry | SnapshotEntry;

export interface PersistedContinuum {
	readonly entries: readonly Entry[];
	readonly focusedId?: string;
}

export type ContinuumAction =
	| { type: 'add-entry'; entry: Entry }
	| { type: 'focus-entry'; id: string }
	| { type: 'remove-entry'; id: string };

export interface ContinuumChange {
	readonly focusedEntry: Entry | undefined;
}

export interface Continuum {
	dispatch(action: ContinuumAction): ContinuumChange;
	snapshot(): PersistedContinuum;
}

export function createContinuum(saved?: PersistedContinuum): Continuum {
	let entries = uniqueEntries(saved?.entries ?? []);
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
				const address = stableAddress(action.entry);
				const existing = address
					? entries.find((entry) => stableAddress(entry) === address)
					: undefined;
				if (existing) focusedId = existing.id;
				else {
					entries.push({ ...action.entry });
					focusedId = action.entry.id;
				}
			} else if (action.type === 'remove-entry') {
				entries = entries.filter(({ id }) => id !== action.id);
				if (!entries.some(({ id }) => id === focusedId)) focusedId = undefined;
			} else if (entries.some(({ id }) => id === action.id)) {
				focusedId = action.id;
			}

			return {
				focusedEntry: entries.find(({ id }) => id === focusedId),
			};
		},
		snapshot,
	};
}

/**
 * Adds an entry as one unit of work. `applySourceEdit` runs first and synchronously, so
 * the captured source range cannot go stale while persistence is in flight, and a source
 * edit that throws persists nothing. It returns the undo for exactly that edit: a `persist`
 * rejection runs it and removes only this entry, never a concurrent collection's.
 */
export async function commitEntry(
	continuum: Continuum,
	entry: Entry,
	persist: () => Promise<void>,
	applySourceEdit?: () => () => void,
): Promise<ContinuumChange> {
	const previousFocusedId = continuum.snapshot().focusedId;
	const undoSourceEdit = applySourceEdit?.();
	const change = continuum.dispatch({ type: 'add-entry', entry });
	try {
		await persist();
	} catch (error) {
		undoSourceEdit?.();
		continuum.dispatch({ type: 'remove-entry', id: entry.id });
		// Only this entry's own removal may hand focus back; a newer collection keeps it.
		if (previousFocusedId && !continuum.snapshot().focusedId) {
			continuum.dispatch({ type: 'focus-entry', id: previousFocusedId });
		}
		throw error;
	}
	return change;
}

function stableAddress(entry: Entry): string | undefined {
	if (entry.type === 'live-note') return entry.sourcePath;
	if (entry.type === 'live-content') return entry.sourceAddress;
	return undefined;
}

function uniqueEntries(entries: readonly Entry[]): Entry[] {
	const addresses = new Set<string>();
	const ids = new Set<string>();
	return entries.filter((entry) => {
		const address = stableAddress(entry);
		if (ids.has(entry.id) || (address !== undefined && addresses.has(address))) return false;
		ids.add(entry.id);
		if (address !== undefined) addresses.add(address);
		return true;
	}).map((entry) => ({ ...entry }));
}
