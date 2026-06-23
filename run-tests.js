'use strict';

// dependency-free test runner for the whole kit. spawns each tool's test in a
// child process and captures its output directly (no shell pipe), so it never
// hits the windows/git-bash stdout-redirect hang. exits non-zero if any fail.

const { spawnSync } = require('child_process');

const tests = [
  'voicecheck/voicecheck.test.js',
  'mdtoc/toc.test.js',
  'envcheck/envcheck.test.js',
  'keel/keel.test.js',
  'mdterm/mdterm.test.js',
  'ward/ward.test.js',
  'linkcheck/links.test.js',
  'devcheck/devcheck.test.js',
];

let failed = 0;
for (const t of tests) {
  const r = spawnSync(process.execPath, [t], { cwd: __dirname, encoding: 'utf8' });
  const ok = r.status === 0;
  if (!ok) failed++;
  const out = (r.stdout || '').trim();
  const err = (r.stderr || '').trim();
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + t + (out ? '  (' + out + ')' : ''));
  if (!ok && err) {
    console.log('      ' + err.split('\n').join('\n      '));
  }
}

console.log('');
console.log(
  failed === 0
    ? 'all ' + tests.length + ' tools green'
    : failed + ' of ' + tests.length + ' failing'
);
process.exit(failed === 0 ? 0 : 1);
