import { useEffect, useState } from 'react'
import { getStats } from '../api'
import { useApi } from '../useApi'
import { formatN, formatPct, formatYds } from '../labels'
import type { ExplorerFilters } from '../types'
import ChartCard from './ChartCard'
import FieldDiagram, { parseFormation } from './FieldDiagram'
import PlayProfile from './PlayProfile'

export default function FormationOnField({ filters }: { filters: ExplorerFilters }) {
  const { data, loading, error, reload } = useApi(() => getStats({ groupBy: 'defFormation', ...filters }), [JSON.stringify(filters)])
  const rows = data?.rows ?? []
  const [selected, setSelected] = useState('')
  useEffect(() => {
    if (rows.length > 0 && !rows.some((r) => r.key === selected)) setSelected(rows[0].key)
  }, [rows, selected])
  const current = rows.find((r) => r.key === selected) ?? rows[0]
  const alignment = current ? parseFormation(current.label) : null

  return (
    <ChartCard title="Formación defensiva en la cancha" term="Formación defensiva" loading={loading} hasData={data != null} error={error} empty={rows.length === 0} onRetry={reload}>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {alignment && current ? <FieldDiagram alignment={alignment} label={current.label} /> : <p className="text-slate-400">Sin esquema para esta formación.</p>}
        </div>
        <div className="space-y-2 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Elige una formación</p>
          {rows.map((r) => (
            <button key={r.key} type="button" onClick={() => setSelected(r.key)} aria-pressed={r.key === current?.key} className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition duration-200 ease-out hover:translate-x-1 ${r.key === current?.key ? 'translate-x-1 border-accent bg-accent/10 shadow-[0_0_16px_rgba(34,211,238,0.2)]' : 'border-line hover:bg-white/5'} ${r.lowSample ? 'opacity-40' : ''}`}>
              <span className="font-semibold">{r.label}</span>
              <span className="text-sm text-slate-300"><span className="font-display text-xl font-bold italic text-green-500">{formatPct(r.stopAdj)}</span> · {formatN(r.n)}</span>
            </button>
          ))}
          {current && (
            <p key={current.key} className="animate-fadeUp pt-2 text-sm text-slate-400">
              Stop Rate ajustado {formatPct(current.stopAdj)} · presión al QB {formatPct(current.pressureRate)} · yardas permitidas {formatYds(current.yardsAllowed)}.
            </p>
          )}
        </div>
      </div>
      {current ? <PlayProfile groupBy="defFormation" itemKey={current.key} label={current.label} filters={filters} /> : null}
    </ChartCard>
  )
}
