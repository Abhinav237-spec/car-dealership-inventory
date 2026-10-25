import type { VehicleFilters } from '../api/types'
import { Button } from './Button'
import { TextField } from './TextField'

interface FiltersBarProps {
  filters: VehicleFilters
  /** Category names to offer as quick-pick chips. */
  categories: string[]
  onChange: (filters: VehicleFilters) => void
}

/** Applies a change and drops any filter that is now empty, so `{}` always means "no filters". */
function withChange(filters: VehicleFilters, change: Partial<VehicleFilters>): VehicleFilters {
  const merged = { ...filters, ...change }
  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== undefined && value !== ''),
  ) as VehicleFilters
}

const toNumber = (text: string) => (text === '' ? undefined : Number(text))

/**
 * The search controls. It is "controlled": the dashboard owns the filter
 * values and this component only displays them and reports changes.
 */
export function FiltersBar({ filters, categories, onChange }: FiltersBarProps) {
  const hasFilters = Object.keys(filters).length > 0
  const chip = (label: string, selected: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 text-sm font-semibold transition-colors ${
        selected ? 'border-racing bg-racing text-showroom' : 'border-line bg-white hover:border-asphalt'
      }`}
    >
      {label}
    </button>
  )

  return (
    <section aria-label="Search and filters" className="mt-8 border border-line bg-showroom p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Make"
          placeholder="Toyota"
          value={filters.make ?? ''}
          onChange={(event) => onChange(withChange(filters, { make: event.target.value }))}
        />
        <TextField
          label="Model"
          placeholder="Camry"
          value={filters.model ?? ''}
          onChange={(event) => onChange(withChange(filters, { model: event.target.value }))}
        />
        <TextField
          label="Min price"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Any"
          value={filters.minPrice ?? ''}
          onChange={(event) => onChange(withChange(filters, { minPrice: toNumber(event.target.value) }))}
        />
        <TextField
          label="Max price"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Any"
          value={filters.maxPrice ?? ''}
          onChange={(event) => onChange(withChange(filters, { maxPrice: toNumber(event.target.value) }))}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold">Category</span>
        {chip('All', filters.category === undefined, () => onChange(withChange(filters, { category: undefined })))}
        {categories.map((category) =>
          chip(category, filters.category === category, () => onChange(withChange(filters, { category }))),
        )}
        {hasFilters && (
          <Button variant="ghost" className="ml-auto" onClick={() => onChange({})}>
            Clear filters
          </Button>
        )}
      </div>
    </section>
  )
}
