import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { GREEN, formatPct } from '../labels'
import type { RecommendResponse } from '../types'

export default function OptionsMiniChart({ rec }: { rec: RecommendResponse }) {
  const data = [
    ...rec.options.map((o, i) => ({ name: `#${i + 1} ${o.label}`, value: o.stopAdj, color: GREEN })),
    { name: 'Promedio de la situación', value: rec.baselineStop, color: '#94a3b8' },
  ]
  return (
    <div className="rounded-md border border-line bg-panel p-4">
      <h3 className="mb-2 text-lg">Stop Rate ajustado vs. promedio</h3>
      <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }}>
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 14, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => formatPct(Number(v))} fill="#f1f5f9" fontSize={14} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
