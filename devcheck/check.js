'use strict';

// devcheck composes the kit into one pre-commit gate: voice lint + secret scan + (for markdown) dead-link check.
// it does not re-implement any detection ... it imports the three verified tools and aggregates their findings, so
// there is one command and one exit code for the whole house style.

const fs = require('fs');
const path = require('path');
const { lintText } = require('../voicecheck/lint.js');
const { scanText } = require('../ward/scan.js');
const { checkLinks } = require('../linkcheck/links.js');

// run the checks over one file's content. returns unified findings: { tool, line, col, message }.
//  - voice runs only when opts.voice !== false. the voice rules (no exclamation, no em-dash) are PROSE rules ... on a
//    code file the exclamation rule alone flags every "!==" and "!flag", so checkFile turns voice OFF for non-prose.
//  - secret runs on every file (a key can hide in any file type).
//  - link runs only when opts.markdown is true and a baseDir is given (relative links resolve against it).
function checkContent(content, opts) {
  opts = opts || {};
  const findings = [];
  if (opts.voice !== false) {
    for (const v of lintText(content)) {
      findings.push({ tool: 'voice', line: v.line, col: v.col, message: v.ruleId + ': ' + v.message });
    }
  }
  for (const s of scanText(content)) {
    findings.push({ tool: 'secret', line: s.line, col: s.col, message: s.kind + ' ' + s.preview });
  }
  if (opts.markdown && opts.baseDir != null) {
    for (const l of checkLinks(content, opts.baseDir)) {
      if (!l.ok) findings.push({ tool: 'link', line: l.line, col: l.col, message: 'broken -> ' + l.target });
    }
  }
  findings.sort((a, b) => a.line - b.line || a.col - b.col || a.tool.localeCompare(b.tool));
  return findings;
}

const PROSE_EXT = new Set(['.md', '.markdown', '.txt', '.mdx']);

// check a file on disk. returns { file, findings }. throws if the file cannot be read (the cli turns that into exit 2).
// voice is scoped to prose files; link to markdown; secret to everything.
function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file).toLowerCase();
  const markdown = ext === '.md' || ext === '.markdown' || ext === '.mdx';
  const prose = PROSE_EXT.has(ext);
  return { file, findings: checkContent(content, { voice: prose, markdown, baseDir: path.dirname(path.resolve(file)) }) };
}

module.exports = { checkContent, checkFile };
