import { randomUUID } from 'node:crypto';
import { VehicleInput } from '../../src/domain/types';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';

const camry: VehicleInput = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500.5, quantity: 3 };
const rav4: VehicleInput = { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31000, quantity: 0 };
const civic: VehicleInput = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 5 };
const f150: VehicleInput = { make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 2 };

/** Behaviour every VehicleRepository must have (see userRepository.contract.ts). */
export function describeVehicleRepositoryContract(name: string, makeRepository: () => Promise<VehicleRepository>) {
  describe(`${name} satisfies the VehicleRepository contract`, () => {
    let repo: VehicleRepository;

    beforeEach(async () => {
      repo = await makeRepository();
    });

    const seed = async () => {
      for (const v of [camry, rav4, civic, f150]) await repo.create(v);
    };
    const modelsOf = (vehicles: { model: string }[]) => vehicles.map((v) => v.model);

    describe('create / find', () => {
      it('creates a vehicle with a generated id and numeric price', async () => {
        const vehicle = await repo.create(camry);

        expect(vehicle).toEqual({ id: expect.any(String), ...camry });
        expect(typeof vehicle.price).toBe('number');
      });

      it('finds by id and returns null for an unknown id', async () => {
        const vehicle = await repo.create(camry);

        expect(await repo.findById(vehicle.id)).toEqual(vehicle);
        expect(await repo.findById(randomUUID())).toBeNull();
      });

      it('lists all vehicles ordered by make then model', async () => {
        await seed();

        expect(modelsOf(await repo.findAll())).toEqual(['F-150', 'Civic', 'Camry', 'RAV4']);
      });
    });

    describe('search', () => {
      it('returns everything for empty criteria', async () => {
        await seed();

        expect(await repo.search({})).toHaveLength(4);
      });

      it('matches make and model case-insensitively as a partial match', async () => {
        await seed();

        expect(modelsOf(await repo.search({ make: 'TOY' }))).toEqual(['Camry', 'RAV4']);
        expect(modelsOf(await repo.search({ model: 'ivi' }))).toEqual(['Civic']);
      });

      it('matches category exactly, ignoring case', async () => {
        await seed();

        expect(modelsOf(await repo.search({ category: 'sedan' }))).toEqual(['Civic', 'Camry']);
        expect(await repo.search({ category: 'sed' })).toEqual([]);
      });

      it('treats price bounds as inclusive', async () => {
        await seed();

        expect(modelsOf(await repo.search({ minPrice: 31000 }))).toEqual(['F-150', 'RAV4']);
        expect(modelsOf(await repo.search({ maxPrice: 24000 }))).toEqual(['Civic']);
        expect(modelsOf(await repo.search({ minPrice: 24000, maxPrice: 28500.5 }))).toEqual(['Civic', 'Camry']);
      });

      it('combines criteria with AND', async () => {
        await seed();

        expect(modelsOf(await repo.search({ make: 'toyota', category: 'SUV', maxPrice: 40000 }))).toEqual(['RAV4']);
      });

      it('treats % and _ in the text as literal characters, not wildcards', async () => {
        await seed();

        expect(await repo.search({ make: '%' })).toEqual([]);
        expect(await repo.search({ model: 'C_mry' })).toEqual([]);
      });
    });

    describe('update / delete', () => {
      it('changes only the given fields', async () => {
        const vehicle = await repo.create(camry);

        const updated = await repo.update(vehicle.id, { price: 27000, quantity: 9 });

        expect(updated).toEqual({ ...vehicle, price: 27000, quantity: 9 });
        expect(await repo.findById(vehicle.id)).toEqual(updated);
      });

      it('returns null when updating an unknown vehicle', async () => {
        expect(await repo.update(randomUUID(), { price: 1 })).toBeNull();
      });

      it('deletes a vehicle once, then reports it missing', async () => {
        const vehicle = await repo.create(camry);

        expect(await repo.delete(vehicle.id)).toBe(true);
        expect(await repo.findById(vehicle.id)).toBeNull();
        expect(await repo.delete(vehicle.id)).toBe(false);
      });
    });

    describe('stock', () => {
      it('decrements stock by one', async () => {
        const vehicle = await repo.create(camry);

        expect((await repo.decrementStock(vehicle.id))?.quantity).toBe(2);
      });

      it('returns null at zero stock and never goes negative', async () => {
        const soldOut = await repo.create(rav4);

        expect(await repo.decrementStock(soldOut.id)).toBeNull();
        expect((await repo.findById(soldOut.id))?.quantity).toBe(0);
      });

      it('returns null when decrementing an unknown vehicle', async () => {
        expect(await repo.decrementStock(randomUUID())).toBeNull();
      });

      it('lets exactly "stock" concurrent buyers succeed', async () => {
        const vehicle = await repo.create(camry); // 3 in stock

        const results = await Promise.all(Array.from({ length: 10 }, () => repo.decrementStock(vehicle.id)));

        expect(results.filter(Boolean)).toHaveLength(3);
        expect((await repo.findById(vehicle.id))?.quantity).toBe(0);
      });

      it('increments stock and returns null for an unknown vehicle', async () => {
        const vehicle = await repo.create(rav4);

        expect((await repo.incrementStock(vehicle.id, 7))?.quantity).toBe(7);
        expect(await repo.incrementStock(randomUUID(), 1)).toBeNull();
      });
    });
  });
}
