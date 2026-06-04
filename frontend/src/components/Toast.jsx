import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onDone }) {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exit'), 2800)
    const t2 = setTimeout(onDone, 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  const isSuccess = type === 'success'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        zIndex: 9999,
        transform: phase === 'exit'
          ? 'translateX(-50%) translateY(12px)'
          : 'translateX(-50%) translateY(0)',
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px',
        borderRadius: 14,
        fontSize: 13, fontWeight: 600,
        background: isSuccess
          ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.15))',
        border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.3)' : 'rgba(252,165,165,0.3)'}`,
        color: isSuccess ? '#6ee7b7' : '#fca5a5',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${isSuccess ? 'rgba(52,211,153,0.1)' : 'rgba(252,165,165,0.1)'}`,
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isSuccess ? 'rgba(52,211,153,0.2)' : 'rgba(252,165,165,0.2)',
          fontSize: 11, flexShrink: 0,
        }}>
          {isSuccess ? '✓' : '✕'}
        </span>
        {message}
      </div>
    </div>
  )
}
