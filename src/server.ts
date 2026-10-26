import { buildApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = await buildApp();

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`);
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Admin panel: http://localhost:${config.port}/admin/`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
