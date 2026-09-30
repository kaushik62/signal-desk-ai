import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

export async function initDb() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(currentDir, '../../db/schema.sql');

  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);

    // Ensure status check constraint allows all supported states ('pending','sending','processing','sent','failed','cancelled')
    try {
      await pool.query(`
        ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_status_check;
        ALTER TABLE follow_ups ADD CONSTRAINT follow_ups_status_check
          CHECK (status IN ('pending','sending','processing','sent','failed','cancelled'));
      `);
    } catch (e) {
      console.warn('Note on status constraint update:', e.message);
    }

    console.log('Database schema initialized successfully');
  } else {
    console.warn('Database schema file not found:', schemaPath);
  }
}