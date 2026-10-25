import { Pool } from 'pg';
import { migrate } from '../../src/db/migrate';
import { PostgresUserRepository } from '../../src/repositories/PostgresUserRepository';
import { PostgresVehicleRepository } from '../../src/repositories/PostgresVehicleRepository';
import { describeUserRepositoryContract } from '../contracts/userRepository.contract';
import { describeVehicleRepositoryContract } from '../contracts/vehicleRepository.contract';

/**
 * Integration tests against a REAL PostgreSQL database.
 * They run only when TEST_DATABASE_URL is set (docker compose up -d, see README),
 * and are skipped otherwise so `npm test` still works on a bare machine.
 */
const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

describeWithDatabase('PostgreSQL repositories (integration)', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString, max: 10 }); // several connections, so concurrency is real
    await migrate(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  const freshTables = () => pool.query('TRUNCATE users, vehicles');

  it('can run migrations repeatedly without error', async () => {
    expect(await migrate(pool)).toEqual([]); // everything already applied
  });

  describeUserRepositoryContract('PostgresUserRepository', async () => {
    await freshTables();
    return new PostgresUserRepository(pool);
  });

  describeVehicleRepositoryContract('PostgresVehicleRepository', async () => {
    await freshTables();
    return new PostgresVehicleRepository(pool);
  });
});
