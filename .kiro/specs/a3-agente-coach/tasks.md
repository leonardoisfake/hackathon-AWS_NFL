# Tareas: A3 · Agente de IA

- [ ] 1. Crear `backend/app/agent.py` con lectura de AWS_REGION y BEDROCK_MODEL_ID, y una función `_recommend_defense_impl(df, ...)` que arme RecommendRequest y llame a `recommender.recommend`.
  - _Requisitos: 2.1, 4.2_
- [ ] 2. Implementar `build_agent(df)` que cree la herramienta `recommend_defense` (decorada con `@tool`, docstring en español con reglas de conversión) cerrando sobre `captured`, el BedrockModel y el Agent con el system prompt del diseño.
  - _Requisitos: 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.3_
- [ ] 3. Implementar `ask(question, df) -> dict` con timeout de 20 s y respuesta de respaldo ante cualquier excepción.
  - _Requisitos: 1.2, 4.1_
- [ ] 4. Agregar `POST /api/ask` en main.py usando AskRequest/AskResponse.
  - _Requisitos: 1.1_
- [ ] 5. Escribir `backend/tests/test_agent.py` (sin credenciales → usedAI false; impl directa → forma válida) y correr `uv run pytest`.
  - _Requisitos: 5.1, 5.2_
- [ ] 6. Prueba manual con las llaves del evento exportadas en la terminal: 3 preguntas (3.º y largo con Empty; red zone ganando por 3; 1.º y 10 en campo propio sin más datos) y revisar que cite n y no invente números.
  - _Requisitos: 3.1, 3.2, 3.3_
