# Diseño: B1 · Dashboard y Explorador

## Archivos
```
dashboard/src/
  types.ts                 # copia de api-contract.md
  api.ts                   # fetch + USE_MOCKS
  labels.ts                # etiquetas en español y glosario (de domain.md), formatPct, formatYds
  mocks/filters.json  stats_coverage.json  stats_rush_dist.json  stats_combo.json
        heatmap.json  recommend.json  ask.json
  content/findings.ts      # tarjetas de Hallazgos (las llena el equipo después)
  components/
    Tabs.tsx  FilterBar.tsx  ChartCard.tsx (título + "?" + estados)  InfoTip.tsx
    CoverageBarChart.tsx  RushComparisonChart.tsx  Heatmap.tsx  PressureScatter.tsx
    FindingCard.tsx
  pages/
    Explorer.tsx  Findings.tsx  CoachMode.tsx (placeholder en B1)
  App.tsx
```

## Estado
- `App.tsx`: `const [tab, setTab] = useState<"coach"|"explorer"|"findings"|"team">("coach")`.
- `Explorer.tsx`: `filters` en un `useState`; cada gráfica recibe `filters` y hace su propio fetch en `useEffect` (hook `useApi(fn, deps)` que devuelve `{data, loading, error, reload}`).
- Filtros → query string omitiendo los "Todos".

## Gráficas (Recharts)
- CoverageBarChart: `BarChart layout="vertical"`, `Bar dataKey="stopAdj"`, `ReferenceLine x={baseline.stopRate}` con etiqueta "Promedio", `Cell` con `fillOpacity` 0.4 si lowSample. Eje en %.
- RushComparisonChart: transformar filas `{key: rushType, split: distBucket}` a `[{dist:"corta", base:.., blitz:.., simulada:..}]`; tres `Bar` con colores fijos.
- Heatmap: `grid grid-cols-6` (cabecera de zonas + filas por down). Escala de color: interpolar entre `#f1f5f9` y `#15803d` (verde) para stopAdj y presión; invertida (rojo = más yardas) para yardsAllowed.
- PressureScatter: `ScatterChart` con `ZAxis dataKey="n" range={[60, 400]}`; una `Scatter` por rushType.

## Colores
- base `#64748b`, blitz `#dc2626`, simulada `#d97706`, métrica principal `#15803d`, fondo `#f8fafc`, texto `#0f172a`.

## Mocks
Escribir JSON realistas que cumplan el contrato (coberturas Cover-3, Cover-1, Cover-2, Quarters, Cover-6, Red Zone, Cover-0, 2-Man; formaciones SHOTGUN, EMPTY, SINGLEBACK, I_FORM, PISTOL, JUMBO; 3 rushTypes; valores 0.4–0.75). Marcar en el encabezado "Datos de ejemplo" cuando USE_MOCKS.

## Formato
- `formatPct(0.684) -> "68 %"`; `formatYds(4.13) -> "4.1 yd"`; `formatN(38) -> "n=38"`.
