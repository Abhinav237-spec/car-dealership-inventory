import { Vehicle, VehicleInput, VehicleSearchCriteria } from '../domain/types';

/**
 * Storage contract for vehicles (see UserRepository for why it's an interface).
 * Lists come back ordered by make, then model.
 */
export interface VehicleRepository {
  create(input: VehicleInput): Promise<Vehicle>;
  findAll(): Promise<Vehicle[]>;
  findById(id: string): Promise<Vehicle | null>;

  /**
   * make/model: case-insensitive "contains". category: case-insensitive exact.
   * Prices are inclusive bounds.
   */
  search(criteria: VehicleSearchCriteria): Promise<Vehicle[]>;

  /** Returns null when the vehicle does not exist. */
  update(id: string, changes: Partial<VehicleInput>): Promise<Vehicle | null>;

  /** Returns false when the vehicle does not exist. */
  delete(id: string): Promise<boolean>;

  /**
   * Removes one unit from stock in a single atomic step, only if stock > 0.
   * Returns null when the vehicle is missing OR already sold out.
   * Being atomic is what stops two buyers taking the last car.
   */
  decrementStock(id: string): Promise<Vehicle | null>;

  /** Adds `amount` units. Returns null when the vehicle does not exist. */
  incrementStock(id: string, amount: number): Promise<Vehicle | null>;
}
