"""Carga única de plays_features.csv. La ruta es relativa a este archivo."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

FEATURES_PATH = Path(__file__).resolve().parents[1] / "data" / "processed" / "plays_features.csv"

_df: pd.DataFrame | None = None


def get_df() -> pd.DataFrame | None:
    """Devuelve la tabla cacheada, o None si el archivo todavía no existe."""
    global _df
    if _df is None and FEATURES_PATH.exists():
        _df = pd.read_csv(FEATURES_PATH, dtype={"downBucket": str}, low_memory=False)
    return _df


def set_df(df: pd.DataFrame | None) -> None:
    """Inyecta un DataFrame (pruebas) o limpia la caché."""
    global _df
    _df = df
