import 'dotenv/config';
import { Pool } from 'pg';
import { loadConfig } from '../config';
import { migrate } from './migrate';

/** `npm run migrate`: applies any pending migrations and reports what ran. */
async function main(): Promise<void> {
  const pool = new Pool({ connectionString: loadConfig().databaseUrl });
  try {
    const applied = await migrate(pool);
    console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
