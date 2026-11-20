# DC Copilot

**Asistente de decisiones para el coordinador defensivo.** Dado lo que el coach ve antes del snap (down, yardas, zona del campo, marcador, reloj y formación ofensiva), recomienda la combinación **cobertura + presión** que históricamente más detuvo esa jugada, con su tasa de éxito, su tamaño de muestra y una explicación en español generada con IA.

## Hallazgo principal

**[[NÚMERO]]**: [[frase del hallazgo principal]] (n=[[N]]).

Fuente: jugadas de pase del Big Data Bowl (datos de scouting de PFF). Los demás hallazgos están en la pestaña **Hallazgos** de la app.

## Captura

![Modo Coach](docs/coach-mode.png)

## Qué problema resuelve

Punto de vista elegido: **Coach**. El coordinador defensivo tiene segundos para llamar la jugada y hoy decide por instinto y por video. DC Copilot responde: *con este down, distancia, zona, marcador, reloj y formación, ¿qué cobertura y cuánta presión conviene llamar, y por qué?*

La app tiene tres pantallas:
- **Modo Coach:** formulario de situación, escenarios rápidos, top 3 de combinaciones, una a evitar y una caja para preguntar a la IA en lenguaje natural.
- **Explorador:** filtros y gráficas (Stop Rate por cobertura, blitz vs. 4 o menos vs. presión simulada, mapa de calor down por zona, presión vs. yardas permitidas).
- **Hallazgos:** los descubrimientos principales con su número y su n.

## Cómo se calculan las métricas

- **Stop Rate:** porcentaje de jugadas en que la ofensiva no tuvo éxito para su down y distancia. Éxito = avanzar al menos 40 % de las yardas por recorrer en 1.er down, 60 % en 2.º, o conseguir el primero en 3.º y 4.º. Un sack o una intercepción cuentan siempre como stop.
- **Ajuste por muestra pequeña:** Stop Rate ajustado = (stops + 20 × promedio) / (n + 20). Con pocas jugadas el valor se acerca al promedio. Siempre se muestra n y se atenúan los grupos con n < 15.
- **Blitz:** 5 o más jugadores con rol de pass rush en la jugada.
- **Presión simulada:** 4 o menos presionadores, pero al menos uno no es liniero defensivo y al menos un liniero defensivo cae a cubrir. La defensa muestra blitz sin mandarlo.
- **Coincidencia de situaciones similares:** si hay pocas jugadas con todos los filtros, se relajan en orden (equipo, formación, marcador y reloj, zona). La insignia de confiabilidad muestra cuánto se relajó.
- **La IA solo explica:** el ranking lo calcula pandas de forma determinista. El agente (Amazon Nova con Strands) recibe los números de una herramienta y los redacta; no inventa cifras. Si falla, el formulario sigue funcionando.

## Cómo correrlo

Requisitos: los del template (`sh .hackathon/setup.sh --check` debe terminar en TODO OK).

Backend (desde la raíz del proyecto):

    .venv/bin/uvicorn backend.main:app --reload

Frontend (otra terminal):

    cd dashboard
    npm install
    npm run dev          # usa la API real en http://localhost:8000
    npm run dev:mocks    # usa datos de ejemplo, sin backend

Compilar para entrega: `npm run build` dentro de `dashboard/` genera `dashboard/dist`.

Variables de entorno para la IA (opcionales; nunca se guardan en el repositorio, ver `.env.example`):

    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_SESSION_TOKEN
    AWS_REGION
    BEDROCK_MODEL_ID

Sin estas variables, `/api/ask` responde con un texto de respaldo sin IA.

## Limitaciones

- El dataset solo contiene **jugadas de pase** (no hay carreras ni patadas) de una temporada histórica.
- Las situaciones muy específicas tienen pocas jugadas. Por eso se muestra n y se relajan filtros.
- Los resultados son históricos y descriptivos: apoyan la decisión del coach, no la reemplazan.
- Las coberturas de situación (Red Zone, Goal Line, Prevent) se llaman por el momento del juego, así que compararlas con otras coberturas sin filtrar la situación puede confundir.
- El tracking de jugadores no se usa en esta versión.

## Equipo

- Rol A (datos, backend e IA): [[nombre]]
- Rol B (frontend, producto y comunicación): Lee

## Declaración de autoría

Declaramos que este trabajo se realizó durante el evento y únicamente por los participantes listados arriba. El código se generó con Kiro durante el evento; los documentos de planeación (steering y specs) se prepararon antes, sin escribir código.
