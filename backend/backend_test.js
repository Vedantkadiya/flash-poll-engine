'use strict';
/**
 * FlashPoll Backend Tests
 * Run:  node backend_test.js
 */

const http    = require('http');
const { polls, buildOptionsResponse, router } = require('./server.js');

// ─── Harness ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓  ${name}`); passed++; }
  catch(e) { console.error(`  ✗  ${name}\n     ${e.message}`); failed++; }
}
async function testAsync(name, fn) {
  try { await fn(); console.log(`  ✓  ${name}`); passed++; }
  catch(e) { console.error(`  ✗  ${name}\n     ${e.message}`); failed++; }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function eq(a, b, m)  { if (a !== b) throw new Error(m || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`); }

// ─── HTTP test helper (spins up a one-shot server per test suite) ─────────────
let srv, BASE;

function startServer() {
  return new Promise(resolve => {
    srv = http.createServer(async (req, res) => {
      try { await router(req, res); } catch(e) { res.writeHead(500); res.end(JSON.stringify({error:e.message})); }
    });
    srv.listen(0, '127.0.0.1', () => {
      BASE = `http://127.0.0.1:${srv.address().port}`;
      resolve();
    });
  });
}

function stopServer() {
  return new Promise(resolve => srv.close(resolve));
}

async function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url  = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json',
                 ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const r = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.status || res.statusCode, body: raw ? JSON.parse(raw) : null, headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: raw, headers: res.headers }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function createPoll(question='Q?', category='Technology', options=['A','B']) {
  const r = await req('POST', '/api/polls', { question, category, options });
  if (r.status !== 201) throw new Error(`createPoll failed: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  await startServer();
  polls.clear(); // clean slate

  // ── GET /api/polls ──────────────────────────────────────────────────────
  console.log('\n── GET /api/polls ────────────────────────────────────────');

  await testAsync('empty DB returns []', async () => {
    const r = await req('GET', '/api/polls');
    eq(r.status, 200); assert(Array.isArray(r.body) && r.body.length === 0);
  });

  await testAsync('returns newly created poll', async () => {
    polls.clear();
    await createPoll('Best lang?', 'Technology', ['Go','Rust','Python']);
    const r = await req('GET', '/api/polls');
    eq(r.status, 200); eq(r.body.length, 1);
    eq(r.body[0].options.length, 3);
    eq(r.body[0].total_votes, 0);
  });

  await testAsync('newest-first ordering', async () => {
    polls.clear();
    await createPoll('First',  'Food',   ['A','B']);
    await new Promise(r => setTimeout(r, 5));
    await createPoll('Second', 'Sports', ['A','B']);
    const r = await req('GET', '/api/polls');
    eq(r.body[0].question, 'Second', 'Newest should be first');
  });

  await testAsync('limit pagination returns correct count', async () => {
    polls.clear();
    for (let i = 0; i < 6; i++) await createPoll(`Poll ${i}`, 'Other', ['A','B','C','D']);
    const r = await req('GET', '/api/polls?limit=4');
    eq(r.body.length, 4, `Expected 4, got ${r.body.length}`);
  });

  await testAsync('pagination does NOT truncate options (key regression test)', async () => {
    polls.clear();
    for (let i = 0; i < 5; i++) await createPoll(`Poll ${i}`, 'Other', ['A','B','C','D']);
    const r = await req('GET', '/api/polls?limit=3');
    eq(r.body.length, 3);
    for (const p of r.body) {
      eq(p.options.length, 4, `Poll "${p.question}" has ${p.options.length} options, expected 4`);
    }
  });

  await testAsync('offset works correctly', async () => {
    polls.clear();
    for (let i = 0; i < 5; i++) await createPoll(`Poll ${i}`, 'Sports', ['A','B']);
    const r1 = await req('GET', '/api/polls?limit=2&offset=0');
    const r2 = await req('GET', '/api/polls?limit=2&offset=2');
    eq(r1.body.length, 2); eq(r2.body.length, 2);
    assert(r1.body[0].id !== r2.body[0].id, 'offset should return different polls');
  });

  // ── POST /api/polls ─────────────────────────────────────────────────────
  console.log('\n── POST /api/polls ───────────────────────────────────────');

  await testAsync('creates poll and returns 201', async () => {
    polls.clear();
    const r = await req('POST', '/api/polls', {
      question: 'Best framework?', category: 'Technology', options: ['React','Vue','Svelte']
    });
    eq(r.status, 201);
    assert(r.body.id, 'missing id');
    eq(r.body.question, 'Best framework?');
    eq(r.body.options.length, 3);
    eq(r.body.is_active, true);
    eq(r.body.total_votes, 0);
  });

  await testAsync('all 7 valid categories accepted', async () => {
    for (const cat of ['Technology','Sports','Entertainment','Politics','Science','Food','Other']) {
      const r = await req('POST', '/api/polls', { question: 'Q?', category: cat, options: ['A','B'] });
      eq(r.status, 201, `Category ${cat} rejected`);
    }
  });

  await testAsync('missing question → 400', async () => {
    const r = await req('POST', '/api/polls', { category: 'Food', options: ['A','B'] });
    eq(r.status, 400);
  });

  await testAsync('missing category → 400', async () => {
    const r = await req('POST', '/api/polls', { question: 'Q?', options: ['A','B'] });
    eq(r.status, 400);
  });

  await testAsync('invalid category → 400', async () => {
    const r = await req('POST', '/api/polls', { question:'Q?', category:'Wizardry', options:['A','B'] });
    eq(r.status, 400);
  });

  await testAsync('only 1 option → 400', async () => {
    const r = await req('POST', '/api/polls', { question:'Q?', category:'Food', options:['Only'] });
    eq(r.status, 400);
  });

  await testAsync('9 options → 400', async () => {
    const r = await req('POST', '/api/polls', { question:'Q?', category:'Other',
      options:['A','B','C','D','E','F','G','H','I'] });
    eq(r.status, 400);
  });

  await testAsync('duplicate options (case-insensitive) → 400', async () => {
    const r = await req('POST', '/api/polls', { question:'Q?', category:'Science', options:['same','Same'] });
    eq(r.status, 400);
  });

  await testAsync('blank option text filtered → 400 when < 2 valid remain', async () => {
    const r = await req('POST', '/api/polls', { question:'Q?', category:'Food', options:['Valid','  '] });
    eq(r.status, 400);
  });

  await testAsync('invalid JSON body → 400', async () => {
    const r = await new Promise((resolve, reject) => {
      const data = '{not valid';
      const url = new URL(BASE + '/api/polls');
      const opts = { hostname: url.hostname, port: url.port, path: '/api/polls', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
      const request = http.request(opts, res => {
        let raw = ''; res.on('data', c => raw += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      });
      request.on('error', reject); request.write(data); request.end();
    });
    eq(r.status, 400);
  });

  // ── DELETE /api/polls/:id ────────────────────────────────────────────────
  console.log('\n── DELETE /api/polls/:id ─────────────────────────────────');

  await testAsync('delete returns 204 with no body', async () => {
    polls.clear();
    const poll = await createPoll('To delete', 'Other', ['Yes','No']);
    const r = await req('DELETE', `/api/polls/${poll.id}`);
    eq(r.status, 204); assert(!r.body, '204 should have no body');
  });

  await testAsync('deleted poll disappears from GET', async () => {
    polls.clear();
    const poll = await createPoll('Gone?', 'Science', ['A','B']);
    await req('DELETE', `/api/polls/${poll.id}`);
    const r = await req('GET', '/api/polls');
    assert(!r.body.find(p => p.id === poll.id), 'Poll still present after delete');
  });

  await testAsync('delete nonexistent → 404', async () => {
    const r = await req('DELETE', '/api/polls/does-not-exist');
    eq(r.status, 404);
  });

  await testAsync('cascade: options removed with poll (in-memory check)', async () => {
    polls.clear();
    const poll = await createPoll('Cascade?', 'Technology', ['A','B']);
    assert(polls.has(poll.id), 'Poll should be in store');
    await req('DELETE', `/api/polls/${poll.id}`);
    assert(!polls.has(poll.id), 'Poll + options should be gone from store');
  });

  // ── PATCH /api/polls/:id/vote ────────────────────────────────────────────
  console.log('\n── PATCH /api/polls/:id/vote ─────────────────────────────');

  await testAsync('vote returns 200 with updated counts', async () => {
    polls.clear();
    const poll = await createPoll('Vote test', 'Sports', ['Team A','Team B']);
    const r = await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[0].id });
    eq(r.status, 200);
    eq(r.body.total_votes, 1);
    eq(r.body.options.length, 2);
  });

  await testAsync('vote increments atomically (5 votes)', async () => {
    polls.clear();
    const poll = await createPoll('Atomic?', 'Science', ['X','Y']);
    for (let i = 0; i < 5; i++) {
      await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[0].id });
    }
    const r = await req('GET', '/api/polls');
    eq(r.body[0].total_votes, 5);
    eq(r.body[0].options[0].vote_count, 5);
  });

  await testAsync('percentage correct after votes (66.67 / 33.33)', async () => {
    polls.clear();
    const poll = await createPoll('Pct?', 'Food', ['Pizza','Sushi']);
    await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[0].id });
    await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[0].id });
    const r = await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[1].id });
    const pizza = r.body.options.find(o => o.option_text === 'Pizza');
    const sushi = r.body.options.find(o => o.option_text === 'Sushi');
    assert(pizza.percentage > 66 && pizza.percentage < 67, `Pizza: ${pizza.percentage}`);
    assert(sushi.percentage > 33 && sushi.percentage < 34, `Sushi: ${sushi.percentage}`);
    eq(r.body.total_votes, 3);
  });

  await testAsync('vote single option → 100%', async () => {
    polls.clear();
    const poll = await createPoll('Solo?', 'Other', ['A','B']);
    const r = await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[0].id });
    const optA = r.body.options.find(o => o.option_text === 'A');
    const optB = r.body.options.find(o => o.option_text === 'B');
    eq(optA.percentage, 100); eq(optB.percentage, 0);
  });

  await testAsync('vote with wrong poll id → 404', async () => {
    polls.clear();
    const poll = await createPoll('Q?', 'Other', ['A','B']);
    const r = await req('PATCH', `/api/polls/wrong-poll-id/vote`, { option_id: poll.options[0].id });
    eq(r.status, 404);
  });

  await testAsync('vote with nonexistent option → 404', async () => {
    polls.clear();
    const poll = await createPoll('Q?', 'Other', ['A','B']);
    const r = await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: '00000000-fake' });
    eq(r.status, 404);
  });

  await testAsync('vote missing option_id → 400', async () => {
    polls.clear();
    const poll = await createPoll('Q?', 'Technology', ['A','B']);
    const r = await req('PATCH', `/api/polls/${poll.id}/vote`, {});
    eq(r.status, 400);
  });

  // ── CORS ─────────────────────────────────────────────────────────────────
  console.log('\n── CORS ──────────────────────────────────────────────────');

  await testAsync('OPTIONS preflight returns 204', async () => {
    const r = await new Promise((resolve, reject) => {
      const url = new URL(BASE + '/api/polls');
      const opts = { hostname: url.hostname, port: url.port, path: '/api/polls',
        method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } };
      const request = http.request(opts, res => {
        let raw = ''; res.on('data', c => raw += c);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw }));
      });
      request.on('error', reject); request.end();
    });
    eq(r.status, 204);
    assert(r.headers['access-control-allow-origin'], 'Missing CORS origin header');
  });

  await testAsync('CORS headers present on GET response', async () => {
    const r = await new Promise((resolve, reject) => {
      const url = new URL(BASE + '/api/polls');
      const opts = { hostname: url.hostname, port: url.port, path: '/api/polls',
        method: 'GET', headers: { Origin: 'http://localhost:5173' } };
      const request = http.request(opts, res => {
        let raw = ''; res.on('data', c => raw += c);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
      });
      request.on('error', reject); request.end();
    });
    assert(r.headers['access-control-allow-methods'], 'Missing Allow-Methods header');
  });

  // ── Full workflow ─────────────────────────────────────────────────────────
  console.log('\n── Full E2E Workflow ─────────────────────────────────────');

  await testAsync('create → vote → verify → delete → gone', async () => {
    polls.clear();
    // Create
    const poll = await createPoll('Favourite OS?', 'Technology', ['Linux','macOS','Windows']);
    eq(poll.options.length, 3);

    // Vote: Linux ×2, macOS ×1
    for (let i = 0; i < 2; i++)
      await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[0].id });
    await req('PATCH', `/api/polls/${poll.id}/vote`, { option_id: poll.options[1].id });

    // Verify
    const g = await req('GET', '/api/polls');
    eq(g.body[0].total_votes, 3);
    const linux = g.body[0].options.find(o => o.option_text === 'Linux');
    assert(linux.vote_count === 2, `Linux: ${linux.vote_count}`);

    // Delete
    const d = await req('DELETE', `/api/polls/${poll.id}`);
    eq(d.status, 204);

    // Gone
    const g2 = await req('GET', '/api/polls');
    assert(!g2.body.find(p => p.id === poll.id), 'Poll still visible after delete');
  });

  // ─── Results ───────────────────────────────────────────────────────────────
  await stopServer();
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) { console.error('  ❌ Some tests failed.'); process.exit(1); }
  else console.log('  ✅ All tests passed.');
}

main().catch(err => { console.error(err); process.exit(1); });
