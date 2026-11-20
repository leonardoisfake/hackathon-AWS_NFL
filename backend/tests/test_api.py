"""Pruebas del backend con una tabla sintética pequeña (no dependen de data/)."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend import data
from backend.features import field_zone, yards_to_endzone
from backend.main import app
from backend.metrics import K_SMOOTHING, summarize

COVERAGES = ["Cover-1", "Cover-3", "Quarters"]
RUSH = ["base", "blitz", "simulada"]
ZONES = ["propio_fondo", "propio", "rival", "red_zone", "goal_line"]
FORMATIONS = ["Nickel (4-2-5)", "Dime (3-2-6)"]


def synthetic_plays(n: int = 1200, seed: int = 7) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    down = rng.integers(1, 5, n)
    ytg = rng.integers(1, 15, n)
    passres = rng.choice(["C", "I", "S", "IN", "R"], n, p=[0.55, 0.3, 0.07, 0.03, 0.05])
    play_result = rng.integers(-5, 20, n)
    return pd.DataFrame({
        "gameId": rng.integers(1, 20, n), "playId": np.arange(n),
        "defensiveTeam": rng.choice(["DAL", "KC", "TB"], n), "possessionTeam": rng.choice(["BUF", "CHI"], n),
        "quarter": rng.integers(1, 6, n), "secondsLeftQuarter": rng.integers(0, 900, n),
        "twoMinute": rng.random(n) < 0.15, "down": down, "yardsToGo": ytg,
        "yardsToEndzone": rng.integers(1, 100, n), "downBucket": down.astype(str),
        "distBucket": np.select([ytg <= 3, ytg <= 7], ["corta", "media"], "larga"),
        "fieldZone": rng.choice(ZONES, n),
        "scoreBucket": rng.choice(["perdiendo_9+", "perdiendo_1_8", "empate", "ganando_1_8", "ganando_9+"], n),
        "offenseFormation": rng.choice(["SHOTGUN", "EMPTY"], n), "defFormation": rng.choice(FORMATIONS, n),
        "coverage": rng.choice(COVERAGES, n), "coverageType": "Zone", "rushType": rng.choice(RUSH, n),
        "pressure": rng.random(n) < 0.35, "passResult": passres, "playResult": play_result,
        "stop": rng.random(n) < 0.52, "turnoverOrSack": np.isin(passres, ["S", "IN"]),
    })


@pytest.fixture()
def client():
    data.set_df(synthetic_plays())
    yield TestClient(app)
    data.set_df(None)


def test_zona_del_campo_en_tres_casos():
    side = pd.Series(["DAL", "KC", None])
    number = pd.Series([20, 3, 50])
    possession = pd.Series(["DAL", "DAL", "DAL"])
    yte = yards_to_endzone(side, number, possession)
    assert yte.tolist() == [80, 3, 50]
    assert field_zone(yte).tolist() == ["propio_fondo", "goal_line", "propio"]


def test_stop_ajustado_entre_0_y_1_y_encogido_al_promedio():
    df = synthetic_plays()
    base = float(df["stop"].mean())
    small = summarize(df.head(3), base)
    big = summarize(df, base)
    for m in (small, big):
        assert 0.0 <= m["stopAdj"] <= 1.0
    stops = int(df.head(3)["stop"].sum())
    assert small["stopAdj"] == pytest.approx((stops + K_SMOOTHING * base) / (3 + K_SMOOTHING), abs=1e-3)
    assert small["lowSample"] is True


def test_recommend_responde_con_n_mayor_a_cero(client):
    r = client.post("/api/recommend", json={
        "down": 3, "yardsToGo": 8, "yardsToEndzone": 35, "scoreDiff": 0, "quarter": 2, "secondsLeft": 480,
        "offenseFormation": None, "team": None,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["nSimilar"] > 0
    assert len(body["options"]) <= 3


@pytest.mark.parametrize("payload", [
    {"down": 1, "yardsToGo": 10, "yardsToEndzone": 70, "scoreDiff": 3, "quarter": 4, "secondsLeft": 110},
    {"down": 4, "yardsToGo": 1, "yardsToEndzone": 1, "scoreDiff": -20, "quarter": 5, "secondsLeft": 0,
     "offenseFormation": "JUMBO", "team": "ZZZ"},
])
def test_recommend_nunca_da_500(client, payload):
    assert client.post("/api/recommend", json=payload).status_code == 200


def test_profile_desglosa_las_cinco_dimensiones(client):
    r = client.get("/api/profile", params={"groupBy": "defFormation", "key": "Nickel (4-2-5)"})
    assert r.status_code == 200
    body = r.json()
    dims = [b["dimension"] for b in body["breakdowns"]]
    assert dims == ["fieldZone", "downBucket", "offenseTeam", "offenseFormation", "quarter"]
    assert body["overall"]["n"] > 0
    zone_rows = body["breakdowns"][0]["rows"]
    assert sum(r["n"] for r in zone_rows) == body["overall"]["n"]
    assert [r["stopAdj"] for r in zone_rows] == sorted((r["stopAdj"] for r in zone_rows), reverse=True)


def test_profile_combo_y_clave_inexistente(client):
    ok = client.get("/api/profile", params={"groupBy": "combo", "key": "Cover-1|blitz"})
    assert ok.status_code == 200
    assert ok.json()["label"] == "Cover-1 + Blitz (5+)"
    missing = client.get("/api/profile", params={"groupBy": "defFormation", "key": "No existe"})
    assert missing.status_code == 404


def test_heatmap_acepta_filtros_de_marcador_y_formacion(client):
    r = client.get("/api/heatmap", params={"metric": "stopAdj", "scoreBucket": "empate", "formation": "EMPTY"})
    assert r.status_code == 200
    assert len(r.json()["cells"]) == 20
