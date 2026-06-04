/**
 * FlashPoll — Frontend Logic Tests
 *
 * Tests the api/polls.js contract, App-level state transforms, and
 * PollCard/CreatePollModal validation logic without a browser or bundler.
 *
 * Run:  node frontend_test.js
 *
 * Requires Node.js >= 18 (built-in fetch, structuredClone).
 */

'use strict';

// ─── Minimal test harness ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}
function assertDeepEqual(a, b, msg) {
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(msg || `Deep-equal failed:\n  got: ${sa}\n  want: ${sb}`);
}

// ─── Mock fetch factory ───────────────────────────────────────────────────────

function makeFetch(status, body) {
  return async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
  });
}

// ─── pollsApi logic (inlined so we don't need ESM imports) ───────────────────
// Mirror of src/api/polls.js logic for unit testing.

const BASE = '/api';

async function request(path, options = {}, fetchImpl = fetch) {
  const res = await fetchImpl(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Server error ${res.status}`);
  }
  return data;
}

const pollsApi = {
  getAll:  (f) => request('/polls', {}, f),
  create:  (body, f) => request('/polls', { method: 'POST', body: JSON.stringify(body) }, f),
  delete:  (id, f) => request(`/polls/${id}`, { method: 'DELETE' }, f),
  vote:    (pollId, optionId, f) => request(`/polls/${pollId}/vote`, {
    method: 'PATCH',
    body: JSON.stringify({ option_id: optionId }),
  }, f),
};

// ─── Helpers for derived state (mirrors App.jsx logic) ────────────────────────

function deriveVisible(polls, filterCat, searchQ, sortBy) {
  const ALL = 'All';
  return polls
    .filter((p) => {
      if (filterCat !== ALL && p.category !== filterCat) return false;
      if (searchQ && !p.question.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest')  return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'popular') return b.total_votes - a.total_votes;
      return 0;
    });
}

// ─── Validation logic (mirrors CreatePollModal.jsx) ────────────────────────────

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const CATEGORIES = ['Technology', 'Sports', 'Entertainment', 'Politics', 'Science', 'Food', 'Other'];

function validatePollForm(question, category, options) {
  const trimQ = question.trim();
  const trimOpts = options.map((o) => o.trim()).filter(Boolean);

  if (!trimQ)                              return 'Question is required.';
  if (!category)                           return 'Please select a category.';
  if (!CATEGORIES.includes(category))      return 'Invalid category.';
  if (trimOpts.length < MIN_OPTIONS)       return `Please fill in at least ${MIN_OPTIONS} options.`;
  if (trimOpts.length > MAX_OPTIONS)       return `Maximum ${MAX_OPTIONS} options allowed.`;
  const unique = new Set(trimOpts.map((o) => o.toLowerCase()));
  if (unique.size !== trimOpts.length)     return 'Options must be distinct.';
  return null; // valid
}

// ─── timeAgo logic (mirrors PollCard.jsx) ─────────────────────────────────────

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Percentage computation (mirrors getPollsWithOptions in backend) ──────────

function computePercentages(options) {
  const total = options.reduce((s, o) => s + o.vote_count, 0);
  return options.map((o) => ({
    ...o,
    percentage: total > 0 ? (o.vote_count / total) * 100 : 0,
  }));
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

console.log('\n── pollsApi.getAll ──────────────────────────────────────────');

test('getAll: resolves to parsed array on 200', async () => {
  const polls = [{ id: '1', question: 'Q', category: 'Technology', options: [], total_votes: 0 }];
  const result = await pollsApi.getAll(makeFetch(200, polls));
  assertDeepEqual(result, polls);
});

test('getAll: throws on 500 with server error message', async () => {
  try {
    await pollsApi.getAll(makeFetch(500, { error: 'Internal server error' }));
    assert(false, 'Should have thrown');
  } catch (err) {
    assertEqual(err.message, 'Internal server error');
  }
});

test('getAll: throws with fallback message when no error field', async () => {
  try {
    await pollsApi.getAll(makeFetch(503, {}));
    assert(false, 'Should have thrown');
  } catch (err) {
    assert(err.message.includes('503'), `Expected 503 in message, got: ${err.message}`);
  }
});

console.log('\n── pollsApi.create ──────────────────────────────────────────');

test('create: resolves on 201', async () => {
  const newPoll = { id: 'abc', question: 'Best lang?', category: 'Technology', options: [] };
  const result = await pollsApi.create(
    { question: 'Best lang?', category: 'Technology', options: ['Go', 'Rust'] },
    makeFetch(201, newPoll)
  );
  assertEqual(result.id, 'abc');
});

test('create: throws on 400 with validation error', async () => {
  try {
    await pollsApi.create(
      { question: '', category: 'Other', options: ['A', 'B'] },
      makeFetch(400, { error: 'question is required' })
    );
    assert(false, 'Should have thrown');
  } catch (err) {
    assertEqual(err.message, 'question is required');
  }
});

console.log('\n── pollsApi.delete ──────────────────────────────────────────');

test('delete: resolves null on 204', async () => {
  const result = await pollsApi.delete('some-id', makeFetch(204, null));
  assertEqual(result, null, 'DELETE 204 should resolve to null');
});

test('delete: throws on 404', async () => {
  try {
    await pollsApi.delete('bad-id', makeFetch(404, { error: 'Poll not found' }));
    assert(false, 'Should have thrown');
  } catch (err) {
    assertEqual(err.message, 'Poll not found');
  }
});

console.log('\n── pollsApi.vote ────────────────────────────────────────────');

test('vote: resolves options + total_votes on 200', async () => {
  const payload = {
    options: [{ id: 'o1', option_text: 'Go', vote_count: 1, percentage: 100 }],
    total_votes: 1,
  };
  const result = await pollsApi.vote('poll-1', 'o1', makeFetch(200, payload));
  assertEqual(result.total_votes, 1);
  assertEqual(result.options.length, 1);
});

test('vote: throws 404 when option_id does not belong to poll', async () => {
  try {
    await pollsApi.vote('poll-1', 'bad-option', makeFetch(404, { error: 'Option not found for this poll' }));
    assert(false, 'Should have thrown');
  } catch (err) {
    assert(err.message.includes('Option not found'), err.message);
  }
});

console.log('\n── validatePollForm (CreatePollModal logic) ─────────────────');

test('valid form returns null', () => {
  const err = validatePollForm('Q?', 'Technology', ['Go', 'Rust']);
  assertEqual(err, null);
});

test('missing question returns error', () => {
  const err = validatePollForm('  ', 'Technology', ['A', 'B']);
  assert(err !== null, 'Should error on blank question');
});

test('missing category returns error', () => {
  const err = validatePollForm('Q?', '', ['A', 'B']);
  assert(err !== null);
});

test('fewer than 2 options returns error', () => {
  const err = validatePollForm('Q?', 'Food', ['Only']);
  assert(err !== null);
});

test('more than 8 options returns error', () => {
  const err = validatePollForm('Q?', 'Other', ['A','B','C','D','E','F','G','H','I']);
  assert(err !== null);
});

test('duplicate options (case-insensitive) returns error', () => {
  const err = validatePollForm('Q?', 'Science', ['same', 'Same']);
  assert(err !== null, 'Should reject case-insensitive duplicates');
});

test('blank option strings filtered before dedup check', () => {
  // options array has 3 entries but middle one is blank → effectively 2 valid
  const err = validatePollForm('Q?', 'Food', ['Pizza', '  ', 'Sushi']);
  assertEqual(err, null, 'Blank options filtered — 2 valid options remain');
});

test('all 7 valid categories accepted', () => {
  const cats = ['Technology', 'Sports', 'Entertainment', 'Politics', 'Science', 'Food', 'Other'];
  for (const cat of cats) {
    const err = validatePollForm('Q?', cat, ['A', 'B']);
    assertEqual(err, null, `Category ${cat} should be valid`);
  }
});

console.log('\n── deriveVisible (App.jsx filter+sort logic) ────────────────');

const samplePolls = [
  { id: '1', question: 'Best framework?', category: 'Technology', total_votes: 10,
    created_at: '2024-01-01T10:00:00Z', options: [] },
  { id: '2', question: 'Best sport?',     category: 'Sports',     total_votes: 50,
    created_at: '2024-01-02T10:00:00Z', options: [] },
  { id: '3', question: 'Best food?',      category: 'Food',       total_votes: 5,
    created_at: '2024-01-03T10:00:00Z', options: [] },
];

test('no filter/sort: returns all polls', () => {
  const v = deriveVisible(samplePolls, 'All', '', 'newest');
  assertEqual(v.length, 3);
});

test('category filter returns only matching polls', () => {
  const v = deriveVisible(samplePolls, 'Sports', '', 'newest');
  assertEqual(v.length, 1);
  assertEqual(v[0].id, '2');
});

test('search filter is case-insensitive', () => {
  const v = deriveVisible(samplePolls, 'All', 'FRAMEWORK', 'newest');
  assertEqual(v.length, 1);
  assertEqual(v[0].id, '1');
});

test('sort newest-first: p3 > p2 > p1', () => {
  const v = deriveVisible(samplePolls, 'All', '', 'newest');
  assertEqual(v[0].id, '3');
  assertEqual(v[1].id, '2');
  assertEqual(v[2].id, '1');
});

test('sort oldest-first: p1 > p2 > p3', () => {
  const v = deriveVisible(samplePolls, 'All', '', 'oldest');
  assertEqual(v[0].id, '1');
  assertEqual(v[2].id, '3');
});

test('sort most-popular: p2(50) > p1(10) > p3(5)', () => {
  const v = deriveVisible(samplePolls, 'All', '', 'popular');
  assertEqual(v[0].id, '2');
  assertEqual(v[1].id, '1');
  assertEqual(v[2].id, '3');
});

test('category + search combined filter works', () => {
  const v = deriveVisible(samplePolls, 'Technology', 'framework', 'newest');
  assertEqual(v.length, 1);
});

test('no match returns empty array', () => {
  const v = deriveVisible(samplePolls, 'All', 'zzz-no-match', 'newest');
  assertEqual(v.length, 0);
});

console.log('\n── computePercentages ───────────────────────────────────────');

test('single vote = 100%', () => {
  const opts = computePercentages([
    { id: 'a', vote_count: 1 },
    { id: 'b', vote_count: 0 },
  ]);
  assertEqual(opts[0].percentage, 100);
  assertEqual(opts[1].percentage, 0);
});

test('equal votes = 50% each', () => {
  const opts = computePercentages([
    { id: 'a', vote_count: 3 },
    { id: 'b', vote_count: 3 },
  ]);
  assertEqual(opts[0].percentage, 50);
  assertEqual(opts[1].percentage, 50);
});

test('zero total = 0% for all', () => {
  const opts = computePercentages([
    { id: 'a', vote_count: 0 },
    { id: 'b', vote_count: 0 },
  ]);
  assertEqual(opts[0].percentage, 0);
  assertEqual(opts[1].percentage, 0);
});

test('66.67 / 33.33 split', () => {
  const opts = computePercentages([
    { id: 'a', vote_count: 2 },
    { id: 'b', vote_count: 1 },
  ]);
  const pctA = Math.round(opts[0].percentage * 100) / 100;
  assert(pctA > 66 && pctA < 67, `Expected ~66.67, got ${pctA}`);
});

console.log('\n── timeAgo ─────────────────────────────────────────────────');

test('< 60s → "just now"', () => {
  const d = new Date(Date.now() - 30_000).toISOString();
  assertEqual(timeAgo(d), 'just now');
});

test('90s → "1m ago"', () => {
  const d = new Date(Date.now() - 90_000).toISOString();
  assertEqual(timeAgo(d), '1m ago');
});

test('2h → "2h ago"', () => {
  const d = new Date(Date.now() - 7_200_000).toISOString();
  assertEqual(timeAgo(d), '2h ago');
});

test('3 days → "3d ago"', () => {
  const d = new Date(Date.now() - 3 * 86_400_000).toISOString();
  assertEqual(timeAgo(d), '3d ago');
});

// ─── Results ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(55)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('  ❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('  ✅ All tests passed.');
}
