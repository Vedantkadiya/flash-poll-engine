// All requests go through the Vite dev-server proxy (/api → localhost:8080).
// In production, set VITE_API_URL to point at your deployed backend.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000) // 10 s timeout

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })

    // 204 No Content — DELETE success, no body to parse
    if (res.status === 204) return null

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error || `Server error ${res.status}`)
    }

    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check the server is running.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export const pollsApi = {
  /** GET /api/polls — fetch full feed of active polls */
  getAll: () => request('/polls'),

  /** POST /api/polls — validate and persist a new poll entity */
  create: (body) =>
    request('/polls', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * DELETE /api/polls/:id — remove poll record and associated options.
   * Backend returns 204 No Content on success.
   */
  delete: (id) => request(`/polls/${id}`, { method: 'DELETE' }),

  /**
   * PATCH /api/polls/:id/vote — atomically increment vote_count for one option.
   * Returns { options: Option[], total_votes: number }
   */
  vote: (pollId, optionId) =>
    request(`/polls/${pollId}/vote`, {
      method: 'PATCH',
      body: JSON.stringify({ option_id: optionId }),
    }),
}
