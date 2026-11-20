import { useState } from 'react'
import { ask } from '../api'
import type { AskResponse } from '../types'
import RecommendationView from './RecommendationView'

const PLACEHOLDER = 'Ej.: 3ra y 8 en su 35, vamos ganando por 4, quedan 2 minutos del último cuarto y salen en EMPTY'

export default function AskBox() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [res, setRes] = useState<AskResponse | null>(null)
  const empty = question.trim() === ''

  async function send() {
    if (empty || loading) return
    setLoading(true)
    setError(null)
    setRes(null)
    try {
      setRes(await ask({ question: question.trim() }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar al asistente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-md border border-line border-t-2 border-t-accent bg-panel p-5">
      <h2 className="mb-1 text-2xl">Pregúntale al asistente</h2>
      <p className="mb-3 text-sm text-slate-400">La IA solo explica los números calculados con el historial y no inventa cifras.</p>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder={PLACEHOLDER} className="w-full rounded-md border border-line bg-navy p-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent" />
      <div className="mt-3 flex items-center gap-4">
        <button onClick={send} disabled={loading || empty} className="rounded-md bg-accent px-6 py-2 font-display text-xl font-extrabold uppercase italic text-navy hover:opacity-90 disabled:opacity-40">Enviar</button>
        {loading ? (
          <span className="flex items-center gap-2 text-slate-300" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Pensando... (puede tardar unos segundos)
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-4 rounded-md border border-red-500 bg-red-950/40 p-3 text-red-300" role="alert">No se pudo obtener respuesta: {error}. El formulario sigue funcionando.</p> : null}
      {res ? (
        <div className="mt-5 space-y-4">
          {res.usedAI ? (
            <div className="rounded-md border border-accent bg-accent/10 p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-accent">Asistente de IA</p>
              <p className="text-lg leading-relaxed">{res.answer}</p>
            </div>
          ) : (
            <div className="rounded-md border border-amber-400 bg-amber-400/10 p-4 text-amber-100" role="status">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest">Respuesta de respaldo (sin IA)</p>
              <p className="text-lg leading-relaxed">{res.answer}</p>
              {res.error ? <p className="mt-1 text-sm opacity-80">{res.error}</p> : null}
            </div>
          )}
          {res.recommendation ? <RecommendationView rec={res.recommendation} /> : null}
        </div>
      ) : null}
    </section>
  )
}
