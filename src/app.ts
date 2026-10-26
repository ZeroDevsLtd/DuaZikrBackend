import { fileURLToPath } from 'node:url';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError } from 'fastify';
import { config } from './config.js';
import { ApiError } from './lib/errors.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { pageRoutes } from './routes/pages.js';
import { publicRoutes } from './routes/public.js';
import { userDataRoutes } from './routes/user-data.js';

export async function buildApp() {
  const app = Fastify({
    logger: config.isProduction ? true : { level: 'info' },
    // v1 clients call both `/getalldua/` and `/getallads` (no slash).
    routerOptions: { ignoreTrailingSlash: true },
    trustProxy: config.trustProxy,
    bodyLimit: 1024 * 1024,
  });

  // Accept an empty body sent with `Content-Type: application/json` (some HTTP clients do this on POST/DELETE).
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    if (!body || !String(body).trim()) return done(null, {});
    try {
      done(null, JSON.parse(String(body)));
    } catch {
      done(Object.assign(new Error('Invalid JSON body'), { statusCode: 400 }), undefined);
    }
  });

  await app.register(cors, { origin: config.corsOrigins.length ? config.corsOrigins : false });
  await app.register(cookie, { secret: config.admin.sessionSecret });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  app.setErrorHandler((error: FastifyError | ApiError, request, reply) => {
    if (error instanceof ApiError) return reply.code(error.statusCode).send(error.body);
    const status = (error as FastifyError).statusCode ?? 500;
    if (status >= 500) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error', message: 'Internal server error' });
    }
    return reply.code(status).send({ error: error.message, message: error.message });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({ error: 'Not found', message: `Route ${request.method} ${request.url} not found` }),
  );

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(publicRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userDataRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/admin/api' });
  await app.register(pageRoutes);

  await app.register(fastifyStatic, {
    root: fileURLToPath(new URL('../public/admin', import.meta.url)),
    prefix: '/admin/',
    index: false,
  });
  // Explicit route: ignoreTrailingSlash folds /admin/ into /admin, which the static wildcard doesn't serve.
  app.get('/admin', (_request, reply) => reply.header('Cache-Control', 'no-store').sendFile('index.html'));

  return app;
}
