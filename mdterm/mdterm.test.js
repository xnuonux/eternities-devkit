'use strict';

const assert = require('assert');
const { renderMarkdown } = require('./mdterm');

const doc = [
  '# Title',
  '',
  'This has **bold** and `code`.',
  '',
  '```js',
  'const x = 1;',
  '```',
  '',
  '- item one',
  '* item two',
  '',
  'A [link](https://example.com) here.',
].join('\n');

const expected = [
  'TITLE',
  '',
  'This has bold and code.',
  '',
  '  const x = 1;',
  '',
  '- item one',
  '- item two',
  '',
  'A link (https://example.com) here.',
].join('\n');

const actual = renderMarkdown(doc, { color: false });

assert.strictEqual(actual, expected, 'plain structural output mismatch');

// Per-element sanity checks (all in plain mode).
assert.strictEqual(renderMarkdown('### Sub', { color: false }), 'SUB');
assert.strictEqual(renderMarkdown('a **b** c', { color: false }), 'a b c');
assert.strictEqual(renderMarkdown('a `b` c', { color: false }), 'a b c');
assert.strictEqual(
  renderMarkdown('```\nhi\n```', { color: false }),
  '  hi'
);
assert.strictEqual(renderMarkdown('- one\n- two', { color: false }), '- one\n- two');
assert.strictEqual(
  renderMarkdown('see [site](http://x.io) now', { color: false }),
  'see site (http://x.io) now'
);

console.log('ok');
process.exit(0);
