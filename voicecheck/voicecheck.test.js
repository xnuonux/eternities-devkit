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

// --- Code-span masking: forbidden tokens inside code spans are ignored ---

// A forbidden word wrapped in single backticks on a prose line is NOT reported.
const inlineSpan = 'Use `deploy` to ship it.';
assert.deepStrictEqual(
  lintText(inlineSpan),
  [],
  'inline code span should mask the forbidden word, got: ' + JSON.stringify(lintText(inlineSpan))
);

// A forbidden word on a line inside a fenced block is NOT reported.
const fenced = [
  '```',
  'deploy the thing',
  '```',
].join('\n');
assert.deepStrictEqual(
  lintText(fenced),
  [],
  'fenced code block should mask its contents, got: ' + JSON.stringify(lintText(fenced))
);

// The same forbidden word in normal prose (outside any code span) IS reported.
const prose = 'deploy the thing';
const proseIssues = lintText(prose);
assert.strictEqual(
  proseIssues.length,
  1,
  'prose forbidden word should be reported once, got: ' + JSON.stringify(proseIssues)
);
assert.strictEqual(proseIssues[0].ruleId, 'forbidden-words');
assert.strictEqual(proseIssues[0].line, 1);
assert.strictEqual(proseIssues[0].col, 1);

// An em-dash, an exclamation mark, and an emoji inside an inline span are
// all ignored, while the same tokens in prose on the same line are flagged.
const mixed = 'ok \u2014! \u{1F680} and `x \u2014! \u{1F680} deploy y` done';
const mixedIssues = lintText(mixed);
const mixedRules = mixedIssues.map((x) => x.ruleId).sort();
assert.deepStrictEqual(
  mixedRules,
  ['em-dash', 'emoji', 'exclamation'],
  'only the prose tokens should be flagged, got: ' + JSON.stringify(mixedIssues)
);

// A fenced block that is never closed still masks everything after the
// opening fence (defensive: an unterminated fence is all code).
const unclosedFence = ['```', 'deploy synergy', 'still code'].join('\n');
assert.deepStrictEqual(
  lintText(unclosedFence),
  [],
  'unterminated fence should mask all following lines, got: ' + JSON.stringify(lintText(unclosedFence))
);

console.log('ok');
process.exit(0);
