import { loadConfig } from '../src/config';

const required = { DATABASE_URL: 'postgres://db/dealership', JWT_SECRET: 's3cret' };

describe('loadConfig', () => {
  it('reads required values and applies defaults', () => {
    expect(loadConfig(required)).toEqual({
      port: 3000,
      databaseUrl: 'postgres://db/dealership',
      jwtSecret: 's3cret',
      jwtExpiresInSeconds: 3600,
      bcryptCost: 10,
    });
  });

  it('parses numeric overrides', () => {
    const config = loadConfig({ ...required, PORT: '4000', JWT_EXPIRES_IN_SECONDS: '60', BCRYPT_COST: '12' });

    expect(config).toMatchObject({ port: 4000, jwtExpiresInSeconds: 60, bcryptCost: 12 });
  });

  it.each(['DATABASE_URL', 'JWT_SECRET'])('fails fast and names the missing variable %s', (name) => {
    const env: Record<string, string> = { ...required };
    delete env[name];

    expect(() => loadConfig(env)).toThrow(name);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => loadConfig({ ...required, PORT: 'abc' })).toThrow('PORT');
  });
});
