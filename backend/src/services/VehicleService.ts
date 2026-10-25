import { ConflictError, NotFoundError } from '../domain/errors';
import { Vehicle, VehicleInput, VehicleSearchCriteria } from '../domain/types';
import { VehicleRepository } from '../repositories/VehicleRepository';

/**
 * Business rules for inventory. Like AuthService it is HTTP-agnostic:
 * validated input in, domain objects or domain errors out.
 */
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  add(input: VehicleInput): Promise<Vehicle> {
    return this.vehicles.create(input);
  }

  /** Every vehicle, sold-out ones included, so the UI can show them as unavailable. */
  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }

  search(criteria: VehicleSearchCriteria): Promise<Vehicle[]> {
    return this.vehicles.search(criteria);
  }

  async update(id: string, changes: Partial<VehicleInput>): Promise<Vehicle> {
    return this.orNotFound(await this.vehicles.update(id, changes));
  }

  async remove(id: string): Promise<void> {
    if (!(await this.vehicles.delete(id))) {
      throw new NotFoundError('Vehicle not found');
    }
  }

  /** Sells one unit. 404 if unknown, 409 if there is nothing left to sell. */
  async purchase(id: string): Promise<Vehicle> {
    const updated = await this.vehicles.decrementStock(id);
    if (updated) return updated;

    // decrementStock returns null for two reasons; tell them apart for the client.
    await this.orNotFound(await this.vehicles.findById(id));
    throw new ConflictError('Vehicle is out of stock');
  }

  async restock(id: string, amount: number): Promise<Vehicle> {
    return this.orNotFound(await this.vehicles.incrementStock(id, amount));
  }

  private orNotFound(vehicle: Vehicle | null): Vehicle {
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }
}
