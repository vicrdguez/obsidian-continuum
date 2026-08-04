import assert from 'node:assert/strict';
import test from 'node:test';
import {
	DEFAULT_BINDINGS,
	describeKey,
	resolveKey,
	validateBindings,
	type KeyBindings,
} from '../src/pane-keymap';

void test('binds navigation, source opening and folding by default', () => {
	assert.deepEqual(DEFAULT_BINDINGS, {
		next: 'j',
		previous: 'k',
		'open-source': 'Enter',
		'toggle-fold': 'Space',
	});
	assert.deepEqual(validateBindings(DEFAULT_BINDINGS), { valid: true });
});

void test('resolves only the exact captured key combination', () => {
	assert.equal(resolveKey({ key: 'j' }, DEFAULT_BINDINGS), 'next');
	assert.equal(resolveKey({ key: 'k' }, DEFAULT_BINDINGS), 'previous');
	assert.equal(resolveKey({ key: 'Enter' }, DEFAULT_BINDINGS), 'open-source');
	assert.equal(resolveKey({ key: ' ' }, DEFAULT_BINDINGS), 'toggle-fold');
	assert.equal(resolveKey({ key: 'j', ctrlKey: true }, DEFAULT_BINDINGS), null);
	assert.equal(resolveKey({ key: 'Tab' }, DEFAULT_BINDINGS), null);
});

void test('describes a captured key as a stable binding', () => {
	assert.equal(describeKey({ key: 'J', shiftKey: true }), 'Shift+j');
	assert.equal(describeKey({ key: ' ' }), 'Space');
	assert.equal(
		describeKey({ key: 'ArrowDown', ctrlKey: true, altKey: true }),
		'Ctrl+Alt+ArrowDown',
	);
});

void test('replaces a binding and disables an empty one', () => {
	const bindings: KeyBindings = {
		...DEFAULT_BINDINGS,
		next: 'Shift+j',
		'toggle-fold': null,
	};

	assert.deepEqual(validateBindings(bindings), { valid: true });
	assert.equal(resolveKey({ key: 'J', shiftKey: true }, bindings), 'next');
	assert.equal(resolveKey({ key: 'j' }, bindings), null);
	assert.equal(resolveKey({ key: ' ' }, bindings), null);
});

void test('rejects duplicate bindings and the reserved Tab key', () => {
	const duplicate = validateBindings({ ...DEFAULT_BINDINGS, previous: 'j' });
	const reserved = validateBindings({ ...DEFAULT_BINDINGS, next: 'Tab' });

	assert.equal(duplicate.valid, false);
	assert.match(duplicate.valid ? '' : duplicate.message, /already/i);
	assert.equal(reserved.valid, false);
	assert.match(reserved.valid ? '' : reserved.message, /Tab/);
});
