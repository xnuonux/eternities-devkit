#!/usr/bin/env node
'use strict';

const { lintFile } = require('./lint');

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('usage: node cli.js <file...>');
  process.exit(2);
}

let anyIssue = false;

for (const file of files) {
  let issues;
  try {
    issues = lintFile(file);
  } catch (err) {
    console.error('voicecheck: cannot read ' + file + ': ' + err.message);
    process.exit(2);
  }
  for (const iss of issues) {
    anyIssue = true;
    console.log(file + ':' + iss.line + ':' + iss.col + ': [' + iss.ruleId + '] ' + iss.message);
  }
}

process.exit(anyIssue ? 1 : 0);
