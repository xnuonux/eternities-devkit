'use strict';

const assert = require('assert');
const { addDecision, whyDecision } = require('./keel');

function run() {
  const records = [];

  const r1 = addDecision(records, {
    topic: 'Database choice',
    choice: 'Postgres',
    reasoning: 'Need relational integrity and mature ecosystem.',
    rejected: ['MongoDB', 'DynamoDB'],
    at: '2024-01-15T10:00:00.000Z',
  });
  records.push(r1);

  const r2 = addDecision(records, {
    topic: 'Frontend framework',
    choice: 'React',
    reasoning: 'Team familiarity and large hiring pool.',
    rejected: ['Vue', 'Svelte'],
    at: '2024-03-20T12:00:00.000Z',
  });
  records.push(r2);

  const r3 = addDecision(records, {
    topic: 'Database sharding strategy',
    choice: 'Hash-based sharding',
    reasoning: 'Even distribution of write load.',
    rejected: ['Range-based sharding', 'Directory-based sharding'],
    at: '2024-06-01T09:30:00.000Z',
  });
  records.push(r3);

  // monotonic ids
  assert.strictEqual(r1.id, 1, 'first id should be 1');
  assert.strictEqual(r2.id, 2, 'second id should be 2');
  assert.strictEqual(r3.id, 3, 'third id should be 3');

  // whyDecision returns matches newest first
  const dbMatches = whyDecision(records, 'database');
  assert.strictEqual(dbMatches.length, 2, 'should match two database decisions');
  assert.strictEqual(dbMatches[0].id, 3, 'newest database decision first');
  assert.strictEqual(dbMatches[1].id, 1, 'older database decision second');

  // case-insensitive substring
  const caseMatches = whyDecision(records, 'DATABASE');
  assert.strictEqual(caseMatches.length, 2, 'case-insensitive match');

  // rejected alternatives preserved on each record
  assert.deepStrictEqual(r1.rejected, ['MongoDB', 'DynamoDB']);
  assert.deepStrictEqual(r2.rejected, ['Vue', 'Svelte']);
  assert.deepStrictEqual(
    r3.rejected,
    ['Range-based sharding', 'Directory-based sharding']
  );

  // rejected preserved through whyDecision
  assert.deepStrictEqual(dbMatches[0].rejected, [
    'Range-based sharding',
    'Directory-based sharding',
  ]);

  // unknown topic returns empty array
  const none = whyDecision(records, 'nonexistent-xyz');
  assert.deepStrictEqual(none, [], 'unknown topic returns empty array');

  process.stdout.write('ok\n');
  process.exit(0);
}

run();
