# Diseño: B2 · Modo Coach

## Archivos
```
dashboard/src/
  pages/CoachMode.tsx           # orquesta formulario, resultado y pregunta a la IA
  components/
    SituationForm.tsx           # campos, validación, escenarios rápidos
    SituationSummary.tsx        # resumen en español de la situación
    ConfidenceBadge.tsx         # matchLabel + nSimilar + color por matchLevel
    RecommendationCard.tsx      # una opción (rank, label, stopAdj, delta, n, secundarias)
    AvoidCard.tsx
    OptionsMiniChart.tsx        # BarChart de las 3 opciones + promedio
    RecommendationView.tsx      # junta resumen + insignia + tarjetas + mini gráfica (se reutiliza en la respuesta de IA)
    AskBox.tsx                  # textarea + enviar + estados
README.md (raíz del repo)
```

## Estado en CoachMode
```ts
const [form, setForm] = useState<RecommendRequest>(DEFAULTS);
const [rec, setRec] = useState<RecommendResponse | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```
El reloj se captura como "MM:SS" y se convierte a `secondsLeft` antes de enviar.

## Escenarios rápidos
```ts
const PRESETS = {
  "3.º y largo":               { down: 3, yardsToGo: 9, yardsToEndzone: 55, scoreDiff: 0, quarter: 2, secondsLeft: 480 },
  "3.º y corto":               { down: 3, yardsToGo: 2, yardsToEndzone: 45, scoreDiff: 0, quarter: 3, secondsLeft: 600 },
  "Red zone":                  { down: 2, yardsToGo: 7, yardsToEndzone: 14, scoreDiff: -3, quarter: 3, secondsLeft: 300 },
  "2 minutos, ganando por 3":  { down: 1, yardsToGo: 10, yardsToEndzone: 70, scoreDiff: 3, quarter: 4, secondsLeft: 110 },
};
```
Al hacer clic: `setForm(preset)` y llamar a recommend de inmediato.

## Diseño visual
- Dos columnas en pantallas anchas: izquierda formulario (1/3), derecha resultado (2/3). Una columna en móvil.
- Tarjeta #1 más grande, borde verde `#15803d`; #2 y #3 normales; "Evitar" con borde rojo `#dc2626`.
- Número principal: `text-5xl font-bold`. Delta en verde si > 0, rojo si < 0.
- Etiqueta de rushType como chip con el color fijo de `frontend-rules.md`.
- InfoTip del glosario junto a "Stop Rate ajustado" y junto a cada cobertura.

## AskBox
- Placeholder: "Ej.: 3ra y 8 en su 35, vamos ganando por 4, quedan 2 minutos del último cuarto y salen en EMPTY".
- Mientras espera: spinner + "Pensando… (puede tardar unos segundos)".
- Respuesta IA: bloque con ícono y el texto; debajo `RecommendationView` con `recommendation`.

## README
Plantilla con secciones del requisito 5 y marcadores `[[NÚMERO]]` que se llenan con los hallazgos del Rol A en el bloque 2:05–2:30. Captura guardada en `docs/coach-mode.png`.
