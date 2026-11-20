"""Recomendador del Modo Coach: relajación progresiva de filtros + ajuste por muestra."""
from __future__ import annotations

import pandas as pd

from .features import dist_bucket, field_zone, score_bucket
from .metrics import _num, apply_filters, combo_label, summarize

MIN_SIMILAR = 30
MIN_GROUP = 10

LEVEL_LABELS = {
    0: "Coincidencia exacta",
    1: "Coincidencia sin filtrar por equipo",
    2: "Coincidencia sin filtrar por formación",
    3: "Coincidencia sin filtrar por marcador",
    4: "Solo down y distancia",
}


def to_situation(req: dict) -> dict:
    """Convierte la petición en buckets usando las mismas funciones que build_features."""
    one = lambda v: pd.Series([v])  # noqa: E731
    return {
        "downBucket": str(req["down"]),
        "distBucket": str(dist_bucket(one(req["yardsToGo"])).iloc[0]),
        "fieldZone": str(field_zone(one(req["yardsToEndzone"])).iloc[0]),
        "scoreBucket": str(score_bucket(one(req["scoreDiff"])).iloc[0]),
        "twoMinute": bool(req["quarter"] in (2, 4) and req["secondsLeft"] <= 120),
    }


def _level_filters(sit: dict, req: dict) -> list[tuple[int, dict]]:
    full = {
        "down": sit["downBucket"],
        "distBucket": sit["distBucket"],
        "fieldZone": sit["fieldZone"],
        "scoreBucket": sit["scoreBucket"],
        "twoMinute": sit["twoMinute"],
    }
    levels: list[tuple[int, dict]] = [
        (0, {**full, "formation": req.get("offenseFormation"), "team": req.get("team")}),
        (1, {**full, "formation": req.get("offenseFormation")}),
        (2, full),
        (3, {k: full[k] for k in ("down", "distBucket", "fieldZone")}),
        (4, {k: full[k] for k in ("down", "distBucket")}),
    ]
    # Se omiten niveles que no cambian nada respecto al anterior (filtros opcionales ausentes).
    unique: list[tuple[int, dict]] = []
    for level, filters in levels:
        clean = {k: v for k, v in filters.items() if v is not None}
        if not unique or clean != unique[-1][1]:
            unique.append((level, clean))
    return unique


def _option(coverage: str, rush_type: str, metrics: dict, base: float) -> dict:
    return {
        **metrics,
        "coverage": coverage,
        "rushType": rush_type,
        "label": combo_label(coverage, rush_type),
        "deltaVsBaseline": _num(metrics["stopAdj"] - base),
    }


def recommend(df: pd.DataFrame, req: dict) -> dict:
    sit = to_situation(req)
    similar = df.iloc[0:0]
    used_level = 4
    for level, filters in _level_filters(sit, req):
        similar = apply_filters(df, **filters)
        used_level = level
        if len(similar) >= MIN_SIMILAR:
            break

    base = float(similar["stop"].mean()) if len(similar) else 0.0
    groups = []
    for (coverage, rush_type), g in similar.groupby(["coverage", "rushType"]):
        if len(g) >= MIN_GROUP:
            groups.append(_option(coverage, rush_type, summarize(g, base), base))
    groups.sort(key=lambda o: o["stopAdj"], reverse=True)

    label = LEVEL_LABELS[used_level]
    if not groups:
        label = "Sin jugadas similares suficientes: ningún grupo llega a 10 jugadas"
    return {
        "situation": sit,
        "matchLevel": used_level,
        "matchLabel": label,
        "nSimilar": len(similar),
        "baselineStop": _num(base),
        "options": groups[:3],
        "avoid": groups[-1] if len(groups) >= 4 else None,
    }
