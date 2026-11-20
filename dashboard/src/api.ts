import type {
  AskRequest, AskResponse, FilterOptions, HeatmapQuery, HeatmapResponse,
  RecommendRequest, RecommendResponse, StatsQuery, StatsResponse, TeamTendencies,
} from './types'
import filters from './mocks/filters.json'
import statsCoverage from './mocks/stats_coverage.json'
import statsRushDist from './mocks/stats_rush_dist.json'
import statsCombo from './mocks/stats_combo.json'
import statsDefFormation from './mocks/stats_def_formation.json'
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

async function request<T>(path: string, init?: RequestInit, timeoutMs = 20000): Promise<T> {
  const res = await fetch(path, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Error ${res.status} al consultar ${path}`)
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
  USE_MOCKS ? mock(filters) : request('/api/filters')

export function getStats(q: StatsQuery): Promise<StatsResponse> {
  if (USE_MOCKS) {
    if (q.groupBy === 'coverage') return mock(statsCoverage)
    if (q.groupBy === 'rushType') return mock(statsRushDist)
    if (q.groupBy === 'defFormation') return mock(statsDefFormation)
    return mock(statsCombo)
  }
  const { groupBy, splitBy, down, distBucket, fieldZone, scoreBucket, team, formation, twoMinute } = q
  return request(`/api/stats${qs({ groupBy, splitBy, down, distBucket, fieldZone, scoreBucket, team, formation, twoMinute })}`)
}

export function getHeatmap(q: HeatmapQuery): Promise<HeatmapResponse> {
  if (USE_MOCKS) return mock(q.metric === 'pressureRate' ? heatPressure : q.metric === 'yardsAllowed' ? heatYards : heatStop)
  return request(`/api/heatmap${qs({ metric: q.metric, coverage: q.coverage, rushType: q.rushType, team: q.team })}`)
}

export const recommend = (body: RecommendRequest): Promise<RecommendResponse> =>
  USE_MOCKS
    ? mock(recommendMock)
    : request('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const ask = (body: AskRequest): Promise<AskResponse> =>
  USE_MOCKS
    ? mock(askMock)
    : request('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 25000)

export const getTeamTendencies = (team: string): Promise<TeamTendencies> =>
  USE_MOCKS
    ? mock({ team, n: 0, coverageMix: [], predictability: [] })
    : request(`/api/team/${encodeURIComponent(team)}/tendencies`)
