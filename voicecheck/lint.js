'use strict';

const fs = require('fs');
const { rules } = require('./rules');

// Replace every character of a line with a space, preserving the line's
// length (in UTF-16 code units) so that column positions of tokens on
// other lines / later on the same line are unaffected. Used to blank out
// the contents of a fenced code block (and the fence delimiter lines).
function maskAll(line) {
  return ' '.repeat(line.length);
}

// Mask the contents of inline code spans (text between single backticks on
// the same line). The backtick delimiters themselves are left in place
// (no rule flags them); only the characters strictly between an opening
// backtick and its matching closing backtick are replaced with spaces,
// preserving length so column positions of any remaining tokens are kept.
// An unmatched opening backtick (no closing backtick later on the line)
// is treated as literal text and left untouched.
function maskInlineSpans(line) {
  const chars = line.split('');
  let i = 0;
  while (i < chars.length) {
    if (chars[i] === '`') {
      let j = i + 1;
      while (j < chars.length && chars[j] !== '`') j++;
      if (j < chars.length) {
        // matched: blank out the interior, keep both backticks
        for (let k = i + 1; k < j; k++) chars[k] = ' ';
        i = j + 1;
      } else {
        // no closing backtick: literal, stop scanning
        break;
      }
    } else {
      i++;
    }
  }
  return chars.join('');
}

// Return a copy of `line` with all code-span content masked out, so that
// the per-rule scan only ever sees prose. Fenced blocks (delimited by lines
// whose first three characters are backticks) are tracked across lines; the
// fence delimiter lines and every line between a pair are fully masked.
// Inline spans (single backticks on the same line) are masked in prose.
function maskCodeSpans(line, state) {
  const isFence = line.slice(0, 3) === '```';
  if (isFence) {
    state.inFence = !state.inFence;
    return maskAll(line);
  }
  if (state.inFence) {
    return maskAll(line);
  }
  return maskInlineSpans(line);
}

// Lint a string of text. Returns an array of
// { line, col, ruleId, message } in line-major, then rule-order.
function lintText(text) {
  const lines = text.split('\n');
  const issues = [];
  const state = { inFence: false };
  for (let i = 0; i < lines.length; i++) {
    const masked = maskCodeSpans(lines[i], state);
    for (const rule of rules) {
      const matches = rule.scan(masked);
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

module.exports = { lintText, lintFile, maskCodeSpans, maskInlineSpans, maskAll };
