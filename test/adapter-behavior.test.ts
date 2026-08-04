import assert from 'node:assert/strict';
import test from 'node:test';
import { canCollectCurrentBlock } from '../src/editor-command';
import { renderEntryHeader } from '../src/entry-header';
import type { Entry } from '../src/continuum';

interface Rendered {
	tag: string;
	cls: string;
	text: string;
	attr: Record<string, string>;
	children: Rendered[];
	createDiv(options?: Options): Rendered;
	createSpan(options?: Options): Rendered;
	createEl(tag: string, options?: Options): Rendered;
}

interface Options {
	cls?: string;
	text?: string;
	attr?: Record<string, string>;
}

/** The Obsidian element helpers this module uses, recorded instead of rendered. */
function element(tag: string, options: Options = {}): Rendered {
	const append = (childTag: string, childOptions: Options = {}) => {
		const child = element(childTag, childOptions);
		node.children.push(child);
		return child;
	};
	const node: Rendered = {
		tag,
		cls: options.cls ?? '',
		text: options.text ?? '',
		attr: options.attr ?? {},
		children: [],
		createDiv: (childOptions) => append('div', childOptions),
		createSpan: (childOptions) => append('span', childOptions),
		createEl: append,
	};
	return node;
}

function renderHeader(entry: Entry) {
	const article = element('article');
	const icons: [Rendered, string][] = [];
	renderEntryHeader(
		article as unknown as HTMLElement,
		entry,
		(target, icon) => icons.push([target as unknown as Rendered, icon]),
	);
	const header = article.children[0]!;
	return {
		source: header.children.find(({ tag }) => tag === 'button')!,
		type: header.children.find(({ cls }) => cls === 'continuum-entry-type')!,
		icons,
	};
}

void test('current Block collection is unavailable in Reading view', () => {
	assert.equal(canCollectCurrentBlock('preview'), false);
	assert.equal(canCollectCurrentBlock('source'), true);
});

void test('rendered entry headers carry accessible Live and Snapshot identity', () => {
	const entries: Entry[] = [
		{
			id: 'live',
			type: 'live-content',
			sourcePath: 'Research.md',
			sourceAddress: 'Research.md#Findings',
			sourceContext: 'Findings',
			markdown: '# Findings',
		},
		{
			id: 'snapshot',
			type: 'snapshot',
			sourcePath: 'Research.md',
			sourceContext: 'Methods',
			sourceRange: { from: { line: 2, ch: 0 }, to: { line: 2, ch: 7 } },
			markdown: 'excerpt',
		},
	];
	const expected = [
		{ context: 'Findings', label: 'Live', icon: 'link' },
		{ context: 'Methods', label: 'Snapshot', icon: 'camera' },
	];

	for (const [index, entry] of entries.entries()) {
		const { context, label, icon } = expected[index]!;
		const rendered = renderHeader(entry);

		assert.equal(rendered.source.text, context);
		assert.equal(rendered.source.attr['aria-label'], `Open source ${context}`);
		assert.equal(rendered.source.attr['data-source-path'], 'Research.md');
		assert.deepEqual(rendered.type.attr, {
			title: label,
			'aria-label': label,
			role: 'img',
		});
		assert.deepEqual(rendered.icons, [[rendered.type, icon]]);
	}
});

void test('an entry without source context falls back to its source path', () => {
	const rendered = renderHeader({ id: 'note', type: 'live-note', sourcePath: 'Notes/Plain.md' });

	assert.equal(rendered.source.text, 'Notes/Plain.md');
	assert.equal(rendered.type.attr['aria-label'], 'Live');
});
