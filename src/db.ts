import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import { config } from './config.js';

export const pool: Pool = mysql.createPool({
  ...config.db,
  charset: 'utf8mb4',
  timezone: 'Z',
  connectionLimit: 10,
  waitForConnections: true,
});

// Store and read every timestamp as UTC.
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

export type Row = RowDataPacket & Record<string, any>;
type Executor = Pool | PoolConnection;

export async function query<T = Row>(sql: string, params: unknown[] = [], db: Executor = pool): Promise<T[]> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function queryOne<T = Row>(sql: string, params: unknown[] = [], db: Executor = pool): Promise<T | null> {
  const rows = await query<T>(sql, params, db);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = [], db: Executor = pool): Promise<ResultSetHeader> {
  const [result] = await db.query<ResultSetHeader>(sql, params);
  return result;
}

export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
