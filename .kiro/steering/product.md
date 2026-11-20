---
inclusion: always
---

# Producto: DC Copilot

## Qué es
Aplicación web que ayuda al **coordinador defensivo (Coach)** a decidir qué jugada defensiva llamar en una situación concreta. Para cada situación recomienda la combinación **cobertura + presión** (por ejemplo "Cover 1 + Blitz") que históricamente más detuvo a la ofensiva, con números verificables.

Proyecto para el NFL Big Data Bowl Hackathon UNAM 2026. Equipo de 2 personas, 3 horas. Punto de vista evaluado: **Coach**.

## Usuario y pregunta central
- Usuario: coordinador defensivo en la banda, con segundos para decidir.
- Pregunta: "Con este down, distancia, zona del campo, marcador, reloj y esta formación ofensiva, ¿qué llamo?"

## Pantallas
1. **Modo Coach** (la principal): formulario de situación → top 3 combinaciones + una a evitar. Caja para preguntar en lenguaje natural a la IA.
2. **Explorador**: filtros y gráficas (Stop Rate por cobertura, blitz vs. base vs. simulada, mapa de calor down × zona, presión vs. yardas).
3. **Hallazgos**: 2–3 tarjetas con los insights principales del equipo.
4. **Perfil de equipo** (opcional): mezcla de coberturas y predictibilidad de una defensa.

## Principios (no negociables)
- Todo porcentaje mostrado va acompañado de **n** (número de jugadas). Grupos con n pequeño se marcan o se ocultan.
- El ranking lo calcula pandas de forma determinista. **La IA solo explica** los números que devuelve la herramienta; nunca inventa cifras.
- Si la IA falla, la app sigue funcionando con el formulario.
- Toda la interfaz y las respuestas de la IA en **español**.
- Simple y que funcione > muchas funciones a medias.

## Cómo nos evalúan (1 a 5 cada uno)
Football Insight · Technical Execution · Communication · Originality.
Lo original del proyecto: separar cobertura de presión, detectar presión simulada, filtrar por formación ofensiva, ajuste por muestra pequeña y medidor de predictibilidad.
