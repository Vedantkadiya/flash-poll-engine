import { useState, useRef, useEffect } from 'react'
import { Spinner } from './LoadingSpinner'

const CATEGORIES = ['Technology','Sports','Entertainment','Politics','Science','Food','Other']
const CAT_ICONS = {
  Technology:'💻', Sports:'⚽', Entertainment:'🎬',
  Politics:'🗳️', Science:'🔬', Food:'🍕', Other:'✨'
}

export default function CreatePollModal({ onClose, onCreate }) {
  const [question,   setQuestion]   = useState('')
  const [category,   setCategory]   = useState('')
  const [options,    setOptions]    = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const firstRef = useRef(null)

  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const setOpt = (i, v) => setOptions(p => p.map((o, j) => j === i ? v : o))
  const addOpt = () => { if (options.length < 8) setOptions(p => [...p, '']) }
  const rmOpt  = (i) => { if (options.length > 2) setOptions(p => p.filter((_,j) => j !== i)) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    const q = question.trim()
    const opts = options.map(o => o.trim()).filter(Boolean)
    if (!q)           return setError('Question is required.')
    if (!category)    return setError('Please select a category.')
    if (opts.length < 2) return setError('At least 2 options required.')
    if (new Set(opts.map(o => o.toLowerCase())).size !== opts.length)
                      return setError('Options must be distinct.')
    setSubmitting(true)
    try { await onCreate({ question: q, category, options: opts }); onClose() }
    catch (err) { setError(err.message || 'Failed to create poll.') }
    finally { setSubmitting(false) }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:50,
        background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, animation:'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        width:'100%', maxWidth:480,
        background:'linear-gradient(145deg, #16162f 0%, #111128 100%)',
        border:'1px solid rgba(139,92,246,0.2)',
        borderRadius:24,
        boxShadow:'0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1), 0 0 40px rgba(139,92,246,0.08)',
        overflow:'hidden',
        animation:'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Glow top */}
        <div style={{
          position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
          width:200, height:1,
          background:'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)',
        }} />

        {/* Header */}
        <div style={{
          padding:'22px 24px 18px',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'rgba(255,255,255,0.95)' }}>
              Create Poll
            </h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.35)' }}>
              Ask your team anything
            </p>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:10, width:32, height:32, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'rgba(255,255,255,0.5)', transition:'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.9)' }}
            onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.5)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding:'20px 24px', maxHeight:'60vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:18 }}>

            {/* Question */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', marginBottom:7 }}>
                QUESTION
              </label>
              <textarea
                ref={firstRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What do you want to ask your team?"
                rows={2} maxLength={280}
                className="form-input"
                style={{ resize:'none', lineHeight:1.5 }}
              />
              <div style={{ textAlign:'right', fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4 }}>
                {question.length}/280
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', marginBottom:7 }}>
                CATEGORY
              </label>
              {category ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)} style={{
                      padding:'7px 13px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer',
                      border: c === category ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      background: c === category ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                      color: c === category ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                      transition:'all 0.15s',
                    }}>
                      {CAT_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)} style={{
                      padding:'7px 13px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer',
                      border:'1px solid rgba(255,255,255,0.07)',
                      background:'rgba(255,255,255,0.03)',
                      color:'rgba(255,255,255,0.45)',
                      transition:'all 0.15s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='rgba(139,92,246,0.3)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.45)' }}
                    >
                      {CAT_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em' }}>
                  OPTIONS <span style={{ color:'rgba(255,255,255,0.25)', fontWeight:400 }}>({options.length}/8)</span>
                </label>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{
                      width:24, height:24, borderRadius:7, flexShrink:0,
                      background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:11, fontWeight:700, color:'#a78bfa',
                    }}>
                      {String.fromCharCode(65+i)}
                    </span>
                    <input
                      type="text" value={opt}
                      onChange={e => setOpt(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65+i)}`}
                      maxLength={120}
                      className="form-input"
                      style={{ flex:1 }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOpt())}
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => rmOpt(i)} style={{
                        background:'transparent', border:'none', cursor:'pointer',
                        color:'rgba(255,255,255,0.2)', padding:6, borderRadius:8,
                        transition:'all 0.15s', flexShrink:0,
                      }}
                        onMouseOver={e => { e.currentTarget.style.color='#fca5a5'; e.currentTarget.style.background='rgba(239,68,68,0.1)' }}
                        onMouseOut={e => { e.currentTarget.style.color='rgba(255,255,255,0.2)'; e.currentTarget.style.background='transparent' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 8 && (
                  <button type="button" onClick={addOpt} style={{
                    display:'flex', alignItems:'center', gap:6,
                    color:'rgba(139,92,246,0.7)', background:'none', border:'none',
                    cursor:'pointer', fontSize:12, fontWeight:600, padding:'4px 0',
                    transition:'color 0.15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.color='#a78bfa'}
                    onMouseOut={e => e.currentTarget.style.color='rgba(139,92,246,0.7)'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add option
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:10, padding:'10px 13px', fontSize:12, color:'#fca5a5',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'16px 24px',
            borderTop:'1px solid rgba(255,255,255,0.06)',
            display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10,
            background:'rgba(0,0,0,0.2)',
          }}>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ minWidth:130, justifyContent:'center' }}>
              {submitting
                ? <><Spinner size={14} /> Creating…</>
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg> Create Poll</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
