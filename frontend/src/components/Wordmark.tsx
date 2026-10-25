/** The Lotline logo: a small key tag followed by the name. */
export function Wordmark({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${tone === 'light' ? 'text-showroom' : 'text-asphalt'}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7">
        <path d="M10 4h19a1 1 0 0 1 1 1v22a1 1 0 0 1-1 1H10L2 16z" fill="#f4c430" />
        <circle cx="9" cy="16" r="2.2" fill="#1c2127" />
      </svg>
      <span className="display text-xl">Lotline</span>
    </span>
  )
}
