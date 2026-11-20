---
inclusion: always
---
# Estructura del proyecto y dueños

> Ajustada al template real (creado por setup.sh). Donde una spec diga `frontend/` léase `dashboard/`, y donde diga `backend/app/` léase `backend/` (ver nota abajo).

```
data/                       # CSV originales del dataset, directamente aquí (NO hay data/raw)
  games.csv  plays.csv  pffScoutingData.csv  players.csv
  tracking/                 # tracking_[gameId].csv (~800 MB; NO se usa en el MVP; NO subir a git)
  processed/                # (Rol A) plays_features.csv, 1 fila por jugada
scripts/                    # (Rol A) build_features.py, explore_findings.py
backend/                    # Rol A. Contrato del template: backend/main.py expone `app` y GET /health
  main.py                   # FastAPI: /health + endpoints /api/*
  features.py  data.py  metrics.py  recommender.py  agent.py  schemas.py   # módulos de A (planos, junto a main.py)
  tests/
dashboard/                  # Rol B. Vite + React + TS + Tailwind. `vite build` genera dashboard/dist
  index.html  package.json  vite.config.ts  tailwind.config.js  tsconfig.json
  src/
    main.tsx  App.tsx  index.css
    api.ts                  # cliente de la API (+ modo mocks)
    types.ts                # tipos del contrato (espejo de api-contract.md)
    labels.ts               # etiquetas en español, glosario, formato
    mocks/                  # JSON de ejemplo para trabajar sin backend
    content/findings.ts     # textos de la pestaña Hallazgos
    components/
    pages/                  # CoachMode, Explorer, Findings, TeamProfile
README.md
.hackathon/                 # setup.sh, stack.json, rules.md (del template; no tocar)
```

## Dueños (para no pisarse en git)
- **Rol A (datos/backend):** `data/`, `scripts/`, `backend/`.
- **Rol B (frontend/producto):** `dashboard/`, `README.md`, `docs/`.
- `.kiro/steering/api-contract.md` es compartido: cualquier cambio se avisa al otro antes de hacerlo.

## Despliegue (del template)
- AWS sirve `dashboard/dist` y la API en la misma URL y puerto: el frontend llama rutas relativas `/api/...`.
- Desarrollo: Vite en `:5173` con proxy de `/api` a `http://localhost:8000`; backend con `.venv/bin/uvicorn backend.main:app --reload`.

## Git
- Commits pequeños y frecuentes; `git pull --rebase` antes de `git push`.
- En `.gitignore`: `.env`, `node_modules/`, `.venv/`, `dist/`. **Pendiente (Rol A): agregar `data/tracking/`** (~800 MB) y decidir con los organizadores si `data/*.csv` y `plays_features.csv` pueden subirse al repo público.
