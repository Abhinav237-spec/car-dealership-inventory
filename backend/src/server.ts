import 'dotenv/config';
import { Pool } from 'pg';
import { createApp } from './app';
import { loadConfig } from './config';
import { migrate } from './db/migrate';
import { PostgresUserRepository } from './repositories/PostgresUserRepository';
import { PostgresVehicleRepository } from './repositories/PostgresVehicleRepository';
import { AuthService } from './services/AuthService';
import { BcryptPasswordHasher } from './services/PasswordHasher';
import { JwtTokenService } from './services/TokenService';
import { VehicleService } from './services/VehicleService';

/**
 * Composition root: the ONE place that picks concrete implementations
 * (Postgres, bcrypt, JWT) and wires them together. Everything else depends
 * only on interfaces, which is what makes the rest swappable and testable.
 *
 *   routes -> services -> repository interfaces -> Postgres
 */
async function main(): Promise<void> {
  const config = loadConfig();

  const pool = new Pool({ connectionString: config.databaseUrl });
  await migrate(pool); // keeps the schema current on every start

  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiresInSeconds);
  const authService = new AuthService(
    new PostgresUserRepository(pool),
    new BcryptPasswordHasher(config.bcryptCost),
    tokenService,
  );
  const vehicleService = new VehicleService(new PostgresVehicleRepository(pool));

  const app = createApp({ authService, tokenService, vehicleService });
  app.listen(config.port, () => {
    console.log(`Dealership API listening on http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
