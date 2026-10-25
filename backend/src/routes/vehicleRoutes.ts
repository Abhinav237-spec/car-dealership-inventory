import { Router } from 'express';
import { z } from 'zod';
import { NotFoundError } from '../domain/errors';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { TokenService } from '../services/TokenService';
import { VehicleService } from '../services/VehicleService';
import { parseInput } from '../validation/parse';
import {
  restockSchema,
  vehicleInputSchema,
  vehicleSearchSchema,
  vehicleUpdateSchema,
} from '../validation/schemas';

/** A malformed id cannot match any vehicle, so it is a 404 rather than a database error. */
function vehicleId(raw: unknown): string {
  const parsed = z.uuid().safeParse(raw);
  if (!parsed.success) throw new NotFoundError('Vehicle not found');
  return parsed.data;
}

/**
 * HTTP adapter for inventory. Every route needs a valid token; delete and
 * restock additionally need the admin role (per the kata's requirements).
 */
export function vehicleRoutes(service: VehicleService, tokens: TokenService): Router {
  const router = Router();
  const adminOnly = requireRole('admin');

  router.use(authenticate(tokens));

  router.post('/', async (req, res) => {
    const vehicle = await service.add(parseInput(vehicleInputSchema, req.body));
    res.status(201).json(vehicle);
  });

  router.get('/', async (_req, res) => {
    res.json(await service.list());
  });

  // Declared before "/:id" routes so "search" is not mistaken for an id.
  router.get('/search', async (req, res) => {
    res.json(await service.search(parseInput(vehicleSearchSchema, req.query)));
  });

  router.put('/:id', async (req, res) => {
    const id = vehicleId(req.params.id);
    res.json(await service.update(id, parseInput(vehicleUpdateSchema, req.body)));
  });

  router.delete('/:id', adminOnly, async (req, res) => {
    await service.remove(vehicleId(req.params.id));
    res.status(204).end();
  });

  router.post('/:id/purchase', async (req, res) => {
    res.json(await service.purchase(vehicleId(req.params.id)));
  });

  router.post('/:id/restock', adminOnly, async (req, res) => {
    const { quantity } = parseInput(restockSchema, req.body);
    res.json(await service.restock(vehicleId(req.params.id), quantity));
  });

  return router;
}
