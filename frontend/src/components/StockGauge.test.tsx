import { render, screen } from '@testing-library/react'
import { StockGauge } from './StockGauge'

describe('StockGauge', () => {
  it('describes the number of units in stock', () => {
    render(<StockGauge quantity={3} />)

    expect(screen.getByRole('img', { name: '3 in stock' })).toBeInTheDocument()
  })

  it('says "Sold out" at zero', () => {
    render(<StockGauge quantity={0} />)

    expect(screen.getByRole('img', { name: 'Sold out' })).toBeInTheDocument()
  })

  it('reports large stock accurately even though the bar caps at ten segments', () => {
    render(<StockGauge quantity={24} />)

    expect(screen.getByRole('img', { name: '24 in stock' })).toBeInTheDocument()
  })
})
