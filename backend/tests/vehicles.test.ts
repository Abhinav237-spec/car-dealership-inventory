import request from 'supertest';
import { buildTestApp } from './support/buildTestApp';

const newVehicle = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 3 };

/** Small catalogue used by the list/search tests. */
async function seedCatalogue(app: ReturnType<typeof buildTestApp>) {
  const { vehicleRepository } = app;
  return {
    camry: await vehicleRepository.create(newVehicle),
    rav4: await vehicleRepository.create({ make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31000, quantity: 0 }),
    civic: await vehicleRepository.create({ make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 5 }),
    f150: await vehicleRepository.create({ make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 2 }),
  };
}

const modelsOf = (res: request.Response) => res.body.map((v: { model: string }) => v.model);

describe('vehicle endpoints require authentication', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const routes: ['get' | 'post' | 'put' | 'delete', string][] = [
    ['get', '/api/vehicles'],
    ['get', '/api/vehicles/search'],
    ['post', '/api/vehicles'],
    ['put', `/api/vehicles/${id}`],
    ['delete', `/api/vehicles/${id}`],
    ['post', `/api/vehicles/${id}/purchase`],
    ['post', `/api/vehicles/${id}/restock`],
  ];

  it.each(routes)('%s %s returns 401 without a token', async (method, path) => {
    const { app } = buildTestApp();

    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/vehicles', () => {
  it('adds a vehicle and returns it with a generated id', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app).post('/api/vehicles').set('Authorization', authHeader()).send(newVehicle);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), ...newVehicle });
  });

  it('gives every vehicle a unique id', async () => {
    const { app, authHeader } = buildTestApp();
    const post = () => request(app).post('/api/vehicles').set('Authorization', authHeader()).send(newVehicle);

    const [a, b] = [await post(), await post()];

    expect(a.body.id).not.toBe(b.body.id);
  });

  it.each([
    ['a missing make', { ...newVehicle, make: undefined }, /make/],
    ['a blank model', { ...newVehicle, model: '   ' }, /model/],
    ['a negative price', { ...newVehicle, price: -1 }, /price/],
    ['a fractional quantity', { ...newVehicle, quantity: 1.5 }, /quantity/],
    ['a negative quantity', { ...newVehicle, quantity: -2 }, /quantity/],
    ['a price sent as text', { ...newVehicle, price: '100' }, /price/],
  ])('rejects %s with 400', async (_label, body, field) => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app).post('/api/vehicles').set('Authorization', authHeader()).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(field);
  });
});

describe('GET /api/vehicles', () => {
  it('lists every vehicle, including sold-out ones, ordered by make then model', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    const res = await request(ctx.app).get('/api/vehicles').set('Authorization', ctx.authHeader());

    expect(res.status).toBe(200);
    expect(modelsOf(res)).toEqual(['F-150', 'Civic', 'Camry', 'RAV4']);
  });

  it('returns an empty list when there is no stock yet', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app).get('/api/vehicles').set('Authorization', authHeader());

    expect(res.body).toEqual([]);
  });
});

describe('GET /api/vehicles/search', () => {
  const search = (ctx: ReturnType<typeof buildTestApp>, query: string) =>
    request(ctx.app).get(`/api/vehicles/search?${query}`).set('Authorization', ctx.authHeader());

  it('matches make case-insensitively and partially', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    expect(modelsOf(await search(ctx, 'make=toy'))).toEqual(['Camry', 'RAV4']);
  });

  it('matches model', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    expect(modelsOf(await search(ctx, 'model=civ'))).toEqual(['Civic']);
  });

  it('matches category exactly, ignoring case', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    expect(modelsOf(await search(ctx, 'category=suv'))).toEqual(['RAV4']);
  });

  it('filters by minimum and maximum price (inclusive)', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    expect(modelsOf(await search(ctx, 'minPrice=31000'))).toEqual(['F-150', 'RAV4']);
    expect(modelsOf(await search(ctx, 'maxPrice=24000'))).toEqual(['Civic']);
    expect(modelsOf(await search(ctx, 'minPrice=25000&maxPrice=30000'))).toEqual(['Camry']);
  });

  it('combines filters with AND', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    expect(modelsOf(await search(ctx, 'make=toyota&category=sedan'))).toEqual(['Camry']);
  });

  it('ignores empty filters and returns everything', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    const res = await search(ctx, 'make=&minPrice=');

    expect(res.body).toHaveLength(4);
  });

  it('returns an empty list when nothing matches', async () => {
    const ctx = buildTestApp();
    await seedCatalogue(ctx);

    const res = await search(ctx, 'make=tesla');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('rejects a non-numeric price with 400', async () => {
    const ctx = buildTestApp();

    expect((await search(ctx, 'minPrice=cheap')).status).toBe(400);
  });

  it('rejects minPrice above maxPrice with 400', async () => {
    const ctx = buildTestApp();

    expect((await search(ctx, 'minPrice=50000&maxPrice=1000')).status).toBe(400);
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('updates only the fields that were sent', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx);

    const res = await request(ctx.app)
      .put(`/api/vehicles/${camry.id}`)
      .set('Authorization', ctx.authHeader())
      .send({ price: 27000 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...camry, price: 27000 });
  });

  it('returns 404 for an unknown vehicle', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app)
      .put('/api/vehicles/11111111-1111-4111-8111-111111111111')
      .set('Authorization', authHeader())
      .send({ price: 1 });

    expect(res.status).toBe(404);
  });

  it('returns 404 for a malformed id', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app).put('/api/vehicles/not-a-uuid').set('Authorization', authHeader()).send({ price: 1 });

    expect(res.status).toBe(404);
  });

  it('rejects an empty update with 400', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx);

    const res = await request(ctx.app).put(`/api/vehicles/${camry.id}`).set('Authorization', ctx.authHeader()).send({});

    expect(res.status).toBe(400);
  });

  it('rejects an invalid value with 400', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx);

    const res = await request(ctx.app)
      .put(`/api/vehicles/${camry.id}`)
      .set('Authorization', ctx.authHeader())
      .send({ price: -5 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/vehicles/:id (admin only)', () => {
  it('lets an admin delete a vehicle (204)', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx);

    const res = await request(ctx.app).delete(`/api/vehicles/${camry.id}`).set('Authorization', ctx.authHeader('admin'));

    expect(res.status).toBe(204);
    expect(await ctx.vehicleRepository.findById(camry.id)).toBeNull();
  });

  it('forbids a regular user (403) and keeps the vehicle', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx);

    const res = await request(ctx.app).delete(`/api/vehicles/${camry.id}`).set('Authorization', ctx.authHeader('user'));

    expect(res.status).toBe(403);
    expect(await ctx.vehicleRepository.findById(camry.id)).not.toBeNull();
  });

  it('returns 404 for an unknown vehicle', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app)
      .delete('/api/vehicles/11111111-1111-4111-8111-111111111111')
      .set('Authorization', authHeader('admin'));

    expect(res.status).toBe(404);
  });
});

describe('POST /api/vehicles/:id/purchase', () => {
  it('decreases the quantity by one and returns the updated vehicle', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx);

    const res = await request(ctx.app).post(`/api/vehicles/${camry.id}/purchase`).set('Authorization', ctx.authHeader());

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(2);
  });

  it('refuses to sell a sold-out vehicle (409) and leaves stock at zero', async () => {
    const ctx = buildTestApp();
    const { rav4 } = await seedCatalogue(ctx);

    const res = await request(ctx.app).post(`/api/vehicles/${rav4.id}/purchase`).set('Authorization', ctx.authHeader());

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/out of stock/i);
    expect((await ctx.vehicleRepository.findById(rav4.id))?.quantity).toBe(0);
  });

  it('returns 404 for an unknown vehicle', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app)
      .post('/api/vehicles/11111111-1111-4111-8111-111111111111/purchase')
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });

  it('never oversells when purchases arrive at the same time', async () => {
    const ctx = buildTestApp();
    const { camry } = await seedCatalogue(ctx); // 3 in stock

    const responses = await Promise.all(
      Array.from({ length: 6 }, () =>
        request(ctx.app).post(`/api/vehicles/${camry.id}/purchase`).set('Authorization', ctx.authHeader()),
      ),
    );

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 200, 200, 409, 409, 409]);
    expect((await ctx.vehicleRepository.findById(camry.id))?.quantity).toBe(0);
  });
});

describe('POST /api/vehicles/:id/restock (admin only)', () => {
  it('lets an admin add stock', async () => {
    const ctx = buildTestApp();
    const { rav4 } = await seedCatalogue(ctx);

    const res = await request(ctx.app)
      .post(`/api/vehicles/${rav4.id}/restock`)
      .set('Authorization', ctx.authHeader('admin'))
      .send({ quantity: 4 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(4);
  });

  it('forbids a regular user (403)', async () => {
    const ctx = buildTestApp();
    const { rav4 } = await seedCatalogue(ctx);

    const res = await request(ctx.app)
      .post(`/api/vehicles/${rav4.id}/restock`)
      .set('Authorization', ctx.authHeader('user'))
      .send({ quantity: 4 });

    expect(res.status).toBe(403);
  });

  it.each([[0], [-3], [1.5], ['2']])('rejects quantity %p with 400', async (quantity) => {
    const ctx = buildTestApp();
    const { rav4 } = await seedCatalogue(ctx);

    const res = await request(ctx.app)
      .post(`/api/vehicles/${rav4.id}/restock`)
      .set('Authorization', ctx.authHeader('admin'))
      .send({ quantity });

    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown vehicle', async () => {
    const { app, authHeader } = buildTestApp();

    const res = await request(app)
      .post('/api/vehicles/11111111-1111-4111-8111-111111111111/restock')
      .set('Authorization', authHeader('admin'))
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
  });
});
