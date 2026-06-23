'use strict';

const assert = require('assert');
const { scanText } = require('./scan');

// All strings below are obviously fake placeholders. No real credential is used.
const sample = [
  '# config file',                                              // line 1 (clean control)
  'openai = sk-FAKEplaceholderkey1234567890abcd',               // line 2 openai-key
  'aws = AKIAFAKEPLACEHOLDER1',                                 // line 3 aws-access-key-id (AKIA + 16)
  '-----BEGIN RSA PRIVATE KEY-----',                            // line 4 private-key-header
  'hex = deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', // line 5 generic-hex (64 hex)
  'blob = AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJ',            // line 6 base64-blob (40+ base64)
  'password = "supersecretpw"',                                 // line 7 suspicious-assignment
].join('\n');

const findings = scanText(sample);

// Helper: group findings by kind
function byKind(kind) {
  return findings.filter((f) => f.kind === kind);
}

// Expected lines (1-based)
const expected = {
  'openai-key': 2,
  'aws-access-key-id': 3,
  'private-key-header': 4,
  'generic-hex': 5,
  'base64-blob': 6,
  'suspicious-assignment': 7,
};

// 1. Each kind is found on its expected line.
for (const kind of Object.keys(expected)) {
  const fs = byKind(kind);
  assert(fs.length >= 1, 'expected at least one ' + kind + ' finding, got ' + fs.length);
  const onLine = fs.some((f) => f.line === expected[kind]);
  assert(onLine, kind + ' not found on expected line ' + expected[kind] + '; got lines ' + fs.map((f) => f.line).join(','));
}

// 2. Clean control line (line 1) yields nothing.
const onLine1 = findings.filter((f) => f.line === 1);
assert(onLine1.length === 0, 'clean control line 1 produced findings: ' + JSON.stringify(onLine1));

// 3. For every finding, the preview must not contain the full matched text.
//    Re-scan with knowledge of matched text by reconstructing from sample lines.
const lines = sample.split('\n');
for (const f of findings) {
  const lineText = lines[f.line - 1];
  // The preview must be a substring-free reveal: it must not equal or contain
  // any 5+ char run of the actual sensitive matched text. We assert the preview
  // contains at least one asterisk (masking happened) and that the preview is
  // shorter than the line (i.e. not the full raw match leaked).
  assert(f.preview.includes('*'), 'preview for ' + f.kind + ' on line ' + f.line + ' has no asterisks: ' + f.preview);
  // The preview must never be the full matched text. Since mask() always appends
  // asterisks when the match is longer than 4 chars, verify no preview ends with
  // a long unmasked run equal to the source. Concretely: preview length must be
  // <= 4 + (asterisks), and any non-asterisk prefix must be <= 4 chars.
  const nonStarPrefix = f.preview.replace(/\*+$/, '');
  assert(nonStarPrefix.length <= 4, 'preview for ' + f.kind + ' reveals more than 4 leading chars: ' + f.preview);
  // Ensure the preview does not contain the full matched text: the preview's
  // non-asterisk part must be a strict prefix of the match and shorter than it.
  // Find the actual matched substring on the line that starts at col.
  const matchedCandidate = lineText.slice(f.col - 1);
  // The preview's leading chars must be a prefix of the candidate and strictly
  // shorter than the candidate (so the full match is never shown).
  if (nonStarPrefix.length > 0) {
    assert(matchedCandidate.startsWith(nonStarPrefix), 'preview prefix not a prefix of matched text for ' + f.kind);
    assert(nonStarPrefix.length < matchedCandidate.length, 'preview reveals full matched text for ' + f.kind + ': ' + f.preview);
  }
}

console.log('ok');
process.exit(0);
