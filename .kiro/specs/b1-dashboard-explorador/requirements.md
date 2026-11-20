# Requisitos: B1 · Estructura del dashboard y Explorador (Rol B)

## Introducción
Construir la estructura del frontend (pestañas, cliente de API con mocks) y la vista **Explorador** con filtros y cuatro gráficas. Debe funcionar desde el minuto uno con datos de ejemplo (mocks) para no depender del backend, y luego conectarse a la API real cambiando un interruptor.

## Requisito 1: Estructura y navegación
1. La app SHALL mostrar un encabezado "DC Copilot · Asistente del coordinador defensivo" y pestañas: Modo Coach, Explorador, Hallazgos y (si existe) Perfil de equipo.
2. La pestaña inicial SHALL ser Modo Coach (en B1 puede ser un marcador de posición).
3. El encabezado SHALL mostrar el total de jugadas analizadas (de /api/filters) o "Datos de ejemplo" si se usan mocks.

## Requisito 2: Cliente de API y mocks
1. `src/types.ts` SHALL replicar los tipos de `api-contract.md`.
2. `src/api.ts` SHALL tener una función por endpoint (getFilters, getStats, getHeatmap, recommend, ask, getTeamTendencies).
3. WHEN `VITE_USE_MOCKS=true` THEN las funciones SHALL devolver JSON de `src/mocks/` con 300 ms de retraso.
4. `dashboard/vite.config.ts` SHALL hacer proxy de `/api` a `http://localhost:8000`.

## Requisito 3: Barra de filtros
1. El Explorador SHALL mostrar selectores de Down, Distancia, Zona, Marcador, Equipo defensivo y Formación ofensiva, con la opción "Todos", llenados desde /api/filters y con etiquetas en español.
2. WHEN cambia un filtro THEN todas las gráficas del Explorador SHALL recargarse con esos filtros.
3. SHALL existir un botón "Limpiar filtros".

## Requisito 4: Gráfica 1 · Stop Rate por cobertura
1. Barras horizontales de stopAdj por cobertura (/api/stats?groupBy=coverage), con línea de referencia en el baseline.
2. Tooltip con stopAdj, n, presión, turnover+sack y yardas permitidas.
3. Grupos con lowSample atenuados.

## Requisito 5: Gráfica 2 · Blitz vs. base vs. simulada
1. Barras agrupadas de stopAdj por rushType con splitBy=distBucket (corta / media / larga), colores fijos por rushType.

## Requisito 6: Gráfica 3 · Mapa de calor down × zona
1. Cuadrícula 4 × 5 (downs × zonas) con /api/heatmap; selector de métrica (Stop Rate ajustado / Presión / Yardas permitidas) y de cobertura.
2. Color de la celda proporcional al valor; texto con valor y n; celdas null en gris con "n<10".

## Requisito 7: Gráfica 4 · Presión vs. yardas
1. Dispersión por combinación (/api/stats?groupBy=combo): x = pressureRate, y = yardsAllowed, tamaño según n, color por rushType. Tooltip con la etiqueta de la combinación.

## Requisito 8: Glosario y estados
1. Un ícono "?" junto a cada término (coberturas, blitz, presión simulada, Stop Rate) SHALL mostrar el texto del glosario de `domain.md`.
2. Cada gráfica SHALL tener estado de carga, de error (mensaje y botón Reintentar) y de vacío ("No hay jugadas con estos filtros").

## Requisito 9: Hallazgos
1. La pestaña Hallazgos SHALL mostrar tarjetas leídas de `src/content/findings.ts` (título, número grande, frase de explicación, n y fuente "Big Data Bowl dataset").
2. En B1 basta con 2 tarjetas de ejemplo marcadas como "pendiente".
