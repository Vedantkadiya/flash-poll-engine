import { useState, useEffect, useCallback } from 'react'
import { pollsApi } from './api/polls'
import PollCard from './components/PollCard'
import CreatePollModal from './components/CreatePollModal'
import Toast from './components/Toast'
import { LoadingSkeleton, Spinner } from './components/LoadingSpinner'

let _tid = 0

const ALL = 'All'
const SORTS = [
  { value: 'newest',  label: 'Newest' },
  { value: 'oldest',  label: 'Oldest' },
  { value: 'popular', label: 'Most Votes' },
]

function StatBadge({ label, value, color = '#a78bfa' }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'10px 18px', borderRadius:14,
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</span>
      <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:3, fontWeight:500 }}>{label}</span>
    </div>
  )
}

export default function App() {
  const [polls,      setPolls]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toasts,     setToasts]     = useState([])
  const [filter,     setFilter]     = useState(ALL)
  const [sort,       setSort]       = useState('newest')
  const [search,     setSearch]     = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const toast = useCallback((msg, type = 'success') => {
    const id = ++_tid
    setToasts(t => [...t, { id, msg, type }])
  }, [])

  const fetchPolls = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError('')
    try { setPolls(await pollsApi.getAll()) }
    catch (e) { setError(e.message || 'Could not connect to server.') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchPolls() }, [])

  const handleCreate = useCallback(async (body) => {
    const p = await pollsApi.create(body)
    setPolls(prev => [p, ...prev])
    toast('🎉 Poll created!')
  }, [toast])

  const handleDelete = useCallback(async (id) => {
    await pollsApi.delete(id)
    setPolls(prev => prev.filter(p => p.id !== id))
    toast('Poll deleted.')
  }, [toast])

  const handleVote = useCallback(async (pollId, optionId) => {
    const res = await pollsApi.vote(pollId, optionId)
    setPolls(prev => prev.map(p => p.id === pollId
      ? { ...p, options: res.options, total_votes: res.total_votes, voted_option_id: res.voted_option_id }
      : p
    ))
    return res
  }, [])

  const categories = [ALL, ...new Set(polls.map(p => p.category))]
  const visible = polls
    .filter(p => {
      if (filter !== ALL && p.category !== filter) return false
      if (search && !p.question.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'newest')  return new Date(b.created_at) - new Date(a.created_at)
      if (sort === 'oldest')  return new Date(a.created_at) - new Date(b.created_at)
      if (sort === 'popular') return b.total_votes - a.total_votes
      return 0
    })

  const totalVotes = polls.reduce((s,p) => s + p.total_votes, 0)
  const votedCount = polls.filter(p => p.voted_option_id).length

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>

      {/* ── Header ── */}
      <header style={{
        position:'sticky', top:0, zIndex:30,
        background:'rgba(6,6,16,0.85)',
        backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        boxShadow:'0 1px 20px rgba(0,0,0,0.4)',
      }}>
        {/* Top accent line */}
        <div style={{
          height:2,
          background:'linear-gradient(90deg, transparent 0%, #7c3aed 30%, #818cf8 50%, #22d3ee 70%, transparent 100%)',
        }} />
        <div style={{
          maxWidth:1200, margin:'0 auto', padding:'0 24px',
          height:64, display:'flex', alignItems:'center', gap:16,
        }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{
              width:36, height:36, borderRadius:11,
              background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 16px rgba(124,58,237,0.4), 0 0 0 1px rgba(139,92,246,0.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'#fff', letterSpacing:'-0.02em', lineHeight:1 }}>
                Flash<span style={{ color:'#a78bfa' }}>Poll</span>
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:500, marginTop:1 }}>
                REAL-TIME DECISIONS
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="hidden sm:block" style={{ flex:1, maxWidth:320, position:'relative' }}>
            <SearchBox value={search} onChange={setSearch} />
          </div>

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => fetchPolls(true)} disabled={refreshing} style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:10, width:36, height:36, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'rgba(255,255,255,0.4)', transition:'all 0.15s',
            }}
              title="Refresh"
              onMouseOver={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}
              onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.4)' }}
            >
              {refreshing
                ? <Spinner size={14} className="text-violet-400" />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
              }
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Poll
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex:1, maxWidth:1200, margin:'0 auto', width:'100%', padding:'28px 24px 48px' }}>

        {/* Mobile search */}
        <div className="block sm:hidden" style={{ marginBottom:20 }}>
          <SearchBox value={search} onChange={setSearch} />
        </div>

        {/* Stats bar */}
        {!loading && !error && polls.length > 0 && (
          <div className="animate-fade-in" style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
            <StatBadge value={polls.length} label="Active Polls" color="#a78bfa" />
            <StatBadge value={totalVotes} label="Total Votes" color="#67e8f9" />
            <StatBadge value={votedCount} label="Your Votes" color="#6ee7b7" />
          </div>
        )}

        {/* Controls */}
        {!loading && !error && polls.length > 0 && (
          <div className="animate-fade-in" style={{
            display:'flex', flexWrap:'wrap', alignItems:'center', gap:8, marginBottom:22,
          }}>
            {/* Category pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, flex:1 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  fontSize:11, fontWeight:700, letterSpacing:'0.04em',
                  padding:'5px 13px', borderRadius:9999, cursor:'pointer',
                  border: filter === cat ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: filter === cat ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                  color: filter === cat ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                  transition:'all 0.15s',
                  boxShadow: filter === cat ? '0 0 10px rgba(139,92,246,0.15)' : 'none',
                }}>
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display:'flex', gap:4 }}>
              {SORTS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)} style={{
                  fontSize:11, fontWeight:600, padding:'5px 11px', borderRadius:8, cursor:'pointer',
                  border: sort === s.value ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  background: sort === s.value ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                  color: sort === s.value ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                  transition:'all 0.15s',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton count={6} />}

        {/* Error */}
        {!loading && error && (
          <div className="animate-fade-in" style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', paddingTop:80, paddingBottom:80, gap:20, textAlign:'center',
          }}>
            <div style={{
              width:64, height:64, borderRadius:20,
              background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <circle cx="12" cy="16" r="1" fill="#fca5a5"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.8)', margin:'0 0 6px' }}>
                Connection failed
              </p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', maxWidth:320 }}>{error}</p>
            </div>
            <button onClick={() => fetchPolls()} className="btn-primary">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && visible.length === 0 && (
          <div className="animate-fade-in" style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', paddingTop:80, paddingBottom:80, gap:20, textAlign:'center',
          }}>
            <div style={{
              width:72, height:72, borderRadius:22,
              background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 24px rgba(139,92,246,0.1)',
            }} className="animate-float">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="4"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize:18, fontWeight:700, color:'rgba(255,255,255,0.8)', margin:'0 0 8px' }}>
                {polls.length === 0 ? 'No polls yet' : 'Nothing matches'}
              </p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>
                {polls.length === 0 ? 'Create the first poll and get instant results' : 'Try a different filter or search term'}
              </p>
            </div>
            {polls.length === 0 && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                Create First Poll
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && visible.length > 0 && (
          <>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', marginBottom:16, fontWeight:500 }}>
              {visible.length} {visible.length === 1 ? 'poll' : 'polls'}
              {filter !== ALL ? ` · ${filter}` : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',
              gap:18,
            }}>
              {visible.map((poll, i) => (
                <div key={poll.id} className={`animate-slide-up stagger-${Math.min(i+1,6)}`}>
                  <PollCard poll={poll} onVote={handleVote} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop:'1px solid rgba(255,255,255,0.05)',
        padding:'16px 24px',
        textAlign:'center',
        fontSize:11, color:'rgba(255,255,255,0.2)', fontWeight:500,
      }}>
        FlashPoll · Votes stored server-side · One vote per person per poll · Node.js + React
      </footer>

      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {toasts.map(t => (
        <Toast key={t.id} message={t.msg} type={t.type} onDone={() => setToasts(p => p.filter(x => x.id !== t.id))} />
      ))}
    </div>
  )
}

function SearchBox({ value, onChange }) {
  return (
    <div style={{ position:'relative' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', pointerEvents:'none' }}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="Search polls…"
        className="form-input"
        style={{ paddingLeft:34, height:36, fontSize:13 }}
      />
    </div>
  )
}
