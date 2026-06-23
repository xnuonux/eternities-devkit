'use strict';

function addDecision(records, fields) {
  fields = fields || {};
  let maxId = 0;
  for (const r of records) {
    if (typeof r.id === 'number' && r.id > maxId) {
      maxId = r.id;
    }
  }
  const id = maxId + 1;
  return {
    id,
    topic: fields.topic || '',
    choice: fields.choice || '',
    reasoning: fields.reasoning || '',
    rejected: Array.isArray(fields.rejected) ? fields.rejected.slice() : [],
    at: fields.at || new Date().toISOString(),
  };
}

function whyDecision(records, query) {
  const q = String(query).toLowerCase();
  const matches = records.filter((r) => {
    return String(r.topic).toLowerCase().includes(q);
  });
  // newest first: sort by at descending (ISO strings sort lexicographically)
  matches.sort((a, b) => {
    if (a.at < b.at) return 1;
    if (a.at > b.at) return -1;
    return 0;
  });
  return matches;
}

module.exports = { addDecision, whyDecision };
