# Requisitos: A1 · Tabla de features por jugada (Rol A)

## Introducción
Convertir los CSV del dataset en una sola tabla `data/processed/plays_features.csv` con una fila por jugada de pase y todas las variables de situación, presión y resultado definidas en `domain.md`. Todo lo demás de la app (API, recomendador, IA) lee solo esta tabla.

## Requisito 1: Carga y validación
**Historia:** Como analista, quiero que el script avise de inmediato si falta una columna, para corregir el mapeo en un minuto en lugar de depurar errores raros.

Criterios de aceptación
1. WHEN se ejecuta `uv run python scripts/build_features.py` THEN el sistema SHALL leer games.csv, plays.csv, pffScoutingData.csv y players.csv desde `data/raw/`.
2. IF falta un archivo o una columna del diccionario `COLS` THEN el sistema SHALL terminar con un mensaje en español que liste exactamente qué falta y en qué archivo.
3. El sistema SHALL aceptar una ruta alternativa de datos con el argumento `--raw-dir`.

## Requisito 2: Jugadas válidas
1. El sistema SHALL conservar solo jugadas con passResult ∈ {C, I, S, IN, R} y pff_passCoverage no nulo.
2. El sistema SHALL imprimir cuántas jugadas se descartaron y por qué motivo.

## Requisito 3: Situación de juego
1. El sistema SHALL calcular `yardsToEndzone`, `downBucket`, `distBucket`, `fieldZone`, `scoreDiff`, `scoreBucket`, `secondsLeftQuarter` y `twoMinute` exactamente como se definen en `domain.md`.
2. `scoreDiff` SHALL calcularse desde la perspectiva de la defensa usando homeTeamAbbr/visitorTeamAbbr de games.csv.

## Requisito 4: Presión
1. El sistema SHALL calcular `rushers`, `rushType` (base / blitz / simulada) y `pressure` a partir de pffScoutingData.csv y players.csv según `domain.md`.
2. IF una jugada no tiene filas en pffScoutingData THEN `rushers` SHALL ser nulo y la jugada SHALL descartarse (contada en el resumen).

## Requisito 5: Resultado
1. El sistema SHALL calcular `sack`, `interception`, `fumble`, `offenseSuccess`, `stop` y `turnoverOrSack` según `domain.md`.

## Requisito 6: Secuencia
1. El sistema SHALL calcular `prevCoverage` y `prevRushType` por gameId + defensiveTeam ordenando por playId.

## Requisito 7: Salida y resumen
1. El sistema SHALL guardar `data/processed/plays_features.csv` (crear la carpeta si no existe).
2. El sistema SHALL imprimir un resumen: total de jugadas, % blitz, % simulada, % presión, stopRate global y las 8 coberturas más frecuentes con su n.

## Requisito 8: Pruebas
1. Existirán pruebas pytest para `yardsToEndzone`, `distBucket`, `fieldZone`, `scoreBucket`, `rushType` y `offenseSuccess` con casos pequeños fabricados a mano.
