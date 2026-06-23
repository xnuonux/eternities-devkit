#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var toc = require('./toc');

function main(argv) {
  if (argv.length < 1) {
    process.stderr.write('usage: node cli.js <file.md>\n');
    process.exit(2);
  }

  var file = argv[0];
  var contents;
  try {
    contents = fs.readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write('error: cannot read file ' + file + '\n');
    process.exit(2);
  }

  process.stdout.write(toc.generateToc(contents) + '\n');
  process.exit(0);
}

main(process.argv.slice(2));
