/** Shapes shared with the backend API. Keep in sync with backend/src/domain/types.ts. */

export type Role = 'user' | 'admin'

export interface User {
  id: string
  email: string
  role: Role
}

/** What sign-in and registration return: a JWT plus the public user. */
export interface Session {
  token: string
  user: User
}

export interface Credentials {
  email: string
  password: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  category: string
  price: number
  /** Units in stock. Zero means sold out. */
  quantity: number
}

export type VehicleInput = Omit<Vehicle, 'id'>

/** Every filter is optional; empty ones are simply not sent. */
export interface VehicleFilters {
  make?: string
  model?: string
  category?: string
  minPrice?: number
  maxPrice?: number
}
