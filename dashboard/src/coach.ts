import type { RecommendRequest } from './types'
import { clockToSeconds, secondsToClock } from './labels'

/** Estado del formulario: los números se guardan como texto para poder editarlos libremente. */
export interface FormState {
  down: number
  yardsToGo: string
  yardsToEndzone: string
  scoreDiff: string
  quarter: number
  clock: string
  offenseFormation: string // '' = Cualquiera
  team: string             // '' = Todas
}

export const DEFAULT_FORM: FormState = {
  down: 3, yardsToGo: '8', yardsToEndzone: '35', scoreDiff: '0', quarter: 2, clock: '08:00', offenseFormation: '', team: '',
}

export interface Preset { name: string; hint: string; values: Omit<FormState, 'offenseFormation' | 'team'> }
const p = (down: number, yardsToGo: number, yardsToEndzone: number, scoreDiff: number, quarter: number, seconds: number) => ({
  down, yardsToGo: String(yardsToGo), yardsToEndzone: String(yardsToEndzone), scoreDiff: String(scoreDiff), quarter, clock: secondsToClock(seconds),
})
export const PRESETS: Preset[] = [
  { name: '3.º y largo', hint: '3.º y 9 · medio campo', values: p(3, 9, 55, 0, 2, 480) },
  { name: '3.º y corto', hint: '3.º y 2 · campo rival', values: p(3, 2, 45, 0, 3, 600) },
  { name: 'Red zone', hint: '2.º y 7 · en su 14', values: p(2, 7, 14, -3, 3, 300) },
  { name: '2 minutos, ganando por 3', hint: '1.º y 10 · 4.º cuarto', values: p(1, 10, 70, 3, 4, 110) },
]

export type FormErrors = Partial<Record<'yardsToGo' | 'yardsToEndzone' | 'scoreDiff' | 'clock', string>>

const intIn = (v: string, min: number, max: number): number | null => {
  if (!/^-?\d+$/.test(v.trim())) return null
  const n = Number(v)
  return n >= min && n <= max ? n : null
}

export function validate(f: FormState): FormErrors {
  const e: FormErrors = {}
  if (intIn(f.yardsToGo, 1, 30) === null) e.yardsToGo = 'Entre 1 y 30'
  if (intIn(f.yardsToEndzone, 1, 99) === null) e.yardsToEndzone = 'Entre 1 y 99'
  if (intIn(f.scoreDiff, -30, 30) === null) e.scoreDiff = 'Entre −30 y 30'
  if (clockToSeconds(f.clock) === null) e.clock = 'Formato MM:SS (hasta 15:00)'
  return e
}

/** Convierte el formulario (ya validado) al cuerpo de POST /api/recommend. */
export function toRequest(f: FormState): RecommendRequest {
  return {
    down: f.down,
    yardsToGo: Number(f.yardsToGo),
    yardsToEndzone: Number(f.yardsToEndzone),
    scoreDiff: Number(f.scoreDiff),
    quarter: f.quarter,
    secondsLeft: clockToSeconds(f.clock) ?? 0,
    offenseFormation: f.offenseFormation || null,
    team: f.team || null,
  }
}
