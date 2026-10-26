import { readFile } from 'node:fs/promises';
import { execute, pool, queryOne, transaction } from './db.js';
import { createCategory, createDua } from './lib/content.js';
import { adSchema, categorySchema, duaSchema } from './lib/schemas.js';

/**
 * Inserts the seed content from db/seed-data/seed.json. Only missing rows are added,
 * so re-running never overwrites edits made in the admin panel.
 * Regenerate seed.json with `npm run seed:build`.
 */
async function seed() {
  const data = JSON.parse(await readFile(new URL('../db/seed-data/seed.json', import.meta.url), 'utf8'));
  const added = { categories: 0, duas: 0, ads: 0 };

  const categoryIds = new Map<string, number>();
  for (const raw of data.categories) {
    const existing = await queryOne('SELECT id FROM categories WHERE slug = ?', [raw.slug]);
    if (existing) {
      categoryIds.set(raw.slug, existing.id);
      continue;
    }
    const input = categorySchema.parse(raw);
    categoryIds.set(raw.slug, await transaction((conn) => createCategory(conn, input)));
    added.categories++;
  }

  for (const raw of data.duas) {
    if (await queryOne('SELECT id FROM duas WHERE id = ?', [raw.id])) continue;
    const { category_slug, ...rest } = raw;
    const input = duaSchema.parse({ ...rest, category_id: category_slug ? (categoryIds.get(category_slug) ?? null) : null });
    await transaction((conn) => createDua(conn, input));
    added.duas++;
  }

  for (const raw of data.ads) {
    const a = adSchema.parse(raw);
    const result = await execute(
      `INSERT IGNORE INTO ads (id, title, text, action_text, action_color, text_color, title_color, link, icon_name, icon_color, is_active, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.title, a.text, a.action_text, a.action_color, a.text_color, a.title_color, a.link, a.icon_name, a.icon_color, a.is_active, a.priority],
    );
    added.ads += result.affectedRows;
  }

  console.log(`seed: added ${added.categories} categories, ${added.duas} duas, ${added.ads} ads`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
