import assert from 'node:assert/strict';
import test from 'node:test';
import { createContinuum, type LiveNoteEntry } from '../src/continuum';

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

void test('restores valid ordered entries and focus from saved data', () => {
	const continuum = createContinuum({ entries: [beta, alpha], focusedId: 'beta' });

	assert.deepEqual(continuum.snapshot(), {
		entries: [beta, alpha],
		focusedId: 'beta',
	});
});
