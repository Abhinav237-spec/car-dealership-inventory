import { Pool } from 'pg';
import { Vehicle, VehicleInput, VehicleSearchCriteria } from '../domain/types';
import { VehicleRepository } from './VehicleRepository';

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  category: string;
  price: string; // NUMERIC comes back from pg as a string to avoid precision loss
  quantity: number;
}

const COLUMNS = 'id, make, model, category, price, quantity';
const ORDER = 'ORDER BY make, model, id';
/** The only columns an update may touch: a whitelist, so no input ever becomes SQL. */
const UPDATABLE = ['make', 'model', 'category', 'price', 'quantity'] as const;

const toVehicle = (row: VehicleRow): Vehicle => ({ ...row, price: Number(row.price) });

/** Escapes LIKE wildcards so a search for "%" or "_" matches those literal characters. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

export class PostgresVehicleRepository implements VehicleRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: VehicleInput): Promise<Vehicle> {
    const { rows } = await this.pool.query<VehicleRow>(
      `INSERT INTO vehicles (make, model, category, price, quantity)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
      [input.make, input.model, input.category, input.price, input.quantity],
    );
    return toVehicle(rows[0]);
  }

  async findAll(): Promise<Vehicle[]> {
    const { rows } = await this.pool.query<VehicleRow>(`SELECT ${COLUMNS} FROM vehicles ${ORDER}`);
    return rows.map(toVehicle);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const { rows } = await this.pool.query<VehicleRow>(`SELECT ${COLUMNS} FROM vehicles WHERE id = $1`, [id]);
    return rows[0] ? toVehicle(rows[0]) : null;
  }

  async search({ make, model, category, minPrice, maxPrice }: VehicleSearchCriteria): Promise<Vehicle[]> {
    // Build the WHERE clause from only the filters provided. Values always go
    // through $n placeholders (never string-concatenated), preventing SQL injection.
    const conditions: string[] = [];
    const values: unknown[] = [];
    const filter = (build: (placeholder: string) => string, value: unknown) => {
      values.push(value);
      conditions.push(build(`$${values.length}`));
    };

    if (make) filter((p) => `make ILIKE ${p}`, `%${escapeLike(make)}%`);
    if (model) filter((p) => `model ILIKE ${p}`, `%${escapeLike(model)}%`);
    if (category) filter((p) => `LOWER(category) = LOWER(${p})`, category);
    if (minPrice !== undefined) filter((p) => `price >= ${p}`, minPrice);
    if (maxPrice !== undefined) filter((p) => `price <= ${p}`, maxPrice);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.pool.query<VehicleRow>(
      `SELECT ${COLUMNS} FROM vehicles ${where} ${ORDER}`,
      values,
    );
    return rows.map(toVehicle);
  }

  async update(id: string, changes: Partial<VehicleInput>): Promise<Vehicle | null> {
    const assignments: string[] = [];
    const values: unknown[] = [id];
    for (const column of UPDATABLE) {
      if (changes[column] !== undefined) {
        values.push(changes[column]);
        assignments.push(`${column} = $${values.length}`);
      }
    }
    if (assignments.length === 0) return this.findById(id);

    const { rows } = await this.pool.query<VehicleRow>(
      `UPDATE vehicles SET ${assignments.join(', ')}, updated_at = now()
       WHERE id = $1 RETURNING ${COLUMNS}`,
      values,
    );
    return rows[0] ? toVehicle(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * The race-proof purchase. "quantity > 0" is checked and the decrement is
   * applied in ONE statement, so the database serialises concurrent buyers:
   * if two people grab the last car, only one UPDATE matches a row.
   */
  async decrementStock(id: string): Promise<Vehicle | null> {
    const { rows } = await this.pool.query<VehicleRow>(
      `UPDATE vehicles SET quantity = quantity - 1, updated_at = now()
       WHERE id = $1 AND quantity > 0 RETURNING ${COLUMNS}`,
      [id],
    );
    return rows[0] ? toVehicle(rows[0]) : null;
  }

  async incrementStock(id: string, amount: number): Promise<Vehicle | null> {
    const { rows } = await this.pool.query<VehicleRow>(
      `UPDATE vehicles SET quantity = quantity + $2, updated_at = now()
       WHERE id = $1 RETURNING ${COLUMNS}`,
      [id, amount],
    );
    return rows[0] ? toVehicle(rows[0]) : null;
  }
}
