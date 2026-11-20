/** Balón de fútbol americano dibujado como SVG propio (no es un logo de la liga). */
export default function BallIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 20C6 10 18 4 32 4s26 6 26 16-12 16-26 16S6 30 6 20z" transform="rotate(-18 32 20)" />
      <path d="M24 20h16M28 15v10M32 15v10M36 15v10" transform="rotate(-18 32 20)" />
    </svg>
  )
}
