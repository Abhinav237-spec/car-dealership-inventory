import { createApp } from '../../src/app';
import { AuthService } from '../../src/services/AuthService';
import { BcryptPasswordHasher } from '../../src/services/PasswordHasher';
import { JwtTokenService } from '../../src/services/TokenService';
import { InMemoryUserRepository } from './InMemoryUserRepository';

/**
 * Wires the whole app with in-memory repositories so HTTP tests run fast
 * and never touch a database. This mirrors what src/server.ts does with
 * the real Postgres repositories (the "composition root").
 */
export function buildTestApp() {
  const userRepository = new InMemoryUserRepository();
  const tokenService = new JwtTokenService('test-secret', 3600);
  // Low bcrypt cost keeps the suite fast; production uses a higher cost.
  const authService = new AuthService(userRepository, new BcryptPasswordHasher(4), tokenService);

  const app = createApp({ authService, tokenService });

  return { app, userRepository, tokenService, authService };
}
