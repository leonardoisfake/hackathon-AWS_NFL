---
inclusion: fileMatch
fileMatchPattern: "dashboard/**"
---

# Reglas del frontend (Rol B)

- React 18 + TypeScript + Vite + Tailwind + Recharts. Sin router: navegación por pestañas con `useState`.
- Sin librerías nuevas: nada de axios, react-query, MUI, shadcn, etc. Usar `fetch`.
- Tipos del contrato en `src/types.ts` (copiar de `api-contract.md`). Cliente en `src/api.ts` con una función por endpoint.
- `src/api.ts` tiene un interruptor `USE_MOCKS` (por defecto toma `import.meta.env.VITE_USE_MOCKS === "true"`). En modo mocks devuelve los JSON de `src/mocks/` con un pequeño retraso simulado.
- Llamar rutas relativas **sin diagonal inicial**: `fetch('api/stats')`, nunca `fetch('/api/stats')` (la app se publica en una subruta y la diagonal inicial daría 404). Lo mismo aplica a imágenes, fuentes y CSS: nada de `url('/...')`. En `vite.config.ts`, proxy de `/api` a `http://localhost:8000`.
- Todos los textos visibles en **español**. Porcentajes con 0 decimales ("68 %"); yardas con 1 decimal.
- Junto a cada porcentaje mostrar `n` (p. ej. "68 % · n=38"). Grupos con `lowSample` atenuados (opacidad 40 %) y con la nota "muestra pequeña".
- Estados de carga, error y vacío en cada vista. Un error nunca deja la pantalla en blanco.
- Diseño legible en proyector: fuente base ≥ 16 px, alto contraste, máximo 3 colores de acento.
- Colores fijos por rushType en todas las gráficas: base = slate/gris azulado, blitz = rojo, simulada = ámbar. Métrica principal (stopAdj) en verde.
- Gráficas: Recharts (`BarChart`, `ScatterChart`, `ResponsiveContainer`, `Tooltip`). El mapa de calor se hace con una cuadrícula CSS de Tailwind (Recharts no trae heatmap).
- Componentes pequeños en `src/components/`, vistas en `src/pages/`.
