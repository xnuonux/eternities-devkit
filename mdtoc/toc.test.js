'use strict';

var assert = require('assert');
var toc = require('./toc');
var slugify = toc.slugify;
var generateToc = toc.generateToc;

var failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log('pass: ' + name);
  } catch (e) {
    failures++;
    console.error('FAIL: ' + name);
    console.error('  ' + e.message);
  }
}

// --- slugify tests ---

check('slugify: simple', function () {
  assert.strictEqual(slugify('Hello World'), 'hello-world');
});

check('slugify: keeps hyphens', function () {
  assert.strictEqual(slugify('Foo - Bar'), 'foo-bar');
});

check('slugify: removes punctuation', function () {
  assert.strictEqual(slugify('Hello, World!'), 'hello-world');
});

check('slugify: collapses repeated hyphens', function () {
  assert.strictEqual(slugify('A   B'), 'a-b');
});

check('slugify: trims leading/trailing hyphens', function () {
  assert.strictEqual(slugify('--A B--'), 'a-b');
});

check('slugify: removes non-alphanumeric (parens, dots)', function () {
  assert.strictEqual(slugify('Section (1.2)'), 'section-12');
});

check('slugify: handles unicode by dropping it', function () {
  assert.strictEqual(slugify('Café Menu'), 'caf-menu');
});

check('slugify: empty input', function () {
  assert.strictEqual(slugify(''), '');
});

check('slugify: only punctuation', function () {
  assert.strictEqual(slugify('!!!'), '');
});

// --- generateToc tests ---

check('generateToc: basic nesting, h1 skipped', function () {
  var md = '# Title\n' +
           '## Section A\n' +
           '### Subsection\n' +
           '## Section B\n';
  var expected =
    '- [Section A](#section-a)\n' +
    '  - [Subsection](#subsection)\n' +
    '- [Section B](#section-b)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: ignores headings inside fenced code blocks', function () {
  var md = '# Title\n' +
           '## Outside\n' +
           '```\n' +
           '## Not A Heading\n' +
           '### Also Not\n' +
           '```\n' +
           '## After\n';
  var expected =
    '- [Outside](#outside)\n' +
    '- [After](#after)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: ignores headings inside tilde fences', function () {
  var md = '## Outside\n' +
           '~~~\n' +
           '## Not A Heading\n' +
           '~~~\n' +
           '## After\n';
  var expected =
    '- [Outside](#outside)\n' +
    '- [After](#after)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: duplicate slug suffixing', function () {
  var md = '## Foo\n' +
           '## Foo\n' +
           '## Foo\n';
  var expected =
    '- [Foo](#foo)\n' +
    '- [Foo](#foo-1)\n' +
    '- [Foo](#foo-2)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: duplicate slug suffixing with different text same slug', function () {
  var md = '## Hello World\n' +
           '## Hello, World!\n';
  var expected =
    '- [Hello World](#hello-world)\n' +
    '- [Hello, World!](#hello-world-1)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: deep nesting indent', function () {
  var md = '## A\n' +
           '### B\n' +
           '#### C\n' +
           '##### D\n' +
           '###### E\n';
  var expected =
    '- [A](#a)\n' +
    '  - [B](#b)\n' +
    '    - [C](#c)\n' +
    '      - [D](#d)\n' +
    '        - [E](#e)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: closed ATX heading strips trailing hashes', function () {
  var md = '## Section ##\n' +
           '### Sub ###\n';
  var expected =
    '- [Section](#section)\n' +
    '  - [Sub](#sub)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: empty markdown', function () {
  assert.strictEqual(generateToc(''), '');
});

check('generateToc: no headings', function () {
  assert.strictEqual(generateToc('just some text\nno headings here'), '');
});

check('generateToc: only h1', function () {
  assert.strictEqual(generateToc('# Only Title\n# Another'), '');
});

check('generateToc: heading text preserved with internal formatting chars', function () {
  var md = '## A & B\n';
  // '&' is removed, leaving two spaces -> two hyphens -> collapsed to one
  var expected = '- [A & B](#a-b)';
  assert.strictEqual(generateToc(md), expected);
});

check('generateToc: nested code fences with different markers do not close early', function () {
  var md = '## Outside\n' +
           '```\n' +
           '~~~\n' +
           '## Not A Heading\n' +
           '```\n' +
           '## After\n';
  var expected =
    '- [Outside](#outside)\n' +
    '- [After](#after)';
  assert.strictEqual(generateToc(md), expected);
});

// --- result ---
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
} else {
  console.log('\nok');
  process.exit(0);
}
