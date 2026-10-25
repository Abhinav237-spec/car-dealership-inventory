import express, { Express, Request, Response } from 'express';
import cors from 'cors';

/**
 * Builds the Express application.
 *
 * Kept separate from the HTTP listener (see server.ts) so tests can
 * exercise the app with Supertest without binding to a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Fallback for any route that no handler matched.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}
