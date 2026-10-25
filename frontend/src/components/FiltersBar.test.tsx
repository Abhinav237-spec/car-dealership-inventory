import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { VehicleFilters } from '../api/types'
import { FiltersBar } from './FiltersBar'

/** FiltersBar is controlled, so tests give it real state like the dashboard does. */
function Harness({ onChange, initial = {} }: { onChange: (filters: VehicleFilters) => void; initial?: VehicleFilters }) {
  const [filters, setFilters] = useState<VehicleFilters>(initial)
  return (
    <FiltersBar
      filters={filters}
      categories={['Sedan', 'SUV']}
      onChange={(next) => {
        setFilters(next)
        onChange(next)
      }}
    />
  )
}

describe('FiltersBar', () => {
  it('reports typed make and model text', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByLabelText(/^make$/i), 'toy')
    expect(onChange).toHaveBeenLastCalledWith({ make: 'toy' })

    await user.type(screen.getByLabelText(/^model$/i), 'cam')
    expect(onChange).toHaveBeenLastCalledWith({ make: 'toy', model: 'cam' })
  })

  it('drops a filter when its field is emptied', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} initial={{ make: 'a' }} />)

    await userEvent.setup().clear(screen.getByLabelText(/^make$/i))

    expect(onChange).toHaveBeenLastCalledWith({})
  })

  it('reports price limits as numbers', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByLabelText(/min price/i), '25000')
    await user.type(screen.getByLabelText(/max price/i), '40000')

    expect(onChange).toHaveBeenLastCalledWith({ minPrice: 25000, maxPrice: 40000 })
  })

  it('lets you pick a category chip, and "All" to remove it', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'SUV' }))
    expect(onChange).toHaveBeenLastCalledWith({ category: 'SUV' })
    expect(screen.getByRole('button', { name: 'SUV' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(onChange).toHaveBeenLastCalledWith({})
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers "Clear filters" only while a filter is active, and clears everything', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} initial={{ make: 'toy', category: 'SUV' }} />)

    await user.click(screen.getByRole('button', { name: /clear filters/i }))

    expect(onChange).toHaveBeenLastCalledWith({})
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
  })
})
