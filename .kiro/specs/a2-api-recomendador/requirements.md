# Requisitos: A2 · API y recomendador (Rol A)

## Introducción
Exponer `plays_features.csv` mediante FastAPI con los endpoints de `api-contract.md`: filtros, estadísticas agrupadas, mapa de calor y la recomendación del Modo Coach con ajuste por muestra pequeña y relajación de filtros.

## Requisito 1: Arranque y salud
1. WHEN arranca el backend THEN el sistema SHALL cargar `data/processed/plays_features.csv` una sola vez.
2. IF el archivo no existe THEN el sistema SHALL arrancar igual y `GET /api/health` SHALL responder `{"status": "no_data", "plays": 0}`.
3. WHEN existe THEN `GET /api/health` SHALL responder `{"status": "ok", "plays": <n>}`.

## Requisito 2: Opciones de filtro
1. `GET /api/filters` SHALL devolver FilterOptions con valores reales del dataset; coberturas y formaciones ordenadas por frecuencia.

## Requisito 3: Estadísticas agrupadas
1. `GET /api/stats` SHALL aceptar `groupBy` (coverage, rushType, combo, coverageType), `splitBy` opcional (distBucket, downBucket, fieldZone) y los filtros opcionales del contrato.
2. Cada fila SHALL incluir las métricas de `domain.md` con `stopAdj` ajustado hacia el stopRate del conjunto filtrado (K = 20) y `lowSample` = n < 15.
3. Las filas SHALL venir ordenadas por stopAdj descendente y con `label` en español.
4. IF los filtros dejan 0 jugadas THEN SHALL responder 200 con `rows: []` y baseline n = 0.

## Requisito 4: Mapa de calor
1. `GET /api/heatmap` SHALL devolver una celda por cada combinación downBucket × fieldZone con `value` de la métrica pedida y `n`; `value` = null si n < 10.

## Requisito 5: Recomendación
**Historia:** Como coordinador defensivo, quiero ingresar la situación y recibir las 3 mejores combinaciones cobertura + presión con su confiabilidad, para decidir en segundos.

1. `POST /api/recommend` SHALL convertir la situación a buckets con las mismas funciones de `features.py`.
2. El sistema SHALL buscar jugadas similares con relajación progresiva hasta tener al menos 30 jugadas: nivel 0 todos los filtros (down, distancia, zona, marcador, twoMinute, formación y equipo si vienen); nivel 1 sin equipo; nivel 2 sin formación; nivel 3 sin marcador ni twoMinute; nivel 4 solo down y distancia.
3. Dentro de las jugadas similares, SHALL agrupar por coverage + rushType, descartar grupos con n < 10, calcular stopAdj hacia el stopRate de las jugadas similares y devolver las 3 mejores en `options` y la peor en `avoid`.
4. Cada opción SHALL incluir `deltaVsBaseline` = stopAdj − baselineStop.
5. La respuesta SHALL incluir `matchLevel`, `matchLabel` en español y `nSimilar`.
6. IF ningún grupo llega a n ≥ 10 ni en el nivel 4 THEN SHALL responder con `options: []` y un matchLabel que lo explique.

## Requisito 6: Tendencias de equipo (opcional, solo si sobra tiempo)
1. `GET /api/team/{team}/tendencies` SHALL devolver la mezcla de coberturas del equipo y, para las situaciones "1.º down", "2.º y largo", "3.º y corto", "3.º y media", "3.º y largo" y "Red zone", la llamada más frecuente (coverage + rushType) con su porcentaje y n.

## Requisito 7: Calidad
1. CORS SHALL permitir `http://localhost:5173`.
2. Todas las respuestas SHALL ser JSON nativo (sin tipos numpy; NaN → null).
3. Pruebas pytest con TestClient para health, stats, heatmap y recommend usando un DataFrame fabricado.
