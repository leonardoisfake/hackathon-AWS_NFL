# Tareas: B2 · Modo Coach

- [x] 1. Crear `SituationForm.tsx` con los campos, valores por defecto, textos de ayuda, validación de rangos y conversión MM:SS → secondsLeft.
  - _Requisitos: 1.1, 1.2, 1.3_
- [x] 2. Agregar los 4 escenarios rápidos que llenan el formulario y recomiendan al instante.
  - _Requisitos: 2.1_
- [x] 3. Crear `SituationSummary.tsx` y `ConfidenceBadge.tsx` (colores por matchLevel).
  - _Requisitos: 3.1_
- [x] 4. Crear `RecommendationCard.tsx`, `AvoidCard.tsx` y `OptionsMiniChart.tsx`; juntarlos en `RecommendationView.tsx` con el estado de options vacío.
  - _Requisitos: 3.1, 3.2_
- [x] 5. Armar `pages/CoachMode.tsx` (dos columnas, carga, error) llamando a `recommend` de api.ts; probar con mocks.
  - _Requisitos: 3.1_
- [x] 6. Crear `AskBox.tsx` con llamada a `ask`, estado "Pensando…", respuesta de IA + RecommendationView, y aviso ámbar cuando usedAI es false.
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_
- [ ] 7. Conectar a la API real (VITE_USE_MOCKS=false) y corregir diferencias con el contrato junto con el Rol A.
  - _Requisitos: 3.1, 4.2_
- [x] 8. Escribir `README.md` con la plantilla del diseño y marcadores [[NÚMERO]]; agregar la captura del Modo Coach.
  - _Requisitos: 5.1_
- [ ] 9. Llenar los hallazgos en `content/findings.ts` y en el README con los números del Rol A; `npm run build` sin errores.
  - _Requisitos: 5.1_
