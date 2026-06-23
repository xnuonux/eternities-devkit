#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { checkLinks } = require('./links');

const USAGE = 'usage: node cli.js <markdown-file>';

const file = process.argv[2];

if (!file) {
  process.stderr.write(USAGE + '\n');
  process.exit(2);
}

let markdown;
try {
  markdown = fs.readFileSync(file, 'utf8');
} catch (e) {
  process.stderr.write(USAGE + '\n');
  process.exit(2);
}

const baseDir = path.dirname(path.resolve(file));
const results = checkLinks(markdown, baseDir);

let broken = 0;
for (const r of results) {
  if (!r.ok) {
    broken++;
    console.log(`${file}:${r.line}:${r.col}: broken -> ${r.target}`);
  }
}

process.exit(broken > 0 ? 1 : 0);
