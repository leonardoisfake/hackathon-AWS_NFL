import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getStats } from '../api'
import { useApi } from '../useApi'
import { DIST_LABEL, RUSH_COLOR, RUSH_LABEL, formatN, formatPct } from '../labels'
import type { DistBucket, ExplorerFilters, RushType } from '../types'
import ChartCard from './ChartCard'

const DISTS: DistBucket[] = ['corta', 'media', 'larga']
const RUSHES: RushType[] = ['base', 'blitz', 'simulada']
type Row = { dist: string } & Partial<Record<RushType, number>> & Partial<Record<`n_${RushType}`, number>>

export default function RushComparisonChart({ filters }: { filters: ExplorerFilters }) {
  // La distancia es el eje X: se ignora el filtro de distancia para que las tres barras existan.
  const { data, loading, error, reload } = useApi(
    () => getStats({ groupBy: 'rushType', splitBy: 'distBucket', ...filters, distBucket: '' }),
    [JSON.stringify(filters)],
  )
  const rows: Row[] = DISTS.map((d) => {
    const row: Row = { dist: DIST_LABEL[d] }
    RUSHES.forEach((r) => {
      const hit = data?.rows.find((x) => x.rushType === r && x.split === d)
      if (hit) { row[r] = hit.stopAdj; row[`n_${r}`] = hit.n }
    })
    return row
  })
  const empty = !data || data.rows.length === 0
  return (
    <ChartCard
      title="Blitz vs. 4 o menos vs. presión simulada" term="Presión simulada"
      loading={loading} hasData={data != null} error={error} empty={empty} onRetry={reload}
      footer="Stop Rate ajustado por distancia a recorrer. Pasa el cursor para ver n de cada barra."
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={rows} margin={{ right: 20 }}>
          <CartesianGrid stroke="#22314f" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dist" tick={{ fontSize: 14, fill: '#94a3b8' }} />
          <YAxis domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)} %`} tick={{ fontSize: 14, fill: '#94a3b8' }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.06)' }}
            contentStyle={{ background: '#111a2e', border: '1px solid #22314f', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(v, name, item) => {
              const rt = String(item.dataKey) as RushType
              const n = (item.payload as Row)[`n_${rt}`]
              return [`${formatPct(Number(v))}${n != null ? ` · ${formatN(n)}` : ''}`, String(name)]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 14, color: '#cbd5e1' }} />
          {RUSHES.map((r) => <Bar key={r} dataKey={r} name={RUSH_LABEL[r]} fill={RUSH_COLOR[r]} radius={[4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
