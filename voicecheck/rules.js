'use strict';

// The single moon emoji that is exempt from the emoji rule.
// (U+1F319 CRESCENT MOON)
const MOON_EMOJI = '\u{1F319}';

// Em-dash (U+2014) and en-dash (U+2013) characters.
const DASH_RE = /[\u2014\u2013]/g;

const EXCLAMATION_RE = /!/g;

// Any Extended_Pictographic character (covers the common single-codepoint emoji).
const EMOJI_RE = /\p{Extended_Pictographic}/gu;

const FORBIDDEN_WORDS = [
  'execute',
  'deploy',
  'activate',
  'leverage',
  'synergy',
  'utilize',
];

function findAll(re, line, makeMessage) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push({ col: m.index + 1, message: makeMessage(m) });
  }
  return out;
}

const rules = [
  {
    id: 'em-dash',
    scan(line) {
      return findAll(DASH_RE, line, () => 'em-dash/en-dash character used');
    },
  },
  {
    id: 'exclamation',
    scan(line) {
      return findAll(EXCLAMATION_RE, line, () => 'exclamation mark used');
    },
  },
  {
    id: 'emoji',
    scan(line) {
      const out = [];
      EMOJI_RE.lastIndex = 0;
      let m;
      while ((m = EMOJI_RE.exec(line)) !== null) {
        if (m[0] === MOON_EMOJI) continue;
        out.push({ col: m.index + 1, message: 'emoji used' });
      }
      return out;
    },
  },
  {
    id: 'forbidden-words',
    scan(line) {
      const re = new RegExp('\\b(?:' + FORBIDDEN_WORDS.join('|') + ')\\b', 'gi');
      return findAll(re, line, (m) => 'forbidden word: ' + m[0]);
    },
  },
];

module.exports = { rules, MOON_EMOJI, FORBIDDEN_WORDS };
