'use strict';

const fs = require('fs');
const path = require('path');

function storePath() {
  if (process.env.KEEL_STORE) {
    return process.env.KEEL_STORE;
  }
  return path.join(process.cwd(), 'keel-store.json');
}

function load() {
  const file = storePath();
  if (!fs.existsSync(file)) {
    return [];
  }
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.trim()) {
    return [];
  }
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function save(records) {
  const file = storePath();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

module.exports = { load, save, storePath };
