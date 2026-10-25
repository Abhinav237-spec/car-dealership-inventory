import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeVehicle } from '../test/fixtures'
import { VehicleCard } from './VehicleCard'

const handlers = () => ({
  onPurchase: vi.fn(),
  onEdit: vi.fn(),
  onRestock: vi.fn(),
  onDelete: vi.fn(),
})

describe('VehicleCard', () => {
  it('shows make, model, category, price and stock', () => {
    render(<VehicleCard vehicle={makeVehicle()} isAdmin={false} {...handlers()} />)

    expect(screen.getByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument()
    expect(screen.getByText('Toyota')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Camry' })).toBeInTheDocument()
    expect(screen.getByText('Sedan')).toBeInTheDocument()
    expect(screen.getByText('$28,500')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '3 in stock' })).toBeInTheDocument()
  })

  it('passes the vehicle to onPurchase when Purchase is clicked', async () => {
    const vehicle = makeVehicle()
    const actions = handlers()
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...actions} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Purchase Toyota Camry' }))

    expect(actions.onPurchase).toHaveBeenCalledWith(vehicle)
  })

  it('marks a sold-out vehicle and disables Purchase', () => {
    render(<VehicleCard vehicle={makeVehicle({ quantity: 0 })} isAdmin={false} {...handlers()} />)

    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Purchase Toyota Camry' })).toBeDisabled()
  })

  it('hides the admin controls from regular users', () => {
    render(<VehicleCard vehicle={makeVehicle()} isAdmin={false} {...handlers()} />)

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('gives admins edit, restock and delete controls wired to the vehicle', async () => {
    const vehicle = makeVehicle()
    const actions = handlers()
    const user = userEvent.setup()
    render(<VehicleCard vehicle={vehicle} isAdmin {...actions} />)

    await user.click(screen.getByRole('button', { name: 'Edit Toyota Camry' }))
    await user.click(screen.getByRole('button', { name: 'Restock Toyota Camry' }))
    await user.click(screen.getByRole('button', { name: 'Delete Toyota Camry' }))

    expect(actions.onEdit).toHaveBeenCalledWith(vehicle)
    expect(actions.onRestock).toHaveBeenCalledWith(vehicle)
    expect(actions.onDelete).toHaveBeenCalledWith(vehicle)
  })
})
