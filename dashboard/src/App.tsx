import { useState } from 'react'
import { USE_MOCKS, getFilters } from './api'
import Tabs, { type TabId } from './components/Tabs'
import CoachMode from './pages/CoachMode'
import Explorer from './pages/Explorer'
import Findings from './pages/Findings'
import { useApi } from './useApi'

export default function App() {
  const [tab, setTab] = useState<TabId>('coach')
  const { data } = useApi(getFilters, [])
  const badge = USE_MOCKS ? 'Datos de ejemplo' : data ? `${data.totalPlays.toLocaleString('es-MX')} jugadas analizadas` : 'Cargando…'
  return (
    <div className="min-h-screen bg-navy text-ink" style={{ fontSize: 16 }}>
      <header className="border-b border-line bg-gradient-to-r from-navy via-[#0d1a33] to-navy">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="skew-x-[-12deg] bg-accent px-3 py-1 text-2xl font-extrabold text-navy">DC</div>
            <div>
              <h1 className="text-3xl leading-none">Copilot</h1>
              <p className="text-sm uppercase tracking-widest text-slate-400">Asistente del coordinador defensivo</p>
            </div>
          </div>
          <span className={`rounded-sm px-4 py-1 text-sm font-bold uppercase tracking-wider ${USE_MOCKS ? 'bg-amber-400 text-navy' : 'border border-accent text-accent'}`}>{badge}</span>
        </div>
        <div className="h-1 bg-gradient-to-r from-accent via-sky-500 to-transparent" />
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <Tabs active={tab} onChange={setTab} />
        {tab === 'coach' && <CoachMode />}
        {tab === 'explorer' && <Explorer />}
        {tab === 'findings' && <Findings />}
      </main>
    </div>
  )
}
