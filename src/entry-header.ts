import type { Entry } from './continuum';

interface EntryHeader {
	readonly icon: 'link' | 'camera';
	readonly label: 'Live' | 'Snapshot';
	readonly source: string;
}

/**
 * Renders the entry header. `setIcon` is injected so this module stays free of the
 * `obsidian` runtime and the rendered identity stays directly testable.
 */
export function renderEntryHeader(
	article: HTMLElement,
	entry: Entry,
	setIcon: (element: HTMLElement, icon: string) => void,
): void {
	const identity = entryHeader(entry);
	const header = article.createDiv({ cls: 'continuum-entry-header' });
	header.createEl('button', {
		cls: 'continuum-source',
		text: identity.source,
		attr: {
			type: 'button',
			'aria-label': `Open source ${identity.source}`,
			'data-source-path': entry.sourcePath,
		},
	});
	const typeIcon = header.createSpan({
		cls: 'continuum-entry-type',
		attr: { title: identity.label, 'aria-label': identity.label, role: 'img' },
	});
	setIcon(typeIcon, identity.icon);
}

function entryHeader(entry: Entry): EntryHeader {
	const live = entry.type !== 'snapshot';
	return {
		icon: live ? 'link' : 'camera',
		label: live ? 'Live' : 'Snapshot',
		source: entry.sourceContext ?? entry.sourcePath,
	};
}
