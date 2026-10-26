import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeAny, z } from 'zod';
import { config } from '../config.js';
import { execute, query, queryOne, transaction } from '../db.js';
import { ApiError, fromZod, notFound, unauthorized } from '../lib/errors.js';
import {
  createCategory,
  createDua,
  DIFFICULTIES,
  DUA_STATUSES,
  DUA_TYPES,
  FREQUENCIES,
  getDuaForEdit,
  listCategories,
  findDuaRows,
  updateCategory,
  updateDua,
} from '../lib/content.js';
import { PRIMARY_LANGUAGES, SUPPORTED_LANGUAGES } from '../lib/languages.js';
import { adSchema, categorySchema, duaSchema } from '../lib/schemas.js';
import { deleteUserAccount } from './auth.js';
import { PUBLIC_ENDPOINTS } from './public.js';

const COOKIE = 'dz_admin';
const SESSION_HOURS = 12;

function sameSecret(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function readSession(request: FastifyRequest): string | null {
  const raw = request.cookies[COOKIE];
  if (!raw) return null;
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return null;
  const [username, expires] = unsigned.value.split('|');
  if (!username || Number(expires) < Date.now()) return null;
  return username;
}

function parse<T extends ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) throw fromZod(result.error);
  return result.data;
}

function rethrowDuplicate(err: any, field: string, label: string): never {
  if (err?.code === 'ER_DUP_ENTRY') {
    throw new ApiError(400, { [field]: [`${label} already exists`], message: `${label} already exists` });
  }
  throw err;
}

export async function adminRoutes(app: FastifyInstance) {
  app.post(
    '/login',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request: FastifyRequest<{ Body: { username?: string; password?: string } }>, reply: FastifyReply) => {
      const { username = '', password = '' } = request.body ?? {};
      const ok = sameSecret(username, config.admin.username) && sameSecret(password, config.admin.password);
      if (!ok) throw new ApiError(401, { detail: 'Invalid username or password', message: 'Invalid username or password' });
      const expires = Date.now() + SESSION_HOURS * 3600_000;
      reply.setCookie(COOKIE, `${username}|${expires}`, {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        secure: config.isProduction,
        path: '/admin',
        maxAge: SESSION_HOURS * 3600,
      });
      return { username };
    },
  );

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie(COOKIE, { path: '/admin' });
    return { message: 'Logged out' };
  });

  // Everything registered below requires an admin session.
  app.register(async (secured) => {
    secured.addHook('preHandler', async (request) => {
      if (!readSession(request)) throw unauthorized('Admin login required');
    });

    secured.get('/me', async (request) => ({
      username: readSession(request),
      languages: SUPPORTED_LANGUAGES,
      primaryLanguages: PRIMARY_LANGUAGES,
      options: { types: DUA_TYPES, statuses: DUA_STATUSES, frequencies: FREQUENCIES, difficulties: DIFFICULTIES },
      publicEndpoints: PUBLIC_ENDPOINTS,
    }));

    secured.get('/stats', async () => {
      const [counts] = await query(`SELECT
        (SELECT COUNT(*) FROM duas) AS duas,
        (SELECT COUNT(*) FROM duas WHERE status = 'published') AS published,
        (SELECT COUNT(*) FROM duas WHERE status = 'draft') AS drafts,
        (SELECT COUNT(*) FROM duas WHERE status = 'review') AS in_review,
        (SELECT COUNT(*) FROM categories) AS categories,
        (SELECT COUNT(*) FROM ads WHERE is_active = 1) AS active_ads,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM devices) AS devices,
        (SELECT COUNT(*) FROM favorites) AS favorites`);
      const translations = await query(
        'SELECT lang, COUNT(*) AS n FROM dua_translations GROUP BY lang ORDER BY n DESC',
      );
      const popular = await query(
        `SELECT d.id, t.title, d.view_count, d.favorite_count FROM duas d
         LEFT JOIN dua_translations t ON t.dua_id = d.id AND t.lang = 'en'
         ORDER BY d.view_count DESC, d.favorite_count DESC LIMIT 5`,
      );
      return {
        counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Number(v)])),
        translations: translations.map((r) => ({ lang: r.lang, count: Number(r.n) })),
        popular,
      };
    });

    // ----- Categories -----
    secured.get('/categories', async () => {
      const categories = await listCategories();
      const counts = await query('SELECT category_id, COUNT(*) AS n FROM duas GROUP BY category_id');
      const byId = new Map(counts.map((r) => [r.category_id, Number(r.n)]));
      return categories.map((c) => ({ ...c, dua_count: byId.get(c.id) ?? 0 }));
    });

    secured.post('/categories', async (request, reply) => {
      const data = parse(categorySchema, request.body);
      const id = await transaction((conn) => createCategory(conn, data)).catch((e) =>
        rethrowDuplicate(e, 'slug', 'Slug'),
      );
      return reply.code(201).send({ id });
    });

    secured.put<{ Params: { id: string } }>('/categories/:id', async (request) => {
      const id = Number(request.params.id);
      if (!(await queryOne('SELECT id FROM categories WHERE id = ?', [id]))) throw notFound('Category not found');
      const data = parse(categorySchema, request.body);
      await transaction((conn) => updateCategory(conn, id, data)).catch((e) => rethrowDuplicate(e, 'slug', 'Slug'));
      return { id };
    });

    secured.delete<{ Params: { id: string } }>('/categories/:id', async (request) => {
      const result = await execute('DELETE FROM categories WHERE id = ?', [Number(request.params.id)]);
      if (!result.affectedRows) throw notFound('Category not found');
      return { message: 'Category deleted; its duas are now uncategorized' };
    });

    // ----- Duas -----
    secured.get<{ Querystring: { q?: string; category_id?: string; status?: string; type?: string } }>(
      '/duas',
      async (request) => {
        const { q, category_id, status, type } = request.query;
        const rows = await findDuaRows({
          search: q?.trim() || undefined,
          categoryId: category_id === 'none' ? undefined : category_id ? Number(category_id) : undefined,
          status: status || undefined,
          type: type || undefined,
          orderBy: 'updated',
        });
        const filtered = category_id === 'none' ? rows.filter((r) => r.category_id == null) : rows;
        const titles = await query(
          "SELECT dua_id, lang, title FROM dua_translations WHERE lang IN ('en', 'bn')",
        );
        const langs = await query('SELECT dua_id, GROUP_CONCAT(lang ORDER BY lang) AS langs FROM dua_translations GROUP BY dua_id');
        const titleMap = new Map<string, Record<string, string>>();
        for (const t of titles) titleMap.set(t.dua_id, { ...(titleMap.get(t.dua_id) ?? {}), [t.lang]: t.title });
        const langMap = new Map(langs.map((r) => [r.dua_id, String(r.langs).split(',')]));
        return filtered.map((r) => ({
          id: r.id,
          title_en: titleMap.get(r.id)?.en ?? '',
          title_bn: titleMap.get(r.id)?.bn ?? '',
          type: r.type,
          status: r.status,
          category_id: r.category_id,
          category_name: r.category_name_en ?? null,
          languages: langMap.get(r.id) ?? [],
          reviewed_by: r.reviewed_by,
          view_count: r.view_count,
          favorite_count: r.favorite_count,
          updated_at: r.updated_at,
        }));
      },
    );

    secured.get<{ Params: { id: string } }>('/duas/:id', async (request) => {
      const dua = await getDuaForEdit(request.params.id);
      if (!dua) throw notFound('Dua not found');
      return dua;
    });

    secured.post('/duas', async (request, reply) => {
      const data = parse(duaSchema, request.body);
      await transaction((conn) => createDua(conn, data)).catch((e) => rethrowDuplicate(e, 'id', 'Dua id'));
      return reply.code(201).send({ id: data.id });
    });

    secured.put<{ Params: { id: string } }>('/duas/:id', async (request) => {
      if (!(await queryOne('SELECT id FROM duas WHERE id = ?', [request.params.id]))) throw notFound('Dua not found');
      const data = parse(duaSchema, request.body);
      await transaction((conn) => updateDua(conn, request.params.id, data)).catch((e) =>
        rethrowDuplicate(e, 'id', 'Dua id'),
      );
      return { id: data.id };
    });

    secured.delete<{ Params: { id: string } }>('/duas/:id', async (request) => {
      const result = await execute('DELETE FROM duas WHERE id = ?', [request.params.id]);
      if (!result.affectedRows) throw notFound('Dua not found');
      return { message: 'Dua deleted' };
    });

    // ----- Ads -----
    secured.get('/ads', async () => query('SELECT * FROM ads ORDER BY priority, created_at'));

    secured.post('/ads', async (request, reply) => {
      const a = parse(adSchema, request.body);
      await execute(
        `INSERT INTO ads (id, title, text, action_text, action_color, text_color, title_color, link, icon_name, icon_color, is_active, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.title, a.text, a.action_text, a.action_color, a.text_color, a.title_color, a.link, a.icon_name, a.icon_color, a.is_active, a.priority],
      ).catch((e) => rethrowDuplicate(e, 'id', 'Ad id'));
      return reply.code(201).send({ id: a.id });
    });

    secured.put<{ Params: { id: string } }>('/ads/:id', async (request) => {
      const a = parse(adSchema, request.body);
      const result = await execute(
        `UPDATE ads SET id = ?, title = ?, text = ?, action_text = ?, action_color = ?, text_color = ?, title_color = ?,
           link = ?, icon_name = ?, icon_color = ?, is_active = ?, priority = ? WHERE id = ?`,
        [a.id, a.title, a.text, a.action_text, a.action_color, a.text_color, a.title_color, a.link, a.icon_name, a.icon_color, a.is_active, a.priority, request.params.id],
      ).catch((e) => rethrowDuplicate(e, 'id', 'Ad id'));
      if (!result.affectedRows) throw notFound('Ad not found');
      return { id: a.id };
    });

    secured.delete<{ Params: { id: string } }>('/ads/:id', async (request) => {
      const result = await execute('DELETE FROM ads WHERE id = ?', [request.params.id]);
      if (!result.affectedRows) throw notFound('Ad not found');
      return { message: 'Ad deleted' };
    });

    // ----- Users & devices (read-only, plus deletion) -----
    secured.get('/users', async () =>
      query(`SELECT u.id, u.name, u.email, u.phone, u.age, u.gender, u.is_active, u.created_at,
               (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id) AS favorites,
               (SELECT MAX(last_used_at) FROM auth_tokens t WHERE t.user_id = u.id) AS last_seen
             FROM users u ORDER BY u.created_at DESC LIMIT 500`),
    );

    secured.delete<{ Params: { id: string } }>('/users/:id', async (request) => {
      const id = Number(request.params.id);
      if (!(await queryOne('SELECT id FROM users WHERE id = ?', [id]))) throw notFound('User not found');
      await deleteUserAccount(id);
      return { message: 'User deleted' };
    });

    secured.get('/devices', async () =>
      query(`SELECT d.id, d.platform, d.app_version, d.package_name, d.locale, d.created_at, d.updated_at,
               CONCAT(LEFT(d.device_token, 12), '…') AS token_preview, u.email AS user_email
             FROM devices d LEFT JOIN users u ON u.id = d.user_id ORDER BY d.updated_at DESC LIMIT 500`),
    );
  });
}
