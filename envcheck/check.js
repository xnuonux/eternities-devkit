'use strict';

// Parse .env text into a Map of KEY -> value.
// - Blank lines are ignored.
// - Lines whose first non-space character is '#' are ignored (comments).
// - Each remaining line is split on the FIRST '=' sign.
// - The key is trimmed; the value is the remainder as-is (no trimming).
function parseEnv(text) {
  const result = new Map();
  if (typeof text !== 'string') {
    return result;
  }
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    // Determine the first non-space character.
    const trimmedStart = line.replace(/^\s+/, '');
    if (trimmedStart === '') {
      // blank line
      continue;
    }
    if (trimmedStart[0] === '#') {
      // comment line
      continue;
    }
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      // No equals sign: skip (not a valid assignment).
      continue;
    }
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1);
    if (key === '') {
      // No key present; skip.
      continue;
    }
    result.set(key, value);
  }
  return result;
}

// Compare an example template against the actual env text.
// Returns { missing: [], extra: [], blank: [] } (string arrays).
// - missing: keys in example but absent from actual.
// - extra:   keys in actual but absent from example.
// - blank:   keys in actual whose trimmed value is empty.
function compareEnv(exampleText, actualText) {
  const exampleMap = parseEnv(exampleText);
  const actualMap = parseEnv(actualText);

  const missing = [];
  const extra = [];
  const blank = [];

  for (const key of exampleMap.keys()) {
    if (!actualMap.has(key)) {
      missing.push(key);
    }
  }

  for (const [key, value] of actualMap) {
    if (!exampleMap.has(key)) {
      extra.push(key);
    }
    if (value.trim() === '') {
      blank.push(key);
    }
  }

  return { missing, extra, blank };
}

module.exports = { parseEnv, compareEnv };
