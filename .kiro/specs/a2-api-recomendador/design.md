# Diseño: A2 · API y recomendador

## Módulos
| Archivo | Responsabilidad |
|---|---|
| `backend/app/data.py` | `get_df() -> DataFrame` cacheado; `set_df(df)` para tests; ruta `Path(__file__).resolve().parents[2] / "data/processed/plays_features.csv"` (ajustar si el template cambia la estructura). |
| `backend/app/schemas.py` | Modelos Pydantic del contrato (FilterOptions, StatsRow, StatsResponse, HeatmapResponse, RecommendRequest, RecommendOption, RecommendResponse, AskRequest, AskResponse). `model_config = ConfigDict(populate_by_name=True)`; campos ya en camelCase. |
| `backend/app/metrics.py` | `apply_filters(df, **filters)`, `summarize(group_df, base) -> dict`, `aggregate(df, group_by, split_by=None) -> list[dict]`, `labels` en español. |
| `backend/app/recommender.py` | `recommend(df, req) -> dict` con la relajación de niveles. |
| `backend/app/main.py` | App FastAPI, CORS, endpoints delgados que llaman a las funciones de arriba. |

## summarize(group, base)
```
n = len(group); stops = group.stop.sum()
stopRate = stops / n
stopAdj = (stops + 20 * base) / (n + 20)
pressureRate = group.pressure.mean(); turnoverSackRate = group.turnoverOrSack.mean()
yardsAllowed = group.playResult.mean()
complPct = C / (C + I + IN) si denominador > 0, si no None
lowSample = n < 15
```

## groupBy
- coverage → clave `coverage`; rushType → `rushType`; coverageType → `coverageType`; combo → `coverage + "|" + rushType`.
- Con splitBy, agrupar por [clave, split] y devolver `split` en cada fila; `base` sigue siendo el stopRate del conjunto filtrado completo.
- Etiquetas: rushType y combo usan los textos de `domain.md`.

## Recomendador
```
sit = buckets(req)       # usa dist_bucket, field_zone, score_bucket de features.py
levels = [
  (0, "Coincidencia exacta",                         {down, dist, zone, score, twoMinute, formation?, team?}),
  (1, "Coincidencia sin filtrar por equipo",         {down, dist, zone, score, twoMinute, formation?}),
  (2, "Coincidencia sin filtrar por formación",      {down, dist, zone, score, twoMinute}),
  (3, "Coincidencia sin filtrar por marcador",       {down, dist, zone}),
  (4, "Solo down y distancia",                       {down, dist}),
]
# los filtros opcionales que no vienen en la petición se omiten; si un nivel es idéntico al anterior, se salta
for level in levels:
    similar = apply_filters(df, filters)
    if len(similar) >= 30: break
base = similar.stop.mean()
groups = similar.groupby(["coverage","rushType"]) -> summarize(g, base), filtrar n >= 10
options = top 3 por stopAdj; avoid = el último si hay ≥ 4 grupos, si no None
```

## Errores
- Validación de RecommendRequest con Pydantic: down 1–4, yardsToGo 1–99, yardsToEndzone 1–99, quarter 1–5, secondsLeft 0–900, scoreDiff −60–60.
- Filtros de stats con valores desconocidos → 0 filas, no error.

## Pruebas (`backend/tests/test_api.py`)
Fixture que construye un DataFrame de ~200 filas aleatorias con semilla fija y lo inyecta con `set_df`. Casos:
1. /api/health → ok y plays = 200.
2. /api/stats?groupBy=rushType → filas con 0 ≤ stopAdj ≤ 1 y ordenadas desc.
3. /api/heatmap?metric=stopAdj → 20 celdas (4 downs × 5 zonas).
4. /api/recommend con situación común → options no vacío, n ≥ 10, matchLevel entre 0 y 4.
5. /api/recommend con formación inexistente → matchLevel ≥ 2.
