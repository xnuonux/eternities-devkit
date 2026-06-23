'use strict';

const fs = require('fs');

// Mask a matched string: show at most the first four characters, then asterisks.
// Never reveals the full matched text.
function mask(matched) {
  if (matched == null) return '';
  const s = String(matched);
  if (s.length <= 4) {
    // Still never reveal the full matched text; show fewer chars then asterisks.
    const head = s.slice(0, Math.max(0, s.length - 1));
    return head + '*'.repeat(Math.max(1, s.length - head.length));
  }
  return s.slice(0, 4) + '*'.repeat(s.length - 4);
}

function pushFinding(findings, lineNo, col, kind, matched) {
  findings.push({
    line: lineNo,
    col: col,
    kind: kind,
    preview: mask(matched),
  });
}

function scanText(text) {
  const findings = [];
  if (text == null) return findings;

  const lines = String(text).split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    // --- openai-key: sk- then 20+ chars from [A-Za-z0-9_-] ---
    // Find all occurrences; report each.
    {
      const re = /sk-[A-Za-z0-9_-]{20,}/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        const col = m.index + 1; // 1-based
        pushFinding(findings, lineNo, col, 'openai-key', m[0]);
      }
    }

    // --- aws-access-key-id: AKIA then exactly 16 [A-Z0-9] ---
    // "exactly sixteen" means the run of [A-Z0-9] after AKIA is exactly 16,
    // i.e. not followed by another [A-Z0-9].
    {
      const re = /AKIA[A-Z0-9]{16}(?![A-Z0-9])/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        const col = m.index + 1;
        pushFinding(findings, lineNo, col, 'aws-access-key-id', m[0]);
      }
    }

    // --- private-key-header: line containing BEGIN then PRIVATE then KEY in order ---
    {
      const re = /BEGIN[\s\S]*PRIVATE[\s\S]*KEY/;
      if (re.test(line)) {
        // Report at column 1; preview is masked snippet of the line.
        pushFinding(findings, lineNo, 1, 'private-key-header', line.trim());
      }
    }

    // --- generic-hex: whole token (bounded by non-word chars), 32+ hex chars ---
    {
      const re = /(^|[^A-Za-z0-9_])([0-9A-Fa-f]{32,})(?![A-Za-z0-9_])/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        const matched = m[2];
        // col is 1-based position of the hex token start
        const col = m.index + m[1].length + 1;
        pushFinding(findings, lineNo, col, 'generic-hex', matched);
      }
    }

    // --- base64-blob: whole token of 40+ base64 alphabet chars ---
    // base64 alphabet: A-Z a-z 0-9 + /
    {
      const re = /(^|[^A-Za-z0-9+/])([A-Za-z0-9+/]{40,})(?![A-Za-z0-9+/])/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        const matched = m[2];
        const col = m.index + m[1].length + 1;
        pushFinding(findings, lineNo, col, 'base64-blob', matched);
      }
    }

    // --- suspicious-assignment ---
    // name containing (secret|token|password|apikey|api_key) case-insensitive,
    // assigned with '=' to a quoted string of 8+ chars.
    {
      // name = "..."  or  name = '...'
      // The quoted string content must be 8+ characters.
      const re = /([A-Za-z0-9_]*(?:secret|token|password|apikey|api_key)[A-Za-z0-9_]*)\s*=\s*(['"])((?:[^\\]|\\.){8,}?)\2/gi;
      let m;
      while ((m = re.exec(line)) !== null) {
        const quote = m[2];
        const content = m[3];
        const fullMatched = m[1] + '=' + quote + content + quote;
        // col points to the start of the name
        const col = m.index + 1;
        pushFinding(findings, lineNo, col, 'suspicious-assignment', fullMatched);
      }
    }
  }

  return findings;
}

function scanFile(path) {
  const contents = fs.readFileSync(path, 'utf8');
  return scanText(contents);
}

module.exports = { scanText, scanFile, mask };
