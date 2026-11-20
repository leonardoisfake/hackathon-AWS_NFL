---
inclusion: always
---

# Contrato de la API (compartido entre Rol A y Rol B)

Base: todas las rutas empiezan con `/api`. JSON en camelCase. Tasas como fracciones 0–1. El frontend llama rutas relativas sin diagonal inicial (`api/...`, requisito de la publicación en subruta); en desarrollo, Vite hace proxy a `http://localhost:8000`.

**Regla:** este archivo es la fuente de verdad. Si alguno necesita cambiarlo, avisa al otro antes. Los tipos de `frontend/src/types.ts` y `backend/app/schemas.py` deben coincidir con esto.

## Tipos (TypeScript; los modelos Pydantic son equivalentes)

```ts
type RushType = "base" | "blitz" | "simulada";
type DownBucket = "1" | "2" | "3" | "4";
type DistBucket = "corta" | "media" | "larga";
type FieldZone = "propio_fondo" | "propio" | "rival" | "red_zone" | "goal_line";
type ScoreBucket = "perdiendo_9+" | "perdiendo_1_8" | "empate" | "ganando_1_8" | "ganando_9+";

interface Metrics {
  n: number;
  stopRate: number;
  stopAdj: number;
  pressureRate: number;
  turnoverSackRate: number;
  yardsAllowed: number;
  complPct: number | null;
  lowSample: boolean;        // n < 15
}

interface FilterOptions {
  teams: string[];           // defensas disponibles
  coverages: string[];       // ordenadas por frecuencia
  rushTypes: RushType[];
  formations: string[];      // offenseFormation
  downBuckets: DownBucket[];
  distBuckets: DistBucket[];
  fieldZones: FieldZone[];
  scoreBuckets: ScoreBucket[];
  totalPlays: number;
}

interface StatsRow extends Metrics {
  key: string;               // valor del groupBy (p. ej. "Cover-1", "blitz", "Cover-1|blitz")
  label: string;             // etiqueta en español lista para mostrar
  coverage?: string;
  rushType?: RushType;
  defFormation?: string;     // solo si groupBy=defFormation (p. ej. "Nickel (4-2-5)")
  split?: string;            // valor del splitBy si se pidió
}

interface StatsResponse {
  baseline: { n: number; stopRate: number };  // del conjunto filtrado completo
  rows: StatsRow[];          // ordenadas por stopAdj desc
}

interface HeatmapCell { down: DownBucket; fieldZone: FieldZone; value: number | null; n: number; }
interface HeatmapResponse { metric: "stopAdj" | "pressureRate" | "yardsAllowed"; cells: HeatmapCell[]; }

interface RecommendRequest {
  down: number;              // 1–4
  yardsToGo: number;         // 1–99
  yardsToEndzone: number;    // 1–99
  scoreDiff: number;         // defensa − ofensiva
  quarter: number;           // 1–5
  secondsLeft: number;       // segundos que quedan en el cuarto
  offenseFormation?: string | null;  // null = cualquiera
  team?: string | null;      // defensa específica (opcional)
}

interface RecommendOption extends Metrics {
  coverage: string;
  rushType: RushType;
  label: string;             // "Cover-1 + Blitz (5+)"
  deltaVsBaseline: number;   // stopAdj − baselineStop
}

interface RecommendResponse {
  situation: { downBucket: DownBucket; distBucket: DistBucket; fieldZone: FieldZone; scoreBucket: ScoreBucket; twoMinute: boolean };
  matchLevel: number;        // 0 exacta · 1 sin equipo · 2 sin formación · 3 sin marcador/reloj · 4 solo down y distancia
  matchLabel: string;        // p. ej. "Coincidencia sin filtrar por marcador"
  nSimilar: number;
  baselineStop: number;
  options: RecommendOption[];      // top 3 por stopAdj
  avoid: RecommendOption | null;   // peor opción con n ≥ 10
}

interface AskRequest { question: string; }
interface AskResponse {
  answer: string;            // texto en español
  usedAI: boolean;           // false = respuesta de respaldo sin IA
  recommendation: RecommendResponse | null;
  error: string | null;
}

interface TeamTendencies {   // opcional
  team: string;
  n: number;
  coverageMix: { coverage: string; share: number; n: number }[];
  predictability: { situation: string; topCall: string; share: number; n: number }[];
}
// Perfil de una jugada defensiva: dónde y contra qué funcionó mejor.
type ProfileGroupBy = "defFormation" | "coverage" | "combo";
type ProfileDimension = "fieldZone" | "downBucket" | "offenseTeam" | "offenseFormation" | "quarter";
interface ProfileRow extends Metrics {
  key: string;               // p. ej. "red_zone", "3", "CHI", "SHOTGUN", "4"
  label: string;             // etiqueta en español: "Red zone", "3.º down", "CHI", "Shotgun", "4.º cuarto"
}
interface ProfileBreakdown {
  dimension: ProfileDimension;
  rows: ProfileRow[];        // ordenadas por stopAdj desc; incluye grupos con n < 15 (el frontend los oculta)
}
interface ProfileResponse {
  groupBy: ProfileGroupBy;
  key: string;               // la jugada perfilada, p. ej. "Nickel (4-2-5)" o "Cover-1|blitz"
  label: string;
  overall: Metrics;          // la jugada en todo el conjunto filtrado
  breakdowns: ProfileBreakdown[];   // una por dimensión, en el orden de ProfileDimension
}
```

## Endpoints

| Método | Ruta | Parámetros | Respuesta |
|---|---|---|---|
| GET | /api/health | – | `{ "status": "ok", "plays": number }` |
| GET | /api/filters | – | FilterOptions |
| GET | /api/stats | `groupBy` = coverage \| rushType \| combo \| coverageType \| defFormation; `splitBy` opcional = distBucket \| downBucket \| fieldZone; filtros opcionales: `down`, `distBucket`, `fieldZone`, `scoreBucket`, `team`, `formation`, `twoMinute` | StatsResponse |
| GET | /api/profile | `groupBy` = defFormation \| coverage \| combo; `key` = jugada a perfilar (p. ej. `Nickel (4-2-5)`; en combo `Cover-1\|blitz`); filtros opcionales iguales a /api/stats | ProfileResponse. Desglose por fieldZone, downBucket, offenseTeam (= possessionTeam), offenseFormation y quarter (1–5). `stopAdj` de cada fila usa como base el stopRate de la jugada en el conjunto filtrado. |
| GET | /api/heatmap | `metric` = stopAdj \| pressureRate \| yardsAllowed; filtros opcionales: `coverage`, `rushType`, `team`, `distBucket`, `scoreBucket`, `formation`, `twoMinute` (down y fieldZone no, porque son los ejes) | HeatmapResponse |
| POST | /api/recommend | RecommendRequest | RecommendResponse |
| POST | /api/ask | AskRequest | AskResponse |
| GET | /api/team/{team}/tendencies | – | TeamTendencies (opcional) |

Errores: 422 para parámetros inválidos (validación de Pydantic/FastAPI). Si un filtro deja 0 jugadas, responder 200 con `rows: []` (no error).

## Ejemplo (números de relleno)
```json
POST /api/recommend
{ "down": 3, "yardsToGo": 8, "yardsToEndzone": 35, "scoreDiff": 4, "quarter": 4, "secondsLeft": 110, "offenseFormation": "EMPTY" }

{ "situation": { "downBucket": "3", "distBucket": "larga", "fieldZone": "rival", "scoreBucket": "ganando_1_8", "twoMinute": true },
  "matchLevel": 3, "matchLabel": "Coincidencia sin filtrar por marcador", "nSimilar": 212, "baselineStop": 0.58,
  "options": [ { "coverage": "Cover-1", "rushType": "blitz", "label": "Cover-1 + Blitz (5+)", "n": 38, "stopRate": 0.74, "stopAdj": 0.69,
                 "deltaVsBaseline": 0.11, "pressureRate": 0.44, "turnoverSackRate": 0.12, "yardsAllowed": 4.1, "complPct": 0.52, "lowSample": false } ],
  "avoid": null }
```
