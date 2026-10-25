import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/health', () => {
  it('responds 200 with a status payload', async () => {
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('responds 404 with a JSON error for unknown routes', async () => {
    const app = createApp();

    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });
});
