import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { parseInput } from '../validation/parse';
import { loginSchema, registerSchema } from '../validation/schemas';

/**
 * HTTP adapter for accounts: validate input, call the service, shape the
 * response. No business rules live here.
 */
export function authRoutes(authService: AuthService): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    const session = await authService.register(parseInput(registerSchema, req.body));
    res.status(201).json(session);
  });

  router.post('/login', async (req, res) => {
    const session = await authService.login(parseInput(loginSchema, req.body));
    res.json(session);
  });

  return router;
}
