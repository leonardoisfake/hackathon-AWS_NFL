"""Filtros, métricas y agregaciones sobre plays_features (funciones puras)."""
from __future__ import annotations

import math

import pandas as pd

K_SMOOTHING = 20
LOW_SAMPLE = 15
MIN_CELL = 10

RUSH_TYPES = ["base", "blitz", "simulada"]
DOWN_BUCKETS = ["1", "2", "3", "4"]
DIST_BUCKETS = ["corta", "media", "larga"]
FIELD_ZONES = ["propio_fondo", "propio", "rival", "red_zone", "goal_line"]
SCORE_BUCKETS = ["perdiendo_9+", "perdiendo_1_8", "empate", "ganando_1_8", "ganando_9+"]

RUSH_LABELS = {"base": "4 o menos", "blitz": "Blitz (5+)", "simulada": "Presión simulada"}
COVERAGE_TYPE_LABELS = {"Man": "Hombre", "Zone": "Zona", "Other": "Otra"}
SPLIT_COLUMNS = {"distBucket": "distBucket", "downBucket": "downBucket", "fieldZone": "fieldZone"}


def _num(x: float | None, digits: int = 3) -> float | None:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), digits)


def combo_label(coverage: str, rush_type: str) -> str:
    return f"{coverage} + {RUSH_LABELS[rush_type]}"


def apply_filters(
    df: pd.DataFrame,
    *,
    down: str | None = None,
    distBucket: str | None = None,
    fieldZone: str | None = None,
    scoreBucket: str | None = None,
    team: str | None = None,
    formation: str | None = None,
    twoMinute: bool | None = None,
    coverage: str | None = None,
    rushType: str | None = None,
) -> pd.DataFrame:
    """Todos los filtros son opcionales. `team` es la defensa; `formation`, la ofensiva."""
    mask = pd.Series(True, index=df.index)
    if down:
        mask &= df["downBucket"] == down
    if distBucket:
        mask &= df["distBucket"] == distBucket
    if fieldZone:
        mask &= df["fieldZone"] == fieldZone
    if scoreBucket:
        mask &= df["scoreBucket"] == scoreBucket
    if team:
        mask &= df["defensiveTeam"] == team
    if formation:
        mask &= df["offenseFormation"] == formation
    if twoMinute is not None:
        mask &= df["twoMinute"] == twoMinute
    if coverage:
        mask &= df["coverage"] == coverage
    if rushType:
        mask &= df["rushType"] == rushType
    return df[mask]


def summarize(group: pd.DataFrame, base: float) -> dict:
    """Métricas de un grupo. `base` es el stopRate del conjunto de referencia."""
    n = len(group)
    stops = int(group["stop"].sum())
    counts = group["passResult"].value_counts()
    attempts = int(counts.get("C", 0) + counts.get("I", 0) + counts.get("IN", 0))
    compl = counts.get("C", 0) / attempts if attempts else None
    return {
        "n": n,
        "stopRate": _num(stops / n),
        "stopAdj": _num((stops + K_SMOOTHING * base) / (n + K_SMOOTHING)),
        "pressureRate": _num(group["pressure"].mean()),
        "turnoverSackRate": _num(group["turnoverOrSack"].mean()),
        "yardsAllowed": _num(group["playResult"].mean(), 1),
        "complPct": _num(compl),
        "lowSample": n < LOW_SAMPLE,
    }


def baseline_of(df: pd.DataFrame) -> dict:
    return {"n": len(df), "stopRate": _num(df["stop"].mean()) if len(df) else 0.0}


def aggregate(df: pd.DataFrame, group_by: str, split_by: str | None = None) -> list[dict]:
    """Agrupa y devuelve filas ordenadas por stopAdj descendente."""
    if df.empty:
        return []
    base = float(df["stop"].mean())
    keys = {
        "coverage": ["coverage"],
        "rushType": ["rushType"],
        "combo": ["coverage", "rushType"],
        "coverageType": ["coverageType"],
        "defFormation": ["defFormation"],
    }[group_by]
    data = df.dropna(subset=keys)
    cols = keys + ([SPLIT_COLUMNS[split_by]] if split_by else [])
    rows = []
    for values, g in data.groupby(cols, observed=True):
        values = values if isinstance(values, tuple) else (values,)
        row = summarize(g, base)
        main = dict(zip(keys, values[: len(keys)]))
        if group_by == "combo":
            row.update(
                key=f"{main['coverage']}|{main['rushType']}",
                label=combo_label(main["coverage"], main["rushType"]),
                coverage=main["coverage"],
                rushType=main["rushType"],
            )
        elif group_by == "coverage":
            row.update(key=main["coverage"], label=main["coverage"], coverage=main["coverage"])
        elif group_by == "rushType":
            row.update(key=main["rushType"], label=RUSH_LABELS[main["rushType"]], rushType=main["rushType"])
        elif group_by == "coverageType":
            ct = main["coverageType"]
            row.update(key=ct, label=COVERAGE_TYPE_LABELS.get(ct, ct))
        else:
            row.update(key=main["defFormation"], label=main["defFormation"], defFormation=main["defFormation"])
        if split_by:
            row["split"] = str(values[-1])
        rows.append(row)
    rows.sort(key=lambda r: r["stopAdj"], reverse=True)
    return rows


def heatmap(df: pd.DataFrame, metric: str) -> list[dict]:
    """Una celda por downBucket x fieldZone (siempre 20). value = None si n < 10."""
    base = float(df["stop"].mean()) if len(df) else 0.0
    cells = []
    for down in DOWN_BUCKETS:
        for zone in FIELD_ZONES:
            g = df[(df["downBucket"] == down) & (df["fieldZone"] == zone)]
            n = len(g)
            value = None
            if n >= MIN_CELL:
                value = summarize(g, base)[metric]
            cells.append({"down": down, "fieldZone": zone, "value": value, "n": n})
    return cells


def filter_options(df: pd.DataFrame) -> dict:
    return {
        "teams": sorted(df["defensiveTeam"].dropna().unique().tolist()),
        "coverages": df["coverage"].value_counts().index.tolist(),
        "rushTypes": RUSH_TYPES,
        "formations": df["offenseFormation"].dropna().value_counts().index.tolist(),
        "downBuckets": DOWN_BUCKETS,
        "distBuckets": DIST_BUCKETS,
        "fieldZones": FIELD_ZONES,
        "scoreBuckets": SCORE_BUCKETS,
        "totalPlays": len(df),
    }


# ---------------------------------------------------------------- perfil de una jugada (/api/profile)
PROFILE_DIMENSIONS = [
    ("fieldZone", "fieldZone"),
    ("downBucket", "downBucket"),
    ("offenseTeam", "possessionTeam"),
    ("offenseFormation", "offenseFormation"),
    ("quarter", "quarter"),
]
ZONE_LABELS = {
    "propio_fondo": "Propio fondo",
    "propio": "Campo propio",
    "rival": "Campo rival",
    "red_zone": "Red zone",
    "goal_line": "Goal line",
}
FORMATION_LABELS = {
    "SHOTGUN": "Shotgun", "EMPTY": "Empty", "SINGLEBACK": "Singleback", "I_FORM": "I-Form",
    "PISTOL": "Pistol", "JUMBO": "Jumbo", "WILDCAT": "Wildcat",
}
QUARTER_LABELS = {1: "1.er cuarto", 2: "2.º cuarto", 3: "3.er cuarto", 4: "4.º cuarto", 5: "Tiempo extra"}


def empty_metrics() -> dict:
    return {
        "n": 0, "stopRate": 0.0, "stopAdj": 0.0, "pressureRate": 0.0, "turnoverSackRate": 0.0,
        "yardsAllowed": 0.0, "complPct": None, "lowSample": True,
    }


def select_play(df: pd.DataFrame, group_by: str, key: str) -> pd.DataFrame:
    """Jugadas de la llamada defensiva perfilada. En combo, key = 'Cover-1|blitz'."""
    if group_by == "combo":
        coverage, _, rush_type = key.partition("|")
        return df[(df["coverage"] == coverage) & (df["rushType"] == rush_type)]
    column = "defFormation" if group_by == "defFormation" else "coverage"
    return df[df[column] == key]


def _profile_key_and_label(dimension: str, value: object) -> tuple[str, str]:
    if dimension == "quarter":
        q = int(value)  # type: ignore[arg-type]
        return str(q), QUARTER_LABELS.get(q, f"Cuarto {q}")
    text = str(value)
    if dimension == "fieldZone":
        return text, ZONE_LABELS.get(text, text)
    if dimension == "downBucket":
        return text, f"{text}.º down"
    if dimension == "offenseFormation":
        return text, FORMATION_LABELS.get(text, text)
    return text, text


def profile(df: pd.DataFrame, group_by: str, key: str) -> dict:
    """Desglose de una llamada defensiva por zona, down, rival, formación ofensiva y cuarto.

    `df` ya viene filtrado. La base del ajuste por muestra es el stopRate de la llamada en `df`.
    """
    sel = select_play(df, group_by, key)
    if group_by == "combo":
        coverage, _, rush_type = key.partition("|")
        label = combo_label(coverage, rush_type) if rush_type in RUSH_LABELS else key
    else:
        label = key
    if sel.empty:
        return {
            "groupBy": group_by, "key": key, "label": label, "overall": empty_metrics(),
            "breakdowns": [{"dimension": d, "rows": []} for d, _ in PROFILE_DIMENSIONS],
        }
    base = float(sel["stop"].mean())
    breakdowns = []
    for dimension, column in PROFILE_DIMENSIONS:
        rows = []
        for value, g in sel.dropna(subset=[column]).groupby(column, observed=True):
            row_key, row_label = _profile_key_and_label(dimension, value)
            rows.append({**summarize(g, base), "key": row_key, "label": row_label})
        rows.sort(key=lambda r: r["stopAdj"], reverse=True)
        breakdowns.append({"dimension": dimension, "rows": rows})
    return {
        "groupBy": group_by, "key": key, "label": label,
        "overall": summarize(sel, base), "breakdowns": breakdowns,
    }
