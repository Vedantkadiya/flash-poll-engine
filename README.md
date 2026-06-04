# FlashPoll v3

Real-time internal polling engine. React frontend + Node.js backend.

**Works on Node.js v14 and above. Zero external dependencies.**

---

## What's New in v3

- **Zero dependencies** — no `npm install` needed for the backend
- **Works on any Node.js v14+** — no experimental flags, no native addons
- **Persistent storage** — data saved to `backend/flashpoll-data.json`, survives restarts
- **One vote per person per poll** — enforced server-side using IP + User-Agent fingerprint. Refreshing the page cannot bypass this
- **Voted state restored on load** — polls you've already voted on show results immediately when the app opens
- **Enhanced UI** — confetti burst on vote, animated bars, staggered card animations

---

## Requirements

- **Node.js v14+** → https://nodejs.org/ (click the LTS download)

Check your version: `node --version`

---

## How to Run

### Step 1 — Start the Backend

```
cd flash_poll_v3\backend
node server.js
```

Expected output:
```
🚀  FlashPoll backend running at http://localhost:8080
💾  Data file: ...\backend\flashpoll-data.json
📊  Loaded 0 existing polls from disk
🔒  Vote deduplication: enabled (IP + UA fingerprint)
```

### Step 2 — Start the Frontend

Open a **second** terminal (keep the first running):

```
cd flash_poll_v3\frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## How Vote Deduplication Works

Each vote request is fingerprinted using `SHA-256(IP address + User-Agent string)`.
The fingerprint is stored server-side alongside the vote.

- Same browser on the same network → same fingerprint → **blocked** (HTTP 409)
- Refreshing the page → **still blocked**
- Clearing browser storage/cookies → **still blocked** (nothing is stored client-side)
- Different browser or different network → different fingerprint → allowed

The `GET /api/polls` response includes `voted_option_id` per poll so the frontend can
show results for polls you've already voted on without needing any local storage.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/polls` | All active polls + your voted state |
| `POST` | `/api/polls` | Create a new poll |
| `PATCH` | `/api/polls/:id/vote` | Cast a vote (deduplicated) |
| `DELETE` | `/api/polls/:id` | Delete poll + all votes |

Vote body: `{ "option_id": "uuid" }`

Duplicate vote response: `HTTP 409 { "error": "You have already voted on this poll." }`

---

## Data Persistence

All data is saved in `backend/flashpoll-data.json` after every write operation.
Writes are atomic (temp file + rename) to prevent corruption on crash.

To reset all data: delete `backend/flashpoll-data.json` and restart the backend.
