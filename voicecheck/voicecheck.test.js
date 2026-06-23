'use strict';

const assert = require('assert');
const { lintText } = require('./lint');

// --- Clean sample: zero issues (includes the allowed moon emoji) ---
const clean = 'The moon is bright \u{1F319} tonight.';
const cleanIssues = lintText(clean);
assert.strictEqual(
  cleanIssues.length,
  0,
  'clean sample should yield zero issues, got: ' + JSON.stringify(cleanIssues)
);

// --- Dirty sample: one of each violation ---
const dirty = [
  'Hello \u2014 world!',          // em-dash + exclamation
  'Deploy the rocket \u{1F680} now', // forbidden word + (non-moon) emoji
  ' synergy ',                    // forbidden word
].join('\n');

const issues = lintText(dirty);

const expected = [
  { line: 1, col: 7, ruleId: 'em-dash', message: 'em-dash/en-dash character used' },
  { line: 1, col: 14, ruleId: 'exclamation', message: 'exclamation mark used' },
  { line: 2, col: 19, ruleId: 'emoji', message: 'emoji used' },
  { line: 2, col: 1, ruleId: 'forbidden-words', message: 'forbidden word: Deploy' },
  { line: 3, col: 2, ruleId: 'forbidden-words', message: 'forbidden word: synergy' },
];

assert.deepStrictEqual(
  issues,
  expected,
  'dirty sample issue set mismatch\n  actual:   ' +
    JSON.stringify(issues) +
    '\n  expected: ' +
    JSON.stringify(expected)
);

console.log('ok');
process.exit(0);
