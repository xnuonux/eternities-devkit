#!/usr/bin/env node
'use strict';

const { checkFile } = require('./check.js');

const files = process.argv.slice(2);
if (files.length === 0) {
  process.stderr.write('usage: devcheck <file...>\n');
  process.exit(2);
}

let total = 0;
for (const f of files) {
  let res;
  try {
    res = checkFile(f);
  } catch (e) {
    process.stderr.write('cannot read ' + f + '\n');
    process.exit(2);
  }
  for (const x of res.findings) {
    process.stdout.write(f + ':' + x.line + ':' + x.col + ': [' + x.tool + '] ' + x.message + '\n');
    total++;
  }
}

process.exit(total > 0 ? 1 : 0);
