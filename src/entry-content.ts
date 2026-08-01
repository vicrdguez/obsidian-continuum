import type {
	LiveContentEntry,
	LiveNoteEntry,
	SnapshotEntry,
} from './continuum';

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
	readonly blocks?: readonly {
		readonly id: string;
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

export type CapturedEntry = SnapshotEntry | LiveContentEntry;

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
		const selectedBlock = blockAt(input.metadata, selection.start, input.markdown);
		if (
			selectedBlock &&
			selectedBlock.range.start.offset === selection.start &&
			selectedBlock.range.end.offset === selection.end
		) return captureBlock(input, selectedBlock);
		return snapshot(input, selection.start, selection.end);
	}
	const cursorOffset = positionToOffset(input.markdown, input.cursor);
	const block = blockAt(input.metadata, cursorOffset, input.markdown);
	if (!block) throw new Error('No Markdown Block at the cursor');
	return captureBlock(input, block);
}

function captureBlock(input: CaptureInput, block: DerivedBlock): CapturePlan {
	const markdown = input.markdown.slice(block.range.start.offset, block.range.end.offset);
	let subpath = block.subpath;
	let sourceEdit: CapturePlan['sourceEdit'];
	if (!subpath && input.automaticBlockIds) {
		const id = uniqueBlockId(input);
		subpath = `#^${id}`;
		sourceEdit = {
			range: {
				from: editorPosition(block.range.start),
				to: editorPosition(block.range.end),
			},
			replacement: addBlockId(markdown, block.type, id),
		};
	}
	if (!subpath) return snapshot(input, block.range.start.offset, block.range.end.offset);
	return {
		entry: {
			id: input.entryId,
			type: 'live-content',
			sourcePath: input.metadata.path,
			sourceAddress: `${input.metadata.path}${subpath}`,
			markdown,
			sourceContext: sourceContext(input, block.range.start.offset),
		},
		...(sourceEdit ? { sourceEdit } : {}),
	};
}

function addBlockId(markdown: string, type: string, id: string): string {
	if (type === 'paragraph') return `${markdown} ^${id}`;
	if (type === 'list') {
		const newline = markdown.indexOf('\n');
		return newline < 0
			? `${markdown} ^${id}`
			: `${markdown.slice(0, newline)} ^${id}${markdown.slice(newline)}`;
	}
	return `${markdown}\n^${id}`;
}

function uniqueBlockId(input: CaptureInput): string {
	const existing = new Set([
		...(input.metadata.sections ?? []).flatMap(({ id }) => id ? [id] : []),
		...(input.metadata.listItems ?? []).flatMap(({ id }) => id ? [id] : []),
		...(input.metadata.blocks ?? []).map(({ id }) => id),
	]);
	let candidate: string;
	do candidate = input.generateId();
	while (!/^[a-z0-9]{6}$/.test(candidate) || existing.has(candidate));
	return candidate;
}

function editorPosition(position: SourcePosition): EditorPosition {
	return { line: position.line, ch: position.ch };
}

function snapshot(input: CaptureInput, start: number, end: number): CapturePlan {
	return {
		entry: {
			id: input.entryId,
			type: 'snapshot',
			sourcePath: input.metadata.path,
			markdown: input.markdown.slice(start, end),
			sourceContext: sourceContext(input, start),
			sourceRange: {
				from: editorPosition(offsetPosition(input.markdown, start)),
				to: editorPosition(offsetPosition(input.markdown, end)),
			},
		},
	};
}

function sourceContext(input: CaptureInput, offset: number): string {
	let context = input.metadata.path;
	for (const heading of input.metadata.headings ?? []) {
		if (heading.position.start.offset > offset) break;
		context = heading.heading;
	}
	return context;
}

function editorRangeToOffsets(markdown: string, range: EditorRange): { start: number; end: number } {
	const from = positionToOffset(markdown, range.from);
	const to = positionToOffset(markdown, range.to);
	return { start: Math.min(from, to), end: Math.max(from, to) };
}

interface DerivedBlock {
	readonly range: SourceRange;
	readonly type: string;
	readonly subpath?: string;
}

function blockAt(metadata: SourceMetadata, offset: number, markdown: string): DerivedBlock | undefined {
	const headingIndex = metadata.headings?.findIndex(
		({ position }) => contains(position, offset),
	) ?? -1;
	if (headingIndex >= 0 && metadata.headings) {
		const heading = metadata.headings[headingIndex];
		if (heading) {
			const next = metadata.headings.slice(headingIndex + 1)
				.find(({ level }) => level <= heading.level);
			const end = next?.position.start ?? offsetPosition(markdown, markdown.length);
			if (offset < end.offset) {
				return {
					range: { start: heading.position.start, end },
					type: 'heading',
					subpath: `#${heading.heading}`,
				};
			}
		}
	}

	const listItem = metadata.listItems
		?.filter(({ position }) => contains(position, offset))
		.sort((left, right) => right.position.start.offset - left.position.start.offset)[0];
	if (listItem) {
		const byLine = new Map(metadata.listItems?.map((item) => [item.position.start.line, item]));
		const descendants = metadata.listItems?.filter((item) => {
			const seen = new Set<number>();
			let parent = byLine.get(item.parent);
			while (parent && !seen.has(parent.position.start.line)) {
				if (parent === listItem) return true;
				seen.add(parent.position.start.line);
				parent = byLine.get(parent.parent);
			}
			return false;
		}) ?? [];
		const end = descendants.reduce(
			(latest, item) => item.position.end.offset > latest.offset ? item.position.end : latest,
			listItem.position.end,
		);
		const range = { start: listItem.position.start, end };
		const id = listItem.id ?? blockIdFor(metadata, range);
		return {
			range,
			type: 'list',
			...(id ? { subpath: `#^${id}` } : {}),
		};
	}

	const section = metadata.sections?.find(({ position }) => contains(position, offset));
	if (!section) return undefined;
	const id = section.id ?? blockIdFor(metadata, section.position);
	return {
		range: section.position,
		type: section.type,
		...(id ? { subpath: `#^${id}` } : {}),
	};
}

function blockIdFor(metadata: SourceMetadata, range: SourceRange): string | undefined {
	return metadata.blocks?.find(({ position }) =>
		position.start.offset === range.start.offset &&
		position.end.offset === range.end.offset)?.id;
}

function offsetPosition(markdown: string, offset: number): SourcePosition {
	const before = markdown.slice(0, offset);
	const lines = before.split('\n');
	return { line: lines.length - 1, ch: lines.at(-1)?.length ?? 0, offset };
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
