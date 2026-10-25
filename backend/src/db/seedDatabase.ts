import { Pool } from 'pg';
import { VehicleInput } from '../domain/types';
import { PostgresUserRepository } from '../repositories/PostgresUserRepository';
import { PostgresVehicleRepository } from '../repositories/PostgresVehicleRepository';
import { BcryptPasswordHasher } from '../services/PasswordHasher';

const SAMPLE_VEHICLES: VehicleInput[] = [
  { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 6 },
  { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31900, quantity: 4 },
  { make: 'Toyota', model: 'Tacoma', category: 'Truck', price: 34200, quantity: 0 },
  { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24800, quantity: 9 },
  { make: 'Honda', model: 'CR-V', category: 'SUV', price: 33100, quantity: 3 },
  { make: 'Honda', model: 'Accord', category: 'Sedan', price: 29500, quantity: 2 },
  { make: 'Ford', model: 'F-150', category: 'Truck', price: 45900, quantity: 5 },
  { make: 'Ford', model: 'Mustang', category: 'Coupe', price: 42800, quantity: 1 },
  { make: 'Ford', model: 'Mustang Mach-E', category: 'Electric', price: 47900, quantity: 3 },
  { make: 'Tesla', model: 'Model 3', category: 'Electric', price: 40200, quantity: 4 },
  { make: 'Tesla', model: 'Model Y', category: 'Electric', price: 46900, quantity: 0 },
  { make: 'BMW', model: '330i', category: 'Sedan', price: 46500, quantity: 2 },
  { make: 'BMW', model: 'X3', category: 'SUV', price: 50400, quantity: 3 },
  { make: 'Mazda', model: 'MX-5 Miata', category: 'Convertible', price: 31200, quantity: 1 },
  { make: 'Subaru', model: 'Outback', category: 'Wagon', price: 31900, quantity: 7 },
  { make: 'Volkswagen', model: 'Golf GTI', category: 'Hatchback', price: 32400, quantity: 2 },
  { make: 'Chevrolet', model: 'Silverado', category: 'Truck', price: 44900, quantity: 4 },
  { make: 'Hyundai', model: 'Ioniq 5', category: 'Electric', price: 43600, quantity: 6 },
];

/**
 * Creates the admin account (admins cannot self-register) and, only when the
 * table is empty, a showroom of sample vehicles. Safe to run repeatedly.
 * Used by `npm run seed` and, when SEED_ON_START=true, by the server at boot
 * (handy on hosts without a shell, such as Render's free tier).
 */
export async function seedDatabase(pool: Pool, bcryptCost: number): Promise<void> {
  const users = new PostgresUserRepository(pool);
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@dealership.test').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin#12345';
  if (await users.findByEmail(adminEmail)) {
    console.log(`Admin ${adminEmail} already exists.`);
  } else {
    const passwordHash = await new BcryptPasswordHasher(bcryptCost).hash(adminPassword);
    await users.create({ email: adminEmail, passwordHash, role: 'admin' });
    console.log(`Created admin ${adminEmail}`);
  }

  const vehicles = new PostgresVehicleRepository(pool);
  if ((await vehicles.findAll()).length === 0) {
    for (const vehicle of SAMPLE_VEHICLES) await vehicles.create(vehicle);
    console.log(`Added ${SAMPLE_VEHICLES.length} sample vehicles.`);
  } else {
    console.log('Vehicles already present; skipping samples.');
  }
}
