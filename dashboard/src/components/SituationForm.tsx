import { getFilters } from '../api'
import { validate, type FormState } from '../coach'
import { formationLabel } from '../labels'
import { useApi } from '../useApi'

interface FieldProps { label: string; help?: string; error?: string; children: React.ReactNode }
function Field({ label, help, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
        <div className="mt-1 normal-case tracking-normal">{children}</div>
      </label>
      {error ? <p className="mt-1 text-sm font-semibold text-red-400">{error}</p> : help && <p className="mt-1 text-sm text-slate-400">{help}</p>}
    </div>
  )
}
const input = (bad: boolean) =>
  `w-full rounded-md border bg-navy px-3 py-2 text-base font-normal text-ink focus:outline-none focus:ring-2 focus:ring-accent ${bad ? 'border-red-500' : 'border-line'}`

interface Props {
  form: FormState
  onChange: (f: FormState) => void
  onSubmit: () => void
  loading: boolean
}

export default function SituationForm({ form, onChange, onSubmit, loading }: Props) {
  const { data } = useApi(getFilters, [])
  const errors = validate(form)
  const invalid = Object.keys(errors).length > 0
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => onChange({ ...form, [k]: v })

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!invalid) onSubmit() }}
      className="space-y-4 rounded-md border border-line border-t-2 border-t-accent bg-panel p-5"
    >
      <h2 className="text-2xl">Situación del juego</h2>

      <div>
        <span className="block text-xs font-bold uppercase tracking-widest text-slate-400">Down</span>
        <div className="mt-1 grid grid-cols-4 gap-2" role="group" aria-label="Down">
          {[1, 2, 3, 4].map((d) => (
            <button
              key={d} type="button" aria-pressed={form.down === d} onClick={() => set('down', d)}
              className={`rounded-md border py-2 font-display text-2xl font-bold italic ${form.down === d ? 'border-accent bg-accent text-navy' : 'border-line text-slate-300 hover:bg-white/10'}`}
            >
              {d}.º
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Yardas por avanzar" error={errors.yardsToGo}>
          <input inputMode="numeric" value={form.yardsToGo} onChange={(e) => set('yardsToGo', e.target.value)} className={input(!!errors.yardsToGo)} />
        </Field>
        <Field label="Yardas a la end zone" error={errors.yardsToEndzone}>
          <input inputMode="numeric" value={form.yardsToEndzone} onChange={(e) => set('yardsToEndzone', e.target.value)} className={input(!!errors.yardsToEndzone)} />
        </Field>
      </div>
      <p className="-mt-2 text-sm text-slate-400">End zone: 35 = en la 35 del rival; 80 = en su propia 20.</p>

      <Field label="Diferencia de marcador" error={errors.scoreDiff} help="Positivo = vamos ganando.">
        <input inputMode="numeric" value={form.scoreDiff} onChange={(e) => set('scoreDiff', e.target.value)} className={input(!!errors.scoreDiff)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cuarto">
          <select value={form.quarter} onChange={(e) => set('quarter', Number(e.target.value))} className={input(false)}>
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{q}.º cuarto</option>)}
            <option value={5}>Tiempo extra</option>
          </select>
        </Field>
        <Field label="Reloj (MM:SS)" error={errors.clock}>
          <input value={form.clock} onChange={(e) => set('clock', e.target.value)} placeholder="08:00" className={input(!!errors.clock)} />
        </Field>
      </div>

      <Field label="Formación ofensiva">
        <select value={form.offenseFormation} onChange={(e) => set('offenseFormation', e.target.value)} className={input(false)}>
          <option value="">Cualquiera</option>
          {data?.formations.map((f) => <option key={f} value={f}>{formationLabel(f)}</option>)}
        </select>
      </Field>

      <Field label="Equipo defensivo (opcional)">
        <select value={form.team} onChange={(e) => set('team', e.target.value)} className={input(false)}>
          <option value="">Todos</option>
          {data?.teams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <button
        type="submit" disabled={invalid || loading}
        className="w-full rounded-md bg-accent py-3 font-display text-2xl font-extrabold uppercase italic tracking-wide text-navy hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? 'Calculando…' : 'Recomendar'}
      </button>
      {invalid && <p className="text-sm text-red-400" role="alert">Corrige los campos en rojo para recomendar.</p>}
    </form>
  )
}
