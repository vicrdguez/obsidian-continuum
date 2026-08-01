import assert from 'node:assert/strict';
import test from 'node:test';
import { capture, type SourceMetadata, type SourceRange } from '../src/entry-content';

function range(markdown: string, start: number, end: number): SourceRange {
	const position = (offset: number) => {
		const before = markdown.slice(0, offset);
		const lines = before.split('\n');
		return { line: lines.length - 1, ch: lines.at(-1)?.length ?? 0, offset };
	};
	return { start: position(start), end: position(end) };
}

function captureAt(
	markdown: string,
	cursorOffset: number,
	metadata: Omit<SourceMetadata, 'path'>,
): string {
	const cursor = range(markdown, cursorOffset, cursorOffset).start;
	return capture({
		markdown,
		cursor,
		selection: null,
		metadata: { path: 'Source.md', ...metadata },
		automaticBlockIds: false,
		generateId: () => 'unused',
		entryId: 'entry',
	}).entry.markdown;
}

void test('captures complete paragraphs, fenced code, tables, and callouts', () => {
	const markdown = [
		'First paragraph',
		'',
		'```ts',
		'const value = 1;',
		'```',
		'',
		'| A | B |',
		'| - | - |',
		'| 1 | 2 |',
		'',
		'> [!note] Title',
		'> Body',
	].join('\n');
	const text = (value: string) => {
		const start = markdown.indexOf(value);
		const end = start + value.length;
		return { start, end, range: range(markdown, start, end) };
	};
	const paragraph = text('First paragraph');
	const code = text('```ts\nconst value = 1;\n```');
	const table = text('| A | B |\n| - | - |\n| 1 | 2 |');
	const callout = text('> [!note] Title\n> Body');
	const sections = [
		{ type: 'paragraph', position: paragraph.range },
		{ type: 'code', position: code.range },
		{ type: 'table', position: table.range },
		{ type: 'callout', position: callout.range },
	];

	for (const block of [paragraph, code, table, callout]) {
		assert.equal(
			captureAt(markdown, block.start + 1, { sections }),
			markdown.slice(block.start, block.end),
		);
	}
});

void test('captures a heading section through the next equal-or-higher heading', () => {
	const markdown = '# One\nIntro\n## Child\nDetails\n# Two\nLater';
	const heading = (text: string, level: number) => {
		const start = markdown.indexOf(text);
		return { heading: text.replace(/^#+ /, ''), level, position: range(markdown, start, start + text.length) };
	};
	const headings = [heading('# One', 1), heading('## Child', 2), heading('# Two', 1)];
	const sections = headings.map(({ position }) => ({ type: 'heading', position }));

	assert.equal(
		captureAt(markdown, markdown.indexOf('# One'), { sections, headings }),
		'# One\nIntro\n## Child\nDetails\n',
	);
});

void test('captures the local Block rather than its preceding heading section', () => {
	const markdown = '# Heading\n\nParagraph below';
	const headingEnd = '# Heading'.length;
	const paragraphStart = markdown.indexOf('Paragraph');
	assert.equal(
		captureAt(markdown, paragraphStart + 2, {
			sections: [
				{ type: 'heading', position: range(markdown, 0, headingEnd) },
				{ type: 'paragraph', position: range(markdown, paragraphStart, markdown.length) },
			],
			headings: [{ heading: 'Heading', level: 1, position: range(markdown, 0, headingEnd) }],
		}),
		'Paragraph below',
	);
});

void test('selection takes precedence and preserves arbitrary Markdown exactly', () => {
	const markdown = 'First paragraph\n\nSecond paragraph';
	const first = range(markdown, 0, 'First paragraph'.length);
	const selected = range(markdown, 6, markdown.indexOf('Second') + 3);
	const plan = capture({
		markdown,
		cursor: first.start,
		selection: { from: selected.start, to: selected.end },
		metadata: {
			path: 'Source.md',
			sections: [
				{ type: 'paragraph', position: first },
				{ type: 'paragraph', position: range(markdown, markdown.indexOf('Second'), markdown.length) },
			],
		},
		automaticBlockIds: false,
		generateId: () => 'unused',
		entryId: 'selection',
	});

	assert.equal(plan.entry.type, 'snapshot');
	assert.equal(plan.entry.markdown, 'paragraph\n\nSec');
	assert.deepEqual(plan.entry.sourceRange, {
		from: { line: 0, ch: 6 },
		to: { line: 2, ch: 3 },
	});
	assert.equal(plan.sourceEdit, undefined);
});

void test('headings and existing block IDs are live without source edits', () => {
	const headingMarkdown = '# Findings\nEvidence';
	const headingRange = range(headingMarkdown, 0, headingMarkdown.length);
	const heading = capture({
		markdown: headingMarkdown,
		cursor: headingRange.start,
		selection: null,
		metadata: {
			path: 'Research.md',
			sections: [{ type: 'heading', position: range(headingMarkdown, 0, 10) }],
			headings: [{ heading: 'Findings', level: 1, position: range(headingMarkdown, 0, 10) }],
		},
		automaticBlockIds: false,
		generateId: () => 'unused',
		entryId: 'heading',
	});
	assert.equal(heading.entry.type, 'live-content');
	assert.equal(heading.entry.sourceAddress, 'Research.md#Findings');
	assert.equal(heading.sourceEdit, undefined);

	const blockMarkdown = 'Stable paragraph ^stable1';
	const block = capture({
		markdown: blockMarkdown,
		cursor: range(blockMarkdown, 2, 2).start,
		selection: null,
		metadata: {
			path: 'Research.md',
			sections: [{ type: 'paragraph', position: range(blockMarkdown, 0, blockMarkdown.length) }],
			blocks: [{ id: 'stable1', position: range(blockMarkdown, 0, blockMarkdown.length) }],
		},
		automaticBlockIds: false,
		generateId: () => 'unused',
		entryId: 'block',
	});
	assert.equal(block.entry.type, 'live-content');
	assert.equal(block.entry.sourceAddress, 'Research.md#^stable1');
	assert.equal(block.sourceEdit, undefined);
});

void test('an unaddressed cursor Block stays a snapshot by default', () => {
	const markdown = 'Unaddressed paragraph';
	const blockRange = range(markdown, 0, markdown.length);
	const plan = capture({
		markdown,
		cursor: blockRange.start,
		selection: null,
		metadata: { path: 'Source.md', sections: [{ type: 'paragraph', position: blockRange }] },
		automaticBlockIds: false,
		generateId: () => 'unused',
		entryId: 'snapshot',
	});

	assert.equal(plan.entry.type, 'snapshot');
	assert.equal(plan.entry.markdown, markdown);
	assert.equal(plan.sourceEdit, undefined);
});

void test('opted-in cursor and exact Block selections receive collision-checked IDs', () => {
	const markdown = 'Paragraph\n\nAlready addressed ^abc123';
	const paragraph = range(markdown, 0, 'Paragraph'.length);
	const addressedStart = markdown.indexOf('Already');
	const metadata: SourceMetadata = {
		path: 'Source.md',
		sections: [
			{ type: 'paragraph', position: paragraph },
			{ type: 'paragraph', position: range(markdown, addressedStart, markdown.length) },
		],
		blocks: [{ id: 'abc123', position: range(markdown, addressedStart, markdown.length) }],
	};

	for (const selection of [null, { from: paragraph.start, to: paragraph.end }]) {
		const candidates = ['abc123', 'def456'];
		const plan = capture({
			markdown,
			cursor: paragraph.start,
			selection,
			metadata,
			automaticBlockIds: true,
			generateId: () => candidates.shift() ?? 'unused',
			entryId: 'live',
		});

		assert.equal(plan.entry.type, 'live-content');
		assert.equal(plan.entry.sourceAddress, 'Source.md#^def456');
		assert.deepEqual(plan.sourceEdit, {
			range: { from: { line: 0, ch: 0 }, to: { line: 0, ch: 9 } },
			replacement: 'Paragraph ^def456',
		});
	}
});

void test('inexact selections stay exact snapshots and never edit their source', () => {
	const markdown = 'First block\n\nSecond block';
	const first = range(markdown, 0, 'First block'.length);
	const secondStart = markdown.indexOf('Second');
	const metadata: SourceMetadata = {
		path: 'Source.md',
		sections: [
			{ type: 'paragraph', position: first },
			{ type: 'paragraph', position: range(markdown, secondStart, markdown.length) },
		],
	};
	const selections = [
		range(markdown, 1, 5),
		range(markdown, 0, first.end.offset - 1),
		range(markdown, 0, markdown.length),
	];

	for (const selected of selections) {
		const plan = capture({
			markdown,
			cursor: first.start,
			selection: { from: selected.start, to: selected.end },
			metadata,
			automaticBlockIds: true,
			generateId: () => 'new123',
			entryId: 'snapshot',
		});
		assert.equal(plan.entry.type, 'snapshot');
		assert.equal(plan.entry.markdown, markdown.slice(selected.start.offset, selected.end.offset));
		assert.equal(plan.sourceEdit, undefined);
	}
});

void test('captures a nested list item and descendants without siblings', () => {
	const markdown = '- Parent\n  - Child\n    continuation\n  - Sibling\n- Other';
	const item = (text: string, endText: string, parent: number) => {
		const start = markdown.indexOf(text);
		const end = markdown.indexOf(endText, start) + endText.length;
		return { parent, position: range(markdown, start, end) };
	};
	const listItems = [
		item('- Parent', '  - Sibling', 0),
		item('  - Child', '    continuation', 0),
		item('  - Sibling', '  - Sibling', 0),
		item('- Other', '- Other', -4),
	];
	const listStart = 0;
	const listEnd = markdown.length;

	assert.equal(
		captureAt(markdown, markdown.indexOf('Child'), {
			sections: [{ type: 'list', position: range(markdown, listStart, listEnd) }],
			listItems,
		}),
		'  - Child\n    continuation',
	);
});
