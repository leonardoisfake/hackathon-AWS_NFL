/** Insignia de confiabilidad: verde si la coincidencia es casi exacta, ámbar si se relajaron filtros, roja si es muy general. */
export default function ConfidenceBadge({ matchLevel, matchLabel, nSimilar }: { matchLevel: number; matchLabel: string; nSimilar: number }) {
  const tone =
    matchLevel <= 1 ? 'border-green-500 bg-green-500/15 text-green-300'
    : matchLevel <= 3 ? 'border-amber-400 bg-amber-400/15 text-amber-200'
    : 'border-red-500 bg-red-500/15 text-red-300'
  return (
    <span className={`inline-block rounded-sm border px-3 py-1 text-sm font-semibold ${tone}`}>
      Basado en {nSimilar.toLocaleString('es-MX')} jugadas similares · {matchLabel.toLowerCase()}
    </span>
  )
}
