import assert from 'node:assert/strict';
import test from 'node:test';
import { captureNote, resolveEntry, resolveNote } from '../src/entry-content';
import type { LiveContentEntry, SnapshotEntry } from '../src/continuum';

void test('captures a live full-note source and resolves its current body', () => {
	const entry = captureNote({ id: 'research', path: 'Notes/Research.md' });
	const markdown = '---\ntopic: tests\n---\n# Current body\n\n- [ ] Keep selectable';

	assert.deepEqual(entry, {
		id: 'research',
		type: 'live-note',
		sourcePath: 'Notes/Research.md',
	});
	assert.deepEqual(
		resolveNote(entry, {
			markdown,
			frontmatter: { startOffset: 0, endOffset: 20 },
		}),
		{
			sourcePath: 'Notes/Research.md',
			markdown: '# Current body\n\n- [ ] Keep selectable',
		},
	);
});

void test('entries with stored Markdown resolve without reading their source', async () => {
	const stored: (LiveContentEntry | SnapshotEntry)[] = [
		{
			id: 'live',
			type: 'live-content',
			sourcePath: 'Research.md',
			sourceAddress: 'Research.md#Findings',
			sourceContext: 'Findings',
			markdown: '# Findings\nEvidence',
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
	let reads = 0;
	const readSource = async () => {
		reads += 1;
		return { markdown: 'unused' };
	};

	for (const entry of stored) {
		assert.deepEqual(await resolveEntry(entry, readSource), {
			sourcePath: entry.sourcePath,
			markdown: entry.markdown,
		});
	}
	assert.equal(reads, 0);

	const note = captureNote({ id: 'note', path: 'Research.md' });
	assert.deepEqual(await resolveEntry(note, readSource), {
		sourcePath: 'Research.md',
		markdown: 'unused',
	});
	assert.equal(reads, 1);
	assert.equal(await resolveEntry(note, async () => null), undefined);
});

void test('keeps the complete source when metadata has no frontmatter position', () => {
	const entry = captureNote({ id: 'plain', path: 'Plain.md' });

	assert.equal(
		resolveNote(entry, { markdown: '# Plain body' }).markdown,
		'# Plain body',
	);
});
