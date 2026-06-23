'use strict';

// Generate a github-style anchor slug from a heading text.
// Rules:
//   - lowercase
//   - remove characters that are not alphanumeric, space, or hyphen
//   - replace spaces with hyphens
//   - collapse repeated hyphens
//   - trim leading/trailing hyphens
function slugify(heading) {
  if (heading == null) return '';
  var text = String(heading);
  // lowercase
  text = text.toLowerCase();
  // remove characters that are not alphanumeric, space, or hyphen
  text = text.replace(/[^a-z0-9 -]/g, '');
  // replace spaces with hyphens
  text = text.replace(/ /g, '-');
  // collapse repeated hyphens
  text = text.replace(/-+/g, '-');
  // trim leading/trailing hyphens
  text = text.replace(/^-+|-+$/g, '');
  return text;
}

// Generate a github-style table of contents from a markdown string.
//   - one bullet per heading
//   - nested by heading level using two-space indents
//   - each bullet formatted as '- [text](#slug)'
//   - skip level-1 (#) headings
//   - ignore heading lines inside fenced code blocks
//   - duplicate slugs get a suffix -1, -2, ...
function generateToc(markdown) {
  if (markdown == null) markdown = '';
  var lines = String(markdown).split(/\r?\n/);

  var inFence = false;
  var fenceMarker = null; // backticks count or '~' count, to match closing fence

  var seen = Object.create(null);
  var bullets = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Detect code fences. A fence opens with a line that is (optional spaces)
    // followed by 3+ backticks or 3+ tildes. The closing fence must use the
    // same character and at least as many.
    var fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      var marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0]; // '`' or '~'
      } else if (marker[0] === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }

    if (inFence) continue;

    // Heading: 1-6 '#' followed by a space (or end of line). We only treat
    // lines that start (no leading spaces) as ATX headings for TOC purposes,
    // matching the common markdown convention used by github-style TOCs.
    var headingMatch = line.match(/^(#{1,6})[ \t]+(.*)$/);
    if (!headingMatch) continue;

    var level = headingMatch[1].length;
    if (level === 1) continue; // skip level-1 headings

    var rawText = headingMatch[2];
    // strip trailing '#' sequence (closed ATX heading) and surrounding spaces
    rawText = rawText.replace(/[ \t]+#+[ \t]*$/, '');
    rawText = rawText.replace(/[ \t]+$/, '');
    rawText = rawText.replace(/^[ \t]+/, '');

    var slug = slugify(rawText);

    // duplicate slug suffixing
    if (Object.prototype.hasOwnProperty.call(seen, slug)) {
      seen[slug] += 1;
      slug = slug + '-' + seen[slug];
    } else {
      seen[slug] = 0;
    }

    var indent = repeat('  ', level - 2);
    bullets.push(indent + '- [' + rawText + '](#' + slug + ')');
  }

  return bullets.join('\n');
}

function repeat(str, n) {
  var out = '';
  for (var i = 0; i < n; i++) out += str;
  return out;
}

module.exports = { slugify: slugify, generateToc: generateToc };
