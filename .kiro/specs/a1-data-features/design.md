# Diseño: A1 · Tabla de features

## Archivos
- `backend/app/features.py`: funciones puras (las importan el script, la API y los tests).
- `scripts/build_features.py`: punto de entrada; lee, llama a features.py, guarda y resume.
- `backend/tests/test_features.py`: pruebas.

## Flujo
```
load_raw(raw_dir) -> dict[str, DataFrame]
validate_columns(tables)                     # usa COLS; lanza ValueError con lista de faltantes
plays = filter_valid_plays(plays)
plays = add_situation(plays, games)          # yardsToEndzone, buckets, scoreDiff, twoMinute
rush  = compute_rush(scouting, players)      # 1 fila por (gameId, playId): rushers, rushType, pressure
plays = plays.merge(rush, on=["gameId","playId"], how="inner")
plays = add_outcomes(plays)                  # sack, interception, fumble, offenseSuccess, stop, turnoverOrSack
plays = add_sequence(plays)                  # prevCoverage, prevRushType
save + print_summary
```

## Mapeo de columnas
Diccionario `COLS` al inicio de features.py, por archivo: `{"plays": [...], "games": [...], "scouting": [...], "players": [...]}` y alias internos, p. ej. `COVERAGE = "pff_passCoverage"`. Cambiar un nombre en un solo lugar.

## Funciones de una sola fila (vectorizar con numpy.where / pd.cut donde se pueda)
- `yards_to_endzone(side, number, possession) -> int`
- `dist_bucket(ytg) -> str`, `field_zone(yte) -> str`, `score_bucket(diff) -> str`
- `clock_to_seconds("MM:SS") -> int` (tolerar "M:SS" y nulos → NaN)
- `offense_success(down, ytg, play_result) -> bool`

## compute_rush
1. Unir scouting con players por nflId para obtener officialPosition.
2. Por jugada: `rushers` = conteo de pff_role == "Pass Rush"; `nonDlRusher` = algún rusher con posición ∉ {DE, DT, NT}; `dlDrop` = algún DE/DT/NT con pff_role == "Coverage"; `pressure` = max de pff_hit, pff_hurry, pff_sack (NaN → 0) > 0.
3. `rushType` = "blitz" si rushers ≥ 5; "simulada" si rushers ≤ 4 & nonDlRusher & dlDrop; si no, "base".

## Columnas finales de plays_features.csv
gameId, playId, defensiveTeam, possessionTeam, quarter, secondsLeftQuarter, twoMinute, down, yardsToGo, yardsToEndzone, downBucket, distBucket, fieldZone, scoreDiff, scoreBucket, offenseFormation, personnelO, defendersInBox, playAction, coverage, coverageType, rushers, rushType, pressure, passResult, playResult, sack, interception, fumble, offenseSuccess, stop, turnoverOrSack, prevCoverage, prevRushType.

`downBucket` se guarda como texto ("1"…"4"). Booleanos como True/False.

## Chequeos de cordura (imprimir advertencia, no fallar)
- % blitz fuera de 10–50 % → "revisar pff_role".
- stopRate global fuera de 35–80 % → "revisar offenseSuccess".
- Más del 10 % de jugadas descartadas → mostrar motivo principal.
