import { RUSH_COLOR, RUSH_LABEL } from '../labels'
import type { RushType } from '../types'

export default function RushChip({ rushType }: { rushType: RushType }) {
  return (
    <span className="inline-block rounded-sm px-2 py-0.5 text-sm font-bold text-white" style={{ background: RUSH_COLOR[rushType] }}>
      {RUSH_LABEL[rushType]}
    </span>
  )
}
