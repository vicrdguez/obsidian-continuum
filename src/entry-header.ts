import type { Entry } from './continuum';

export interface EntryHeader {
	readonly icon: 'link' | 'camera';
	readonly label: 'Live' | 'Snapshot';
	readonly source: string;
}

export function entryHeader(entry: Entry): EntryHeader {
	const live = entry.type !== 'snapshot';
	return {
		icon: live ? 'link' : 'camera',
		label: live ? 'Live' : 'Snapshot',
		source: entry.sourceContext ?? entry.sourcePath,
	};
}
