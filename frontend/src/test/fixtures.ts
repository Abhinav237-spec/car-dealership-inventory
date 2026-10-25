import type { Session, Vehicle } from '../api/types'

/** Builds a signed-in session for tests; pass 'admin' to get admin powers. */
export function makeSession(role: 'user' | 'admin' = 'user'): Session {
  return {
    token: `token-for-${role}`,
    user: { id: `${role}-1`, email: `${role}@example.com`, role },
  }
}

/** Builds a vehicle with sensible defaults; override only what a test cares about. */
export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 28500,
    quantity: 3,
    ...overrides,
  }
}
