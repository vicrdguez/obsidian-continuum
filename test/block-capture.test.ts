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
		captureAt(markdown, markdown.indexOf('Intro'), { sections, headings }),
		'# One\nIntro\n## Child\nDetails\n',
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
	assert.equal(plan.sourceEdit, undefined);
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
