/**
 * One runnable check for the only non-trivial logic in the site: token verification.
 * Run with: node --test test/flags.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalize, submit, TEST_POINTS, TOTAL_TEST_POINTS } from '../src/lib/flags.ts';

test('accepts a known token', async () => {
	const r = await submit('CKT{tr4ce_the_p4th}', []);
	assert.equal(r.kind, 'found');
	assert.equal(r.kind === 'found' && r.id, 'TP-01');
});

test('normalises surrounding whitespace before hashing', async () => {
	const r = await submit('   CKT{0hm_sw33p}\n', []);
	assert.equal(r.kind, 'found');
});

test('rejects a wrong token', async () => {
	const r = await submit('CKT{not_a_real_flag}', []);
	assert.equal(r.kind, 'invalid');
});

test('rejects an empty token', async () => {
	const r = await submit('   ', []);
	assert.equal(r.kind, 'invalid');
});

test('reports a duplicate instead of re-finding', async () => {
	const r = await submit('CKT{p4tch_sch3dule}', ['TP-03']);
	assert.equal(r.kind, 'duplicate');
});

test('every stored hash is a 64-char sha-256 digest and unique', () => {
	assert.equal(TEST_POINTS.length, TOTAL_TEST_POINTS);
	assert.ok(TOTAL_TEST_POINTS >= 5);
	const hashes = new Set(TEST_POINTS.map((t) => t.hash));
	assert.equal(hashes.size, TEST_POINTS.length);
	for (const t of TEST_POINTS) assert.match(t.hash, /^[0-9a-f]{64}$/);
});

test('no plaintext token is stored in the flags module', async () => {
	const src = await import('node:fs/promises').then((fs) => fs.readFile('src/lib/flags.ts', 'utf8'));
	assert.ok(!src.includes('CKT{'), 'flags.ts must not contain a plaintext token');
});

test('normalize collapses internal whitespace', () => {
	assert.equal(normalize('  a   b  '), 'a b');
});
