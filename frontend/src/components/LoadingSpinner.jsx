export function Spinner({ size = 18, className = '' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className}`}
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="31.4" strokeDashoffset="10" opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="poll-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center justify-between">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-6 w-6 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          <div className="skeleton h-3 w-20 rounded-full" />
          <div className="space-y-2.5">
            {[100, 80, 65].map((w, j) => (
              <div key={j} className="skeleton rounded-xl" style={{ height: 46, width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
