'use strict';

const assert = require('assert');
const { parseEnv, compareEnv } = require('./check.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('pass: ' + name);
}

// --- parseEnv ---

test('parseEnv ignores blank lines and comments', () => {
  const text = [
    '# a comment',
    '',
    '   ',
    'FOO=bar',
    '   # indented comment',
    'BAZ=qux',
  ].join('\n');
  const map = parseEnv(text);
  assert.strictEqual(map.size, 2);
  assert.strictEqual(map.get('FOO'), 'bar');
  assert.strictEqual(map.get('BAZ'), 'qux');
});

test('parseEnv splits on the first equals sign only', () => {
  const text = 'URL=https://example.com?a=b&c=d';
  const map = parseEnv(text);
  assert.strictEqual(map.size, 1);
  assert.strictEqual(map.get('URL'), 'https://example.com?a=b&c=d');
});

test('parseEnv trims the key but keeps value as-is', () => {
  const text = '   KEY  =  value with spaces  ';
  const map = parseEnv(text);
  assert.strictEqual(map.get('KEY'), '  value with spaces  ');
});

test('parseEnv returns a Map', () => {
  const map = parseEnv('A=1');
  assert.ok(map instanceof Map);
});

// --- compareEnv ---

test('compareEnv detects missing, extra, and blank keys', () => {
  const example = [
    'API_KEY=changeme',
    'PORT=3000',
    'SECRET=topsecret',
  ].join('\n');

  const actual = [
    'API_KEY=realkey',
    'PORT=',
    'DEBUG=true',
  ].join('\n');

  const result = compareEnv(example, actual);

  assert.deepStrictEqual(result.missing.sort(), ['SECRET']);
  assert.deepStrictEqual(result.extra.sort(), ['DEBUG']);
  assert.deepStrictEqual(result.blank.sort(), ['PORT']);
});

test('compareEnv returns empty arrays when everything matches', () => {
  const example = 'A=1\nB=2\n';
  const actual = 'A=1\nB=2\n';
  const result = compareEnv(example, actual);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.extra, []);
  assert.deepStrictEqual(result.blank, []);
});

test('compareEnv blank includes extra keys with empty values too', () => {
  const example = 'A=1\n';
  const actual = 'A=1\nB=\n';
  const result = compareEnv(example, actual);
  assert.deepStrictEqual(result.extra, ['B']);
  assert.deepStrictEqual(result.blank, ['B']);
});

console.log('\nok (' + passed + ' tests)');
process.exit(0);
