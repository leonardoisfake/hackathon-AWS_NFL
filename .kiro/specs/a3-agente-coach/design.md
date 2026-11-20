# Diseño: A3 · Agente de IA

## Archivo: `backend/app/agent.py`

### Configuración (solo variables de entorno)
- `AWS_REGION` (default "us-east-1").
- `BEDROCK_MODEL_ID`: el ID del modelo Nova que den los organizadores (confirmarlo el día del evento; p. ej. un perfil de inferencia "us.amazon.nova-…"). Default razonable: "us.amazon.nova-lite-v1:0".
- boto3 toma AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN automáticamente del entorno. No pasarlas a mano.
- Cargar `.env` NO es necesario: exportar las variables en la terminal antes de `uvicorn`. (No agregar python-dotenv.)

### Uso de Strands (strands-agents 1.64)
Referencia de API (verificar contra la documentación instalada si algo falla):
```python
from strands import Agent, tool
from strands.models import BedrockModel

model = BedrockModel(model_id=MODEL_ID, region_name=REGION, temperature=0.2)
agent = Agent(model=model, tools=[recommend_defense], system_prompt=SYSTEM_PROMPT, callback_handler=None)
result = agent(question)
text = str(result)
```
`callback_handler=None` evita que imprima en consola.

### Herramienta con captura del resultado
Crear la herramienta dentro de una función `build_agent(df)` para que cierre sobre un objeto `captured = {}`; la herramienta guarda en `captured["rec"]` el dict que devuelve `recommend(df, req)`. Así `/api/ask` puede devolver `recommendation` estructurado además del texto.

El docstring de `recommend_defense` describe cada argumento en español (Strands lo usa como descripción de la herramienta), incluidas las reglas de conversión de yardas y marcador del requisito 2.2.

### System prompt (español)
```
Eres el asistente del coordinador defensivo de un equipo de la NFL.
Siempre llamas a la herramienta recommend_defense antes de responder.
Respondes en español, en 4 a 6 frases, directo y práctico.
Usa SOLO los números que devuelve la herramienta: Stop Rate ajustado (en %), n y diferencia contra el promedio.
Nombra la mejor combinación y, si existe, la opción a evitar.
Si supusiste algún dato que el coach no dio, dilo en una frase.
Si matchLevel es 3 o más, o la mejor opción tiene n < 30, advierte que la muestra es pequeña.
Stop Rate = % de jugadas en que la ofensiva no tuvo éxito para su down y distancia.
```

### Timeout y respaldo
```python
from concurrent.futures import ThreadPoolExecutor
ex = ThreadPoolExecutor(max_workers=1)
try:
    fut = ex.submit(agent, question)
    result = fut.result(timeout=20)
finally:
    ex.shutdown(wait=False)   # NO usar "with": esperaría al hilo y anularía el timeout
```
Cualquier excepción (credenciales, red, timeout, import) → AskResponse(answer="No pude consultar la IA en este momento. Usa el formulario del Modo Coach: da la misma recomendación con los números.", usedAI=False, recommendation=None, error="<tipo de error corto>").

### Endpoint
`POST /api/ask` en main.py llama a `ask(question, get_df())` de agent.py.

## Pruebas (`backend/tests/test_agent.py`)
1. Con `monkeypatch.delenv` de las credenciales → /api/ask responde 200 y usedAI false.
2. Llamar la lógica interna de la herramienta (función normal sin decorar, p. ej. `_recommend_defense_impl`) con una situación válida → dict con la forma de RecommendResponse.
