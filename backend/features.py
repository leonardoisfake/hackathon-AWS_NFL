"""Construcción de la tabla de features por jugada (funciones puras, sin FastAPI).

Las definiciones están en .kiro/steering/domain.md. Los nombres de columnas de los CSV
originales se concentran en COLS: si el dataset cambia, solo se edita aquí.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

DL_POSITIONS = {"DE", "DT", "NT"}
VALID_PASS_RESULTS = ["C", "I", "S", "IN", "R"]

COLS: dict[str, list[str]] = {
    "games": ["gameId", "homeTeamAbbr", "visitorTeamAbbr"],
    "plays": [
        "gameId", "playId", "quarter", "gameClock", "down", "yardsToGo", "possessionTeam",
        "defensiveTeam", "yardlineSide", "yardlineNumber", "preSnapHomeScore",
        "preSnapVisitorScore", "passResult", "playResult", "offenseFormation", "personnelO",
        "defendersInBox", "personnelD", "pff_playAction", "pff_passCoverage",
        "pff_passCoverageType", "playDescription",
    ],
    "scouting": ["gameId", "playId", "nflId", "pff_role", "pff_hit", "pff_hurry", "pff_sack"],
    "players": ["nflId", "officialPosition"],
}
FILES = {
    "games": "games.csv",
    "plays": "plays.csv",
    "scouting": "pffScoutingData.csv",
    "players": "players.csv",
}

# (DL, LB, DB) -> formación de la tabla del coordinador.
DEF_FORMATIONS: dict[tuple[int, int, int], str] = {
    (4, 3, 4): "4-3",
    (3, 4, 4): "3-4",
    (4, 2, 5): "Nickel (4-2-5)",
    (3, 3, 5): "Nickel (3-3-5)",
    (4, 1, 6): "Dime (4-1-6)",
    (3, 2, 6): "Dime (3-2-6)",
    (3, 1, 7): "Quarter (3-1-7)",
    (6, 2, 3): "Goal Line (6-2-3)",
}

FEATURE_COLUMNS = [
    "gameId", "playId", "defensiveTeam", "possessionTeam", "quarter", "secondsLeftQuarter",
    "twoMinute", "down", "yardsToGo", "yardsToEndzone", "downBucket", "distBucket", "fieldZone",
    "scoreDiff", "scoreBucket", "offenseFormation", "personnelO", "defendersInBox", "playAction",
    "defFormation", "defFormationExact", "coverage", "coverageType", "rushers", "rushType",
    "pressure", "passResult", "playResult", "sack", "interception", "fumble", "offenseSuccess",
    "stop", "turnoverOrSack", "prevCoverage", "prevRushType",
]


# ---------------------------------------------------------------- carga y validación
def load_raw(raw_dir: str | Path) -> dict[str, pd.DataFrame]:
    raw = Path(raw_dir)
    missing_files = [f for f in FILES.values() if not (raw / f).exists()]
    if missing_files:
        raise ValueError(f"Faltan archivos en {raw}: {', '.join(missing_files)}")
    return {name: pd.read_csv(raw / fname, low_memory=False) for name, fname in FILES.items()}


def validate_columns(tables: dict[str, pd.DataFrame]) -> None:
    problems = []
    for name, cols in COLS.items():
        missing = [c for c in cols if c not in tables[name].columns]
        if missing:
            problems.append(f"{FILES[name]}: faltan las columnas {', '.join(missing)}")
    if problems:
        raise ValueError("Mapeo de columnas inválido:\n" + "\n".join(problems))


# ---------------------------------------------------------------- funciones puras
def clock_to_seconds(clock: pd.Series) -> pd.Series:
    parts = clock.astype("string").str.extract(r"^\s*(\d+):(\d{2})\s*$").astype(float)
    return parts[0] * 60 + parts[1]


def yards_to_endzone(side: pd.Series, number: pd.Series, possession: pd.Series) -> pd.Series:
    """Yardas que le faltan a la ofensiva para anotar (1 a 99). Medio campo = 50."""
    own = side == possession
    out = np.where(side.isna() | (number == 50), 50, np.where(own, 100 - number, number))
    return pd.Series(out, index=side.index).astype(int)


def dist_bucket(yards_to_go: pd.Series) -> pd.Series:
    return pd.Series(
        np.select([yards_to_go <= 3, yards_to_go <= 7], ["corta", "media"], default="larga"),
        index=yards_to_go.index,
    )


def field_zone(yte: pd.Series) -> pd.Series:
    return pd.Series(
        np.select(
            [yte >= 80, yte >= 50, yte >= 21, yte >= 6],
            ["propio_fondo", "propio", "rival", "red_zone"],
            default="goal_line",
        ),
        index=yte.index,
    )


def score_bucket(diff: pd.Series) -> pd.Series:
    return pd.Series(
        np.select(
            [diff <= -9, diff <= -1, diff == 0, diff <= 8],
            ["perdiendo_9+", "perdiendo_1_8", "empate", "ganando_1_8"],
            default="ganando_9+",
        ),
        index=diff.index,
    )


def offense_success(down: pd.Series, yards_to_go: pd.Series, play_result: pd.Series) -> pd.Series:
    factor = down.map({1: 0.4, 2: 0.6}).fillna(1.0)
    return play_result >= factor * yards_to_go


def group_def_formation(dl: int, lb: int, db: int) -> str:
    """Agrupa una alineación (DL, LB, DB) en una de las 8 formaciones de la tabla."""
    if (dl, lb, db) in DEF_FORMATIONS:
        return DEF_FORMATIONS[(dl, lb, db)]
    if dl >= 5:
        return "Goal Line (6-2-3)"
    if db >= 7:
        return "Quarter (3-1-7)"
    if db == 6:
        return "Dime (4-1-6)" if dl >= 4 else "Dime (3-2-6)"
    if db == 5:
        return "Nickel (4-2-5)" if dl >= 4 else "Nickel (3-3-5)"
    return "4-3" if dl >= 4 else "3-4"


# ---------------------------------------------------------------- pasos del pipeline
def filter_valid_plays(plays: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    discarded: dict[str, int] = {}
    mask_result = plays["passResult"].isin(VALID_PASS_RESULTS)
    discarded["resultado de pase inválido"] = int((~mask_result).sum())
    mask_cov = plays["pff_passCoverage"].notna()
    discarded["sin cobertura"] = int((mask_result & ~mask_cov).sum())
    mask_down = plays["down"].between(1, 4)
    discarded["conversión de 2 puntos (down 0)"] = int((mask_result & mask_cov & ~mask_down).sum())
    return plays[mask_result & mask_cov & mask_down].copy(), discarded


def add_situation(plays: pd.DataFrame, games: pd.DataFrame) -> pd.DataFrame:
    p = plays.merge(games[["gameId", "homeTeamAbbr"]], on="gameId", how="left")
    p["yardsToEndzone"] = yards_to_endzone(p["yardlineSide"], p["yardlineNumber"], p["possessionTeam"])
    p["downBucket"] = p["down"].astype(int).astype(str)
    p["distBucket"] = dist_bucket(p["yardsToGo"])
    p["fieldZone"] = field_zone(p["yardsToEndzone"])
    defense_home = p["defensiveTeam"] == p["homeTeamAbbr"]
    p["scoreDiff"] = np.where(
        defense_home,
        p["preSnapHomeScore"] - p["preSnapVisitorScore"],
        p["preSnapVisitorScore"] - p["preSnapHomeScore"],
    ).astype(int)
    p["scoreBucket"] = score_bucket(p["scoreDiff"])
    p["secondsLeftQuarter"] = clock_to_seconds(p["gameClock"])
    p["twoMinute"] = p["quarter"].isin([2, 4]) & (p["secondsLeftQuarter"] <= 120)
    p["playAction"] = p["pff_playAction"].fillna(0).astype(int)
    p["coverage"] = p["pff_passCoverage"]
    p["coverageType"] = p["pff_passCoverageType"]
    return p.drop(columns=["homeTeamAbbr"])


def add_def_formation(plays: pd.DataFrame) -> pd.DataFrame:
    p = plays.copy()
    parts = p["personnelD"].astype("string").str.extract(r"(\d+) DL, (\d+) LB, (\d+) DB").astype("Int64")
    has = parts[0].notna()
    p["defFormationExact"] = pd.Series(pd.NA, index=p.index, dtype="string")
    p["defFormation"] = pd.Series(pd.NA, index=p.index, dtype="string")
    exact = parts[0].astype(str) + "-" + parts[1].astype(str) + "-" + parts[2].astype(str)
    p.loc[has, "defFormationExact"] = exact[has]
    p.loc[has, "defFormation"] = [
        group_def_formation(int(a), int(b), int(c))
        for a, b, c in zip(parts.loc[has, 0], parts.loc[has, 1], parts.loc[has, 2])
    ]
    return p


def compute_rush(scouting: pd.DataFrame, players: pd.DataFrame) -> pd.DataFrame:
    """Una fila por jugada con rushers, rushType y pressure."""
    s = scouting.merge(players[["nflId", "officialPosition"]], on="nflId", how="left")
    keys = ["gameId", "playId"]
    is_rush = s["pff_role"] == "Pass Rush"
    is_dl = s["officialPosition"].isin(DL_POSITIONS)

    rushers = s[is_rush].groupby(keys).agg(
        rushers=("nflId", "count"),
        nonDlRusher=("officialPosition", lambda x: bool((~x.isin(DL_POSITIONS)).any())),
    )
    dl_drop = (
        s[(s["pff_role"] == "Coverage") & is_dl].groupby(keys).size().rename("dlDrop").to_frame()
    )
    flags = s[["pff_hit", "pff_hurry", "pff_sack"]].fillna(0).eq(1).any(axis=1)
    pressure = flags.groupby([s["gameId"], s["playId"]]).any().rename("pressure").to_frame()

    out = rushers.join(dl_drop, how="left").join(pressure, how="left").reset_index()
    out["dlDrop"] = out["dlDrop"].fillna(0) > 0
    out["pressure"] = out["pressure"].fillna(False).astype(bool)
    out["rushType"] = np.select(
        [out["rushers"] >= 5, (out["rushers"] <= 4) & out["nonDlRusher"] & out["dlDrop"]],
        ["blitz", "simulada"],
        default="base",
    )
    return out[keys + ["rushers", "rushType", "pressure"]]


def add_outcomes(plays: pd.DataFrame) -> pd.DataFrame:
    p = plays.copy()
    p["sack"] = p["passResult"] == "S"
    p["interception"] = p["passResult"] == "IN"
    p["fumble"] = p["playDescription"].astype("string").str.contains("FUMBLE", case=False, na=False)
    p["offenseSuccess"] = offense_success(p["down"], p["yardsToGo"], p["playResult"])
    p["turnoverOrSack"] = p["sack"] | p["interception"] | p["fumble"]
    p["stop"] = ~p["offenseSuccess"] | p["turnoverOrSack"]
    return p


def add_sequence(plays: pd.DataFrame) -> pd.DataFrame:
    p = plays.sort_values(["gameId", "defensiveTeam", "playId"]).copy()
    g = p.groupby(["gameId", "defensiveTeam"])
    p["prevCoverage"] = g["coverage"].shift(1)
    p["prevRushType"] = g["rushType"].shift(1)
    return p


def build_features(raw_dir: str | Path) -> tuple[pd.DataFrame, dict[str, int]]:
    tables = load_raw(raw_dir)
    validate_columns(tables)
    plays, discarded = filter_valid_plays(tables["plays"])
    plays = add_situation(plays, tables["games"])
    plays = add_def_formation(plays)
    rush = compute_rush(tables["scouting"], tables["players"])
    before = len(plays)
    plays = plays.merge(rush, on=["gameId", "playId"], how="inner")
    discarded["sin pass rushers en scouting"] = before - len(plays)
    plays = add_outcomes(plays)
    plays = add_sequence(plays)
    plays = plays.sort_values(["gameId", "playId"])
    return plays[FEATURE_COLUMNS].reset_index(drop=True), discarded
