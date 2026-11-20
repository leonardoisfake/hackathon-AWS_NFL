import FindingCard from '../components/FindingCard'
import { FINDINGS } from '../content/findings'

export default function Findings() {
  return (
    <div>
      <h2 className="mb-4 text-3xl">Hallazgos</h2>
      <div className="grid gap-6 md:grid-cols-2">{FINDINGS.map((f) => <FindingCard key={f.title} f={f} />)}</div>
    </div>
  )
}
