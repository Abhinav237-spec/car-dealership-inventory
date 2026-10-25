import { request } from './client'
import type { Vehicle, VehicleFilters, VehicleInput } from './types'

export const listVehicles = () => request<Vehicle[]>('/api/vehicles')

/** Only filters that have a value are sent, so "no filter" and "empty filter" behave the same. */
export function searchVehicles(filters: VehicleFilters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const query = params.toString()
  return request<Vehicle[]>(`/api/vehicles/search${query ? `?${query}` : ''}`)
}

export const createVehicle = (input: VehicleInput) => request<Vehicle>('/api/vehicles', { method: 'POST', body: input })

export const updateVehicle = (id: string, input: VehicleInput) =>
  request<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: input })

export const deleteVehicle = (id: string) => request<void>(`/api/vehicles/${id}`, { method: 'DELETE' })

/** Buys one unit. Fails with 409 if the last unit was just taken. */
export const purchaseVehicle = (id: string) => request<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST' })

/** Admin only: adds `quantity` units to stock. */
export const restockVehicle = (id: string, quantity: number) =>
  request<Vehicle>(`/api/vehicles/${id}/restock`, { method: 'POST', body: { quantity } })
