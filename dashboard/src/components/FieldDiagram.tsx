/** Cancha con una formación defensiva dibujada. Posiciones TÍPICAS (esquema), no posiciones reales de tracking. */
export interface Alignment { dl: number; lb: number; db: number }

/** "Nickel (4-2-5)" -> {dl:4, lb:2, db:5}. "4-3" y "3-4" se interpretan como 4-3-4 y 3-4-4. */
export function parseFormation(label: string): Alignment | null {
  const m = /(\d)-(\d)-(\d)/.exec(label)
  if (m) return { dl: Number(m[1]), lb: Number(m[2]), db: Number(m[3]) }
  if (label.trim() === '4-3') return { dl: 4, lb: 3, db: 4 }
  if (label.trim() === '3-4') return { dl: 3, lb: 4, db: 4 }
  return null
}

type Kind = 'DL' | 'LB' | 'DB'
interface Dot { x: number; y: number; t: Kind }

const LOS_Y = 168
const ROW_Y: Record<Kind, number> = { DL: LOS_Y - 16, LB: LOS_Y - 46, DB: LOS_Y - 66 }
// Se dibuja siempre un "pool" fijo de jugadores: los que sobran se encogen y desaparecen, los nuevos aparecen.
const POOL: Record<Kind, number> = { DL: 6, LB: 5, DB: 8 }
const FILL: Record<Kind, string> = { DL: '#22d3ee', LB: '#f1f5f9', DB: '#94a3b8' }

const centered = (count: number, spacing: number): number[] =>
  Array.from({ length: count }, (_, i) => 200 + (i - (count - 1) / 2) * spacing)

export function positions(a: Alignment): Dot[] {
  const dots: Dot[] = []
  centered(a.dl, a.dl >= 5 ? 26 : 34).forEach((x) => dots.push({ x, y: ROW_Y.DL, t: 'DL' }))
  centered(a.lb, 56).forEach((x) => dots.push({ x, y: ROW_Y.LB, t: 'LB' }))
  const corners = Math.min(2, a.db)
  const rest = a.db - corners
  const safeties = Math.min(2, rest)
  const extras = rest - safeties
  if (corners >= 1) dots.push({ x: 36, y: LOS_Y - 38, t: 'DB' })
  if (corners >= 2) dots.push({ x: 364, y: LOS_Y - 38, t: 'DB' })
  centered(extras, 90).forEach((x) => dots.push({ x, y: LOS_Y - 66, t: 'DB' }))
  centered(safeties, 100).forEach((x) => dots.push({ x, y: LOS_Y - 112, t: 'DB' }))
  return dots
}

interface PoolDot extends Dot { id: string; visible: boolean }

function poolDots(a: Alignment): PoolDot[] {
  const active = positions(a)
  const out: PoolDot[] = []
  ;(['DL', 'LB', 'DB'] as Kind[]).forEach((t) => {
    const mine = active.filter((d) => d.t === t)
    for (let i = 0; i < POOL[t]; i++) {
      const d = mine[i]
      out.push(d ? { ...d, id: `${t}-${i}`, visible: true } : { x: 200, y: ROW_Y[t], t, id: `${t}-${i}`, visible: false })
    }
  })
  return out
}

const MOVE = 'transform 550ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 300ms ease'

export default function FieldDiagram({ alignment, label }: { alignment: Alignment; label: string }) {
  const dots = poolDots(alignment)
  const ol = centered(5, 22)
  return (
    <figure>
      <svg viewBox="0 0 400 230" className="w-full rounded-md" role="img" aria-label={`Esquema de ${label} en la cancha`}>
        <rect width="400" height="230" fill="#14532d" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="0" y={i * 40} width="400" height="20" fill="#166534" opacity="0.5" />)}
        {[30, 70, 110, 150, 190].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.18" />)}
        <line x1="0" x2="400" y1={LOS_Y} y2={LOS_Y} stroke="#facc15" strokeWidth="2" strokeDasharray="6 4" />
        <text x="8" y={LOS_Y + 14} fontSize="11" fill="#fde68a">Línea de golpeo</text>
        {ol.map((x) => <circle key={x} cx={x} cy={LOS_Y + 14} r="8" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />)}
        <circle cx="200" cy={LOS_Y + 42} r="8" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
        <text x="392" y={LOS_Y + 46} fontSize="11" fill="#ffffff" fillOpacity="0.7" textAnchor="end">Ofensiva</text>
        {dots.map((d) => (
          <g key={d.id} style={{ transform: `translate(${d.x}px, ${d.y}px) scale(${d.visible ? 1 : 0.2})`, opacity: d.visible ? 1 : 0, transition: MOVE }}>
            <circle cx="0" cy="0" r="12" fill={FILL[d.t]} stroke="#0a1020" strokeWidth="2" />
            <text x="0" y="4" fontSize="11" fontWeight="700" textAnchor="middle" fill="#0a1020">{d.t}</text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-sm text-slate-400">
        {alignment.dl} DL · {alignment.lb} LB · {alignment.db} DB. Posiciones típicas, no reales (esquema ilustrativo).
      </figcaption>
    </figure>
  )
}
