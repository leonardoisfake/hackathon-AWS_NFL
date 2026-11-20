# Tareas: A1 · Tabla de features

- [ ] 1. Crear `backend/app/features.py` con el diccionario `COLS`, `load_raw(raw_dir)` y `validate_columns(tables)` que lance ValueError en español listando archivo y columnas faltantes.
  - _Requisitos: 1.1, 1.2_
- [ ] 2. Implementar `filter_valid_plays` y el conteo de descartes por motivo.
  - _Requisitos: 2.1, 2.2_
- [ ] 3. Implementar funciones de situación (`yards_to_endzone`, `dist_bucket`, `field_zone`, `score_bucket`, `clock_to_seconds`) y `add_situation(plays, games)` vectorizado, con scoreDiff desde la defensa.
  - _Requisitos: 3.1, 3.2_
- [ ] 4. Implementar `compute_rush(scouting, players)` con rushers, rushType (base/blitz/simulada) y pressure; unir a plays con inner join y contar descartes.
  - _Requisitos: 4.1, 4.2_
- [ ] 5. Implementar `add_outcomes(plays)` (sack, interception, fumble por texto, offenseSuccess, stop, turnoverOrSack).
  - _Requisitos: 5.1_
- [ ] 6. Implementar `add_sequence(plays)` con prevCoverage y prevRushType por gameId + defensiveTeam ordenado por playId.
  - _Requisitos: 6.1_
- [ ] 7. Crear `scripts/build_features.py` con argumento `--raw-dir` (default `data/raw`), que guarde `data/processed/plays_features.csv` con las columnas del diseño e imprima el resumen y los chequeos de cordura.
  - _Requisitos: 1.3, 7.1, 7.2_
- [ ] 8. Escribir `backend/tests/test_features.py` con casos fabricados: TB 33 con posesión TB → 67; DAL 20 con posesión TB → 20; yardline 50 → 50; distBucket 3/4/8; fieldZone 80/50/21/6/5; scoreBucket −9/−1/0/8/9; rushType blitz, simulada y base; offenseSuccess en 1.º, 2.º y 3.º down.
  - _Requisitos: 8.1_
- [ ] 9. Ejecutar el script con el dataset real, revisar el resumen y corregir el mapeo si algún chequeo de cordura falla. Ejecutar `uv run pytest`.
  - _Requisitos: 7.2_
