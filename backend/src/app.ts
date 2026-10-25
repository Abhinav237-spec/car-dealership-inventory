import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/authRoutes';
import { AuthService } from './services/AuthService';
import { TokenService } from './services/TokenService';

/** Everything the app needs, injected from outside (see server.ts / tests). */
export interface AppDependencies {
  authService: AuthService;
  tokenService: TokenService;
}

/**
 * Builds the Express application from its dependencies.
 *
 * Kept separate from the HTTP listener (server.ts) so tests can drive the
 * app with Supertest, with fake repositories, and without opening a port.
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes(deps.authService));

  // Fallbacks run last: unknown routes, then the central error handler.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });
  app.use(errorHandler);

  return app;
}
