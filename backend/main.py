"""API del DC Copilot. Ejecuta desde la raíz: .venv/bin/uvicorn backend.main:app --reload"""
from __future__ import annotations

from typing import Literal

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import metrics
from .agent import ask
from .data import get_df
from .recommender import recommend
from .schemas import (
    AskRequest, AskResponse, DistBucket, DownBucket, FieldZone, FilterOptions, HeatmapResponse, RecommendRequest,
    ProfileGroupBy, ProfileResponse, RecommendResponse, RushType, ScoreBucket, StatsResponse,
)

app = FastAPI(title="Hackathon NFL UNAM")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_df() -> pd.DataFrame:
    df = get_df()
    if df is None:
        raise HTTPException(
            status_code=503,
            detail="Sin datos: ejecuta scripts/build_features.py para generar plays_features.csv",
        )
    return df


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/health")
def api_health() -> dict:
    df = get_df()
    if df is None:
        return {"status": "no_data", "plays": 0, "message": "Falta data/processed/plays_features.csv"}
    return {"status": "ok", "plays": len(df)}


@app.get("/api/filters", response_model=FilterOptions)
def filters(df: pd.DataFrame = Depends(require_df)) -> dict:
    return metrics.filter_options(df)


@app.get("/api/stats", response_model=StatsResponse, response_model_exclude_unset=True)
def stats(
    groupBy: Literal["coverage", "rushType", "combo", "coverageType", "defFormation"],
    splitBy: Literal["distBucket", "downBucket", "fieldZone"] | None = None,
    down: DownBucket | None = None,
    distBucket: DistBucket | None = None,
    fieldZone: FieldZone | None = None,
    scoreBucket: ScoreBucket | None = None,
    team: str | None = None,
    formation: str | None = None,
    twoMinute: bool | None = None,
    df: pd.DataFrame = Depends(require_df),
) -> dict:
    sub = metrics.apply_filters(
        df, down=down, distBucket=distBucket, fieldZone=fieldZone, scoreBucket=scoreBucket,
        team=team, formation=formation, twoMinute=twoMinute,
    )
    return {"baseline": metrics.baseline_of(sub), "rows": metrics.aggregate(sub, groupBy, splitBy)}


@app.get("/api/heatmap", response_model=HeatmapResponse)
def heatmap(
    metric: Literal["stopAdj", "pressureRate", "yardsAllowed"] = Query(...),
    coverage: str | None = None,
    rushType: RushType | None = None,
    team: str | None = None,
    distBucket: DistBucket | None = None,
    scoreBucket: ScoreBucket | None = None,
    formation: str | None = None,
    twoMinute: bool | None = None,
    df: pd.DataFrame = Depends(require_df),
) -> dict:
    # down y fieldZone no se filtran: son los ejes del mapa.
    sub = metrics.apply_filters(
        df, coverage=coverage, rushType=rushType, team=team, distBucket=distBucket,
        scoreBucket=scoreBucket, formation=formation, twoMinute=twoMinute,
    )
    return {"metric": metric, "cells": metrics.heatmap(sub, metric)}


@app.get("/api/profile", response_model=ProfileResponse)
def profile_endpoint(
    groupBy: ProfileGroupBy,
    key: str = Query(..., min_length=1, max_length=80),
    down: DownBucket | None = None,
    distBucket: DistBucket | None = None,
    fieldZone: FieldZone | None = None,
    scoreBucket: ScoreBucket | None = None,
    team: str | None = None,
    formation: str | None = None,
    twoMinute: bool | None = None,
    df: pd.DataFrame = Depends(require_df),
) -> dict:
    if metrics.select_play(df, groupBy, key).empty:
        raise HTTPException(status_code=404, detail=f"No hay jugadas de '{key}' para groupBy={groupBy}")
    sub = metrics.apply_filters(
        df, down=down, distBucket=distBucket, fieldZone=fieldZone, scoreBucket=scoreBucket,
        team=team, formation=formation, twoMinute=twoMinute,
    )
    return metrics.profile(sub, groupBy, key)


@app.post("/api/recommend", response_model=RecommendResponse)
def recommend_endpoint(req: RecommendRequest, df: pd.DataFrame = Depends(require_df)) -> dict:
    return recommend(df, req.model_dump())


@app.post("/api/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest, df: pd.DataFrame = Depends(require_df)) -> dict:
    return ask(req.question, df)
