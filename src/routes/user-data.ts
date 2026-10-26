import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { execute, query, queryOne, transaction } from '../db.js';
import { fromZod } from '../lib/errors.js';
import { optionalUser, requireUser } from '../lib/auth.js';

const deviceSchema = z.object({
  device_token: z.string().trim().min(1, 'This field is required.').max(255),
  platform: z.string().trim().max(20).default(''),
  app_version: z.string().trim().max(30).nullish(),
  package: z.string().trim().max(150).nullish(),
  locale: z.string().trim().max(35).nullish(),
});

const duaId = z.string().trim().min(1).max(50);
const favoritesSchema = z.object({ dua_ids: z.array(duaId).max(5000) });

async function favoritesResponse(userId: number) {
  const rows = await query('SELECT dua_id, created_at FROM favorites WHERE user_id = ? ORDER BY created_at', [userId]);
  return { favorites: rows, dua_ids: rows.map((r) => r.dua_id), count: rows.length };
}

export async function userDataRoutes(app: FastifyInstance) {
  // Push token registration. Works for guests; links the device to the user when a token is sent.
  app.post('/device/register', async (request, reply) => {
    const parsed = deviceSchema.safeParse(request.body ?? {});
    if (!parsed.success) throw fromZod(parsed.error);
    const d = parsed.data;
    const ctx = await optionalUser(request);
    const existing = await queryOne('SELECT id FROM devices WHERE device_token = ?', [d.device_token]);
    await execute(
      `INSERT INTO devices (device_token, platform, app_version, package_name, locale, user_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE platform = VALUES(platform), app_version = VALUES(app_version),
         package_name = VALUES(package_name), locale = VALUES(locale),
         user_id = COALESCE(VALUES(user_id), user_id), updated_at = CURRENT_TIMESTAMP(3)`,
      [d.device_token, d.platform, d.app_version ?? null, d.package ?? null, d.locale ?? null, ctx?.user.id ?? null],
    );
    return reply.code(existing ? 200 : 201).send({ message: existing ? 'Device updated' : 'Device registered' });
  });

  // Favorites sync for logged-in users. Guests keep favorites on the device only.
  app.get('/favorites', async (request) => {
    const { user } = await requireUser(request);
    return favoritesResponse(user.id);
  });

  // Replace the whole list (the app sends its merged local + server list).
  app.put('/favorites', async (request) => {
    const { user } = await requireUser(request);
    const parsed = favoritesSchema.safeParse(request.body ?? {});
    if (!parsed.success) throw fromZod(parsed.error);
    const ids = [...new Set(parsed.data.dua_ids)];
    await transaction(async (conn) => {
      if (ids.length) {
        await execute('DELETE FROM favorites WHERE user_id = ? AND dua_id NOT IN (?)', [user.id, ids], conn);
        await execute('INSERT IGNORE INTO favorites (user_id, dua_id) VALUES ?', [ids.map((id) => [user.id, id])], conn);
      } else {
        await execute('DELETE FROM favorites WHERE user_id = ?', [user.id], conn);
      }
    });
    return favoritesResponse(user.id);
  });

  app.post<{ Params: { duaId: string } }>('/favorites/:duaId', async (request, reply) => {
    const { user } = await requireUser(request);
    const id = duaId.safeParse(request.params.duaId);
    if (!id.success) throw fromZod(id.error);
    await execute('INSERT IGNORE INTO favorites (user_id, dua_id) VALUES (?, ?)', [user.id, id.data]);
    return reply.code(201).send(await favoritesResponse(user.id));
  });

  app.delete<{ Params: { duaId: string } }>('/favorites/:duaId', async (request) => {
    const { user } = await requireUser(request);
    await execute('DELETE FROM favorites WHERE user_id = ? AND dua_id = ?', [user.id, request.params.duaId]);
    return favoritesResponse(user.id);
  });
}
