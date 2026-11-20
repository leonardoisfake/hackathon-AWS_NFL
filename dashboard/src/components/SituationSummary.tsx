import { SCORE_LABEL, ZONE_LABEL } from '../labels'
import type { RecommendResponse } from '../types'

const DIST_WORD = { corta: 'corto', media: 'media distancia', larga: 'largo' } as const

export function summaryText(s: RecommendResponse['situation']): string {
  const parts = [
    `${s.downBucket}.º y ${DIST_WORD[s.distBucket]}`,
    ZONE_LABEL[s.fieldZone].replace(/ \(.*\)/, ''),
    SCORE_LABEL[s.scoreBucket],
  ]
  if (s.twoMinute) parts.push('Últimos 2 minutos')
  return parts.join(' · ')
}

export default function SituationSummary({ situation }: { situation: RecommendResponse['situation'] }) {
  return <p className="font-display text-2xl font-bold uppercase italic tracking-wide text-ink">{summaryText(situation)}</p>
}
