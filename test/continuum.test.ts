import assert from 'node:assert/strict';
import test from 'node:test';
import { commitEntry, createContinuum, type Entry, type LiveNoteEntry } from '../src/continuum';

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
		sourceRange: { from: { line: 1, ch: 0 }, to: { line: 1, ch: 13 } },
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

void test('edits the source before persistence can interrupt it', async () => {
	const continuum = createContinuum();
	const order: string[] = [];

	await commitEntry(
		continuum,
		alpha,
		() => { order.push('persist'); return Promise.resolve(); },
		() => { order.push('edit'); return () => order.push('undo'); },
	);

	assert.deepEqual(order, ['edit', 'persist']);
});

void test('a failed save undoes the source edit and leaves the Continuum untouched', async () => {
	const continuum = createContinuum({ entries: [alpha], focusedId: 'alpha' });
	const before = continuum.snapshot();
	let sourceEdits = 0;
	let undos = 0;

	await assert.rejects(
		commitEntry(continuum, beta, () => Promise.reject(new Error('disk full')), () => {
			sourceEdits += 1;
			return () => { undos += 1; };
		}),
		/disk full/,
	);

	assert.equal(sourceEdits, 1);
	assert.equal(undos, 1);
	assert.deepEqual(continuum.snapshot(), before);
});

void test('a failed source edit persists nothing', async () => {
	const continuum = createContinuum({ entries: [alpha], focusedId: 'alpha' });
	const before = continuum.snapshot();
	let saves = 0;

	await assert.rejects(
		commitEntry(
			continuum,
			beta,
			() => { saves += 1; return Promise.resolve(); },
			() => { throw new Error('stale editor'); },
		),
		/stale editor/,
	);

	assert.equal(saves, 0);
	assert.deepEqual(continuum.snapshot(), before);
});

void test('a failed collection keeps a concurrent successful collection', async () => {
	const gamma: LiveNoteEntry = { id: 'gamma', type: 'live-note', sourcePath: 'Notes/Gamma.md' };
	const continuum = createContinuum({ entries: [gamma], focusedId: 'gamma' });
	let failPending = () => {};
	const pending = commitEntry(continuum, alpha, () => new Promise((_resolve, reject) => {
		failPending = () => { reject(new Error('disk full')); };
	}));

	await commitEntry(continuum, beta, () => Promise.resolve());
	failPending();

	await assert.rejects(pending, /disk full/);
	assert.deepEqual(continuum.snapshot(), { entries: [gamma, beta], focusedId: 'beta' });
});

void test('a successful save edits the source and keeps the added entry', async () => {
	const continuum = createContinuum({ entries: [alpha], focusedId: 'alpha' });
	const saved: unknown[] = [];
	let sourceEdits = 0;
	let undos = 0;

	const change = await commitEntry(
		continuum,
		beta,
		() => { saved.push(continuum.snapshot()); return Promise.resolve(); },
		() => { sourceEdits += 1; return () => { undos += 1; }; },
	);

	assert.equal(change.focusedEntry?.id, 'beta');
	assert.equal(sourceEdits, 1);
	assert.equal(undos, 0);
	assert.deepEqual(saved, [{ entries: [alpha, beta], focusedId: 'beta' }]);
	assert.deepEqual(continuum.snapshot(), { entries: [alpha, beta], focusedId: 'beta' });
});

void test('restores valid ordered entries and focus from saved data', () => {
	const continuum = createContinuum({ entries: [beta, alpha], focusedId: 'beta' });

	assert.deepEqual(continuum.snapshot(), {
		entries: [beta, alpha],
		focusedId: 'beta',
	});
});
