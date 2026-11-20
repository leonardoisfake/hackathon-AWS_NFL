# Requisitos: B2 · Modo Coach, pregunta a la IA y README (Rol B)

## Introducción
La pantalla estrella de la demo. El coach captura la situación (o elige un escenario preparado), recibe las 3 mejores combinaciones cobertura + presión y una a evitar, y puede preguntar en lenguaje natural a la IA. Incluye el README final del proyecto.

## Requisito 1: Formulario de situación
1. El formulario SHALL tener: Down (1–4, botones), Yardas por avanzar (1–30), Yardas a la end zone (1–99, con texto de ayuda "35 = en la 35 del rival; 80 = en su propia 20"), Diferencia de marcador para la defensa (−30 a 30, con texto "positivo = vamos ganando"), Cuarto (1–4, y 5 = tiempo extra), Reloj (MM:SS), Formación ofensiva (de /api/filters + "Cualquiera") y Equipo defensivo (opcional).
2. Valores por defecto: 3.º y 8, 35 yardas a la end zone, marcador 0, 2.º cuarto, 08:00, Cualquiera.
3. IF un valor está fuera de rango THEN el campo SHALL marcarse en rojo y el botón "Recomendar" SHALL deshabilitarse.

## Requisito 2: Escenarios rápidos (para la demo)
1. SHALL existir 4 botones que llenan el formulario y recomiendan al instante: "3.º y largo", "3.º y corto", "Red zone", "2 minutos, ganando por 3".

## Requisito 3: Resultado
1. WHEN se presiona "Recomendar" THEN el sistema SHALL llamar a POST /api/recommend y mostrar:
   - Resumen de la situación en español (p. ej. "3.º y largo · Campo rival · Ganando por 1–8 · Últimos 2 minutos").
   - Insignia de confiabilidad con matchLabel y nSimilar ("Basado en 212 jugadas similares · sin filtrar por marcador"); color verde si matchLevel ≤ 1, ámbar si 2–3, rojo si 4.
   - 3 tarjetas ordenadas (#1, #2, #3) con la etiqueta de la combinación, Stop Rate ajustado grande, diferencia contra el promedio ("+11 pts vs. promedio"), n y métricas secundarias (presión, turnover+sack, yardas permitidas, % completos).
   - Una tarjeta "Evitar" en rojo si `avoid` no es null.
   - Una mini gráfica de barras con las 3 opciones + el promedio.
2. IF `options` viene vacío THEN SHALL mostrar el matchLabel y sugerir cambiar la situación.

## Requisito 4: Pregunta a la IA
1. SHALL existir una caja de texto "Pregúntale al asistente" con un ejemplo como placeholder y botón Enviar.
2. WHEN se envía THEN SHALL llamar a POST /api/ask, mostrar un indicador "Pensando…" (puede tardar hasta 20 s) y deshabilitar el botón.
3. WHEN responde con usedAI true THEN SHALL mostrar el texto de la IA y, debajo, las tarjetas de `recommendation` (mismo componente del requisito 3).
4. WHEN usedAI es false THEN SHALL mostrar el answer de respaldo en un aviso ámbar sin romper la pantalla.

## Requisito 5: README
1. `README.md` SHALL tener, en este orden: nombre y frase del proyecto; **Hallazgo principal** con número y n; captura del Modo Coach; qué problema resuelve (punto de vista Coach); cómo se calculan las métricas (Stop Rate, ajuste por muestra, blitz y presión simulada); cómo correrlo (backend, frontend, variables de entorno sin valores); limitaciones (solo pases, temporada histórica, muestra); equipo; declaración de que el trabajo se hizo durante el evento y solo por los participantes.
