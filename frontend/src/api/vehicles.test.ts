import { request } from './client'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
} from './vehicles'

vi.mock('./client')

const input = { make: 'Ford', model: 'F-150', category: 'Truck', price: 45900, quantity: 5 }

beforeEach(() => {
  vi.mocked(request).mockReset()
  vi.mocked(request).mockResolvedValue(undefined)
})

describe('vehicle API calls', () => {
  it('lists vehicles', async () => {
    await listVehicles()

    expect(request).toHaveBeenCalledWith('/api/vehicles')
  })

  it('builds the search query from the filters, leaving out empty ones', async () => {
    await searchVehicles({ make: 'toy', category: '', minPrice: 25000, maxPrice: undefined })

    expect(request).toHaveBeenCalledWith('/api/vehicles/search?make=toy&minPrice=25000')
  })

  it('encodes search text safely', async () => {
    await searchVehicles({ model: 'Mach E & more' })

    expect(request).toHaveBeenCalledWith('/api/vehicles/search?model=Mach+E+%26+more')
  })

  it('creates a vehicle with POST', async () => {
    await createVehicle(input)

    expect(request).toHaveBeenCalledWith('/api/vehicles', { method: 'POST', body: input })
  })

  it('updates a vehicle with PUT', async () => {
    await updateVehicle('abc', input)

    expect(request).toHaveBeenCalledWith('/api/vehicles/abc', { method: 'PUT', body: input })
  })

  it('deletes a vehicle with DELETE', async () => {
    await deleteVehicle('abc')

    expect(request).toHaveBeenCalledWith('/api/vehicles/abc', { method: 'DELETE' })
  })

  it('purchases a vehicle', async () => {
    await purchaseVehicle('abc')

    expect(request).toHaveBeenCalledWith('/api/vehicles/abc/purchase', { method: 'POST' })
  })

  it('restocks a vehicle with the number of units', async () => {
    await restockVehicle('abc', 4)

    expect(request).toHaveBeenCalledWith('/api/vehicles/abc/restock', { method: 'POST', body: { quantity: 4 } })
  })
})
