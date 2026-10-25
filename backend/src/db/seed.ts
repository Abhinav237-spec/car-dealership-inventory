import 'dotenv/config';
import { Pool } from 'pg';
import { loadConfig } from '../config';
import { migrate } from './migrate';
import { seedDatabase } from './seedDatabase';

/** `npm run seed`: migrates, then seeds the admin and sample vehicles. */
async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  try {
    await migrate(pool);
    await seedDatabase(pool, config.bcryptCost);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
