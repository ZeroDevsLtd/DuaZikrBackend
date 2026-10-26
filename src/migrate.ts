import { readdir, readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from './config.js';

const dir = new URL('../db/migrations/', import.meta.url);

export async function migrate(): Promise<string[]> {
  // Separate connection: migrations need multipleStatements, the app pool must not have it.
  const conn = await mysql.createConnection({ ...config.db, charset: 'utf8mb4', multipleStatements: true });
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const [rows] = await conn.query<any[]>('SELECT name FROM schema_migrations');
    const done = new Set(rows.map((r) => r.name));
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    const applied: string[] = [];
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(new URL(file, dir), 'utf8');
      // DDL auto-commits in MySQL, so a failed migration must be fixed by hand before re-running.
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      applied.push(file);
      console.log(`applied ${file}`);
    }
    if (!applied.length) console.log('database is up to date');
    return applied;
  } finally {
    await conn.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
