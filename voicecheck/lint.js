'use strict';

const fs = require('fs');
const { rules } = require('./rules');

// Lint a string of text. Returns an array of
// { line, col, ruleId, message } in line-major, then rule-order.
function lintText(text) {
  const lines = text.split('\n');
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of rules) {
      const matches = rule.scan(line);
      for (const match of matches) {
        issues.push({
          line: i + 1,
          col: match.col,
          ruleId: rule.id,
          message: match.message,
        });
      }
    }
  }
  return issues;
}

// Lint a file on disk. Returns the same shape as lintText.
function lintFile(path) {
  const text = fs.readFileSync(path, 'utf8');
  return lintText(text);
}

module.exports = { lintText, lintFile };
