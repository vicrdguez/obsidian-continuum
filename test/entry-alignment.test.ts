import assert from 'node:assert/strict';
import test from 'node:test';
import { entryAlignment } from '../src/entry-alignment';

void test('centers entries below the threshold and top-aligns the rest', () => {
	assert.equal(entryAlignment(799, 1000, 80), 'center');
	assert.equal(entryAlignment(800, 1000, 80), 'start');
	assert.equal(entryAlignment(1200, 1000, 80), 'start');
});

void test('uses the configured threshold', () => {
	assert.equal(entryAlignment(799, 1000, 50), 'start');
	assert.equal(entryAlignment(499, 1000, 50), 'center');
});
