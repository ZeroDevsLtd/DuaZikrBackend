import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name} (see .env.example)`);
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 8000),
  host: process.env.HOST ?? '0.0.0.0',
  publicUrl: (process.env.PUBLIC_URL ?? 'http://localhost:8000').replace(/\/$/, ''),
  // Only enable behind a reverse proxy; otherwise clients could spoof X-Forwarded-For to dodge rate limits.
  trustProxy: process.env.TRUST_PROXY === 'true',
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME'),
  },
  admin: {
    username: required('ADMIN_USERNAME'),
    password: required('ADMIN_PASSWORD'),
    sessionSecret: required('SESSION_SECRET'),
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

if (config.admin.sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters');
}
if (isProduction && config.admin.password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters in production');
}
