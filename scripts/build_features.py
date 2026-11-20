"""Genera data/processed/plays_features.csv (1 fila por jugada de pase).

Uso desde la raíz del repo:
    .venv\\Scripts\\python.exe scripts\\build_features.py [--raw-dir data]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.features import build_features  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Construye plays_features.csv")
    parser.add_argument("--raw-dir", default=str(ROOT / "data"), help="Carpeta con los CSV originales")
    args = parser.parse_args()

    try:
        df, discarded = build_features(args.raw_dir)
    except ValueError as e:
        print(f"ERROR: {e}")
        return 1

    out = ROOT / "data" / "processed" / "plays_features.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)

    print(f"Jugadas guardadas: {len(df)} -> {out}")
    for reason, n in discarded.items():
        if n:
            print(f"  descartadas por {reason}: {n}")
    print(f"% blitz: {(df.rushType == 'blitz').mean():.1%} | % simulada: {(df.rushType == 'simulada').mean():.1%}")
    print(f"% presión: {df.pressure.mean():.1%} | stopRate global: {df.stop.mean():.1%}")
    print("Coberturas más frecuentes:")
    for cov, n in df.coverage.value_counts().head(8).items():
        print(f"  {cov}: {n}")

    if not 0.10 <= (df.rushType == "blitz").mean() <= 0.50:
        print("ADVERTENCIA: % blitz fuera de 10-50 %, revisar pff_role.")
    if not 0.35 <= df.stop.mean() <= 0.80:
        print("ADVERTENCIA: stopRate fuera de 35-80 %, revisar offenseSuccess.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
