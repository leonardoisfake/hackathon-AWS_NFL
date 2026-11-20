---
inclusion: fileMatch
fileMatchPattern: "backend/**"
---

# Reglas del backend (Rol A)

- FastAPI con rutas bajo `/api`. Modelos de entrada/salida en `backend/app/schemas.py` (Pydantic v2), iguales a `api-contract.md`.
- Los datos se cargan **una sola vez** al iniciar (lifespan o carga perezosa cacheada) desde `data/processed/plays_features.csv`, resolviendo la ruta relativa al archivo (`Path(__file__).resolve()`), nunca con rutas absolutas de la laptop.
- Si `plays_features.csv` no existe, el backend debe arrancar igual y `/api/health` debe responder `{"status": "no_data"}` con un mensaje claro.
- Las funciones de cálculo (features, métricas, recomendador) son **puras** y no dependen de FastAPI, para poder probarlas con pytest.
- Convertir tipos numpy a tipos nativos de Python antes de responder (int, float, bool, None). NaN → null.
- CORS habilitado para `http://localhost:5173` en desarrollo.
- Endpoints síncronos (`def`) están bien; el dataset es pequeño.
- Pruebas en `backend/tests/` con pytest y `fastapi.testclient.TestClient`. Usar un DataFrame pequeño fabricado en el test (no depender del dataset real).
- Prohibido: escribir credenciales, imprimir variables de entorno, agregar dependencias.
