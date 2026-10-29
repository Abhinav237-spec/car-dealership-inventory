import request from 'supertest';
import { buildTestApp } from './support/buildTestApp';

const password = 'Passw0rd!';

/** Business rule: nobody may sign up with an email containing consecutive A's (any case). */
describe('POST /api/auth/register: consecutive "a" restriction', () => {
  it.each([
    ['lowercase pair', 'aaron@example.com'],
    ['uppercase pair', 'bAAn@example.com'],
    ['mixed case pair (aA)', 'maAx@example.com'],
    ['mixed case pair (Aa)', 'sAam@example.com'],
    ['a longer run', 'baaaad@example.com'],
    ['a pair in the domain', 'ada@saas.com'],
  ])('rejects %s with 400 and a clear message', async (_label, email) => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/register').send({ email, password });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/consecutive/i);
  });

  it('does not create an account when the email is rejected', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send({ email: 'aaron@example.com', password });

    const res = await request(app).post('/api/auth/login').send({ email: 'aaron@example.com', password });

    expect(res.status).toBe(401);
  });

  it.each([
    ['single a letters apart', 'ada@example.com'],
    ['a separated by another character', 'a.a@example.com'],
    ['no a at all', 'bob@example.com'],
  ])('still accepts %s', async (_label, email) => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/register').send({ email, password });

    expect(res.status).toBe(201);
  });
});
