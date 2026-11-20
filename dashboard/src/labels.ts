import type { RushType, FieldZone, DistBucket, DownBucket, ScoreBucket, HeatmapMetric } from './types'

export const RUSH_LABEL: Record<RushType, string> = {
  base: '4 o menos',
  blitz: 'Blitz (5+)',
  simulada: 'Presión simulada',
}
// Colores fijos por tipo de presión (frontend-rules.md)
export const RUSH_COLOR: Record<RushType, string> = { base: '#64748b', blitz: '#dc2626', simulada: '#d97706' }
export const GREEN = '#22c55e'

export const ZONE_LABEL: Record<FieldZone, string> = {
  propio_fondo: 'Propio fondo (dentro de su 20)',
  propio: 'Campo propio',
  rival: 'Campo rival',
  red_zone: 'Red zone',
  goal_line: 'Goal line',
}
export const ZONE_SHORT: Record<FieldZone, string> = {
  propio_fondo: 'Propio fondo', propio: 'Propio', rival: 'Rival', red_zone: 'Red zone', goal_line: 'Goal line',
}
export const DIST_LABEL: Record<DistBucket, string> = { corta: 'Corta (1–3)', media: 'Media (4–7)', larga: 'Larga (8+)' }
export const DOWN_LABEL: Record<DownBucket, string> = { '1': '1.º down', '2': '2.º down', '3': '3.º down', '4': '4.º down' }
export const SCORE_LABEL: Record<ScoreBucket, string> = {
  'perdiendo_9+': 'Perdiendo por 9+',
  perdiendo_1_8: 'Perdiendo por 1–8',
  empate: 'Empate',
  ganando_1_8: 'Ganando por 1–8',
  'ganando_9+': 'Ganando por 9+',
}
export const METRIC_LABEL: Record<HeatmapMetric, string> = {
  stopAdj: 'Stop Rate ajustado',
  pressureRate: 'Presión al QB',
  yardsAllowed: 'Yardas permitidas',
}
export const FORMATION_LABEL: Record<string, string> = {
  SHOTGUN: 'Shotgun', EMPTY: 'Empty', SINGLEBACK: 'Singleback', I_FORM: 'I-Form', PISTOL: 'Pistol', JUMBO: 'Jumbo', WILDCAT: 'Wildcat',
}
export const formationLabel = (f: string): string => FORMATION_LABEL[f] ?? f

export const GLOSSARY: Record<string, string> = {
  'Cover-0': 'Hombre a hombre sin ayuda profunda (suele ir con blitz).',
  'Cover-1': 'Hombre a hombre con 1 profundo.',
  'Cover-2': 'Zona con 2 profundos.',
  '2-Man': 'Hombre abajo con 2 profundos.',
  'Cover-3': 'Zona con 3 profundos.',
  Quarters: 'Cover-4: zona con 4 profundos.',
  'Cover-6': 'Mitad Quarters, mitad Cover-2.',
  'Formación defensiva': 'Cuántos linieros (DL), apoyadores (LB) y backs defensivos (DB) pone la defensa. 4-2-5 = 4 DL, 2 LB y 5 DB. Nickel = 5 DB, Dime = 6 DB, Quarter = 7 DB.',
  Blitz: 'Cinco o más defensores presionan al mariscal.',
  'Presión simulada': 'Mandan 4, pero no los 4 esperados: un linebacker o back presiona y un liniero cae a cubrir.',
  'Stop Rate': 'Porcentaje de jugadas en que la ofensiva no tuvo éxito para su down y distancia. Sack e intercepción cuentan como stop.',
  'Stop Rate ajustado': 'Stop Rate encogido hacia el promedio cuando hay pocas jugadas: (stops + 20 × promedio) ÷ (n + 20).',
}

/** 0.684 -> "68 %" */
export const formatPct = (v: number | null | undefined): string => (v == null ? '—' : `${Math.round(v * 100)} %`)
/** 4.13 -> "4.1 yd" */
export const formatYds = (v: number | null | undefined): string => (v == null ? '—' : `${v.toFixed(1)} yd`)
/** 38 -> "n=38" */
export const formatN = (n: number): string => `n=${n}`

/** 0.11 -> "+11 pts vs. promedio" */
export const formatDelta = (d: number): string => {
  const pts = Math.round(d * 100)
  return `${pts > 0 ? '+' : ''}${pts} pts vs. promedio`
}
/** 110 -> "01:50" */
export const secondsToClock = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
/** "01:50" -> 110; null si el formato no es válido (MM:SS, hasta 15:00) */
export const clockToSeconds = (c: string): number | null => {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(c.trim())
  if (!m) return null
  const total = Number(m[1]) * 60 + Number(m[2])
  return total <= 900 ? total : null
}
