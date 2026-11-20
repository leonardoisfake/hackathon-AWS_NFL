export type TabId = 'coach' | 'explorer' | 'findings' | 'team'
const TABS: { id: TabId; label: string }[] = [
  { id: 'coach', label: 'Modo Coach' },
  { id: 'explorer', label: 'Explorador' },
  { id: 'findings', label: 'Hallazgos' },
]

export default function Tabs({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="flex gap-1 border-b border-line" role="tablist" aria-label="Secciones">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`px-6 py-3 font-display text-xl font-bold uppercase italic tracking-wide ${active === t.id ? 'border-b-4 border-accent bg-white/5 text-accent' : 'text-slate-400 hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
