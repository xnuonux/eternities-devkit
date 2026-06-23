'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { extractLinks, checkLinks } = require('./links');

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linkcheck-'));
  let exitCode = 0;

  try {
    // Write one real target file into the temp dir.
    const realFile = path.join(tmpDir, 'real.md');
    fs.writeFileSync(realFile, '# real\n');

    const markdown = [
      '[real](real.md)',
      '[missing](missing.md)',
      '[web](https://example.com)',
      '[anchor](#section)',
      '![image](pic.png)',
      '',
    ].join('\n');

    const results = checkLinks(markdown, tmpDir);

    // Index results by target for easy assertions.
    const byTarget = {};
    for (const r of results) {
      byTarget[r.target] = r;
    }

    // Real file link should be present and ok.
    assert.ok(byTarget['real.md'], 'real.md should be checked');
    assert.strictEqual(byTarget['real.md'].ok, true, 'real.md should resolve (ok)');

    // Missing file link should be present and broken.
    assert.ok(byTarget['missing.md'], 'missing.md should be checked');
    assert.strictEqual(byTarget['missing.md'].ok, false, 'missing.md should be broken');

    // http link must be skipped entirely.
    assert.ok(!byTarget['https://example.com'], 'http link must be skipped');

    // Pure anchor must be skipped entirely.
    assert.ok(!byTarget['#section'], 'anchor link must be skipped');

    // Image link must not be treated as a link at all.
    const links = extractLinks(markdown);
    const imageLink = links.find((l) => l.target === 'pic.png');
    assert.ok(!imageLink, 'image link must not be extracted as a link');

    console.log('ok');
  } catch (e) {
    console.error('FAIL: ' + (e && e.message ? e.message : e));
    exitCode = 1;
  } finally {
    // Clean up the temp files.
    try {
      for (const entry of fs.readdirSync(tmpDir)) {
        fs.unlinkSync(path.join(tmpDir, entry));
      }
      fs.rmdirSync(tmpDir);
    } catch (cleanupErr) {
      // best effort; ignore
    }
  }

  process.exit(exitCode);
}

main();
