import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getStats } from '../api'
import { useApi } from '../useApi'
import { GREEN, formatN, formatPct, formatYds } from '../labels'
import type { ExplorerFilters, StatsRow } from '../types'
import ChartCard from './ChartCard'

function Tip({ active, payload }: { active?: boolean; payload?: { payload: StatsRow }[] }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="rounded-md border border-line bg-panel p-3 text-sm shadow">
      <p className="font-bold">{r.label}</p>
      <p>Stop Rate ajustado: {formatPct(r.stopAdj)} · {formatN(r.n)}</p>
      <p>Presión: {formatPct(r.pressureRate)}</p>
      <p>Turnover + sack: {formatPct(r.turnoverSackRate)}</p>
      <p>Yardas permitidas: {formatYds(r.yardsAllowed)}</p>
      {r.lowSample && <p className="mt-1 font-semibold text-amber-700">Muestra pequeña</p>}
    </div>
  )
}

interface Props {
  filters: ExplorerFilters
  groupBy?: 'coverage' | 'defFormation'
  title?: string
  term?: string
  labelWidth?: number
}

export default function CoverageBarChart({ filters, groupBy = 'coverage', title = 'Stop Rate por cobertura', term = 'Stop Rate ajustado', labelWidth = 110 }: Props) {
  const { data, loading, error, reload } = useApi(() => getStats({ groupBy, ...filters }), [JSON.stringify(filters), groupBy])
  const rows = data?.rows ?? []
  const height = Math.max(240, rows.length * 38 + 40)
  return (
    <ChartCard
      title={title} term={term}
      loading={loading} error={error} empty={rows.length === 0} onRetry={reload}
      footer={data && <>Línea gris: promedio del conjunto filtrado ({formatPct(data.baseline.stopRate)}, {formatN(data.baseline.n)}). Barras tenues: muestra pequeña.</>}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid stroke="#22314f" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)} %`} tick={{ fontSize: 14, fill: '#94a3b8' }} />
          <YAxis type="category" dataKey="label" width={labelWidth} tick={{ fontSize: 14, fill: '#94a3b8' }} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
          {data && <ReferenceLine x={data.baseline.stopRate} stroke="#94a3b8" strokeDasharray="5 4" label={{ value: 'Promedio', position: 'top', fontSize: 13, fill: '#cbd5e1' }} />}
          <Bar dataKey="stopAdj" radius={[0, 4, 4, 0]}>
            {rows.map((r) => <Cell key={r.key} fill={GREEN} fillOpacity={r.lowSample ? 0.4 : 1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
