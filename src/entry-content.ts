import type { LiveNoteEntry } from './continuum';

export interface NoteSource {
	readonly id: string;
	readonly path: string;
}

export interface SourceDocument {
	readonly markdown: string;
	readonly frontmatter?: {
		readonly startOffset: number;
		readonly endOffset: number;
	};
}

export interface ResolvedEntry {
	readonly sourcePath: string;
	readonly markdown: string;
}

export function captureNote(source: NoteSource): LiveNoteEntry {
	return { id: source.id, type: 'live-note', sourcePath: source.path };
}

export function resolveNote(
	entry: LiveNoteEntry,
	source: SourceDocument,
): ResolvedEntry {
	const { frontmatter } = source;
	const markdown = frontmatter
		? source.markdown.slice(0, frontmatter.startOffset) +
			source.markdown.slice(frontmatter.endOffset + 1).replace(/^\r?\n/, '')
		: source.markdown;
	return { sourcePath: entry.sourcePath, markdown };
}
