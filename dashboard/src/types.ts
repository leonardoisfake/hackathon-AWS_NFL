// Espejo de .kiro/steering/api-contract.md. Si cambia allá, cambia aquí.
export type RushType = 'base' | 'blitz' | 'simulada'
export type DownBucket = '1' | '2' | '3' | '4'
export type DistBucket = 'corta' | 'media' | 'larga'
export type FieldZone = 'propio_fondo' | 'propio' | 'rival' | 'red_zone' | 'goal_line'
export type ScoreBucket = 'perdiendo_9+' | 'perdiendo_1_8' | 'empate' | 'ganando_1_8' | 'ganando_9+'

export interface Metrics {
  n: number
  stopRate: number
  stopAdj: number
  pressureRate: number
  turnoverSackRate: number
  yardsAllowed: number
  complPct: number | null
  lowSample: boolean
}
export interface FilterOptions {
  teams: string[]
  coverages: string[]
  rushTypes: RushType[]
  formations: string[]
  downBuckets: DownBucket[]
  distBuckets: DistBucket[]
  fieldZones: FieldZone[]
  scoreBuckets: ScoreBucket[]
  totalPlays: number
}
export interface StatsRow extends Metrics {
  key: string
  label: string
  coverage?: string
  rushType?: RushType
  defFormation?: string
  split?: string
}
export interface StatsResponse {
  baseline: { n: number; stopRate: number }
  rows: StatsRow[]
}
export type HeatmapMetric = 'stopAdj' | 'pressureRate' | 'yardsAllowed'
export interface HeatmapCell { down: DownBucket; fieldZone: FieldZone; value: number | null; n: number }
export interface HeatmapResponse { metric: HeatmapMetric; cells: HeatmapCell[] }
export interface RecommendRequest {
  down: number
  yardsToGo: number
  yardsToEndzone: number
  scoreDiff: number
  quarter: number
  secondsLeft: number
  offenseFormation?: string | null
  team?: string | null
}
export interface RecommendOption extends Metrics {
  coverage: string
  rushType: RushType
  label: string
  deltaVsBaseline: number
}
export interface RecommendResponse {
  situation: { downBucket: DownBucket; distBucket: DistBucket; fieldZone: FieldZone; scoreBucket: ScoreBucket; twoMinute: boolean }
  matchLevel: number
  matchLabel: string
  nSimilar: number
  baselineStop: number
  options: RecommendOption[]
  avoid: RecommendOption | null
}
export interface AskRequest { question: string }
export interface AskResponse {
  answer: string
  usedAI: boolean
  recommendation: RecommendResponse | null
  error: string | null
}
export interface TeamTendencies {
  team: string
  n: number
  coverageMix: { coverage: string; share: number; n: number }[]
  predictability: { situation: string; topCall: string; share: number; n: number }[]
}

/** Filtros del Explorador (valor vacío = "Todos"). */
export interface ExplorerFilters {
  down: string
  distBucket: string
  fieldZone: string
  scoreBucket: string
  team: string
  formation: string
}
export interface StatsQuery extends Partial<ExplorerFilters> {
  groupBy: 'coverage' | 'rushType' | 'combo' | 'coverageType' | 'defFormation'
  splitBy?: 'distBucket' | 'downBucket' | 'fieldZone'
  twoMinute?: boolean
}
export interface HeatmapQuery { metric: HeatmapMetric; coverage?: string; rushType?: string; team?: string }
