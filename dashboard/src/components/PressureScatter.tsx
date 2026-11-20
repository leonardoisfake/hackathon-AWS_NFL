import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Legend } from 'recharts'
import { getStats } from '../api'
import { useApi } from '../useApi'
import { RUSH_COLOR, RUSH_LABEL, formatN, formatPct, formatYds } from '../labels'
import type { ExplorerFilters, RushType, StatsRow } from '../types'
import ChartCard from './ChartCard'

const RUSHES: RushType[] = ['base', 'blitz', 'simulada']

function Tip({ active, payload }: { active?: boolean; payload?: { payload: StatsRow }[] }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="rounded-md border border-line bg-panel p-3 text-sm shadow">
      <p className="font-bold">{r.label}</p>
      <p>Presión: {formatPct(r.pressureRate)} · {formatN(r.n)}</p>
      <p>Yardas permitidas: {formatYds(r.yardsAllowed)}</p>
      <p>Stop Rate ajustado: {formatPct(r.stopAdj)}</p>
    </div>
  )
}

export default function PressureScatter({ filters }: { filters: ExplorerFilters }) {
  const { data, loading, error, reload } = useApi(() => getStats({ groupBy: 'combo', ...filters }), [JSON.stringify(filters)])
  const rows = (data?.rows ?? []).filter((r) => !r.lowSample)
  return (
    <ChartCard
      title="Presión al QB vs. yardas permitidas" term="Blitz"
      loading={loading} hasData={data != null} error={error} empty={rows.length === 0} onRetry={reload}
      footer="Cada punto es una combinación cobertura + presión (solo n ≥ 15). Más a la izquierda y abajo es mejor para la defensa. Tamaño = n."
    >
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 8, right: 20, bottom: 24, left: 8 }}>
          <CartesianGrid stroke="#22314f" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="pressureRate" name="Presión" domain={['auto', 'auto']} tickFormatter={(v: number) => `${Math.round(v * 100)} %`} tick={{ fontSize: 14, fill: '#94a3b8' }} label={{ value: 'Presión al QB', position: 'insideBottom', offset: -14, fontSize: 14, fill: '#94a3b8' }} />
          <YAxis type="number" dataKey="yardsAllowed" name="Yardas" domain={['auto', 'auto']} tick={{ fontSize: 14, fill: '#94a3b8' }} label={{ value: 'Yardas permitidas', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#94a3b8' }} />
          <ZAxis type="number" dataKey="n" range={[60, 400]} />
          <Tooltip content={<Tip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 14, color: '#cbd5e1' }} />
          {RUSHES.map((r) => (
            <Scatter key={r} name={RUSH_LABEL[r]} data={rows.filter((x) => x.rushType === r)} fill={RUSH_COLOR[r]} fillOpacity={0.8} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
