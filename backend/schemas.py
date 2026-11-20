"""Modelos Pydantic del contrato (.kiro/steering/api-contract.md). Campos en camelCase."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RushType = Literal["base", "blitz", "simulada"]
DownBucket = Literal["1", "2", "3", "4"]
DistBucket = Literal["corta", "media", "larga"]
FieldZone = Literal["propio_fondo", "propio", "rival", "red_zone", "goal_line"]
ScoreBucket = Literal["perdiendo_9+", "perdiendo_1_8", "empate", "ganando_1_8", "ganando_9+"]


class Metrics(BaseModel):
    n: int
    stopRate: float
    stopAdj: float
    pressureRate: float
    turnoverSackRate: float
    yardsAllowed: float
    complPct: float | None
    lowSample: bool


class FilterOptions(BaseModel):
    teams: list[str]
    coverages: list[str]
    rushTypes: list[RushType]
    formations: list[str]
    downBuckets: list[DownBucket]
    distBuckets: list[DistBucket]
    fieldZones: list[FieldZone]
    scoreBuckets: list[ScoreBucket]
    totalPlays: int


class StatsRow(Metrics):
    key: str
    label: str
    coverage: str | None = None
    rushType: RushType | None = None
    defFormation: str | None = None
    split: str | None = None


class Baseline(BaseModel):
    n: int
    stopRate: float


class StatsResponse(BaseModel):
    baseline: Baseline
    rows: list[StatsRow]


class HeatmapCell(BaseModel):
    down: DownBucket
    fieldZone: FieldZone
    value: float | None
    n: int


class HeatmapResponse(BaseModel):
    metric: Literal["stopAdj", "pressureRate", "yardsAllowed"]
    cells: list[HeatmapCell]


class RecommendRequest(BaseModel):
    down: int = Field(ge=1, le=4)
    yardsToGo: int = Field(ge=1, le=99)
    yardsToEndzone: int = Field(ge=1, le=99)
    scoreDiff: int = Field(ge=-60, le=60)
    quarter: int = Field(ge=1, le=5)
    secondsLeft: int = Field(ge=0, le=900)
    offenseFormation: str | None = None
    team: str | None = None


class RecommendOption(Metrics):
    coverage: str
    rushType: RushType
    label: str
    deltaVsBaseline: float


class Situation(BaseModel):
    downBucket: DownBucket
    distBucket: DistBucket
    fieldZone: FieldZone
    scoreBucket: ScoreBucket
    twoMinute: bool


class RecommendResponse(BaseModel):
    situation: Situation
    matchLevel: int
    matchLabel: str
    nSimilar: int
    baselineStop: float
    options: list[RecommendOption]
    avoid: RecommendOption | None


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


class AskResponse(BaseModel):
    answer: str
    usedAI: bool
    recommendation: RecommendResponse | None
    error: str | None
