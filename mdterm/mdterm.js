'use strict';

// Tiny internal ANSI helper (no external dependencies).
const RESET = '\x1b[0m';

function bold(s) {
  return '\x1b[1m' + s + RESET;
}

function boldBright(s) {
  return '\x1b[1;97m' + s + RESET;
}

function dim(s) {
  return '\x1b[2m' + s + RESET;
}

// Inline rendering: handles inline code, bold, and links.
function renderInline(s, color) {
  if (!color) {
    // Plain structural text: strip formatting, expand links.
    return s
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  }

  // Color mode: scan left-to-right, longest/first match wins per position.
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/;
  let result = '';
  let rest = s;
  while (true) {
    const m = re.exec(rest);
    if (!m) {
      result += rest;
      break;
    }
    result += rest.slice(0, m.index);
    if (m[1] !== undefined) {
      // inline code
      result += dim(m[1]);
    } else if (m[2] !== undefined) {
      // bold span
      result += bold(m[2]);
    } else if (m[3] !== undefined) {
      // link: text then url in dim
      result += m[3] + ' ' + dim(m[4]);
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return result;
}

function headingPrefix(level) {
  return '#'.repeat(level) + ' ';
}

function renderMarkdown(md, opts) {
  const color = !opts || opts.color !== false;
  const lines = String(md).split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block: a line whose first three chars are backticks.
    if (line.slice(0, 3) === '```') {
      const inner = [];
      i++;
      while (i < lines.length && lines[i].slice(0, 3) !== '```') {
        inner.push(lines[i]);
        i++;
      }
      i++; // skip closing fence (if present)
      for (const il of inner) {
        out.push('  ' + (color ? dim(il) : il));
      }
      continue;
    }

    // Heading levels 1-3.
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = renderInline(h[2], color);
      if (color) {
        out.push(boldBright(headingPrefix(level) + text));
      } else {
        out.push(text.toUpperCase());
      }
      i++;
      continue;
    }

    // Unordered list item: dash or asterisk followed by a space.
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) {
      const text = renderInline(li[1], color);
      if (color) {
        out.push('\u2022 ' + text);
      } else {
        out.push('- ' + text);
      }
      i++;
      continue;
    }

    // Plain line (still processes inline elements).
    out.push(renderInline(line, color));
    i++;
  }

  return out.join('\n');
}

module.exports = { renderMarkdown, renderInline };
