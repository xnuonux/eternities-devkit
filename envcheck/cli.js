#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { compareEnv } = require('./check.js');

function fail(msg) {
  process.stderr.write(String(msg) + '\n');
  process.exit(2);
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length < 2) {
    fail('usage: node cli.js <example-path> <actual-path>');
  }

  const [examplePath, actualPath] = args;

  let exampleText;
  let actualText;
  try {
    exampleText = fs.readFileSync(examplePath, 'utf8');
  } catch (e) {
    fail('error: cannot read example file: ' + examplePath);
  }
  try {
    actualText = fs.readFileSync(actualPath, 'utf8');
  } catch (e) {
    fail('error: cannot read actual file: ' + actualPath);
  }

  const { missing, extra, blank } = compareEnv(exampleText, actualText);

  let hasBlocking = false;

  for (const key of missing) {
    console.log('missing: ' + key);
    hasBlocking = true;
  }
  for (const key of blank) {
    console.log('blank: ' + key);
    hasBlocking = true;
  }
  for (const key of extra) {
    console.log('extra: ' + key);
  }

  if (hasBlocking) {
    process.exit(1);
  }

  if (missing.length === 0 && extra.length === 0 && blank.length === 0) {
    console.log('ok');
  }

  process.exit(0);
}

main(process.argv);
