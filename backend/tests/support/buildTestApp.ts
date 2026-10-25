import { createApp } from '../../src/app';
import { Role } from '../../src/domain/types';
import { AuthService } from '../../src/services/AuthService';
import { BcryptPasswordHasher } from '../../src/services/PasswordHasher';
import { JwtTokenService } from '../../src/services/TokenService';
import { VehicleService } from '../../src/services/VehicleService';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { InMemoryVehicleRepository } from './InMemoryVehicleRepository';

/**
 * Wires the whole app with in-memory repositories so HTTP tests run fast
 * and never touch a database. This mirrors what src/server.ts does with
 * the real Postgres repositories (the "composition root").
 */
export function buildTestApp() {
  const userRepository = new InMemoryUserRepository();
  const vehicleRepository = new InMemoryVehicleRepository();
  const tokenService = new JwtTokenService('test-secret', 3600);
  // Low bcrypt cost keeps the suite fast; production uses a higher cost.
  const authService = new AuthService(userRepository, new BcryptPasswordHasher(4), tokenService);
  const vehicleService = new VehicleService(vehicleRepository);

  const app = createApp({ authService, tokenService, vehicleService });

  /** "Bearer <jwt>" header value for a caller with the given role. */
  const authHeader = (role: Role = 'user') =>
    `Bearer ${tokenService.sign({ id: `${role}-test-id`, role })}`;

  return { app, userRepository, vehicleRepository, tokenService, authService, authHeader };
}
