import { ErrorRequestHandler } from 'express';
import { AppError } from '../domain/errors';

/**
 * The single place where errors become HTTP responses.
 * Known domain errors keep their status; anything unexpected is logged and
 * returned as a generic 500 so internals never leak to clients.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
