/**
 * Domain types: the plain data shapes the whole backend agrees on.
 * They know nothing about HTTP or SQL, so every layer can import them.
 */

export type Role = 'user' | 'admin';

/** What a verified JWT tells us about the caller. */
export interface AuthUser {
  id: string;
  role: Role;
}

/** A stored user. `passwordHash` must never leave the backend. */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export type NewUser = Omit<User, 'id' | 'createdAt'>;

/** A car in the dealership's inventory. `quantity` is units in stock. */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

export type VehicleInput = Omit<Vehicle, 'id'>;

/** All filters are optional and combine with AND. */
export interface VehicleSearchCriteria {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

/** The safe-to-share view of a user (what the API returns). */
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
}
