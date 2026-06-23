#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { renderMarkdown } = require('./mdterm');

const arg = process.argv[2];

if (!arg) {
  process.stderr.write('usage: node cli.js <file.md>\n');
  process.exit(2);
}

let content;
try {
  content = fs.readFileSync(arg, 'utf8');
} catch (e) {
  process.stderr.write('usage: node cli.js <file.md>\n');
  process.exit(2);
}

process.stdout.write(renderMarkdown(content) + '\n');
process.exit(0);
