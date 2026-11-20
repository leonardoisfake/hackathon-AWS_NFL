import type { Finding } from '../content/findings'

export default function FindingCard({ f }: { f: Finding }) {
  return (
    <article className="rounded-md border border-line border-l-4 border-l-accent bg-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">{f.title}</h3>
        {f.pending && <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-bold uppercase text-navy">Pendiente</span>}
      </div>
      <p className={`my-3 font-display text-7xl font-extrabold italic ${f.pending ? 'text-slate-500' : 'text-green-500'}`}>{f.number}</p>
      <p className="text-lg text-slate-300">{f.text}</p>
      <p className="mt-3 text-sm text-slate-400">n={f.n} · Fuente: Big Data Bowl dataset</p>
    </article>
  )
}
