import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../src/middleware/authenticate';
import { requireRole } from '../src/middleware/requireRole';
import { JwtTokenService } from '../src/services/TokenService';

const tokens = new JwtTokenService('test-secret', 3600);

/** A tiny app with one open-to-users route and one admin-only route. */
function buildApp() {
  const app = express();
  app.get('/me', authenticate(tokens), (req, res) => {
    res.json((req as AuthenticatedRequest).user);
  });
  app.get('/admin', authenticate(tokens), requireRole('admin'), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('authenticate middleware', () => {
  it('rejects a request with no Authorization header (401)', async () => {
    const res = await request(buildApp()).get('/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('rejects a malformed Authorization header (401)', async () => {
    const res = await request(buildApp()).get('/me').set('Authorization', 'Token abc');

    expect(res.status).toBe(401);
  });

  it('rejects an invalid token (401)', async () => {
    const res = await request(buildApp()).get('/me').set('Authorization', 'Bearer not.a.jwt');

    expect(res.status).toBe(401);
  });

  it('attaches the user to the request for a valid token', async () => {
    const token = tokens.sign({ id: 'u1', role: 'user' });

    const res = await request(buildApp()).get('/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'u1', role: 'user' });
  });
});

describe('requireRole middleware', () => {
  it('forbids a regular user from an admin route (403)', async () => {
    const token = tokens.sign({ id: 'u1', role: 'user' });

    const res = await request(buildApp()).get('/admin').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('lets an admin through', async () => {
    const token = tokens.sign({ id: 'a1', role: 'admin' });

    const res = await request(buildApp()).get('/admin').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
