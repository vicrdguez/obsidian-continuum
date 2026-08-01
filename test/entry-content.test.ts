import assert from 'node:assert/strict';
import test from 'node:test';
import { captureNote, resolveNote } from '../src/entry-content';

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

void test('keeps the complete source when metadata has no frontmatter position', () => {
	const entry = captureNote({ id: 'plain', path: 'Plain.md' });

	assert.equal(
		resolveNote(entry, { markdown: '# Plain body' }).markdown,
		'# Plain body',
	);
});
