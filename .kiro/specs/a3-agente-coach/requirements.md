# Requisitos: A3 · Agente de IA para el coach (Rol A)

## Introducción
Permitir que el coach escriba la situación en lenguaje natural ("3ra y 8 en su 35, vamos ganando por 4, quedan 2 minutos del 4.º, salen en Empty") y reciba una recomendación explicada en español. El agente usa Strands con Amazon Nova en Bedrock y una herramienta que llama al recomendador existente. La IA explica; los números los calcula el recomendador.

## Requisito 1: Endpoint
1. `POST /api/ask` SHALL recibir AskRequest y devolver AskResponse (contrato).
2. WHEN la IA responde THEN `usedAI` SHALL ser true, `answer` SHALL contener la explicación y `recommendation` SHALL contener el RecommendResponse que devolvió la herramienta.

## Requisito 2: Herramienta
1. El agente SHALL tener una herramienta `recommend_defense` con parámetros down, yards_to_go, yards_to_endzone, score_diff, quarter, seconds_left, offense_formation (opcional) y team (opcional), que llame a `recommender.recommend`.
2. La descripción de la herramienta SHALL explicar en español cómo convertir frases típicas: "en su 35" = la ofensiva está en su propia yarda 35 → yards_to_endzone = 65; "en nuestra 20" = yards_to_endzone 20; "vamos ganando por 4" = score_diff 4 (perspectiva de la defensa).
3. IF la pregunta no trae algún dato THEN el agente SHALL usar valores por defecto razonables (quarter 2, seconds_left 600, score_diff 0, sin formación) y decir en la respuesta qué supuso.

## Requisito 3: Comportamiento de la respuesta
1. La respuesta SHALL estar en español, en 4 a 6 frases, dirigida a un coordinador defensivo.
2. SHALL nombrar la combinación recomendada, su Stop Rate ajustado en %, n, la diferencia contra el promedio de la situación y una opción a evitar si existe.
3. SHALL NOT inventar números que no vengan de la herramienta.
4. IF la muestra es pequeña (matchLevel ≥ 3 o n < 30 en la mejor opción) THEN SHALL advertirlo.

## Requisito 4: Robustez
1. IF faltan credenciales, Bedrock falla o la respuesta tarda más de 20 s THEN el sistema SHALL responder 200 con `usedAI: false`, un `answer` de respaldo que pida usar el formulario y `error` con un mensaje corto (sin detalles de credenciales).
2. Las credenciales y el modelo SHALL leerse solo de variables de entorno: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN (si aplica), AWS_REGION y BEDROCK_MODEL_ID.
3. El módulo SHALL importarse sin error aunque no haya credenciales (crear el agente de forma perezosa, dentro de la petición).

## Requisito 5: Pruebas
1. Prueba pytest de /api/ask sin credenciales → 200, usedAI false.
2. Prueba de la función de la herramienta llamada directamente → devuelve RecommendResponse válido.
