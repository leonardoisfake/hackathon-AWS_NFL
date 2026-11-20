import type { ReactNode } from 'react'
import InfoTip from './InfoTip'

interface Props {
  title: string
  term?: string
  loading: boolean
  error: string | null
  empty: boolean
  onRetry: () => void
  children: ReactNode
  footer?: ReactNode
  /** true si ya hay datos previos: al recargar se conserva la gráfica (permite transiciones) */
  hasData?: boolean
}

/** Tarjeta de gráfica con estados de carga, error (con Reintentar) y vacío.
 *  Si ya hay datos, al recargar NO se borra la gráfica: se atenúa y se actualiza en su lugar. */
export default function ChartCard({ title, term, loading, error, empty, onRetry, children, footer, hasData = false }: Props) {
  return (
    <section className="rounded-md border border-line border-t-2 border-t-accent bg-panel p-5">
      <h3 className="mb-3 text-xl text-ink">
        {title}
        {term && <InfoTip term={term} />}
      </h3>
      {loading && !hasData ? (
        <p className="py-16 text-center text-slate-400" role="status">Cargando…</p>
      ) : error ? (
        <div className="py-12 text-center" role="alert">
          <p className="mb-3 text-red-400">No se pudo cargar: {error}</p>
          <button onClick={onRetry} className="rounded-md bg-accent px-4 py-2 font-bold text-navy hover:opacity-80">Reintentar</button>
        </div>
      ) : empty ? (
        <p className="py-16 text-center text-slate-400">No hay jugadas con estos filtros.</p>
      ) : (
        <div className="relative">
          {loading ? <span className="absolute right-0 top-0 z-10 rounded-sm bg-navy/80 px-2 py-0.5 text-xs font-semibold text-accent" role="status">Actualizando…</span> : null}
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>{children}</div>
        </div>
      )}
      {footer && !(loading && !hasData) && !error && <div className="mt-3 text-sm text-slate-400">{footer}</div>}
    </section>
  )
}
