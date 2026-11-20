import { useState } from 'react'
import { getFilters, getHeatmap } from '../api'
import { useApi } from '../useApi'
import { METRIC_LABEL, ZONE_SHORT, formatN, formatPct, formatYds } from '../labels'
import type { DownBucket, ExplorerFilters, FieldZone, HeatmapMetric } from '../types'
import ChartCard from './ChartCard'

// Zonas de izquierda (campo propio de la ofensiva) a derecha (end zone que ataca), con su ancho en yardas.
const ZONES: { zone: FieldZone; yards: number }[] = [
  { zone: 'propio_fondo', yards: 20 },
  { zone: 'propio', yards: 30 },
  { zone: 'rival', yards: 29 },
  { zone: 'red_zone', yards: 15 },
  { zone: 'goal_line', yards: 5 },
]
const DOWNS: DownBucket[] = ['1', '2', '3', '4']
const PX = 8          // píxeles por yarda
const BAND = 64       // alto de cada down
const TOP = 34
const ENDZONE = 80
const WIDTH = 99 * PX + ENDZONE
const EMPTY_FILL = '#334155'
const FILL_TRANSITION = { transition: 'fill 600ms ease' }

function mix(a: number[], b: number[], t: number): string {
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',')})`
}
const fmt = (m: HeatmapMetric, v: number) => (m === 'yardsAllowed' ? formatYds(v) : formatPct(v))

const selectClass = 'mt-1 min-w-[13rem] rounded-md border border-line bg-navy px-3 py-2 text-base font-normal normal-case tracking-normal text-ink'

export default function FieldHeatmap({ filters }: { filters: ExplorerFilters }) {
  // Down y zona son los ejes del mapa, así que esos dos filtros no se aplican aquí.
  const { team, distBucket, scoreBucket, formation } = filters
  const [metric, setMetric] = useState<HeatmapMetric>('stopAdj')
  const [coverage, setCoverage] = useState('')
  const opts = useApi(getFilters, [])
  const { data, loading, error, reload } = useApi(
    () => getHeatmap({ metric, coverage, team, distBucket, scoreBucket, formation }),
    [metric, coverage, team, distBucket, scoreBucket, formation],
  )
  const cells = data?.cells ?? []
  // Mientras llega la métrica nueva se siguen mostrando los datos anteriores con su propia escala.
  const shownMetric: HeatmapMetric = data?.metric ?? metric
  const vals = cells.map((c) => c.value).filter((v): v is number => v != null)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const t = (v: number) => (max > min ? (v - min) / (max - min) : 0.5)
  const color = (v: number) => mix([30, 45, 74], shownMetric === 'yardsAllowed' ? [239, 68, 68] : [34, 197, 94], t(v))
  const height = TOP + BAND * 4 + 24

  let x = 0
  const cols = ZONES.map((z) => {
    const col = { ...z, x, w: z.yards * PX }
    x += z.yards * PX
    return col
  })

  return (
    <ChartCard title="Mapa de calor sobre la cancha" term="Stop Rate" loading={loading} hasData={data != null} error={error} empty={cells.length === 0} onRetry={reload} footer="La ofensiva ataca hacia la derecha. Celdas en gris: menos de 10 jugadas (n<10). Usa los filtros de arriba excepto Down y Zona, que son los ejes del mapa.">
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex flex-col text-xs font-bold uppercase tracking-widest text-slate-400">
          Métrica
          <select value={metric} onChange={(e) => setMetric(e.target.value as HeatmapMetric)} className={selectClass}>
            {(Object.keys(METRIC_LABEL) as HeatmapMetric[]).map((m) => <option key={m} value={m}>{METRIC_LABEL[m]}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs font-bold uppercase tracking-widest text-slate-400">
          Cobertura
          <select value={coverage} onChange={(e) => setCoverage(e.target.value)} className={selectClass}>
            <option value="">Todas</option>
            {opts.data?.coverages.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <svg viewBox={`0 0 ${WIDTH + 56} ${height}`} className="w-full" role="img" aria-label={`Mapa de calor de ${METRIC_LABEL[shownMetric]} por down y zona`}>
        <g transform="translate(56,0)">
          <rect x="0" y={TOP} width={WIDTH} height={BAND * 4} fill="#14532d" />
          <rect x={99 * PX} y={TOP} width={ENDZONE} height={BAND * 4} fill="#0f3d22" />
          <text x={99 * PX + ENDZONE / 2} y={TOP + BAND * 2} fontSize="13" fontWeight="700" fill="#ffffff" fillOpacity="0.5" textAnchor="middle" transform={`rotate(90 ${99 * PX + ENDZONE / 2} ${TOP + BAND * 2})`}>END ZONE</text>
          {cols.map((c) => <text key={c.zone} x={c.x + c.w / 2} y={TOP - 12} fontSize="13" fontWeight="700" fill="#94a3b8" textAnchor="middle">{ZONE_SHORT[c.zone]}</text>)}
          {DOWNS.map((d, row) => (
            <g key={d}>
              <text x="-10" y={TOP + row * BAND + BAND / 2 + 5} fontSize="14" fontWeight="700" fill="#cbd5e1" textAnchor="end">{d}.º</text>
              {cols.map((c) => {
                const cell = cells.find((q) => q.down === d && q.fieldZone === c.zone)
                const y = TOP + row * BAND
                const has = cell != null && cell.value != null
                const v = has ? (cell.value as number) : 0
                const light = has && t(v) > 0.6
                const cx = c.x + c.w / 2
                return (
                  <g key={c.zone}>
                    <rect x={c.x + 2} y={y + 2} width={c.w - 4} height={BAND - 4} rx="4" fill={has ? color(v) : EMPTY_FILL} fillOpacity={has ? 1 : 0.8} style={FILL_TRANSITION} />
                    {has ? (
                      <g key={`${shownMetric}-${v}-${cell?.n}`} className="animate-fadeIn">
                        <text x={cx} y={y + BAND / 2} fontSize="15" fontWeight="700" fill={light ? '#0a1020' : '#ffffff'} textAnchor="middle" style={FILL_TRANSITION}>{fmt(shownMetric, v)}</text>
                        <text x={cx} y={y + BAND / 2 + 16} fontSize="11" fill={light ? '#0a1020' : '#e2e8f0'} textAnchor="middle" style={FILL_TRANSITION}>{formatN(cell?.n ?? 0)}</text>
                      </g>
                    ) : (
                      <text key="vacio" className="animate-fadeIn" x={cx} y={y + BAND / 2 + 4} fontSize="11" fill="#cbd5e1" textAnchor="middle">n&lt;10</text>
                    )}
                  </g>
                )
              })}
            </g>
          ))}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((yd) => <line key={yd} x1={yd * PX} x2={yd * PX} y1={TOP} y2={TOP + BAND * 4} stroke="#ffffff" strokeOpacity="0.15" />)}
          <text x="0" y={TOP + BAND * 4 + 18} fontSize="12" fill="#94a3b8">Su propia end zone</text>
          <text x={99 * PX} y={TOP + BAND * 4 + 18} fontSize="12" fill="#94a3b8" textAnchor="end">Ataca hacia aquí</text>
        </g>
      </svg>
    </ChartCard>
  )
}
