# Tareas: A2 · API y recomendador

- [ ] 1. Crear `backend/app/data.py` con carga cacheada de plays_features.csv, `set_df` para tests y manejo de archivo inexistente.
  - _Requisitos: 1.1, 1.2_
- [ ] 2. Crear `backend/app/schemas.py` con los modelos Pydantic del contrato y sus validaciones de rango.
  - _Requisitos: 5.1, 7.2_
- [ ] 3. Crear `backend/app/metrics.py` con `apply_filters`, `summarize` (K = 20), `aggregate` con groupBy/splitBy y etiquetas en español; convertir a tipos nativos.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 7.2_
- [ ] 4. Crear `backend/app/main.py` con FastAPI, CORS para localhost:5173 y los endpoints /api/health, /api/filters y /api/stats.
  - _Requisitos: 1.3, 2.1, 3.1, 7.1_
- [ ] 5. Agregar /api/heatmap (downBucket × fieldZone, value null si n < 10).
  - _Requisitos: 4.1_
- [ ] 6. Crear `backend/app/recommender.py` con la relajación de 5 niveles, agrupación coverage + rushType, top 3, avoid y deltaVsBaseline; exponer POST /api/recommend.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
- [ ] 7. Escribir `backend/tests/test_api.py` con el DataFrame fabricado y los 5 casos del diseño; correr `uv run pytest`.
  - _Requisitos: 7.3_
- [ ] 8. Probar a mano con el dataset real: `uv run uvicorn app.main:app --reload --port 8000` (o el comando del template) y abrir /docs; revisar 3 situaciones (3.º y largo, red zone, 1.º y 10 en campo propio).
  - _Requisitos: 5.2_
- [ ] 9. (Opcional) GET /api/team/{team}/tendencies con mezcla de coberturas y llamada más frecuente por situación.
  - _Requisitos: 6.1_
