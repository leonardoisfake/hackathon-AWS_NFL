// Hallazgos con cifras reales (8,521 jugadas de pase, semanas 1 a 8 de 2021).
// Se calcularon con backend/metrics.py sobre data/processed/plays_features.csv.
// Stop Rate = % de jugadas en que la ofensiva no tuvo éxito para su down y distancia.
export interface Finding { title: string; number: string; text: string; n: number | string; pending: boolean }

export const FINDINGS: Finding[] = [
  {
    title: 'Blitz en 3.º y largo',
    number: '−9.2 pts',
    text: 'En 3.º y 8 o más yardas, mandar blitz detuvo al 66.1 % de las jugadas, contra 75.3 % con 4 o menos presionadores. El blitz sí incomoda más al mariscal (62 % de presión contra 46 %), pero no se traduce en más stops.',
    n: '292 con blitz vs. 705 con 4 o menos',
    pending: false,
  },
  {
    title: 'Presión simulada',
    number: '+5.7 pts',
    text: 'Mandar 4 pero fingir más presionadores detuvo al 57.5 % de las jugadas, contra 51.8 % con presión normal, y permitió la mitad de jugadas grandes de 20 o más yardas (5.0 % contra 9.6 %). Es una muestra pequeña: conviene tomarlo como señal, no como regla.',
    n: '221 con presión simulada vs. 6,205 con 4 o menos',
    pending: false,
  },
  {
    title: 'Dime contra Nickel en 3.º down',
    number: '+7.2 pts',
    text: 'En 3.er down, la formación Dime (3-2-6) detuvo al 65.5 % de las jugadas, contra 58.3 % de Nickel (4-2-5). Ojo: Dime se llama justo en situaciones de pase largo, así que parte de la diferencia viene de la situación y no solo de la formación.',
    n: '740 con Dime (3-2-6) vs. 609 con Nickel (4-2-5)',
    pending: false,
  },
]
