import { useState } from 'react'
import CoverageBarChart from '../components/CoverageBarChart'
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar'
import Heatmap from '../components/Heatmap'
import PressureScatter from '../components/PressureScatter'
import RushComparisonChart from '../components/RushComparisonChart'
import type { ExplorerFilters } from '../types'

export default function Explorer() {
  const [filters, setFilters] = useState<ExplorerFilters>(EMPTY_FILTERS)
  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="grid gap-6 xl:grid-cols-2">
        <CoverageBarChart filters={filters} />
        <RushComparisonChart filters={filters} />
        <CoverageBarChart filters={filters} groupBy="defFormation" title="Stop Rate por formación defensiva" term="Formación defensiva" labelWidth={150} />
        <Heatmap team={filters.team} />
        <div className="xl:col-span-2"><PressureScatter filters={filters} /></div>
      </div>
    </div>
  )
}
