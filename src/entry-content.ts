import type { LiveNoteEntry } from './continuum';

export interface EditorPosition {
	readonly line: number;
	readonly ch: number;
}

export interface SourcePosition extends EditorPosition {
	readonly offset: number;
}

export interface EditorRange {
	readonly from: EditorPosition;
	readonly to: EditorPosition;
}

export interface SourceRange {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
}

export interface SourceMetadata {
	readonly path: string;
	readonly sections?: readonly {
		readonly type: string;
		readonly id?: string;
		readonly position: SourceRange;
	}[];
	readonly headings?: readonly {
		readonly heading: string;
		readonly level: number;
		readonly position: SourceRange;
	}[];
	readonly listItems?: readonly {
		readonly id?: string;
		readonly parent: number;
		readonly position: SourceRange;
	}[];
}

export interface CaptureInput {
	readonly markdown: string;
	readonly selection: EditorRange | null;
	readonly cursor: EditorPosition;
	readonly metadata: SourceMetadata;
	readonly automaticBlockIds: boolean;
	readonly generateId: () => string;
	readonly entryId: string;
}

export interface CapturedEntry {
	readonly id: string;
	readonly type: 'snapshot';
	readonly sourcePath: string;
	readonly markdown: string;
}

export interface CapturePlan {
	readonly entry: CapturedEntry;
	readonly sourceEdit?: { readonly range: EditorRange; readonly replacement: string };
}

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

export function capture(input: CaptureInput): CapturePlan {
	const selection = input.selection && editorRangeToOffsets(input.markdown, input.selection);
	if (selection && selection.start !== selection.end) {
		return snapshot(input, selection.start, selection.end);
	}
	const cursorOffset = positionToOffset(input.markdown, input.cursor);
	const block = blockAt(input.metadata, cursorOffset);
	if (!block) throw new Error('No Markdown Block at the cursor');
	return snapshot(input, block.start.offset, block.end.offset);
}

function snapshot(input: CaptureInput, start: number, end: number): CapturePlan {
	return {
		entry: {
			id: input.entryId,
			type: 'snapshot',
			sourcePath: input.metadata.path,
			markdown: input.markdown.slice(start, end),
		},
	};
}

function editorRangeToOffsets(markdown: string, range: EditorRange): { start: number; end: number } {
	const from = positionToOffset(markdown, range.from);
	const to = positionToOffset(markdown, range.to);
	return { start: Math.min(from, to), end: Math.max(from, to) };
}

function blockAt(metadata: SourceMetadata, offset: number): SourceRange | undefined {
	const headingIndex = metadata.headings?.findLastIndex(
		({ position }) => position.start.offset <= offset,
	) ?? -1;
	if (headingIndex >= 0 && metadata.headings) {
		const heading = metadata.headings[headingIndex];
		if (heading) {
			const next = metadata.headings.slice(headingIndex + 1)
				.find(({ level }) => level <= heading.level);
			const end = next?.position.start ?? documentEnd(metadata);
			if (offset < end.offset) return { start: heading.position.start, end };
		}
	}

	const listItem = metadata.listItems
		?.filter(({ position }) => contains(position, offset))
		.sort((left, right) => right.position.start.offset - left.position.start.offset)[0];
	if (listItem) return listItem.position;

	return metadata.sections?.find(({ position }) => contains(position, offset))?.position;
}

function documentEnd(metadata: SourceMetadata): SourcePosition {
	const positions = [
		...(metadata.sections ?? []).map(({ position }) => position.end),
		...(metadata.listItems ?? []).map(({ position }) => position.end),
		...(metadata.headings ?? []).map(({ position }) => position.end),
	];
	return positions.reduce((latest, position) =>
		position.offset > latest.offset ? position : latest,
	positions[0] ?? { line: 0, ch: 0, offset: 0 });
}

function contains(range: SourceRange, offset: number): boolean {
	return range.start.offset <= offset && offset <= range.end.offset;
}

function positionToOffset(markdown: string, position: EditorPosition): number {
	let offset = 0;
	for (let line = 0; line < position.line; line += 1) {
		offset = markdown.indexOf('\n', offset) + 1;
	}
	return offset + position.ch;
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
