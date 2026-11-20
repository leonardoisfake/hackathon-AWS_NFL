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
}

/** Tarjeta de gráfica con estados de carga, error (con Reintentar) y vacío. */
export default function ChartCard({ title, term, loading, error, empty, onRetry, children, footer }: Props) {
  return (
    <section className="rounded-md border border-line border-t-2 border-t-accent bg-panel p-5">
      <h3 className="mb-3 text-xl text-ink">
        {title}
        {term && <InfoTip term={term} />}
      </h3>
      {loading ? (
        <p className="py-16 text-center text-slate-400" role="status">Cargando…</p>
      ) : error ? (
        <div className="py-12 text-center" role="alert">
          <p className="mb-3 text-red-400">No se pudo cargar: {error}</p>
          <button onClick={onRetry} className="rounded-md bg-accent px-4 py-2 font-bold text-navy hover:opacity-80">Reintentar</button>
        </div>
      ) : empty ? (
        <p className="py-16 text-center text-slate-400">No hay jugadas con estos filtros.</p>
      ) : (
        children
      )}
      {footer && !loading && !error && <div className="mt-3 text-sm text-slate-400">{footer}</div>}
    </section>
  )
}
