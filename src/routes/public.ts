import type { FastifyInstance } from 'fastify';
import { execute, query, queryOne } from '../db.js';
import { badRequest, notFound } from '../lib/errors.js';
import { contentVersion, listCategories, listDuas, SUPPORTED_LANGUAGES } from '../lib/content.js';

const API_VERSION = '2.0.0';

async function metadata(totalDuas: number) {
  return {
    version: API_VERSION,
    contentVersion: await contentVersion(),
    lastUpdated: new Date().toISOString(),
    totalDuas,
    supportedLanguages: SUPPORTED_LANGUAGES,
    categories: await listCategories(),
  };
}

export const PUBLIC_ENDPOINTS = [
  '/api/',
  '/api/getalldua/',
  '/api/getallcategory/',
  '/api/getallads/',
  '/api/dua/{id}/',
  '/api/category/{slug}/',
  '/api/search/?q=',
  '/api/popular/?limit=',
  '/api/type/{type}/',
  '/api/difficulty/{level}/',
  '/api/favorite/{id}/ (POST)',
  '/api/info/',
];

export async function publicRoutes(app: FastifyInstance) {
  const info = async () => {
    const [totals] = await query(
      `SELECT (SELECT COUNT(*) FROM duas WHERE status = 'published') AS duas,
              (SELECT COUNT(*) FROM categories) AS categories`,
    );
    const categoryBreakdown = await query(
      `SELECT ct.name, COUNT(d.id) AS dua_count FROM categories c
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.lang = 'en'
       LEFT JOIN duas d ON d.category_id = c.id AND d.status = 'published'
       GROUP BY c.id, ct.name ORDER BY c.sort_order, c.id`,
    );
    const typeBreakdown = await query(
      `SELECT type, COUNT(*) AS count FROM duas WHERE status = 'published' GROUP BY type ORDER BY count DESC`,
    );
    return {
      api_name: 'Dua & Zikr API',
      version: API_VERSION,
      description: 'A comprehensive API for Islamic duas and zikr',
      contentVersion: await contentVersion(),
      statistics: {
        totalDuas: Number(totals.duas),
        totalCategories: Number(totals.categories),
        categoryBreakdown: categoryBreakdown.map((r) => ({ name: r.name, dua_count: Number(r.dua_count) })),
        typeBreakdown: typeBreakdown.map((r) => ({ type: r.type, count: Number(r.count) })),
      },
      endpoints: PUBLIC_ENDPOINTS,
    };
  };

  // The app pings GET /api/ to check that the server is reachable.
  app.get('/', info);
  app.get('/info', info);

  app.get('/getalldua', async () => {
    const duas = await listDuas({ publishedOnly: true });
    return { metadata: await metadata(duas.length), duas };
  });

  app.get('/getallcategory', async () => {
    const totalDuas = await queryOne("SELECT COUNT(*) AS n FROM duas WHERE status = 'published'");
    const meta = await metadata(Number(totalDuas?.n ?? 0));
    return { metadata: meta, categories: meta.categories };
  });

  app.get<{ Params: { id: string } }>('/dua/:id', async (request) => {
    const [dua] = await listDuas({ publishedOnly: true, id: request.params.id });
    if (!dua) throw notFound('Dua not found');
    await execute(
      'UPDATE duas SET view_count = view_count + 1, last_read = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [request.params.id],
    );
    return dua;
  });

  app.get<{ Params: { slug: string } }>('/category/:slug', async (request) => {
    const category = (await listCategories()).find((c) => c.slug === request.params.slug);
    if (!category) throw notFound('Category not found');
    const duas = await listDuas({ publishedOnly: true, categoryId: category.id });
    return { category, duas, count: duas.length };
  });

  app.get<{ Querystring: { q?: string } }>('/search', async (request) => {
    const q = (request.query.q ?? '').trim();
    if (!q) throw badRequest('Query parameter "q" is required');
    if (q.length > 100) throw badRequest('Query is too long');
    const results = await listDuas({ publishedOnly: true, search: q, limit: 100 });
    return { query: q, results, count: results.length };
  });

  app.get<{ Querystring: { limit?: string } }>('/popular', async (request) => {
    const limit = Math.min(Math.max(Number(request.query.limit) || 10, 1), 100);
    const duas = await listDuas({ publishedOnly: true, orderBy: 'popular', limit });
    return { duas, count: duas.length };
  });

  app.get<{ Params: { type: string } }>('/type/:type', async (request) => {
    const duas = await listDuas({ publishedOnly: true, type: request.params.type });
    return { type: request.params.type, duas, count: duas.length };
  });

  app.get<{ Params: { level: string } }>('/difficulty/:level', async (request) => {
    const duas = await listDuas({ publishedOnly: true, difficulty: request.params.level });
    return { difficulty: request.params.level, duas, count: duas.length };
  });

  // v1 "mark as favorite": a public counter, separate from a user's synced favorites.
  app.post<{ Params: { id: string } }>(
    '/favorite/:id',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request) => {
      const result = await execute(
        "UPDATE duas SET favorite_count = favorite_count + 1 WHERE id = ? AND status = 'published'",
        [request.params.id],
      );
      if (!result.affectedRows) throw notFound('Dua not found');
      const row = await queryOne('SELECT favorite_count FROM duas WHERE id = ?', [request.params.id]);
      return { message: 'Dua marked as favorite', favoriteCount: row?.favorite_count ?? 0 };
    },
  );

  app.get('/getallads', async () => {
    const ads = await query('SELECT * FROM ads WHERE is_active = 1 ORDER BY priority, created_at');
    return {
      success: true,
      data: {
        ads: ads.map((ad) => ({
          id: ad.id,
          title: ad.title,
          text: ad.text,
          actionText: ad.action_text,
          actionColor: ad.action_color,
          textColor: ad.text_color,
          titleColor: ad.title_color,
          link: ad.link,
          iconName: ad.icon_name,
          iconColor: ad.icon_color,
          isActive: Boolean(ad.is_active),
          priority: ad.priority,
        })),
        lastUpdated: new Date().toISOString(),
      },
    };
  });
}
