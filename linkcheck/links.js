'use strict';

const fs = require('fs');
const path = require('path');

// Matches an inline markdown link of the form [text](target).
// text may not contain brackets; target may not contain parens.
const LINK_RE = /\[([^\]]*)\]\(([^)\s]*)\)/g;

// Blank out the interior of inline code spans (text between single backticks on
// the same line), preserving length so column positions are unaffected. A link
// written inside backticks, like a `[text](target)` example in a doc, is then
// not seen as a real link. An unmatched backtick is treated as literal text.
function maskInline(line) {
  const chars = line.split('');
  let i = 0;
  while (i < chars.length) {
    if (chars[i] === '`') {
      let j = i + 1;
      while (j < chars.length && chars[j] !== '`') j++;
      if (j < chars.length) { for (let k = i + 1; k < j; k++) chars[k] = ' '; i = j + 1; }
      else break; // no closing backtick: literal, stop
    } else {
      i++;
    }
  }
  return chars.join('');
}

// Extract every inline markdown link [text](target) from the source.
// Returns an array of { line, col, text, target }.
//  - line: 1-based line number
//  - col:  1-based column where the opening '[' sits
// Image links (![text](target)) are ignored.
// Links inside fenced code blocks (``` ... ```) are ignored.
function extractLinks(markdown) {
  const links = [];
  const lines = markdown.split('\n');
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // A fence delimiter is any line whose first three characters are backticks.
    if (line.slice(0, 3) === '```') {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // scan a copy with inline code spans blanked, so a link inside backticks is
    // not matched. positions are preserved, so col + the image check stay correct.
    const scan = maskInline(line);
    LINK_RE.lastIndex = 0;
    let m;
    while ((m = LINK_RE.exec(scan)) !== null) {
      const idx = m.index;
      // Skip image links: an '!' immediately before the opening bracket.
      if (idx > 0 && line[idx - 1] === '!') {
        continue;
      }
      links.push({
        line: i + 1,
        col: idx + 1,
        text: m[1],
        target: m[2],
      });
    }
  }

  return links;
}

// Check the LOCAL RELATIVE links in the markdown against the filesystem.
// A link is local-relative when its target does not start with http://,
// https://, or mailto:, and is not a pure anchor (starts with '#').
// For each such link, strip any trailing hash fragment and trailing query,
// then report whether the resolved path exists on disk.
// Returns an array of { line, col, target, ok }.
function checkLinks(markdown, baseDir) {
  const links = extractLinks(markdown);
  const results = [];

  for (const link of links) {
    const target = link.target;

    // Skip absolute URLs and mailto.
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:')
    ) {
      continue;
    }
    // Skip pure anchors.
    if (target.startsWith('#')) {
      continue;
    }

    // Strip trailing hash fragment and trailing query (in either order).
    let cleaned = target;
    const hashIdx = cleaned.indexOf('#');
    if (hashIdx !== -1) cleaned = cleaned.slice(0, hashIdx);
    const queryIdx = cleaned.indexOf('?');
    if (queryIdx !== -1) cleaned = cleaned.slice(0, queryIdx);

    const resolved = path.resolve(baseDir, cleaned);
    const ok = fs.existsSync(resolved);

    results.push({ line: link.line, col: link.col, target, ok });
  }

  return results;
}

module.exports = { extractLinks, checkLinks };
