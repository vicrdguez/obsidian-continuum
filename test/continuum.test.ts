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

const gamma: LiveNoteEntry = {
	id: 'gamma',
	type: 'live-note',
	sourcePath: 'Notes/Gamma.md',
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

void test('focuses the newest entry when the remembered one is gone', () => {
	const continuum = createContinuum({ entries: [alpha, beta], focusedId: 'removed' });

	assert.equal(continuum.snapshot().focusedId, 'beta');
});

void test('moves focus one entry at a time in both directions', () => {
	const continuum = createContinuum({
		entries: [alpha, beta, gamma],
		focusedId: 'beta',
	});

	assert.deepEqual(continuum.dispatch({ type: 'focus-next' }).focusedEntry, gamma);
	assert.deepEqual(continuum.dispatch({ type: 'focus-previous' }).focusedEntry, beta);
	assert.equal(continuum.snapshot().focusedId, 'beta');
});

void test('stops navigation at the collection boundaries without wrapping', () => {
	const continuum = createContinuum({
		entries: [alpha, beta, gamma],
		focusedId: 'gamma',
	});

	assert.deepEqual(continuum.dispatch({ type: 'focus-next' }).focusedEntry, gamma);

	continuum.dispatch({ type: 'focus-entry', id: 'alpha' });

	assert.deepEqual(continuum.dispatch({ type: 'focus-previous' }).focusedEntry, alpha);
});

void test('starts entries expanded and persists a single fold', () => {
	const continuum = createContinuum({ entries: [alpha, beta], focusedId: 'alpha' });

	assert.equal(continuum.snapshot().foldedIds, undefined);

	continuum.dispatch({ type: 'toggle-fold', id: 'alpha' });

	assert.deepEqual(continuum.snapshot().foldedIds, ['alpha']);
	assert.deepEqual(createContinuum(continuum.snapshot()).snapshot().foldedIds, ['alpha']);

	continuum.dispatch({ type: 'toggle-fold', id: 'alpha' });

	assert.equal(continuum.snapshot().foldedIds, undefined);
});

void test('folds every entry unless all of them are already folded', () => {
	const continuum = createContinuum({
		entries: [alpha, beta, gamma],
		focusedId: 'alpha',
		foldedIds: ['beta'],
	});

	continuum.dispatch({ type: 'toggle-all-folds' });

	assert.deepEqual(continuum.snapshot().foldedIds, ['alpha', 'beta', 'gamma']);

	continuum.dispatch({ type: 'toggle-all-folds' });

	assert.equal(continuum.snapshot().foldedIds, undefined);
});

void test('drops fold state that no longer belongs to an entry', () => {
	const continuum = createContinuum({
		entries: [alpha],
		focusedId: 'alpha',
		foldedIds: ['alpha', 'removed'],
	});

	assert.deepEqual(continuum.snapshot().foldedIds, ['alpha']);
});
