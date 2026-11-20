import { useState } from 'react'
import { getFilters, getHeatmap } from '../api'
import { useApi } from '../useApi'
import { METRIC_LABEL, ZONE_SHORT, formatN, formatPct, formatYds } from '../labels'
import type { DownBucket, FieldZone, HeatmapMetric } from '../types'
import ChartCard from './ChartCard'

const DOWNS: DownBucket[] = ['1', '2', '3', '4']
const ZONES: FieldZone[] = ['propio_fondo', 'propio', 'rival', 'red_zone', 'goal_line']

function lerp(a: number[], b: number[], t: number): string {
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',')})`
}
const BASE = [30, 45, 74]      // #1e2d4a (celda neutra sobre fondo oscuro)
const GOOD = [34, 197, 94]     // #22c55e
const BAD = [239, 68, 68]      // rojo: más yardas permitidas

const fmt = (m: HeatmapMetric, v: number) => (m === 'yardsAllowed' ? formatYds(v) : formatPct(v))

export default function Heatmap({ team }: { team: string }) {
  const [metric, setMetric] = useState<HeatmapMetric>('stopAdj')
  const [coverage, setCoverage] = useState('')
  const opts = useApi(getFilters, [])
  const { data, loading, error, reload } = useApi(() => getHeatmap({ metric, coverage, team }), [metric, coverage, team])
  const cells = data?.cells ?? []
  const vals = cells.map((c) => c.value).filter((v): v is number => v != null)
  const min = Math.min(...vals), max = Math.max(...vals)
  const color = (v: number): string => {
    const t = max > min ? (v - min) / (max - min) : 0.5
    return lerp(BASE, metric === 'yardsAllowed' ? BAD : GOOD, t)
  }
  const textDark = (v: number) => (max > min ? (v - min) / (max - min) : 0.5) > 0.6

  return (
    <ChartCard
      title="Mapa de calor: down × zona del campo" term="Stop Rate"
      loading={loading} error={error} empty={cells.length === 0} onRetry={reload}
      footer="Celdas en gris: menos de 10 jugadas (n<10)."
    >
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex flex-col text-xs font-bold uppercase tracking-widest text-slate-400">
          Métrica
          <select value={metric} onChange={(e) => setMetric(e.target.value as HeatmapMetric)} className="mt-1 min-w-[13rem] rounded-md border border-line bg-navy px-3 py-2 text-base font-normal text-ink">
            {(Object.keys(METRIC_LABEL) as HeatmapMetric[]).map((m) => <option key={m} value={m}>{METRIC_LABEL[m]}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs font-bold uppercase tracking-widest text-slate-400">
          Cobertura
          <select value={coverage} onChange={(e) => setCoverage(e.target.value)} className="mt-1 min-w-[13rem] rounded-md border border-line bg-navy px-3 py-2 text-base font-normal text-ink">
            <option value="">Todas</option>
            {opts.data?.coverages.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-6 gap-1 text-center">
        <div />
        {ZONES.map((z) => <div key={z} className="text-xs font-bold uppercase tracking-widest text-slate-400">{ZONE_SHORT[z]}</div>)}
        {DOWNS.map((d) => (
          <div key={d} className="contents">
            <div className="flex items-center justify-end pr-2 text-xs font-bold uppercase tracking-widest text-slate-400">{d}.º down</div>
            {ZONES.map((z) => {
              const c = cells.find((x) => x.down === d && x.fieldZone === z)
              if (!c || c.value == null) {
                return <div key={z} className="rounded bg-white/10 py-4 text-sm text-slate-400">n&lt;10</div>
              }
              return (
                <div key={z} style={{ background: color(c.value) }} className={`rounded py-3 ${textDark(c.value) ? 'text-navy' : 'text-white'}`}>
                  <div className="text-base font-bold">{fmt(metric, c.value)}</div>
                  <div className="text-xs">{formatN(c.n)}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
