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
	| { type: 'restore'; saved: PersistedContinuum };

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
			} else if (action.type === 'restore') {
				entries = uniqueEntries(action.saved.entries);
				focusedId = entries.some(({ id }) => id === action.saved.focusedId)
					? action.saved.focusedId
					: undefined;
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
 * Adds an entry as one unit of work: nothing durable happens unless the entry is
 * persisted first. A `persist` rejection rolls the Continuum back and skips
 * `applySourceEdit`, so a failed save can never leave a block ID in a note that no
 * saved entry refers to.
 */
export async function commitEntry(
	continuum: Continuum,
	entry: Entry,
	persist: (snapshot: PersistedContinuum) => Promise<void>,
	applySourceEdit?: () => void,
): Promise<ContinuumChange> {
	const previous = continuum.snapshot();
	const change = continuum.dispatch({ type: 'add-entry', entry });
	try {
		await persist(continuum.snapshot());
	} catch (error) {
		continuum.dispatch({ type: 'restore', saved: previous });
		throw error;
	}
	applySourceEdit?.();
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
