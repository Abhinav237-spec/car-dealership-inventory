import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import * as vehiclesApi from '../api/vehicles'
import { ApiError } from '../api/client'
import { AuthProvider } from '../auth/AuthContext'
import { loadSession, saveSession } from '../auth/storage'
import { makeSession, makeVehicle } from '../test/fixtures'
import { DashboardPage } from './DashboardPage'

vi.mock('../api/vehicles')

const camry = makeVehicle()
const rav4 = makeVehicle({ id: 'vehicle-2', model: 'RAV4', category: 'SUV', price: 31000, quantity: 0 })
const civic = makeVehicle({ id: 'vehicle-3', make: 'Honda', model: 'Civic', price: 24800, quantity: 9 })

function renderDashboard(role: 'user' | 'admin' = 'user') {
  saveSession(makeSession(role))
  render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const card = (name: string) => screen.getByRole('article', { name })

beforeEach(() => {
  vi.mocked(vehiclesApi.listVehicles).mockReset().mockResolvedValue([camry, rav4, civic])
  vi.mocked(vehiclesApi.searchVehicles).mockReset().mockResolvedValue([camry])
})

describe('DashboardPage: browsing', () => {
  it('lists every vehicle with a count', async () => {
    renderDashboard()

    expect(await screen.findByText('3 vehicles')).toBeInTheDocument()
    expect(card('Toyota Camry')).toBeInTheDocument()
    expect(card('Toyota RAV4')).toBeInTheDocument()
    expect(card('Honda Civic')).toBeInTheDocument()
  })

  it('shows who is signed in and lets them sign out', async () => {
    renderDashboard()
    await screen.findByText('3 vehicles')

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /sign out/i }))

    expect(loadSession()).toBeNull()
  })

  it('shows an empty-lot message when there are no vehicles', async () => {
    vi.mocked(vehiclesApi.listVehicles).mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText(/no vehicles on the lot yet/i)).toBeInTheDocument()
  })

  it('explains a failed load and retries on request', async () => {
    vi.mocked(vehiclesApi.listVehicles)
      .mockRejectedValueOnce(new ApiError(0, 'Could not reach the server.'))
      .mockResolvedValueOnce([camry])
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.')
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('1 vehicle')).toBeInTheDocument()
  })
})

describe('DashboardPage: search and filter', () => {
  it('searches by make after the user pauses typing', async () => {
    renderDashboard()
    await screen.findByText('3 vehicles')

    await userEvent.setup().type(screen.getByLabelText(/^make$/i), 'toy')

    await waitFor(() => expect(vehiclesApi.searchVehicles).toHaveBeenLastCalledWith({ make: 'toy' }))
    expect(await screen.findByText('1 vehicle')).toBeInTheDocument()
  })

  it('filters by category chip', async () => {
    renderDashboard()
    await screen.findByText('3 vehicles')

    await userEvent.setup().click(screen.getByRole('button', { name: 'SUV' }))

    await waitFor(() => expect(vehiclesApi.searchVehicles).toHaveBeenLastCalledWith({ category: 'SUV' }))
  })

  it('filters by price range', async () => {
    renderDashboard()
    await screen.findByText('3 vehicles')

    await userEvent.setup().type(screen.getByLabelText(/min price/i), '30000')

    await waitFor(() => expect(vehiclesApi.searchVehicles).toHaveBeenLastCalledWith({ minPrice: 30000 }))
  })

  it('returns to the full list when filters are cleared', async () => {
    renderDashboard()
    await screen.findByText('3 vehicles')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/^make$/i), 'toy')
    await screen.findByText('1 vehicle')

    await user.click(screen.getByRole('button', { name: /clear filters/i }))

    expect(await screen.findByText('3 vehicles')).toBeInTheDocument()
  })

  it('says nothing matched, with a way to clear the filters', async () => {
    vi.mocked(vehiclesApi.searchVehicles).mockResolvedValue([])
    renderDashboard()
    await screen.findByText('3 vehicles')

    await userEvent.setup().type(screen.getByLabelText(/^make$/i), 'zzz')

    expect(await screen.findByText(/no vehicles match these filters/i)).toBeInTheDocument()
  })
})

describe('DashboardPage: purchasing', () => {
  it('buys one unit and shows the new stock and a confirmation', async () => {
    vi.mocked(vehiclesApi.purchaseVehicle).mockResolvedValue({ ...camry, quantity: 2 })
    renderDashboard()
    await screen.findByText('3 vehicles')

    await userEvent.setup().click(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i }))

    expect(vehiclesApi.purchaseVehicle).toHaveBeenCalledWith('vehicle-1')
    expect(await within(card('Toyota Camry')).findByRole('img', { name: '2 in stock' })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Purchased Toyota Camry')
  })

  it('disables Purchase on sold-out vehicles', async () => {
    renderDashboard()
    await screen.findByText('3 vehicles')

    expect(within(card('Toyota RAV4')).getByRole('button', { name: /purchase/i })).toBeDisabled()
    expect(within(card('Honda Civic')).getByRole('button', { name: /purchase/i })).toBeEnabled()
  })

  it('shows the server message and refreshes stock when someone else bought the last unit', async () => {
    vi.mocked(vehiclesApi.purchaseVehicle).mockRejectedValue(new ApiError(409, 'Vehicle is out of stock'))
    vi.mocked(vehiclesApi.listVehicles)
      .mockResolvedValueOnce([camry, rav4, civic])
      .mockResolvedValueOnce([{ ...camry, quantity: 0 }, rav4, civic])
    renderDashboard()
    await screen.findByText('3 vehicles')

    await userEvent.setup().click(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle is out of stock')
    await waitFor(() =>
      expect(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i })).toBeDisabled(),
    )
  })
})

describe('DashboardPage: admin tools', () => {
  it('hides admin tools from regular users', async () => {
    renderDashboard('user')
    await screen.findByText('3 vehicles')

    expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^edit /i })).not.toBeInTheDocument()
  })

  it('adds a vehicle through the form and refreshes the list', async () => {
    const added = makeVehicle({ id: 'vehicle-9', make: 'Mazda', model: 'MX-5', category: 'Convertible', price: 31200, quantity: 1 })
    vi.mocked(vehiclesApi.createVehicle).mockResolvedValue(added)
    vi.mocked(vehiclesApi.listVehicles)
      .mockResolvedValueOnce([camry])
      .mockResolvedValueOnce([camry, added])
    renderDashboard('admin')
    await screen.findByText('1 vehicle')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add vehicle' })
    await user.type(within(dialog).getByLabelText(/^make$/i), 'Mazda')
    await user.type(within(dialog).getByLabelText(/^model$/i), 'MX-5')
    await user.type(within(dialog).getByLabelText(/^category$/i), 'Convertible')
    await user.type(within(dialog).getByLabelText(/^price$/i), '31200')
    await user.type(within(dialog).getByLabelText(/^quantity$/i), '1')
    await user.click(within(dialog).getByRole('button', { name: 'Add vehicle' }))

    expect(vehiclesApi.createVehicle).toHaveBeenCalledWith({
      make: 'Mazda',
      model: 'MX-5',
      category: 'Convertible',
      price: 31200,
      quantity: 1,
    })
    expect(await screen.findByText('2 vehicles')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('refuses to submit the add form while required fields are empty', async () => {
    renderDashboard('admin')
    await screen.findByText('3 vehicles')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add vehicle' })
    await user.click(within(dialog).getByRole('button', { name: 'Add vehicle' }))

    expect(within(dialog).getByRole('alert')).toBeInTheDocument()
    expect(vehiclesApi.createVehicle).not.toHaveBeenCalled()
  })

  it('edits a vehicle with its current values prefilled', async () => {
    vi.mocked(vehiclesApi.updateVehicle).mockResolvedValue({ ...camry, price: 27000 })
    vi.mocked(vehiclesApi.listVehicles)
      .mockResolvedValueOnce([camry])
      .mockResolvedValueOnce([{ ...camry, price: 27000 }])
    renderDashboard('admin')
    await screen.findByText('1 vehicle')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Edit Toyota Camry' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit Toyota Camry' })
    const price = within(dialog).getByLabelText(/^price$/i)
    expect(price).toHaveValue(28500)
    await user.clear(price)
    await user.type(price, '27000')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(vehiclesApi.updateVehicle).toHaveBeenCalledWith('vehicle-1', {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 27000,
      quantity: 3,
    })
    expect(await screen.findByText('$27,000')).toBeInTheDocument()
  })

  it('restocks a vehicle with the chosen number of units', async () => {
    vi.mocked(vehiclesApi.restockVehicle).mockResolvedValue({ ...camry, quantity: 8 })
    vi.mocked(vehiclesApi.listVehicles)
      .mockResolvedValueOnce([camry])
      .mockResolvedValueOnce([{ ...camry, quantity: 8 }])
    renderDashboard('admin')
    await screen.findByText('1 vehicle')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Restock Toyota Camry' }))
    const dialog = await screen.findByRole('dialog', { name: 'Restock Toyota Camry' })
    await user.type(within(dialog).getByLabelText(/units to add/i), '5')
    await user.click(within(dialog).getByRole('button', { name: 'Add stock' }))

    expect(vehiclesApi.restockVehicle).toHaveBeenCalledWith('vehicle-1', 5)
    expect(await within(card('Toyota Camry')).findByRole('img', { name: '8 in stock' })).toBeInTheDocument()
  })

  it('rejects a restock of zero units before calling the API', async () => {
    renderDashboard('admin')
    await screen.findByText('3 vehicles')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Restock Toyota Camry' }))
    const dialog = await screen.findByRole('dialog', { name: 'Restock Toyota Camry' })
    await user.type(within(dialog).getByLabelText(/units to add/i), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Add stock' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(/1 or more/i)
    expect(vehiclesApi.restockVehicle).not.toHaveBeenCalled()
  })

  it('deletes a vehicle only after confirmation', async () => {
    vi.mocked(vehiclesApi.deleteVehicle).mockResolvedValue(undefined)
    vi.mocked(vehiclesApi.listVehicles)
      .mockResolvedValueOnce([camry, civic])
      .mockResolvedValueOnce([civic])
    renderDashboard('admin')
    await screen.findByText('2 vehicles')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete Toyota Camry' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete Toyota Camry?' })
    expect(vehiclesApi.deleteVehicle).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Delete vehicle' }))

    expect(vehiclesApi.deleteVehicle).toHaveBeenCalledWith('vehicle-1')
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Toyota Camry' })).not.toBeInTheDocument())
  })

  it('keeps the vehicle when the delete is cancelled', async () => {
    renderDashboard('admin')
    await screen.findByText('3 vehicles')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Delete Toyota Camry' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete Toyota Camry?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(vehiclesApi.deleteVehicle).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(card('Toyota Camry')).toBeInTheDocument()
  })

  it('closes a dialog with the Escape key', async () => {
    renderDashboard('admin')
    await screen.findByText('3 vehicles')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
    await screen.findByRole('dialog', { name: 'Add vehicle' })
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
