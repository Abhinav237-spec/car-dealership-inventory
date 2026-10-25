import { randomUUID } from 'node:crypto';
import { Vehicle, VehicleInput, VehicleSearchCriteria } from '../../src/domain/types';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';

const byMakeThenModel = (a: Vehicle, b: Vehicle) =>
  a.make.localeCompare(b.make) || a.model.localeCompare(b.model);

/**
 * In-memory stand-in for the Postgres vehicle repository (tests only).
 * The shared contract tests prove it behaves like the real one.
 */
export class InMemoryVehicleRepository implements VehicleRepository {
  private vehicles: Vehicle[] = [];

  async create(input: VehicleInput): Promise<Vehicle> {
    const vehicle: Vehicle = { id: randomUUID(), ...input };
    this.vehicles.push(vehicle);
    return { ...vehicle };
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicles.map((v) => ({ ...v })).sort(byMakeThenModel);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const found = this.vehicles.find((v) => v.id === id);
    return found ? { ...found } : null;
  }

  async search(criteria: VehicleSearchCriteria): Promise<Vehicle[]> {
    const { make, model, category, minPrice, maxPrice } = criteria;
    const contains = (value: string, query?: string) =>
      !query || value.toLowerCase().includes(query.toLowerCase());

    return (await this.findAll()).filter(
      (v) =>
        contains(v.make, make) &&
        contains(v.model, model) &&
        (!category || v.category.toLowerCase() === category.toLowerCase()) &&
        (minPrice === undefined || v.price >= minPrice) &&
        (maxPrice === undefined || v.price <= maxPrice),
    );
  }

  async update(id: string, changes: Partial<VehicleInput>): Promise<Vehicle | null> {
    const index = this.vehicles.findIndex((v) => v.id === id);
    if (index === -1) return null;
    this.vehicles[index] = { ...this.vehicles[index], ...changes };
    return { ...this.vehicles[index] };
  }

  async delete(id: string): Promise<boolean> {
    const before = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    return this.vehicles.length < before;
  }

  async decrementStock(id: string): Promise<Vehicle | null> {
    const vehicle = this.vehicles.find((v) => v.id === id);
    if (!vehicle || vehicle.quantity <= 0) return null;
    vehicle.quantity -= 1;
    return { ...vehicle };
  }

  async incrementStock(id: string, amount: number): Promise<Vehicle | null> {
    const vehicle = this.vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    vehicle.quantity += amount;
    return { ...vehicle };
  }
}
