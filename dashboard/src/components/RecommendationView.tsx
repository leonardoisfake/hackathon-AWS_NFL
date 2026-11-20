import type { RecommendResponse } from '../types'
import AvoidCard from './AvoidCard'
import ConfidenceBadge from './ConfidenceBadge'
import OptionsMiniChart from './OptionsMiniChart'
import RecommendationCard from './RecommendationCard'
import SituationSummary from './SituationSummary'

/** Resultado completo de una recomendación. Se reutiliza en la respuesta de la IA. */
export default function RecommendationView({ rec }: { rec: RecommendResponse }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SituationSummary situation={rec.situation} />
        <ConfidenceBadge matchLevel={rec.matchLevel} matchLabel={rec.matchLabel} nSimilar={rec.nSimilar} />
      </div>
      {rec.options.length === 0 ? (
        <div className="rounded-md border border-amber-400 bg-amber-400/10 p-5 text-amber-100" role="status">
          <p className="font-semibold">No hay suficientes jugadas para recomendar ({rec.matchLabel}).</p>
          <p>Cambia la situación: quita la formación o el equipo, o prueba otra distancia.</p>
        </div>
      ) : (
        <>
          <RecommendationCard option={rec.options[0]} rank={1} />
          {rec.options.length > 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              {rec.options.slice(1).map((o, i) => <RecommendationCard key={o.coverage + o.rushType} option={o} rank={i + 2} />)}
            </div>
          )}
          {rec.avoid && <AvoidCard option={rec.avoid} />}
          <OptionsMiniChart rec={rec} />
        </>
      )}
    </div>
  )
}
