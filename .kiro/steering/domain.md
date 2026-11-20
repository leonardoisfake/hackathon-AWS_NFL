---
inclusion: always
---

# Dominio: datos, definiciones y métricas

## Dataset (solo jugadas de PASE; no hay carreras ni patadas)
| Archivo | Llave | Columnas que usamos |
|---|---|---|
| games.csv | gameId | homeTeamAbbr, visitorTeamAbbr |
| plays.csv | gameId + playId | quarter, gameClock ("MM:SS"), down, yardsToGo, possessionTeam, defensiveTeam, yardlineSide, yardlineNumber, preSnapHomeScore, preSnapVisitorScore, passResult, playResult, offenseFormation, personnelO, defendersInBox, pff_passCoverage, pff_passCoverageType, pff_playAction, playDescription |
| pffScoutingData.csv | gameId + playId + nflId | pff_role, pff_hit, pff_hurry, pff_sack |
| players.csv | nflId | officialPosition |
| tracking_*.csv | + frameId | NO se usa (pesado) |

Valores esperados de passResult: C (completo), I (incompleto), S (sack), IN (intercepción), R (scramble).
Valores esperados de pff_role: "Pass", "Pass Block", "Pass Route", "Pass Rush", "Coverage".
pff_passCoverageType: "Man", "Zone", "Other". pff_passCoverage: p. ej. "Cover-0", "Cover-1", "Cover-2", "Cover-3", "Quarters", "Cover-6", "2-Man", "Red Zone", "Goal Line", "Prevent", "Bracket", "Miscellaneous" (confirmar con los datos reales).

**Todos los nombres de columnas se mapean en un solo diccionario `COLS` en `backend/app/features.py`.** Si el dataset real usa otro nombre, solo se cambia ahí.

## Jugadas válidas
Se conservan jugadas con passResult ∈ {C, I, S, IN, R} y pff_passCoverage no nulo.

## Variables derivadas (nombres exactos de columna en plays_features.csv)
- `yardsToEndzone` (1–99): si yardlineNumber == 50 o yardlineSide vacío → 50; si yardlineSide == possessionTeam → 100 − yardlineNumber; si no → yardlineNumber.
- `downBucket`: "1", "2", "3", "4".
- `distBucket`: "corta" (yardsToGo ≤ 3), "media" (4–7), "larga" (≥ 8).
- `fieldZone`: "propio_fondo" (yardsToEndzone ≥ 80), "propio" (50–79), "rival" (21–49), "red_zone" (6–20), "goal_line" (≤ 5).
- `scoreDiff`: puntos de la defensa − puntos de la ofensiva antes del snap (usar homeTeamAbbr para saber de quién es cada marcador).
- `scoreBucket`: "perdiendo_9+" (≤ −9), "perdiendo_1_8" (−8 a −1), "empate" (0), "ganando_1_8" (1 a 8), "ganando_9+" (≥ 9). Siempre desde la perspectiva de la DEFENSA.
- `secondsLeftQuarter`: gameClock convertido a segundos.
- `twoMinute`: True si quarter ∈ {2, 4} y secondsLeftQuarter ≤ 120.
- `coverage` = pff_passCoverage; `coverageType` = pff_passCoverageType.
- `rushers`: número de defensores con pff_role == "Pass Rush" en la jugada.
- `rushType`:
  - "blitz" si rushers ≥ 5.
  - "simulada" si rushers ≤ 4 Y al menos un presionador NO es DL (officialPosition ∉ {DE, DT, NT}) Y al menos un DL (DE/DT/NT) tiene pff_role == "Coverage".
  - "base" en cualquier otro caso.
- `pressure`: True si algún defensor tiene pff_hit, pff_hurry o pff_sack == 1.
- `sack` (passResult == "S"), `interception` (passResult == "IN"), `fumble` ("FUMBLE" en playDescription, sin importar mayúsculas).
- `offenseSuccess`: down 1 → playResult ≥ 0.4 × yardsToGo; down 2 → ≥ 0.6 × yardsToGo; down 3 o 4 → ≥ yardsToGo.
- `stop`: NOT offenseSuccess OR sack OR interception OR fumble.
- `turnoverOrSack`: sack OR interception OR fumble.
- `prevCoverage`, `prevRushType`: cobertura y presión de la jugada anterior de la MISMA defensa en el MISMO partido (orden por playId). Vacío en la primera.

## Métricas (para cualquier grupo de jugadas)
- `n` = número de jugadas.
- `stopRate` = media de stop.
- `stopAdj` (Stop Rate ajustado por muestra) = (stops + K × base) / (n + K), con **K = 20** y `base` = stopRate del conjunto filtrado de referencia (la situación consultada o el filtro activo).
- `pressureRate` = media de pressure.
- `turnoverSackRate` = media de turnoverOrSack.
- `yardsAllowed` = media de playResult.
- `complPct` = C ÷ (C + I + IN). Si el denominador es 0 → null.
- `lowSample` = n < 15. En gráficas, los grupos con lowSample se muestran atenuados; en recomendaciones no se usan grupos con n < 10.
- Todas las tasas son fracciones 0–1 en la API; el frontend las muestra como %.

## Etiquetas en español para la interfaz
- rushType: base → "4 o menos", blitz → "Blitz (5+)", simulada → "Presión simulada".
- Combinación: "<coverage> + <etiqueta rushType>", p. ej. "Cover-1 + Blitz (5+)".
- fieldZone: propio_fondo → "Propio fondo (dentro de su 20)", propio → "Campo propio", rival → "Campo rival", red_zone → "Red zone", goal_line → "Goal line".
- distBucket: corta → "Corta (1–3)", media → "Media (4–7)", larga → "Larga (8+)".

## Glosario breve (para tooltips)
- Cover-0: hombre a hombre sin ayuda profunda (suele ir con blitz).
- Cover-1: hombre a hombre con 1 profundo.
- Cover-2: zona con 2 profundos. 2-Man: hombre abajo con 2 profundos.
- Cover-3: zona con 3 profundos. Quarters (Cover-4): zona con 4 profundos. Cover-6: mitad Quarters, mitad Cover-2.
- Blitz: 5 o más presionan al mariscal. Presión simulada: mandan 4, pero no los 4 esperados (un linebacker o back presiona y un liniero cae a cubrir).
- Stop Rate: % de jugadas en que la ofensiva no tuvo éxito para su down y distancia.
