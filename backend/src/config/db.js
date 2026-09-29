import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 10, connectionTimeoutMillis: 3000 });

pool.on('error', (err) => console.error('Postgres pool error:', err.message));

export async function initDb() {
  const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
  }
}

