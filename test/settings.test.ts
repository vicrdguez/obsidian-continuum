import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_BINDINGS } from '../src/pane-keymap';
import {
	DEFAULT_SETTINGS,
	normalizeSettings,
	normalizeThreshold,
	THRESHOLD_RANGE,
} from '../src/settings';

void test('offers the alignment threshold from 50 to 100 in steps of 5, defaulting to 80', () => {
	assert.deepEqual(THRESHOLD_RANGE, { min: 50, max: 100, step: 5 });
	assert.equal(DEFAULT_SETTINGS.alignmentThreshold, 80);
	assert.equal(normalizeThreshold(65), 65);
});

void test('falls back to the default threshold when a saved value is unusable', () => {
	assert.equal(normalizeThreshold(42), 80);
	assert.equal(normalizeThreshold(120), 80);
	assert.equal(normalizeThreshold(undefined), 80);
});

void test('keeps saved bindings that are valid', () => {
	const bindings = { ...DEFAULT_BINDINGS, next: 'Shift+n', 'toggle-fold': null };

	assert.deepEqual(normalizeSettings({ alignmentThreshold: 55, bindings }), {
		alignmentThreshold: 55,
		bindings,
	});
});

void test('restores the default keymap when saved bindings are unusable', () => {
	const duplicate = { ...DEFAULT_BINDINGS, previous: 'j' };
	const reserved = { ...DEFAULT_BINDINGS, next: 'Tab' };
	const corrupt = { ...DEFAULT_BINDINGS, next: 7 } as never;

	assert.deepEqual(normalizeSettings({ bindings: duplicate }).bindings, DEFAULT_BINDINGS);
	assert.deepEqual(normalizeSettings({ bindings: reserved }).bindings, DEFAULT_BINDINGS);
	assert.deepEqual(normalizeSettings({ bindings: corrupt }).bindings, DEFAULT_BINDINGS);
	assert.deepEqual(normalizeSettings(), DEFAULT_SETTINGS);
});
