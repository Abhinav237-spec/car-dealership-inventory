import request from 'supertest';
import { buildTestApp } from './support/buildTestApp';

const validUser = { email: 'ada@example.com', password: 'Passw0rd!' };

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token with the public profile', async () => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(String), email: 'ada@example.com', role: 'user' });
  });

  it('never exposes the password hash', async () => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(JSON.stringify(res.body)).not.toMatch(/hash|Passw0rd/i);
  });

  it('stores the password hashed, never in plain text', async () => {
    const { app, userRepository } = buildTestApp();

    await request(app).post('/api/auth/register').send(validUser);

    const stored = await userRepository.findByEmail('ada@example.com');
    expect(stored?.passwordHash).not.toBe(validUser.password);
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format
  });

  it('rejects an invalid email with 400', async () => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/register').send({ ...validUser, email: 'nope' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects a password shorter than 8 characters with 400', async () => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/register').send({ ...validUser, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects a duplicate email with 409', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
  });

  it('treats emails case-insensitively', async () => {
    const { app, userRepository } = buildTestApp();
    await request(app).post('/api/auth/register').send({ ...validUser, email: 'Ada@Example.com' });

    const duplicate = await request(app).post('/api/auth/register').send(validUser);

    expect(duplicate.status).toBe(409);
    expect(await userRepository.findByEmail('ada@example.com')).not.toBeNull();
  });

  it('always creates a regular user, ignoring a role sent in the body', async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, role: 'admin' });

    expect(res.body.user.role).toBe('user');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/login').send(validUser);

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('ada@example.com');
  });

  it('rejects a wrong password with 401', async () => {
    const { app } = buildTestApp();
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...validUser, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('gives an unknown email the same 401 message (no account enumeration)', async () => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/login').send(validUser);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects missing fields with 400', async () => {
    const { app } = buildTestApp();

    const res = await request(app).post('/api/auth/login').send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
  });
});
