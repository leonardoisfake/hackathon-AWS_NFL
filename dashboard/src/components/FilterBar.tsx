import { getFilters } from '../api'
import { useApi } from '../useApi'
import { DIST_LABEL, DOWN_LABEL, SCORE_LABEL, ZONE_LABEL, formationLabel } from '../labels'
import type { ExplorerFilters } from '../types'

export const EMPTY_FILTERS: ExplorerFilters = { down: '', distBucket: '', fieldZone: '', scoreBucket: '', team: '', formation: '' }

interface SelectProps { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }
function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="flex flex-col text-xs font-bold uppercase tracking-widest text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-md border border-line bg-navy px-3 py-2 text-base font-normal text-ink"
      >
        <option value="">Todos</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export default function FilterBar({ filters, onChange }: { filters: ExplorerFilters; onChange: (f: ExplorerFilters) => void }) {
  const { data, loading, error, reload } = useApi(getFilters, [])
  if (loading) return <p className="text-slate-400" role="status">Cargando filtros…</p>
  if (error || !data) {
    return (
      <p className="text-red-400" role="alert">
        No se pudieron cargar los filtros. <button onClick={reload} className="font-semibold underline">Reintentar</button>
      </p>
    )
  }
  const set = (k: keyof ExplorerFilters) => (v: string) => onChange({ ...filters, [k]: v })
  const active = Object.values(filters).some(Boolean)
  return (
    <div className="grid grid-cols-2 gap-4 rounded-md border border-line bg-panel p-4 md:grid-cols-4 xl:grid-cols-7">
      <Select label="Down" value={filters.down} onChange={set('down')} options={data.downBuckets.map((d) => ({ value: d, label: DOWN_LABEL[d] }))} />
      <Select label="Distancia" value={filters.distBucket} onChange={set('distBucket')} options={data.distBuckets.map((d) => ({ value: d, label: DIST_LABEL[d] }))} />
      <Select label="Zona del campo" value={filters.fieldZone} onChange={set('fieldZone')} options={data.fieldZones.map((z) => ({ value: z, label: ZONE_LABEL[z] }))} />
      <Select label="Marcador" value={filters.scoreBucket} onChange={set('scoreBucket')} options={data.scoreBuckets.map((s) => ({ value: s, label: SCORE_LABEL[s] }))} />
      <Select label="Defensa" value={filters.team} onChange={set('team')} options={data.teams.map((t) => ({ value: t, label: t }))} />
      <Select label="Formación ofensiva" value={filters.formation} onChange={set('formation')} options={data.formations.map((f) => ({ value: f, label: formationLabel(f) }))} />
      <div className="flex items-end">
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          disabled={!active}
          className="w-full rounded-md border border-line px-3 py-2 font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )
}
