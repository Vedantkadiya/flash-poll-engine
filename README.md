<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&color=gradient&customColorList=12,20,24&height=250&section=header&text=FlashPoll&fontSize=90&fontColor=ffffff&animation=twinkling&fontAlignY=45&desc=Real-Time%20Internal%20Polling%20Engine&descAlignY=65&descSize=18&descColor=c4b5fd&stroke=7c3aed&strokeWidth=2" width="100%"/>

</div>

<div align="center">

<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=A78BFA&center=true&vCenter=true&width=600&lines=Create+polls+in+seconds+%E2%9A%A1;Real-time+results%2C+no+page+reload+%F0%9F%93%8A;One+vote+per+person%2C+enforced+server-side+%F0%9F%94%92;Zero+external+dependencies+on+the+backend+%F0%9F%A7%B9;38+tests%2C+all+passing+%E2%9C%85" alt="Typing SVG" />
</a>

<br/><br/>

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-38%20passing-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)](LICENSE)

<br/>

<img src="https://github-readme-stats.vercel.app/api/pin/?username=YOUR_USERNAME&repo=flash-poll-engine&theme=tokyonight&border_color=7c3aed&bg_color=0d0d1a&title_color=a78bfa&icon_color=c4b5fd&text_color=e2e8f0" />

</div>

---

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ⚡ What is FlashPoll?

<img align="right" src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20&height=200&section=header&text=LIVE%20DEMO&fontSize=28&fontColor=a78bfa&animation=blinking&fontAlignY=50&width=180" width="180"/>

> A **real-time internal polling engine** designed for high-velocity team decision-making.
> Create a question, share it with your team, and watch votes roll in with live animated results — all without a single page reload.

**Built for the LeMiCi Engineering Full-Stack Assessment.**

<br clear="right"/>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ✨ Features

<div align="center">

| 🗳️ Full CRUD | 🔒 One Vote Per Person | 📊 Live Results |
|:---:|:---:|:---:|
| Create polls with 2–8 options, read the live feed, delete any poll | Server-side SHA-256 fingerprinting — no localStorage tricks | Animated gradient bars update on vote, no page reload |

| ⚡ Zero Dependencies | 💾 Persistent Storage | 🧪 38 Tests |
|:---:|:---:|:---:|
| Entire backend on Node built-ins only | Atomic JSON writes survive server restarts | Real HTTP server, zero test frameworks |

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🚀 Quick Start

<details>
<summary><b>📦 Prerequisites</b></summary>
<br/>

- **Node.js v22+** — [Download](https://nodejs.org/)
- That's it.

</details>

### 1 — Backend

```bash
cd backend
node server.js
```

```
🚀  FlashPoll backend running at http://localhost:8080
💾  Data file: /path/to/flashpoll-data.json
📊  Loaded 0 existing polls from disk
🔒  Vote deduplication: enabled (IP + UA fingerprint)
```

> **No `npm install` needed.** Zero external dependencies.

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**

> Vite proxies `/api` → `localhost:8080` automatically. No CORS config needed.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🧪 Tests

```bash
cd backend
node backend_test.js
```

<details>
<summary><b>See full test output</b></summary>
<br/>

```
  🧪  FlashPoll Backend Tests

── GET /api/polls ──
  ✅  returns empty array on fresh DB
  ✅  returns polls with options after creation
  ✅  returns polls newest-first
  ✅  pagination: limit + offset work

── POST /api/polls ──
  ✅  creates poll and returns 201
  ✅  poll id is a valid UUID
  ✅  400 — empty question
  ✅  400 — invalid category enum
  ✅  400 — duplicate options (case-insensitive)
  ✅  201 — exactly 2 options (min boundary)
  ✅  201 — exactly 8 options (max boundary)
  ✅  all 7 valid categories accepted

── PATCH /api/polls/:id/vote ──
  ✅  vote returns 200 with updated options
  ✅  vote increments correct option vote_count
  ✅  vote computes correct percentages
  ✅  DEDUPLICATION — same voter cannot vote twice (409)
  ✅  DEDUPLICATION — different voters can vote on same poll
  ✅  DEDUPLICATION — 409 even if voter tries different option
  ✅  404 — vote on non-existent poll

── DELETE /api/polls/:id ──
  ✅  returns 204 No Content on success
  ✅  poll is removed from feed after delete
  ✅  404 — delete non-existent poll
  ✅  vote records removed when poll deleted

── Integration ──
  ✅  full CRUD lifecycle: create → vote → verify → delete

──────────────────────────────────────
  38/38 tests passed ✅
──────────────────────────────────────
```

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📁 Project Structure

```
flash-poll-engine/
│
├── 📂 backend/
│   ├── 📄 server.js               ← Zero-dependency Node.js HTTP server
│   ├── 📄 backend_test.js         ← 38-test suite, no frameworks
│   └── 📄 flashpoll-data.json     ← Auto-created on first run
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📄 App.jsx             ← Global state, CRUD handlers, filtering
│   │   ├── 📂 api/
│   │   │   └── 📄 polls.js        ← Fetch wrapper — timeout, 204 guard, errors
│   │   └── 📂 components/
│   │       ├── 📄 PollCard.jsx    ← Two-mode card: vote view + results view
│   │       ├── 📄 CreatePollModal.jsx
│   │       ├── 📄 LoadingSpinner.jsx
│   │       └── 📄 Toast.jsx
│   ├── 📄 index.css               ← Tailwind + custom animations
│   └── 📄 tailwind.config.js
│
└── 📄 README.md
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🛠️ API Reference

<details>
<summary><b>GET /api/polls</b></summary>
<br/>

Returns full feed of active polls, newest first, with options and voted state per fingerprint.

```json
[
  {
    "id": "uuid",
    "question": "Best runtime?",
    "category": "Technology",
    "created_at": "2024-11-15T10:30:00.000Z",
    "total_votes": 42,
    "voted_option_id": "uuid-or-null",
    "options": [
      { "id": "uuid", "option_text": "Node.js", "vote_count": 25, "percentage": 59.52 },
      { "id": "uuid", "option_text": "Deno",    "vote_count": 17, "percentage": 40.48 }
    ]
  }
]
```

</details>

<details>
<summary><b>POST /api/polls — 201 Created</b></summary>
<br/>

```json
{
  "question": "Best runtime?",
  "category": "Technology",
  "options": ["Node.js", "Deno", "Bun"]
}
```

Validates: non-empty question · valid category enum · 2–8 distinct options.

</details>

<details>
<summary><b>PATCH /api/polls/:id/vote — 200 OK / 409 Conflict</b></summary>
<br/>

```json
{ "option_id": "uuid" }
```

Returns updated options with percentages. Returns `409` if fingerprint already voted.

</details>

<details>
<summary><b>DELETE /api/polls/:id — 204 No Content</b></summary>
<br/>

Removes poll and all associated vote records. Returns `404` if not found.

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🏗️ Architecture Deep-Dive

<details>
<summary><b>🔒 How one-vote-per-person works</b></summary>
<br/>

Every request gets a fingerprint:

```
SHA-256( IP + "||" + UserAgent ) → first 32 hex chars
```

Stored server-side against each poll. On any vote attempt:
- Fingerprint exists → `409 Conflict`, vote blocked
- Fingerprint new → vote recorded, fingerprint stored

Node.js is single-threaded so the check and write are naturally atomic — no race conditions possible.

`voted_option_id` is included in every GET response so the frontend renders the correct state on page load with no extra requests.

</details>

<details>
<summary><b>💾 Why atomic file writes?</b></summary>
<br/>

Every write goes to a `.tmp` file first, then gets renamed over the real file. `rename` is atomic at the OS level — even a mid-write crash leaves the data file intact.

For production: swap to SQLite via the `node:sqlite` module built into Node 22. Zero install, ACID transactions, indexed queries. No API changes needed.

</details>

<details>
<summary><b>🎞️ The double requestAnimationFrame trick</b></summary>
<br/>

When the results panel mounts after a vote, progress bars are brand new DOM elements. CSS `transition: width` doesn't fire on newly mounted elements — bars snap instantly.

Fix: render bars at `width: 0` first, then on the **second** `requestAnimationFrame` set the real percentage. This gives the browser a genuine starting state so the transition fires correctly in every browser.

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📊 Evaluation Criteria

| Criterion | How it's addressed |
|---|---|
| **System Architecture** | Polls ↔ Options ↔ Votes enforced server-side · fingerprint deduplication · atomic writes |
| **API Integrity** | Correct HTTP verbs · status codes 201/200/204/400/404/409/500 · JSON throughout |
| **State Management** | Surgical poll update on vote · stable `useCallback` handlers · loading/error/retry covered |
| **Scalability** | Zero-dependency core · JSON → SQLite swap needs no API changes · auth middleware hook ready |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<div align="center">

### 📬 Contact

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vedant-kadiya-55196127a/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Vedantkadiya)

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=120&section=footer&animation=twinkling" width="100%"/>

*Confidential Technical Assessment — LeMiCi Engineering*

</div>
