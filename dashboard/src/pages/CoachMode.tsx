import { useEffect, useState } from 'react'
import { recommend } from '../api'
import AskBox from '../components/AskBox'
import QuickScenarios from '../components/QuickScenarios'
import RecommendationView from '../components/RecommendationView'
import SituationForm from '../components/SituationForm'
import { DEFAULT_FORM, PRESETS, toRequest, validate, type FormState } from '../coach'
import type { RecommendResponse } from '../types'

export default function CoachMode() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [rec, setRec] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(f: FormState) {
    if (Object.keys(validate(f)).length > 0) return
    setLoading(true)
    setError(null)
    try {
      setRec(await recommend(toRequest(f)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Al abrir la pantalla ya hay una recomendación con la situación por defecto.
  useEffect(() => {
    run(DEFAULT_FORM)
  }, [])

  function pick(name: string) {
    const preset = PRESETS.find((p) => p.name === name)
    if (!preset) return
    const next: FormState = { ...form, ...preset.values }
    setForm(next)
    run(next)
  }

  return (
    <div className="space-y-6">
      <QuickScenarios onPick={pick} disabled={loading} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SituationForm form={form} onChange={setForm} onSubmit={() => run(form)} loading={loading} />
        </div>
        <div className="lg:col-span-2" aria-live="polite">
          {loading && rec === null ? (
            <p className="py-20 text-center text-slate-400" role="status">Calculando recomendación...</p>
          ) : error ? (
            <div className="rounded-md border border-red-500 bg-red-950/40 p-6 text-center" role="alert">
              <p className="mb-3 text-red-300">No se pudo obtener la recomendación: {error}</p>
              <button onClick={() => run(form)} className="rounded-md bg-accent px-4 py-2 font-bold text-navy hover:opacity-80">Reintentar</button>
            </div>
          ) : rec ? (
            <div className={loading ? 'opacity-50 transition-opacity' : ''}><RecommendationView rec={rec} /></div>
          ) : null}
        </div>
      </div>
      <AskBox />
    </div>
  )
}
