"""Agente de IA (Amazon Nova en Bedrock vía Strands) para /api/ask.

La IA hace dos cosas: convierte la pregunta del coach en una situación de juego y redacta la
explicación en español. Los números los calcula siempre `recommender.recommend`.
Riesgo controlado: si la IA falla, tarda o cita números que no vienen de la herramienta, se
responde con un resumen determinista construido con los mismos datos (usedAI = false).
"""
from __future__ import annotations

import os
import re
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from pathlib import Path

import pandas as pd

from .recommender import recommend
from .schemas import RecommendRequest

TIMEOUT_SECONDS = 20
# Nova Pro interpreta mejor las preguntas que Lite (en pruebas, Lite omitía el cuarto o inventaba datos).
# Se puede cambiar con la variable de entorno BEDROCK_MODEL_ID.
DEFAULT_MODEL_ID = "us.amazon.nova-pro-v1:0"
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"

FALLBACK_NO_AI = (
    "No pude consultar la IA en este momento. Usa el formulario del Modo Coach: "
    "da la misma recomendación con los números."
)

SYSTEM_PROMPT = """Eres el asistente del coordinador defensivo de un equipo de la NFL.
Siempre llamas a la herramienta recommend_defense antes de dar una recomendación.
Solo pides datos (en una frase) si en la pregunta NO aparece el down, o las yardas por ganar, o la posición en el campo.
Cuarto, reloj, marcador, formación y equipo son opcionales: nunca los pidas, solo envíalos si el coach los menciona.
Ejemplos de cómo leer la pregunta:
- "2.º y 7 en nuestra 14, perdemos por 3" -> down=2, yards_to_go=7, yards_to_endzone=14, score_diff=-3.
- "1.º y 10 en su 25, empatados, 2.º cuarto, 8:30, shotgun" -> down=1, yards_to_go=10, yards_to_endzone=75,
  score_diff=0, quarter=2, seconds_left=510, offense_formation=SHOTGUN.
- "3ra y 8 en su 35, ganando por 4, 2 minutos del 4.º, Empty" -> down=3, yards_to_go=8, yards_to_endzone=65,
  score_diff=4, quarter=4, seconds_left=120, offense_formation=EMPTY.
Respondes en español, en 4 a 6 frases, directo y práctico.
Usa SOLO los números que devuelve la herramienta: Stop Rate ajustado (en %), n y diferencia contra el promedio.
Nunca inventes ni calcules números por tu cuenta.
Nombra la mejor combinación y, si existe, la opción a evitar.
Conversión de yardas: "en su N" (la ofensiva está en SU propia yarda N) = 100 - N.
"En nuestra N" o "en tu N" (la ofensiva está cerca de NUESTRA zona de anotación) = N, nunca 100 - N.
"Red zone" sin yarda exacta = 10. "Medio campo" = 50.
Extrae de la pregunta TODOS los datos que el coach da: down, yardas, cuarto, reloj, marcador y formación ofensiva.
No escribas tu razonamiento ni etiquetas como <thinking>: entrega solo la respuesta final.
No repitas la situación interpretada ni los supuestos: el sistema los agrega al final.
No opines sobre el tamaño de la muestra: el sistema agrega ese aviso al final.
Stop Rate = % de jugadas en que la ofensiva no tuvo éxito para su down y distancia.
Si la herramienta devuelve options vacío, di que no hay jugadas similares suficientes y no recomiendes nada."""


def load_env_file(path: Path = ENV_PATH) -> None:
    """Carga KEY=VALUE de .env sin pisar variables ya definidas (sin dependencias extra)."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and value and key not in os.environ:
            os.environ[key] = value


def _clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, int(value)))


def _build_request(
    down: int,
    yards_to_go: int,
    yards_to_endzone: int,
    score_diff: int = 0,
    quarter: int = 2,
    seconds_left: int = 600,
    offense_formation: str | None = None,
    team: str | None = None,
) -> RecommendRequest:
    """Arma la petición ajustando los valores a rangos válidos."""
    return RecommendRequest(
        down=_clamp(down, 1, 4),
        yardsToGo=_clamp(yards_to_go, 1, 99),
        yardsToEndzone=_clamp(yards_to_endzone, 1, 99),
        scoreDiff=_clamp(score_diff, -60, 60),
        quarter=_clamp(quarter, 1, 5),
        secondsLeft=_clamp(seconds_left, 0, 900),
        offenseFormation=(offense_formation or None),
        team=(team or None),
    )


def _recommend_defense_impl(df: pd.DataFrame, *args, **kwargs) -> dict:
    """Arma la petición y llama al recomendador (mismos argumentos que _build_request)."""
    return recommend(df, _build_request(*args, **kwargs).model_dump())


def build_agent(df: pd.DataFrame):
    """Crea el agente y un dict `captured` donde la herramienta deja la recomendación."""
    from strands import Agent, tool  # import perezoso: el módulo carga sin credenciales
    from strands.models import BedrockModel

    captured: dict = {}

    @tool
    def recommend_defense(
        down: int,
        yards_to_go: int,
        yards_to_endzone: int,
        score_diff: int | None = None,
        quarter: int | None = None,
        seconds_left: int | None = None,
        offense_formation: str | None = None,
        team: str | None = None,
    ) -> dict:
        """Consulta el historial de jugadas y devuelve las mejores coberturas y presiones.

        Args:
            down: Down actual, de 1 a 4.
            yards_to_go: Yardas que faltan para el primer down (1 a 99). "3.º y 8" = 8.
            yards_to_endzone: Yardas que le faltan a la OFENSIVA para anotar (1 a 99).
                "en su 35" (la ofensiva está en su propia yarda 35) = 65.
                "en nuestra 20" o "en tu 20" (la ofensiva está a 20 de nuestra zona) = 20.
                "red zone" sin yarda exacta = 10. "En medio campo" = 50.
            score_diff: Puntos de NUESTRA defensa menos puntos de la ofensiva.
                "vamos ganando por 4" = 4; "vamos perdiendo por 7" = -7.
                Si el coach no lo dice, NO envíes este argumento.
            quarter: Cuarto, de 1 a 5 (5 = tiempo extra). "del 4.º", "en el cuarto cuarto" = 4;
                "segundo cuarto" = 2. Si se menciona, SIEMPRE envíalo. Si no, NO envíes este argumento.
            seconds_left: Segundos que quedan en el cuarto. "2 minutos" = 120, "1:30" = 90.
                Si se menciona, SIEMPRE envíalo. Si no, NO envíes este argumento.
            offense_formation: Formación ofensiva en mayúsculas: SHOTGUN, EMPTY, SINGLEBACK,
                I_FORM, PISTOL, JUMBO o WILDCAT. Omitir si no se menciona.
            team: Abreviatura de la defensa (por ejemplo "NE"). Omitir si no se menciona.
        """
        assumed = [
            name
            for name, value in (("marcador", score_diff), ("cuarto", quarter), ("reloj", seconds_left))
            if value is None
        ]
        req = _build_request(
            down,
            yards_to_go,
            yards_to_endzone,
            0 if score_diff is None else score_diff,
            2 if quarter is None else quarter,
            600 if seconds_left is None else seconds_left,
            offense_formation,
            team,
        )
        rec = recommend(df, req.model_dump())
        captured.update(rec=rec, req=req.model_dump(), assumed=assumed)
        return rec

    model = BedrockModel(
        model_id=os.environ.get("BEDROCK_MODEL_ID", DEFAULT_MODEL_ID),
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
        temperature=0.2,
    )
    agent = Agent(model=model, tools=[recommend_defense], system_prompt=SYSTEM_PROMPT, callback_handler=None)
    return agent, captured


# ---------------------------------------------------------------- verificación de números
_PCT = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:%|por ciento|puntos)")
_N = re.compile(r"\bn\s*=\s*(\d+)", re.IGNORECASE)
_THINKING = re.compile(r"<thinking>.*?(</thinking>|$)", re.DOTALL | re.IGNORECASE)


def clean_answer(text: str) -> str:
    """Quita bloques <thinking> y espacios sobrantes."""
    return _THINKING.sub("", text).strip()


def _allowed_numbers(rec: dict) -> tuple[list[float], set[int]]:
    pcts: list[float] = [rec["baselineStop"] * 100]
    counts: set[int] = {rec["nSimilar"]}
    for opt in [*rec["options"], *([rec["avoid"]] if rec["avoid"] else [])]:
        for key in ("stopRate", "stopAdj", "pressureRate", "turnoverSackRate"):
            pcts.append(opt[key] * 100)
        if opt["complPct"] is not None:
            pcts.append(opt["complPct"] * 100)
        pcts.append(abs(opt["deltaVsBaseline"]) * 100)
        counts.add(opt["n"])
    return pcts, counts


def numbers_are_grounded(answer: str, rec: dict) -> bool:
    """True si todo porcentaje y todo 'n=' citado en la respuesta existe en la recomendación."""
    pcts, counts = _allowed_numbers(rec)
    for raw in _PCT.findall(answer):
        value = float(raw.replace(",", "."))
        if not any(abs(value - p) <= 1.0 for p in pcts):
            return False
    for raw in _N.findall(answer):
        if int(raw) not in counts:
            return False
    return True


# ---------------------------------------------------------------- textos deterministas
def _clock(seconds: int) -> str:
    return f"{seconds // 60}:{seconds % 60:02d}"


def sample_notice(rec: dict) -> str:
    """Aviso determinista sobre la confiabilidad (reglas fijas, no opinión del modelo)."""
    text = f"Base de datos: {rec['matchLabel'].lower()}, {rec['nSimilar']} jugadas similares."
    if rec["options"] and (rec["matchLevel"] >= 3 or rec["options"][0]["n"] < 30):
        text += " Muestra pequeña: toma la recomendación con cautela."
    return text


def describe_situation(req: dict, assumed: list[str], rec: dict | None = None) -> str:
    """Líneas con lo que se consultó, para que el coach verifique la interpretación."""
    diff = req["scoreDiff"]
    score = "empatando" if diff == 0 else f"ganando por {diff}" if diff > 0 else f"perdiendo por {-diff}"
    yards = req["yardsToEndzone"]
    text = (
        f"Situación interpretada: {req['down']}.º y {req['yardsToGo']}, la ofensiva a "
        f"{yards} {'yarda' if yards == 1 else 'yardas'} de anotar, {score}, cuarto {req['quarter']} con "
        f"{_clock(req['secondsLeft'])} restantes"
    )
    if req.get("offenseFormation"):
        text += f", formación {req['offenseFormation']}"
    if req.get("team"):
        text += f", defensa {req['team']}"
    text += "."
    if assumed:
        text += f" Supuse: {', '.join(assumed)} (no los indicaste)."
    if rec:
        text += "\n" + sample_notice(rec)
    return text


def summarize_recommendation(rec: dict) -> str:
    """Resumen en español sin IA, usado cuando la IA no está disponible o no se verifica."""
    if not rec["options"]:
        return (
            f"No hay jugadas similares suficientes para recomendar ({rec['matchLabel'].lower()}). "
            "Prueba con otra situación en el formulario."
        )
    best = rec["options"][0]
    text = (
        f"En esta situación ({rec['nSimilar']} jugadas similares, promedio de paradas "
        f"{rec['baselineStop'] * 100:.0f} %) la mejor opción histórica es {best['label']}: "
        f"Stop Rate ajustado de {best['stopAdj'] * 100:.0f} % con n={best['n']}, "
        f"{abs(best['deltaVsBaseline']) * 100:.0f} puntos "
        f"{'por encima' if best['deltaVsBaseline'] >= 0 else 'por debajo'} del promedio."
    )
    if rec["avoid"]:
        a = rec["avoid"]
        text += f" Evita {a['label']} (Stop Rate ajustado {a['stopAdj'] * 100:.0f} %, n={a['n']})."
    return text


# ---------------------------------------------------------------- punto de entrada
def _fallback(error: str, captured: dict) -> dict:
    rec = captured.get("rec")
    answer = summarize_recommendation(rec) if rec else FALLBACK_NO_AI
    if rec and "req" in captured:
        answer += "\n\n" + describe_situation(captured["req"], captured["assumed"], rec)
    return {"answer": answer, "usedAI": False, "recommendation": rec, "error": error}


_LOCATION_WORDS = re.compile(r"medio campo|red ?zone|zona roja|goal ?line|l[ií]nea de gol", re.IGNORECASE)
NEED_DATA = (
    "Necesito la situación para consultar el historial: el down, las yardas por ganar y dónde está "
    "la ofensiva. Por ejemplo: 3ra y 8 en su 35, vamos ganando por 4, quedan 2 minutos del 4.º."
)


def has_situation_data(question: str) -> bool:
    """Una situación de juego trae al menos un número (down, yardas) o una ubicación en el campo."""
    return bool(re.search(r"\d", question) or _LOCATION_WORDS.search(question))


def ask(question: str, df: pd.DataFrame) -> dict:
    """Responde una pregunta en lenguaje natural. Nunca lanza: ante fallos usa el respaldo."""
    if not has_situation_data(question):
        # Evita que el modelo invente una situación y gasta cero llamadas a Bedrock.
        return {"answer": NEED_DATA, "usedAI": False, "recommendation": None, "error": None}
    load_env_file()
    captured: dict = {}
    executor = ThreadPoolExecutor(max_workers=1)
    try:
        agent, captured = build_agent(df)
        future = executor.submit(agent, question)
        result = future.result(timeout=TIMEOUT_SECONDS)
        answer = clean_answer(str(result))
    except FutureTimeout:
        return _fallback("La IA tardó demasiado", captured)
    except Exception as exc:  # credenciales, red, Bedrock, import
        return _fallback(f"IA no disponible ({type(exc).__name__})", captured)
    finally:
        executor.shutdown(wait=False)  # no usar `with`: esperaría al hilo y anularía el timeout

    rec = captured.get("rec")
    if rec is None:
        # Sin consulta a los datos solo se admite una pregunta de aclaración, sin cifras.
        if answer and not _PCT.search(answer) and not _N.search(answer):
            return {"answer": answer, "usedAI": True, "recommendation": None, "error": None}
        return _fallback("La IA no consultó los datos", captured)
    if not answer or not numbers_are_grounded(answer, rec):
        return _fallback("Respuesta de IA no verificada contra los datos", captured)
    answer += "\n\n" + describe_situation(captured["req"], captured["assumed"], rec)
    return {"answer": answer, "usedAI": True, "recommendation": rec, "error": None}
