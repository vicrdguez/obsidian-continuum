import assert from 'node:assert/strict';
import test from 'node:test';
import { entryAlignment } from '../src/entry-alignment';
import { DEFAULT_SETTINGS, normalizeThreshold } from '../src/settings';

void test('centers entries below the threshold and top-aligns the rest', () => {
	assert.equal(entryAlignment(799, 1000, 80), 'center');
	assert.equal(entryAlignment(800, 1000, 80), 'start');
	assert.equal(entryAlignment(1200, 1000, 80), 'start');
});

void test('uses the configured threshold', () => {
	assert.equal(DEFAULT_SETTINGS.alignmentThreshold, 80);
	assert.equal(entryAlignment(799, 1000, 50), 'start');
	assert.equal(entryAlignment(499, 1000, 50), 'center');
});

void test('falls back to the default threshold when a saved value is unusable', () => {
	assert.equal(normalizeThreshold(65), 65);
	assert.equal(normalizeThreshold(42), 80);
	assert.equal(normalizeThreshold(120), 80);
	assert.equal(normalizeThreshold(undefined), 80);
});
