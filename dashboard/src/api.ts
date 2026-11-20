import type {
  DistBucket, DownBucket, FieldZone, ScoreBucket,
  AskRequest, AskResponse, ProfileQuery, ProfileResponse, FilterOptions, HeatmapQuery, HeatmapResponse,
  RecommendRequest, RecommendResponse, StatsQuery, StatsResponse, TeamTendencies,
} from './types'
import filters from './mocks/filters.json'
import statsCoverage from './mocks/stats_coverage.json'
import statsRushDist from './mocks/stats_rush_dist.json'
import statsCombo from './mocks/stats_combo.json'
import statsDefFormation from './mocks/stats_def_formation.json'
import profilesDefFormation from './mocks/profiles_def_formation.json'
import heatStop from './mocks/heatmap_stopAdj.json'
import heatPressure from './mocks/heatmap_pressureRate.json'
import heatYards from './mocks/heatmap_yardsAllowed.json'
import recommendMock from './mocks/recommend.json'
import askMock from './mocks/ask.json'

/** Interruptor: VITE_USE_MOCKS=true usa los JSON de src/mocks sin backend. */
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS === 'true'
const MOCK_DELAY_MS = 300

const mock = <T,>(data: unknown): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data) as T), MOCK_DELAY_MS))


/** Solo para mocks: calcula la situación a partir de lo capturado, para que el resumen sea coherente con el formulario. */
function mockSituation(b: RecommendRequest): RecommendResponse['situation'] {
  const dist: DistBucket = b.yardsToGo <= 3 ? 'corta' : b.yardsToGo <= 7 ? 'media' : 'larga'
  const e = b.yardsToEndzone
  const zone: FieldZone = e <= 5 ? 'goal_line' : e <= 20 ? 'red_zone' : e <= 49 ? 'rival' : e <= 79 ? 'propio' : 'propio_fondo'
  const d = b.scoreDiff
  const score: ScoreBucket = d <= -9 ? 'perdiendo_9+' : d < 0 ? 'perdiendo_1_8' : d === 0 ? 'empate' : d <= 8 ? 'ganando_1_8' : 'ganando_9+'
  return {
    downBucket: String(Math.min(Math.max(b.down, 1), 4)) as DownBucket,
    distBucket: dist,
    fieldZone: zone,
    scoreBucket: score,
    twoMinute: (b.quarter === 2 || b.quarter === 4) && b.secondsLeft <= 120,
  }
}

/** Mensaje claro para el usuario. Un 500 sin cuerpo JSON casi siempre es el proxy de Vite sin backend. */
async function errorMessage(res: Response, path: string): Promise<string> {
  let detail = ''
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object' && 'detail' in body) {
      const d = (body as { detail: unknown }).detail
      detail = typeof d === 'string' ? d : ''
    }
  } catch {
    // sin cuerpo JSON
  }
  if (detail) return detail
  if (res.status === 500 || res.status === 502 || res.status === 504) {
    return 'No se pudo conectar con el backend. Revisa que esté corriendo en el puerto 8000 (uvicorn backend.main:app).'
  }
  if (res.status === 503) return 'El backend no tiene datos todavía: ejecuta scripts/build_features.py.'
  return `Error ${res.status} al consultar ${path}`
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 20000): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === 'TimeoutError'
    throw new Error(timedOut ? 'El servidor tardó demasiado en responder' : 'No hay conexión con el servidor')
  }
  if (!res.ok) throw new Error(await errorMessage(res, path))
  return (await res.json()) as T
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const getFilters = (): Promise<FilterOptions> =>
  USE_MOCKS ? mock(filters) : request('api/filters')

export function getStats(q: StatsQuery): Promise<StatsResponse> {
  if (USE_MOCKS) {
    if (q.groupBy === 'coverage') return mock(statsCoverage)
    if (q.groupBy === 'rushType') return mock(statsRushDist)
    if (q.groupBy === 'defFormation') return mock(statsDefFormation)
    return mock(statsCombo)
  }
  const { groupBy, splitBy, down, distBucket, fieldZone, scoreBucket, team, formation, twoMinute } = q
  return request(`api/stats${qs({ groupBy, splitBy, down, distBucket, fieldZone, scoreBucket, team, formation, twoMinute })}`)
}

export function getHeatmap(q: HeatmapQuery): Promise<HeatmapResponse> {
  if (USE_MOCKS) return mock(q.metric === 'pressureRate' ? heatPressure : q.metric === 'yardsAllowed' ? heatYards : heatStop)
  const { metric, coverage, rushType, team, distBucket, scoreBucket, formation } = q
  return request(`api/heatmap${qs({ metric, coverage, rushType, team, distBucket, scoreBucket, formation })}`)
}

export const recommend = (body: RecommendRequest): Promise<RecommendResponse> =>
  USE_MOCKS
    ? mock<RecommendResponse>({ ...recommendMock, situation: mockSituation(body) })
    : request('api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const ask = (body: AskRequest): Promise<AskResponse> =>
  USE_MOCKS
    ? mock(askMock)
    : request('api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 25000)

export const getTeamTendencies = (team: string): Promise<TeamTendencies> =>
  USE_MOCKS
    ? mock({ team, n: 0, coverageMix: [], predictability: [] })
    : request(`api/team/${encodeURIComponent(team)}/tendencies`)

/** Perfil de una jugada: en qué zona, down, rival, formación ofensiva y cuarto funcionó mejor. */
export function getProfile(q: ProfileQuery): Promise<ProfileResponse> {
  if (USE_MOCKS) {
    const all = profilesDefFormation as unknown as Record<string, ProfileResponse>
    const hit = all[q.key]
    return hit ? mock<ProfileResponse>(hit) : Promise.reject(new Error('Sin datos de ejemplo para esta selección'))
  }
  const { groupBy, key, down, distBucket, fieldZone, scoreBucket, team, formation } = q
  return request(`api/profile${qs({ groupBy, key, down, distBucket, fieldZone, scoreBucket, team, formation })}`)
}
