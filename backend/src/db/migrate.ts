import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

/**
 * Minimal migration runner: applies each .sql file in the migrations folder
 * once, in filename order, and remembers what it applied in `schema_migrations`.
 * Safe to call on every startup. Returns the names it applied this time.
 */
export async function migrate(pool: Pool, directory = path.join(__dirname, 'migrations')): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const done = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const alreadyApplied = new Set(done.rows.map((row) => row.name));
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();

  const applied: string[] = [];
  for (const file of files) {
    if (alreadyApplied.has(file)) continue;

    const sql = await readFile(path.join(directory, file), 'utf8');
    const client = await pool.connect();
    try {
      // One transaction per file: a failing migration leaves nothing half-applied.
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied.push(file);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  return applied;
}
