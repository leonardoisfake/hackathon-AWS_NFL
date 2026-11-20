import { formatDelta, formatN, formatPct, formatYds } from '../labels'
import type { RecommendOption } from '../types'
import RushChip from './RushChip'

export default function AvoidCard({ option }: { option: RecommendOption }) {
  return (
    <article className="rounded-md border-2 border-red-600 bg-red-950/30 p-5">
      <p className="font-display text-xl font-extrabold uppercase italic text-red-400">Evitar</p>
      <h3 className="text-2xl">{option.coverage}</h3>
      <RushChip rushType={option.rushType} />
      <p className="mt-2">
        <span className="font-display text-4xl font-extrabold italic text-red-400">{formatPct(option.stopAdj)}</span>
        <span className="ml-2 text-sm text-slate-300">Stop Rate ajustado · {formatN(option.n)} · {formatDelta(option.deltaVsBaseline)}</span>
      </p>
      <p className="text-sm text-slate-300">Presión {formatPct(option.pressureRate)} · Yardas permitidas {formatYds(option.yardsAllowed)}</p>
    </article>
  )
}
