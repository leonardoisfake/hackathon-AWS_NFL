import { GLOSSARY, formatDelta, formatN, formatPct, formatYds } from '../labels'
import type { RecommendOption } from '../types'
import InfoTip from './InfoTip'
import RushChip from './RushChip'

export default function RecommendationCard({ option, rank }: { option: RecommendOption; rank: number }) {
  const best = rank === 1
  const up = option.deltaVsBaseline >= 0
  // Una muestra pequeña NO atenúa la tarjeta (se leería mal): se marca con borde y etiqueta ámbar.
  const border = option.lowSample ? 'border-2 border-dashed border-amber-400' : best ? 'border-2 border-green-500' : 'border-line'
  return (
    <article className={`rounded-md border bg-panel p-5 ${border}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`font-display font-extrabold italic ${best ? 'text-5xl text-green-500' : 'text-4xl text-slate-400'}`}>#{rank}</span>
        <div>
          <h3 className={best ? 'text-3xl' : 'text-2xl'}>
            {option.coverage}
            {GLOSSARY[option.coverage] && <InfoTip term={option.coverage} />}
          </h3>
          <RushChip rushType={option.rushType} />
        </div>
      </div>
      <p className={`mt-3 font-display font-extrabold italic leading-none text-green-500 ${best ? 'text-7xl' : 'text-6xl'}`}>{formatPct(option.stopAdj)}</p>
      <p className="text-sm text-slate-400">
        Stop Rate ajustado<InfoTip term="Stop Rate ajustado" /> · {formatN(option.n)}
        {option.lowSample && <span className="ml-2 rounded-sm bg-amber-400 px-2 py-0.5 text-xs font-bold uppercase text-navy">Muestra pequeña</span>}
      </p>
      <p className={`mt-1 text-lg font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>{formatDelta(option.deltaVsBaseline)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-3 text-sm">
        <dt className="text-slate-400">Presión al QB</dt><dd className="text-right font-semibold">{formatPct(option.pressureRate)}</dd>
        <dt className="text-slate-400">Turnover + sack</dt><dd className="text-right font-semibold">{formatPct(option.turnoverSackRate)}</dd>
        <dt className="text-slate-400">Yardas permitidas</dt><dd className="text-right font-semibold">{formatYds(option.yardsAllowed)}</dd>
        <dt className="text-slate-400">% completos</dt><dd className="text-right font-semibold">{formatPct(option.complPct)}</dd>
      </dl>
    </article>
  )
}
