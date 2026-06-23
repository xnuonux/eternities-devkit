'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { checkContent, checkFile } = require('./check.js');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcheck-'));
fs.writeFileSync(path.join(dir, 'exists.md'), '# ok\n');

// 1. clean markdown (calm prose + a real link) -> no findings
const clean = 'a calm line about the work\n[ok](exists.md)\n';
assert.strictEqual(checkContent(clean, { markdown: true, baseDir: dir }).length, 0, 'clean content has no findings');

// 2. dirty markdown: a forbidden word (voice), a fake key (secret), a broken link (link)
const dirty = [
  'we should leverage this',                    // voice: forbidden word
  'key = sk-FAKEfake1234567890abcdEFGHij',       // secret: openai-key (fake placeholder)
  '[gone](missing.md) is broken',                // link: broken
].join('\n');
const f = checkContent(dirty, { markdown: true, baseDir: dir });
const tools = new Set(f.map((x) => x.tool));
assert.ok(tools.has('voice'), 'voice finding present');
assert.ok(tools.has('secret'), 'secret finding present');
assert.ok(tools.has('link'), 'link finding present');

// 3. the secret finding must never leak the full key
for (const x of f) {
  if (x.tool === 'secret') assert.ok(!x.message.includes('sk-FAKEfake1234567890abcdEFGHij'), 'secret is masked');
}

// 4. non-markdown content does not run the link check
const jsLike = checkContent('we should leverage this\n', { markdown: false });
assert.ok(jsLike.every((x) => x.tool !== 'link'), 'no link checks on non-markdown');
assert.ok(jsLike.some((x) => x.tool === 'voice'), 'voice still runs on non-markdown');

// 5. CLI exit codes via spawnSync
const cli = path.join(__dirname, 'cli.js');
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const cleanFile = path.join(dir, 'clean.md');
const dirtyFile = path.join(dir, 'dirty.md');
fs.writeFileSync(cleanFile, clean);
fs.writeFileSync(dirtyFile, dirty);

assert.strictEqual(run([]).status, 2, 'no args -> exit 2');
assert.strictEqual(run([path.join(dir, 'nofile.md')]).status, 2, 'unreadable -> exit 2');
assert.strictEqual(run([cleanFile]).status, 0, 'clean file -> exit 0');
assert.strictEqual(run([dirtyFile]).status, 1, 'dirty file -> exit 1');
const dirtyOut = run([dirtyFile]).stdout || '';
assert.ok(!dirtyOut.includes('sk-FAKEfake1234567890abcdEFGHij'), 'cli stdout does not leak the full key');

// 6. checkFile scopes voice to prose: a .js file with a negation operator and a fake key gets a secret finding but
//    NO voice finding (the "!" in "!==" is not an exclamation violation); a .md with a forbidden word still gets voice.
const jsFile = path.join(dir, 'sample.js');
fs.writeFileSync(jsFile, 'if (a !== b) { run(); }\nconst k = "sk-FAKEfake1234567890abcdEFGHij";\n');
const jsFindings = checkFile(jsFile).findings;
assert.ok(jsFindings.every((x) => x.tool !== 'voice'), 'no voice findings on a .js file');
assert.ok(jsFindings.some((x) => x.tool === 'secret'), 'secret still found in a .js file');
const mdFile = path.join(dir, 'prose.md');
fs.writeFileSync(mdFile, 'we should leverage this\n');
assert.ok(checkFile(mdFile).findings.some((x) => x.tool === 'voice'), 'voice still runs on a .md file');

fs.rmSync(dir, { recursive: true, force: true });
console.log('ok');
process.exit(0);
