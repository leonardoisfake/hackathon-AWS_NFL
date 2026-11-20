// Las llena el equipo en el bloque 2:05–2:30 con los números de Rol A (número + n + frase).
export interface Finding { title: string; number: string; text: string; n: number | string; pending: boolean }

export const FINDINGS: Finding[] = [
  { title: 'Blitz en 3.º y largo', number: '[[NÚMERO]]', text: 'Diferencia de Stop Rate entre blitz y 4 o menos en 3.º y largo (pendiente de confirmar con los datos reales).', n: '—', pending: true },
  { title: 'Presión simulada', number: '[[NÚMERO]]', text: 'Qué tanto se acerca la presión simulada al blitz con menos riesgo (pendiente de confirmar).', n: '—', pending: true },
]
