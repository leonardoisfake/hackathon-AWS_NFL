import { getProfile } from '../api'
import { useApi } from '../useApi'
import { formatN, formatPct } from '../labels'
import type { ExplorerFilters, ProfileBreakdown, ProfileDimension, ProfileGroupBy, ProfileRow } from '../types'

const TITLES: Record<ProfileDimension, string> = {
  fieldZone: 'Zona del campo',
  downBucket: 'Down',
  offenseTeam: 'Contra qué ofensiva',
  offenseFormation: 'Formación ofensiva rival',
  quarter: 'Momento del partido',
}
const MIN_N = 15
const MAX_ROWS = 5

const deltaText = (d: number): string => {
  const pts = Math.round(d * 100)
  return `${pts > 0 ? '+' : ''}${pts} pts vs. su promedio`
}

function Bar({ r }: { r: ProfileRow }) {
  return (
    <li className="text-sm">
      <div className="flex justify-between gap-2 text-slate-300">
        <span className="truncate">{r.label}</span>
        <span className="shrink-0">{formatPct(r.stopAdj)} · {formatN(r.n)}</span>
      </div>
      <div className="h-1.5 rounded bg-white/10">
        <div className="h-1.5 rounded bg-green-500 transition-all duration-700 ease-out" style={{ width: `${Math.round(r.stopAdj * 100)}%` }} />
      </div>
    </li>
  )
}

function Breakdown({ b, base }: { b: ProfileBreakdown; base: number }) {
  const valid = [...b.rows].filter((r) => r.n >= MIN_N).sort((x, y) => y.stopAdj - x.stopAdj)
  const hidden = b.rows.length - valid.length
  const best = valid[0]
  return (
    <div className="rounded-md border border-line bg-navy/60 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{TITLES[b.dimension]}</p>
      {best ? (
        <div key={best.key} className="animate-fadeUp">
          <p className="mt-1 font-display text-2xl font-bold uppercase italic leading-tight text-ink">{best.label}</p>
          <p className="font-display text-4xl font-extrabold italic leading-none text-green-500">{formatPct(best.stopAdj)}</p>
          <p className="text-sm text-slate-400">{formatN(best.n)} · <span className={best.stopAdj - base >= 0 ? 'text-green-400' : 'text-red-400'}>{deltaText(best.stopAdj - base)}</span></p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-amber-300">Muestra insuficiente: ningún grupo tiene 15 jugadas o más.</p>
      )}
      {valid.length > 1 ? <ul className="mt-3 space-y-1.5">{valid.slice(0, MAX_ROWS).map((r) => <Bar key={r.key} r={r} />)}</ul> : null}
      {hidden > 0 ? <p className="mt-2 text-xs text-slate-500">{hidden} {hidden === 1 ? 'grupo oculto' : 'grupos ocultos'} por muestra pequeña (n &lt; 15).</p> : null}
    </div>
  )
}

interface Props { groupBy: ProfileGroupBy; itemKey: string; label: string; filters: ExplorerFilters }

/** Dónde funcionó mejor la jugada seleccionada: zona, down, rival, formación ofensiva y cuarto. */
export default function PlayProfile({ groupBy, itemKey, label, filters }: Props) {
  const { data, loading, error, reload } = useApi(() => getProfile({ groupBy, key: itemKey, ...filters }), [groupBy, itemKey, JSON.stringify(filters)])
  return (
    <section className="mt-6 border-t border-line pt-5" aria-live="polite">
      <h4 className="font-display text-2xl font-bold uppercase italic text-ink">¿Dónde funcionó mejor {label}?</h4>
      <p className="text-sm text-slate-400">
        Mejor = mayor Stop Rate ajustado entre los grupos con al menos 15 jugadas. Se aplican los filtros de arriba.
        {data ? ` Promedio de esta formación: ${formatPct(data.overall.stopRate)} (${formatN(data.overall.n)}).` : ''}
      </p>
      {loading && data == null ? (
        <p className="py-10 text-center text-slate-400" role="status">Cargando perfil…</p>
      ) : error ? (
        <p className="py-6 text-center text-red-400" role="alert">No se pudo cargar el perfil: {error}. <button onClick={reload} className="font-semibold underline">Reintentar</button></p>
      ) : data ? (
        <div className={`mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
          {data.breakdowns.map((b) => <Breakdown key={b.dimension} b={b} base={data.overall.stopRate} />)}
        </div>
      ) : null}
    </section>
  )
}
