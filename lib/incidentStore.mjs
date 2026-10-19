import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const storePath = resolve('data/incidents.json');
let pool;

async function readJsonStore() {
  try {
    const parsed = JSON.parse(await readFile(storePath, 'utf8'));
    return Array.isArray(parsed.incidents) ? parsed.incidents : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return [];
  }
}

export async function initializeIncidentStore() {
  if (!process.env.DATABASE_URL) return 'json';

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX || 5),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arc_incidents (
      id TEXT PRIMARY KEY,
      occurred_at BIGINT NOT NULL,
      payload JSONB NOT NULL
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS arc_incidents_occurred_at_idx ON arc_incidents (occurred_at DESC)');

  // Import an existing local JSON store once when connecting a fresh database.
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM arc_incidents');
  if (rows[0].count === 0) {
    const legacyIncidents = await readJsonStore();
    if (legacyIncidents.length) await writePostgresStore(legacyIncidents);
  }
  return 'postgres';
}

async function writePostgresStore(incidents) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM arc_incidents');
    for (const incident of incidents) {
      await client.query(
        'INSERT INTO arc_incidents (id, occurred_at, payload) VALUES ($1, $2, $3::jsonb)',
        [incident.id, incident.time, JSON.stringify(incident)],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function readIncidents() {
  if (pool) {
    const { rows } = await pool.query('SELECT payload FROM arc_incidents ORDER BY occurred_at DESC, id ASC');
    return rows.map((row) => row.payload);
  }
  return readJsonStore();
}

export async function saveIncidents(incidents) {
  if (pool) {
    await writePostgresStore(incidents);
    return;
  }
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify({ incidents }, null, 2)}\n`, 'utf8');
}

export async function closeIncidentStore() {
  if (pool) await pool.end();
}
