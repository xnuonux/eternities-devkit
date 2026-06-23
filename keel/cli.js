#!/usr/bin/env node
'use strict';

const { load, save } = require('./store');
const { addDecision, whyDecision } = require('./keel');

function usage() {
  process.stderr.write(
    'usage: keel decide --topic <t> --choice <c> --reasoning <r> [--rejected a,b] [--at <iso>]\n' +
      '       keel why <topic-query>\n'
  );
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i + 1];
      flags[key] = val;
      i++;
    }
  }
  return flags;
}

function cmdDecide(args) {
  const flags = parseFlags(args);
  const required = ['topic', 'choice', 'reasoning'];
  for (const k of required) {
    if (flags[k] === undefined) {
      usage();
      process.exit(2);
    }
  }
  const rejected = flags.rejected
    ? String(flags.rejected)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];
  const records = load();
  const record = addDecision(records, {
    topic: flags.topic,
    choice: flags.choice,
    reasoning: flags.reasoning,
    rejected,
    at: flags.at || new Date().toISOString(),
  });
  records.push(record);
  save(records);
  process.stdout.write('recorded #' + record.id + '\n');
  process.exit(0);
}

function cmdWhy(args) {
  if (args.length === 0) {
    usage();
    process.exit(2);
  }
  const query = args.join(' ');
  const records = load();
  const matches = whyDecision(records, query);
  if (matches.length === 0) {
    process.exit(1);
  }
  for (const r of matches) {
    process.stdout.write('topic: ' + r.topic + '\n');
    process.stdout.write('choice: ' + r.choice + '\n');
    process.stdout.write('reasoning: ' + r.reasoning + '\n');
    if (r.rejected && r.rejected.length > 0) {
      process.stdout.write('ruled out: ' + r.rejected.join(', ') + '\n');
    } else {
      process.stdout.write('ruled out: \n');
    }
    process.stdout.write('date: ' + r.at + '\n');
    process.stdout.write('\n');
  }
  process.exit(0);
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    usage();
    process.exit(2);
  }
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === 'decide') {
    cmdDecide(rest);
  } else if (sub === 'why') {
    cmdWhy(rest);
  } else {
    usage();
    process.exit(2);
  }
}

if (require.main === module) {
  main(process.argv);
}

module.exports = { main, parseFlags, usage };
