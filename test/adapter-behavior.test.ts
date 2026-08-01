import assert from 'node:assert/strict';
import test from 'node:test';
import { canCollectCurrentBlock } from '../src/editor-command';
import { entryHeader } from '../src/entry-header';
import type { Entry } from '../src/continuum';

void test('current Block collection is unavailable in Reading view', () => {
	assert.equal(canCollectCurrentBlock('preview'), false);
	assert.equal(canCollectCurrentBlock('source'), true);
});

void test('entry identity exposes compact accessible Live and Snapshot indicators', () => {
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
			markdown: 'excerpt',
		},
	];

	assert.deepEqual(entryHeader(entries[0]!), {
		icon: 'link',
		label: 'Live',
		source: 'Findings',
	});
	assert.deepEqual(entryHeader(entries[1]!), {
		icon: 'camera',
		label: 'Snapshot',
		source: 'Methods',
	});
});
