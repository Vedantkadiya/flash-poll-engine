'use strict';
/**
 * FlashPoll — Node.js Backend v3
 * Zero external dependencies. Works on Node.js v14+.
 * Persistence: JSON file (flashpoll-data.json) — survives restarts.
 * Vote deduplication: one vote per IP+UserAgent fingerprint per poll (SHA-256).
 * Run:  node server.js
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const PORT      = 8080;
const DATA_FILE = path.join(__dirname, 'flashpoll-data.json');

// ─── Valid categories ─────────────────────────────────────────────────────────
const VALID_CATEGORIES = new Set([
  'Technology', 'Sports', 'Entertainment',
  'Politics', 'Science', 'Food', 'Other',
]);

// ─── Persistent JSON store ────────────────────────────────────────────────────
// Shape: { polls: { [pollId]: Poll }, votes: { [pollId]: { [fingerprint]: optionId } } }
// Poll shape: { id, question, category, created_at, is_active, options: { [optId]: Option } }
// Option shape: { id, poll_id, option_text, vote_count }

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Warning: could not load data file, starting fresh.', e.message);
  }
  return { polls: {}, votes: {} };
}

function saveData() {
  try {
    // Write atomically: write to temp file then rename
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.error('Error saving data:', e.message);
  }
}

const store = loadData();
// Ensure both keys always exist (handles old data files)
if (!store.polls) store.polls = {};
if (!store.votes) store.votes = {};

// ─── Fingerprint ──────────────────────────────────────────────────────────────
function fingerprint(req) {
  const ip = (req.headers['x-forwarded-for']?.split(',')[0]?.trim())
          || req.socket?.remoteAddress
          || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}||${ua}`).digest('hex').slice(0, 32);
}

// ─── Response helpers ─────────────────────────────────────────────────────────
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}
const sendError = (res, s, m) => sendJSON(res, s, { error: m });
const send204   = (res) => { res.writeHead(204); res.end(); };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// ─── Serialise a poll for API responses ──────────────────────────────────────
function serialisePoll(poll, fp) {
  const opts  = Object.values(poll.options);
  const total = opts.reduce((s, o) => s + o.vote_count, 0);

  // voted_option_id: which option this fingerprint voted for (null if not voted)
  const pollVotes     = store.votes[poll.id] || {};
  const votedOptionId = fp ? (pollVotes[fp] || null) : null;

  return {
    id:              poll.id,
    question:        poll.question,
    category:        poll.category,
    created_at:      poll.created_at,
    is_active:       poll.is_active,
    total_votes:     total,
    voted_option_id: votedOptionId,
    options: opts.map(o => ({
      id:          o.id,
      poll_id:     o.poll_id,
      option_text: o.option_text,
      vote_count:  o.vote_count,
      percentage:  total > 0 ? parseFloat(((o.vote_count / total) * 100).toFixed(2)) : 0,
    })),
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleGetPolls(req, res) {
  const fp = fingerprint(req);
  const active = Object.values(store.polls)
    .filter(p => p.is_active)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  sendJSON(res, 200, active.map(p => serialisePoll(p, fp)));
}

async function handleCreatePoll(req, res) {
  let body;
  try { body = await readBody(req); }
  catch { return sendError(res, 400, 'Invalid JSON body'); }

  const question = (body.question || '').trim();
  const category = (body.category || '').trim();
  const rawOpts  = Array.isArray(body.options) ? body.options : [];

  if (!question)                        return sendError(res, 400, 'question is required');
  if (!category)                        return sendError(res, 400, 'category is required');
  if (!VALID_CATEGORIES.has(category))  return sendError(res, 400, `category must be one of: ${[...VALID_CATEGORIES].join(', ')}`);

  const trimmed = rawOpts.map(o => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
  if (trimmed.length < 2) return sendError(res, 400, 'at least 2 non-empty options required');
  if (trimmed.length > 8) return sendError(res, 400, 'maximum 8 options allowed');
  if (new Set(trimmed.map(o => o.toLowerCase())).size !== trimmed.length)
    return sendError(res, 400, 'options must be distinct (case-insensitive)');

  const pollId = crypto.randomUUID();
  const now    = new Date().toISOString();
  const options = {};

  for (const text of trimmed) {
    const optId = crypto.randomUUID();
    options[optId] = { id: optId, poll_id: pollId, option_text: text, vote_count: 0 };
  }

  store.polls[pollId] = { id: pollId, question, category, created_at: now, is_active: true, options };
  store.votes[pollId] = {};
  saveData();

  sendJSON(res, 201, serialisePoll(store.polls[pollId], fingerprint(req)));
}

function handleDeletePoll(req, res, pollId) {
  if (!store.polls[pollId]) return sendError(res, 404, 'Poll not found');
  delete store.polls[pollId];
  delete store.votes[pollId];
  saveData();
  send204(res);
}

async function handleVote(req, res, pollId) {
  const poll = store.polls[pollId];
  if (!poll) return sendError(res, 404, 'Poll not found');

  let body;
  try { body = await readBody(req); }
  catch { return sendError(res, 400, 'Invalid JSON body'); }

  const optionId = (body.option_id || '').trim();
  if (!optionId) return sendError(res, 400, 'option_id is required');
  if (!poll.options[optionId]) return sendError(res, 404, 'Option not found for this poll');

  const fp          = fingerprint(req);
  const pollVotes   = store.votes[pollId] || (store.votes[pollId] = {});

  // Duplicate vote check
  if (pollVotes[fp]) {
    return sendError(res, 409, 'You have already voted on this poll.');
  }

  // Record vote + increment count atomically (JS is single-threaded)
  pollVotes[fp] = optionId;
  poll.options[optionId].vote_count += 1;
  saveData();

  sendJSON(res, 200, serialisePoll(poll, fp));
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
function setCORS(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  req.headers['origin'] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age',       '86400');
}

// ─── Router ───────────────────────────────────────────────────────────────────
async function router(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return send204(res);

  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method   = req.method;

  if (method === 'GET'    && pathname === '/api/polls')            return handleGetPolls(req, res);
  if (method === 'POST'   && pathname === '/api/polls')            return handleCreatePoll(req, res);

  const delMatch  = pathname.match(/^\/api\/polls\/([^/]+)$/);
  if (method === 'DELETE' && delMatch)  return handleDeletePoll(req, res, delMatch[1]);

  const voteMatch = pathname.match(/^\/api\/polls\/([^/]+)\/vote$/);
  if (method === 'PATCH'  && voteMatch) return handleVote(req, res, voteMatch[1]);

  sendError(res, 404, `Route not found: ${method} ${pathname}`);
}

// ─── Start ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try { await router(req, res); }
  catch (err) {
    console.error('Unhandled error:', err);
    sendError(res, 500, 'Internal server error');
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    const pollCount = Object.keys(store.polls).length;
    console.log(`\n  🚀  FlashPoll backend running at http://localhost:${PORT}`);
    console.log(`  💾  Data file: ${DATA_FILE}`);
    console.log(`  📊  Loaded ${pollCount} existing poll${pollCount !== 1 ? 's' : ''} from disk`);
    console.log('  🔒  Vote deduplication: enabled (IP + UA fingerprint)');
    console.log('\n  Press Ctrl+C to stop.\n');
  });
}

module.exports = { store, router };
