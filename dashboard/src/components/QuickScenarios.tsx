import { PRESETS } from '../coach'

/** Escenarios preparados para la demo: llenan el formulario y recomiendan al instante. */
export default function QuickScenarios({ onPick, disabled }: { onPick: (name: string) => void; disabled: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Escenarios rápidos</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PRESETS.map((p) => (
          <button
            key={p.name} type="button" disabled={disabled} onClick={() => onPick(p.name)}
            className="rounded-md border border-line bg-panel px-4 py-3 text-left hover:border-accent hover:bg-white/5 disabled:opacity-50"
          >
            <span className="block font-display text-xl font-bold uppercase italic text-accent">{p.name}</span>
            <span className="text-sm text-slate-400">{p.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
