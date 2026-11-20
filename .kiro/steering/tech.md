---
inclusion: always
---

# Stack técnico (FIJO: AWS hospedará la app y solo funciona con este stack)

| Capa | Versión |
|---|---|
| Python / uv | 3.12.12 / 0.11.19 |
| Backend | fastapi 0.115.14, uvicorn 0.34.3, pydantic 2.11.7 |
| Datos | pandas 2.2.3, numpy 2.1.3 |
| Pruebas | pytest 8.3.5, httpx 0.28.1 |
| Node / npm | 22.23.1 / 10.x |
| Frontend | React 18.3.1, Vite 5.4.21, TypeScript 5.7.3, Tailwind CSS 3.4.19, Recharts 3.10.1 |
| IA (opcional) | strands-agents 1.64.0, boto3 1.44.0 (Amazon Nova en Bedrock) |

## Reglas
- **NO agregar dependencias** fuera de esta tabla (nada de scipy, scikit-learn, statsmodels, axios, react-router, librerías de UI, etc.). Si algo parece necesitar una librería nueva, resolverlo con pandas/numpy o con React + Tailwind.
- No cambiar versiones en pyproject.toml ni package.json.
- Python: ejecutar con `uv run ...`. Frontend: `npm run dev` / `npm run build`.
- Usar los comandos y la estructura que trae el template del hackathon (creado por setup.sh). Verificación: `sh .hackathon/setup.sh --check`. Entrega: `sh .hackathon/setup.sh --entregar`.
- **Credenciales solo por variables de entorno** (o archivo `.env` que está en `.gitignore`). Nunca escribir llaves en código, en tests, en README ni en commits.
- El código será público en GitHub: nada de datos personales ni secretos.
- Tipado: type hints en Python; TypeScript estricto en el frontend (sin `any` salvo que sea inevitable).
- Código y nombres de variables en inglés; textos visibles al usuario y comentarios de negocio en español.
- Preferir funciones pequeñas y puras que se puedan probar con pytest.
