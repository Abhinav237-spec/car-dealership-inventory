/** Runtime settings, read once from environment variables at startup. */
export interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  bcryptCost: number;
}

type Env = Record<string, string | undefined>;

/**
 * Fails fast: a missing secret or database URL stops the server at boot with
 * a clear message instead of failing later on the first request.
 */
export function loadConfig(env: Env = process.env): Config {
  const required = (name: string): string => {
    const value = env[name];
    if (!value) throw new Error(`Missing required environment variable ${name}`);
    return value;
  };

  const integer = (name: string, fallback: number): number => {
    const raw = env[name];
    if (raw === undefined || raw === '') return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value)) throw new Error(`Environment variable ${name} must be a whole number`);
    return value;
  };

  return {
    port: integer('PORT', 3000),
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresInSeconds: integer('JWT_EXPIRES_IN_SECONDS', 3600),
    bcryptCost: integer('BCRYPT_COST', 10),
  };
}
