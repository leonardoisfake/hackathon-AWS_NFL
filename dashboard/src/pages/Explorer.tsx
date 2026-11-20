import { useState } from 'react'
import CoverageBarChart from '../components/CoverageBarChart'
import FieldHeatmap from '../components/FieldHeatmap'
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar'
import FormationOnField from '../components/FormationOnField'
import PressureScatter from '../components/PressureScatter'
import RushComparisonChart from '../components/RushComparisonChart'
import type { ExplorerFilters } from '../types'

export default function Explorer() {
  const [filters, setFilters] = useState<ExplorerFilters>(EMPTY_FILTERS)
  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onChange={setFilters} />
      {/* Primero, las gráficas en cancha */}
      <FormationOnField filters={filters} />
      <FieldHeatmap filters={filters} />
      {/* Después, las gráficas de estadísticas */}
      <div className="grid gap-6 xl:grid-cols-2">
        <CoverageBarChart filters={filters} />
        <CoverageBarChart filters={filters} groupBy="defFormation" title="Stop Rate por formación defensiva" term="Formación defensiva" labelWidth={150} />
        <RushComparisonChart filters={filters} />
        <PressureScatter filters={filters} />
      </div>
    </div>
  )
}
