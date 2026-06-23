#!/usr/bin/env node
'use strict';

const { scanFile } = require('./scan');

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.stderr.write('usage: node cli.js <file...>\n');
    process.exit(2);
  }

  let anyFindings = false;
  let hadError = false;

  for (const p of args) {
    let findings;
    try {
      findings = scanFile(p);
    } catch (e) {
      process.stderr.write('usage: node cli.js <file...>\n');
      process.stderr.write('error: cannot read ' + p + '\n');
      hadError = true;
      continue;
    }

    for (const f of findings) {
      anyFindings = true;
      process.stdout.write(p + ':' + f.line + ':' + f.col + ': [' + f.kind + '] ' + f.preview + '\n');
    }
  }

  if (hadError) {
    process.exit(2);
  }
  if (anyFindings) {
    process.exit(1);
  }
  process.exit(0);
}

main();
