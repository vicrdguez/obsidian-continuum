import assert from 'node:assert/strict';
import test from 'node:test';
import { createContinuum, type Entry, type LiveNoteEntry } from '../src/continuum';

const alpha: LiveNoteEntry = {
	id: 'alpha',
	type: 'live-note',
	sourcePath: 'Notes/Alpha.md',
};

const beta: LiveNoteEntry = {
	id: 'beta',
	type: 'live-note',
	sourcePath: 'Notes/Beta.md',
};

void test('adds live notes in order and focuses the newest entry', () => {
	const continuum = createContinuum();

	continuum.dispatch({ type: 'add-entry', entry: alpha });
	continuum.dispatch({ type: 'add-entry', entry: beta });

	assert.deepEqual(continuum.snapshot(), {
		entries: [alpha, beta],
		focusedId: 'beta',
	});
});

void test('focuses an existing live note instead of duplicating it', () => {
	const continuum = createContinuum({ entries: [alpha, beta], focusedId: 'beta' });

	continuum.dispatch({
		type: 'add-entry',
		entry: { ...alpha, id: 'duplicate' },
	});

	assert.deepEqual(continuum.snapshot(), {
		entries: [alpha, beta],
		focusedId: 'alpha',
	});
});

void test('deduplicates live source addresses but appends duplicate snapshots', () => {
	const live: Entry = {
		id: 'live',
		type: 'live-content',
		sourcePath: 'Notes/Alpha.md',
		sourceAddress: 'Notes/Alpha.md#^block1',
		markdown: 'Live block',
	};
	const snapshot: Entry = {
		id: 'snapshot',
		type: 'snapshot',
		sourcePath: 'Notes/Alpha.md',
		markdown: 'Captured text',
	};
	const continuum = createContinuum({ entries: [live, snapshot], focusedId: 'snapshot' });

	continuum.dispatch({ type: 'add-entry', entry: { ...live, id: 'duplicate-live' } });
	assert.equal(continuum.snapshot().focusedId, 'live');
	continuum.dispatch({ type: 'add-entry', entry: { ...snapshot, id: 'second-snapshot' } });

	assert.deepEqual(continuum.snapshot().entries, [
		live,
		snapshot,
		{ ...snapshot, id: 'second-snapshot' },
	]);
});

void test('restores valid ordered entries and focus from saved data', () => {
	const continuum = createContinuum({ entries: [beta, alpha], focusedId: 'beta' });

	assert.deepEqual(continuum.snapshot(), {
		entries: [beta, alpha],
		focusedId: 'beta',
	});
});
