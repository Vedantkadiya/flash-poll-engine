import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner } from './LoadingSpinner'

const CAT_CONFIG = {
  Technology:    { color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  bar: 'linear-gradient(90deg,#6366f1,#818cf8)' },
  Sports:        { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.3)',  bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  Entertainment: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.3)', bar: 'linear-gradient(90deg,#a855f7,#c084fc)' },
  Politics:      { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.3)',  bar: 'linear-gradient(90deg,#f97316,#fb923c)' },
  Science:       { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.3)',  bar: 'linear-gradient(90deg,#06b6d4,#22d3ee)' },
  Food:          { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.3)',  bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  Other:         { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', bar: 'linear-gradient(90deg,#64748b,#94a3b8)' },
}

const OPTION_BARS = [
  'linear-gradient(90deg,#6366f1,#8b5cf6)',
  'linear-gradient(90deg,#06b6d4,#3b82f6)',
  'linear-gradient(90deg,#10b981,#06b6d4)',
  'linear-gradient(90deg,#f59e0b,#ef4444)',
  'linear-gradient(90deg,#ec4899,#8b5cf6)',
  'linear-gradient(90deg,#a855f7,#6366f1)',
  'linear-gradient(90deg,#f97316,#f59e0b)',
  'linear-gradient(90deg,#22d3ee,#10b981)',
]

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    color: ['#8b5cf6','#6366f1','#22d3ee','#34d399','#fbbf24','#f472b6','#a78bfa'][i % 7],
    x: (Math.random() - 0.5) * 140,
    rot: 180 + Math.random() * 360,
    delay: (Math.random() * 0.3).toFixed(2),
    dur: (0.6 + Math.random() * 0.5).toFixed(2),
    size: 5 + Math.random() * 6,
    shape: Math.random() > 0.5,
  }))
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', borderRadius:20 }}>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: '50%', top: '40%',
          width: p.size, height: p.size,
          borderRadius: p.shape ? '50%' : '2px',
          background: p.color,
          '--tx': `${p.x}px`,
          '--rot': `${p.rot}deg`,
          '--dur': `${p.dur}s`,
          '--delay': `${p.delay}s`,
        }} />
      ))}
    </div>
  )
}

export default function PollCard({ poll, onVote, onDelete }) {
  const [options, setOptions]       = useState(poll.options)
  const [total, setTotal]           = useState(poll.total_votes)
  const [votedId, setVotedId]       = useState(poll.voted_option_id ?? null)
  const [votingId, setVotingId]     = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState('')
  const [barsReady, setBarsReady]   = useState(false)
  const [confetti, setConfetti]     = useState(false)
  const rafRef                      = useRef(null)

  const cat = CAT_CONFIG[poll.category] || CAT_CONFIG.Other

  useEffect(() => {
    setOptions(poll.options)
    setTotal(poll.total_votes)
    if (poll.voted_option_id && !votedId) setVotedId(poll.voted_option_id)
  }, [poll.options, poll.total_votes, poll.voted_option_id])

  useEffect(() => {
    if (!votedId) return
    setBarsReady(false)
    rafRef.current = requestAnimationFrame(() =>
      rafRef.current = requestAnimationFrame(() => setBarsReady(true))
    )
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [votedId])

  const handleVote = useCallback(async (optId) => {
    if (votedId || votingId) return
    setVotingId(optId); setError('')
    try {
      const res = await onVote(poll.id, optId)
      setOptions(res.options); setTotal(res.total_votes); setVotedId(optId)
      setConfetti(true); setTimeout(() => setConfetti(false), 1100)
    } catch (e) {
      setError(e.message || 'Vote failed')
    } finally {
      setVotingId(null)
    }
  }, [votedId, votingId, onVote, poll.id])

  const handleDelete = async () => {
    if (!confirm('Delete this poll and all its votes?')) return
    setDeleting(true)
    try { await onDelete(poll.id) } catch { setDeleting(false) }
  }

  const maxVotes = Math.max(...options.map(o => o.vote_count), 0)

  return (
    <article className={`animate-slide-up p-5 flex flex-col gap-4 relative ${votedId ? 'poll-card-voted' : 'poll-card'}`}>
      <Confetti active={confetti} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <span style={{
          background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color,
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
          display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
          {poll.category.toUpperCase()}
        </span>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger-icon">
          {deleting
            ? <Spinner size={13} className="text-red-400" />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
          }
        </button>
      </div>

      {/* Question */}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.45, margin: 0 }}>
        {poll.question}
      </h3>

      {/* Meta */}
      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {total} {total === 1 ? 'vote' : 'votes'}
        </span>
        <span>·</span>
        <span>{timeAgo(poll.created_at)}</span>
        {votedId && <>
          <span>·</span>
          <span style={{ color: '#a78bfa', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M5 12l5 5L20 7"/>
            </svg>
            Voted
          </span>
        </>}
      </div>

      {/* Options */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {options.map((opt, idx) => {
          const isMyVote = votedId === opt.id
          const isWinner = votedId && opt.vote_count === maxVotes && maxVotes > 0
          const pct = Math.round(opt.percentage ?? 0)
          const barW = barsReady ? (opt.percentage ?? 0) : 0
          const gradient = isMyVote ? 'linear-gradient(90deg,#8b5cf6,#a78bfa)' : OPTION_BARS[idx % OPTION_BARS.length]

          if (votedId) {
            return (
              <div key={opt.id} style={{
                borderRadius: 14,
                border: `1px solid ${isMyVote ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.05)'}`,
                background: isMyVote ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                padding: '12px 14px',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
                    {isMyVote && (
                      <span className="animate-pop" style={{
                        width:18, height:18, borderRadius:'50%', flexShrink:0,
                        background:'linear-gradient(135deg,#8b5cf6,#6366f1)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 0 8px rgba(139,92,246,0.5)',
                      }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
                          <path d="M5 12l5 5L20 7"/>
                        </svg>
                      </span>
                    )}
                    <span style={{
                      fontSize:13, fontWeight: isMyVote ? 600 : 500,
                      color: isMyVote ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {opt.option_text}
                    </span>
                    {isWinner && (
                      <span style={{
                        fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9999,
                        background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.25)',
                        color:'#fbbf24', flexShrink:0, letterSpacing:'0.04em',
                      }}>WINNER</span>
                    )}
                  </div>
                  <span style={{
                    fontSize:14, fontWeight:700,
                    color: isMyVote ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    marginLeft:12, flexShrink:0, tabularNums:true,
                  }}>{pct}%</span>
                </div>
                <div className="vote-bar-track">
                  <div className="vote-bar-fill" style={{ width:`${barW}%`, background: gradient }} />
                </div>
                <div style={{ marginTop:5, fontSize:11, color:'rgba(255,255,255,0.25)' }}>
                  {opt.vote_count} {opt.vote_count === 1 ? 'vote' : 'votes'}
                </div>
              </div>
            )
          }

          return (
            <button key={opt.id} onClick={() => handleVote(opt.id)}
              disabled={!!votingId} className="option-btn">
              <span style={{
                width:24, height:24, borderRadius:8, flexShrink:0,
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)',
                transition:'all 0.15s',
              }}>
                {String.fromCharCode(65+idx)}
              </span>
              <span style={{ flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {opt.option_text}
              </span>
              {votingId === opt.id
                ? <Spinner size={14} className="text-violet-400" />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ opacity:0.3, flexShrink:0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
              }
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'9px 12px', fontSize:12, color:'#fca5a5',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          {error}
        </div>
      )}

      {/* Voted footer */}
      {votedId && (
        <div style={{
          textAlign:'center', fontSize:11, color:'rgba(167,139,250,0.6)',
          fontWeight:600, letterSpacing:'0.05em',
          borderTop:'1px solid rgba(139,92,246,0.1)', paddingTop:10, marginTop:-4,
        }}>
          YOUR VOTE IS LOCKED IN
        </div>
      )}
    </article>
  )
}
