import type { PoolConnection } from 'mysql2/promise';
import { execute, query, type Row } from '../db.js';
import { emptyLocalized, isLang, SUPPORTED_LANGUAGES, type Lang, type Localized } from './languages.js';
import { parseJsonArray, toJsonArray } from './json.js';

export const DUA_TYPES = ['quranic', 'hadith', 'traditional', 'personal'] as const;
export const DUA_STATUSES = ['draft', 'review', 'published'] as const;
export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'occasional', 'special'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

// ---------- Categories ----------

export interface CategoryTranslation {
  name: string;
  description: string;
}

export interface CategoryInput {
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
  translations: Partial<Record<Lang, CategoryTranslation>>;
}

async function loadCategoryTranslations(ids: number[]): Promise<Map<number, Row[]>> {
  const map = new Map<number, Row[]>();
  if (!ids.length) return map;
  const rows = await query('SELECT * FROM category_translations WHERE category_id IN (?)', [ids]);
  for (const row of rows) {
    const list = map.get(row.category_id) ?? [];
    list.push(row);
    map.set(row.category_id, list);
  }
  return map;
}

/** v1 API category shape: { id, name: {lang}, slug, description: {lang}, icon, color, created_at, updated_at } */
export async function listCategories(): Promise<any[]> {
  const rows = await query('SELECT * FROM categories ORDER BY sort_order, id');
  const translations = await loadCategoryTranslations(rows.map((r) => r.id));
  return rows.map((row) => {
    const name = emptyLocalized();
    const description = emptyLocalized();
    for (const t of translations.get(row.id) ?? []) {
      if (!isLang(t.lang)) continue;
      name[t.lang] = t.name;
      description[t.lang] = t.description;
    }
    return {
      id: row.id,
      name,
      slug: row.slug,
      description,
      icon: row.icon,
      color: row.color,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

async function writeCategoryTranslations(conn: PoolConnection, id: number, input: CategoryInput) {
  for (const [lang, t] of Object.entries(input.translations)) {
    if (!isLang(lang) || !t) continue;
    await execute(
      `INSERT INTO category_translations (category_id, lang, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
      [id, lang, t.name ?? '', t.description ?? ''],
      conn,
    );
  }
}

export async function createCategory(conn: PoolConnection, input: CategoryInput): Promise<number> {
  const result = await execute(
    'INSERT INTO categories (slug, icon, color, sort_order) VALUES (?, ?, ?, ?)',
    [input.slug, input.icon, input.color, input.sort_order],
    conn,
  );
  await writeCategoryTranslations(conn, result.insertId, input);
  return result.insertId;
}

export async function updateCategory(conn: PoolConnection, id: number, input: CategoryInput): Promise<void> {
  await execute(
    'UPDATE categories SET slug = ?, icon = ?, color = ?, sort_order = ? WHERE id = ?',
    [input.slug, input.icon, input.color, input.sort_order, id],
    conn,
  );
  await writeCategoryTranslations(conn, id, input);
}

// ---------- Duas ----------

export interface DuaTranslation {
  title: string;
  transliteration: string;
  translation: string;
  explanation: string;
  benefits: string;
}

export interface DuaInput {
  id: string;
  type: string;
  category_id: number | null;
  priority: number;
  tags: string[];
  arabic_text: string;
  reciter: string;
  audio_duration: string;
  audio_url: string;
  quran_surah: number | null;
  quran_ayah: number | null;
  quran_juz: number | null;
  hadith_book: string;
  hadith_chapter: string;
  hadith_number: string;
  source: string;
  authenticity: string;
  when_to_recite: string[];
  frequency: string;
  difficulty: string;
  estimated_time: string;
  related_duas: string[];
  notes: string;
  status: string;
  reviewed_by: string;
  translations: Partial<Record<Lang, Partial<DuaTranslation>>>;
}

const TRANSLATION_FIELDS = ['title', 'transliteration', 'translation', 'explanation', 'benefits'] as const;

async function loadDuaTranslations(ids: string[]): Promise<Map<string, Row[]>> {
  const map = new Map<string, Row[]>();
  if (!ids.length) return map;
  const rows = await query('SELECT * FROM dua_translations WHERE dua_id IN (?)', [ids]);
  for (const row of rows) {
    const list = map.get(row.dua_id) ?? [];
    list.push(row);
    map.set(row.dua_id, list);
  }
  return map;
}

function localizedFields(translations: Row[]): Record<(typeof TRANSLATION_FIELDS)[number], Localized> {
  const out = Object.fromEntries(TRANSLATION_FIELDS.map((f) => [f, emptyLocalized()])) as Record<
    (typeof TRANSLATION_FIELDS)[number],
    Localized
  >;
  for (const t of translations) {
    if (!isLang(t.lang)) continue;
    for (const f of TRANSLATION_FIELDS) out[f][t.lang] = t[f] ?? '';
  }
  return out;
}

/** Serializes a dua row into the exact v1 API shape the mobile app consumes. */
function serializeDua(row: Row, translations: Row[], categoryNameEn: string | null) {
  const loc = localizedFields(translations);
  const references: Record<string, unknown> = {};
  if (row.quran_surah || row.quran_ayah || row.quran_juz) {
    references.quran = { surah: row.quran_surah, ayah: row.quran_ayah, juz: row.quran_juz };
  }
  if (row.hadith_book || row.hadith_chapter || row.hadith_number) {
    references.hadith = { book_name: row.hadith_book, chapter: row.hadith_chapter, number: row.hadith_number };
  }
  if (row.source) references.source = row.source;

  return {
    id: row.id,
    type: row.type,
    category_id: row.category_id,
    category_name: categoryNameEn,
    priority: row.priority,
    tags: parseJsonArray(row.tags),
    title: loc.title,
    dua_text: row.arabic_text,
    transliteration: loc.transliteration,
    translation: loc.translation,
    explanation: loc.explanation,
    benefits: loc.benefits,
    audio: { reciter: row.reciter, duration: row.audio_duration, url: row.audio_url },
    references,
    usage: { whenToRecite: parseJsonArray(row.when_to_recite), frequency: row.frequency },
    statistics: { viewCount: row.view_count, favoriteCount: row.favorite_count, lastRead: row.last_read },
    metadata: {
      difficulty: row.difficulty,
      estimatedTime: row.estimated_time,
      relatedDuas: parseJsonArray(row.related_duas),
      notes: row.notes,
      authenticity: row.authenticity,
    },
  };
}

export interface DuaFilter {
  publishedOnly?: boolean;
  id?: string;
  categoryId?: number;
  type?: string;
  difficulty?: string;
  status?: string;
  search?: string;
  orderBy?: 'default' | 'popular' | 'updated';
  limit?: number;
}

const DUA_SELECT = `
  SELECT d.*, ct.name AS category_name_en
  FROM duas d
  LEFT JOIN category_translations ct ON ct.category_id = d.category_id AND ct.lang = 'en'`;

export async function findDuaRows(filter: DuaFilter = {}): Promise<Row[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.publishedOnly) where.push("d.status = 'published'");
  if (filter.id) {
    where.push('d.id = ?');
    params.push(filter.id);
  }
  if (filter.categoryId !== undefined) {
    where.push('d.category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter.type) {
    where.push('d.type = ?');
    params.push(filter.type);
  }
  if (filter.difficulty) {
    where.push('d.difficulty = ?');
    params.push(filter.difficulty);
  }
  if (filter.status) {
    where.push('d.status = ?');
    params.push(filter.status);
  }
  if (filter.search) {
    const like = `%${filter.search}%`;
    where.push(`(d.id LIKE ? OR d.arabic_text LIKE ? OR d.source LIKE ? OR EXISTS (
      SELECT 1 FROM dua_translations t WHERE t.dua_id = d.id
      AND (t.title LIKE ? OR t.translation LIKE ? OR t.transliteration LIKE ? OR t.explanation LIKE ?)))`);
    params.push(like, like, like, like, like, like, like);
  }
  const order =
    filter.orderBy === 'popular'
      ? 'd.view_count DESC, d.priority, d.id'
      : filter.orderBy === 'updated'
        ? 'd.updated_at DESC'
        : 'd.priority, d.id';
  let sql = `${DUA_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`;
  if (filter.limit) {
    sql += ' LIMIT ?';
    params.push(filter.limit);
  }
  return query(sql, params);
}

export async function listDuas(filter: DuaFilter = {}) {
  const rows = await findDuaRows(filter);
  const translations = await loadDuaTranslations(rows.map((r) => r.id));
  return rows.map((row) => serializeDua(row, translations.get(row.id) ?? [], row.category_name_en ?? null));
}

/** Admin view of one dua: raw columns plus translations keyed by language. */
export async function getDuaForEdit(id: string) {
  const [row] = await findDuaRows({ id });
  if (!row) return null;
  const translations: Record<string, Partial<DuaTranslation>> = {};
  for (const t of (await loadDuaTranslations([id])).get(id) ?? []) {
    translations[t.lang] = Object.fromEntries(TRANSLATION_FIELDS.map((f) => [f, t[f]]));
  }
  const { category_name_en, ...rest } = row;
  return {
    ...rest,
    tags: parseJsonArray(row.tags),
    when_to_recite: parseJsonArray(row.when_to_recite),
    related_duas: parseJsonArray(row.related_duas),
    category_name: category_name_en ?? null,
    translations,
  };
}

async function writeDuaTranslations(conn: PoolConnection, id: string, input: DuaInput) {
  for (const [lang, t] of Object.entries(input.translations)) {
    if (!isLang(lang) || !t) continue;
    const values = TRANSLATION_FIELDS.map((f) => t[f] ?? '');
    // Skip languages where every field is empty, and remove any stored row for them.
    if (values.every((v) => v === '')) {
      await execute('DELETE FROM dua_translations WHERE dua_id = ? AND lang = ?', [id, lang], conn);
      continue;
    }
    await execute(
      `INSERT INTO dua_translations (dua_id, lang, title, transliteration, translation, explanation, benefits)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), transliteration = VALUES(transliteration),
         translation = VALUES(translation), explanation = VALUES(explanation), benefits = VALUES(benefits)`,
      [id, lang, ...values],
      conn,
    );
  }
}

function duaColumns(input: DuaInput): [string[], unknown[]] {
  const cols: Record<string, unknown> = {
    type: input.type,
    category_id: input.category_id,
    priority: input.priority,
    tags: toJsonArray(input.tags),
    arabic_text: input.arabic_text,
    reciter: input.reciter,
    audio_duration: input.audio_duration,
    audio_url: input.audio_url,
    quran_surah: input.quran_surah,
    quran_ayah: input.quran_ayah,
    quran_juz: input.quran_juz,
    hadith_book: input.hadith_book,
    hadith_chapter: input.hadith_chapter,
    hadith_number: input.hadith_number,
    source: input.source,
    authenticity: input.authenticity,
    when_to_recite: toJsonArray(input.when_to_recite),
    frequency: input.frequency,
    difficulty: input.difficulty,
    estimated_time: input.estimated_time,
    related_duas: toJsonArray(input.related_duas),
    notes: input.notes,
    status: input.status,
    reviewed_by: input.reviewed_by,
  };
  return [Object.keys(cols), Object.values(cols)];
}

export async function createDua(conn: PoolConnection, input: DuaInput): Promise<void> {
  const [cols, values] = duaColumns(input);
  const reviewedAt = input.reviewed_by ? new Date() : null;
  await execute(
    `INSERT INTO duas (id, ${cols.join(', ')}, reviewed_at) VALUES (?, ${cols.map(() => '?').join(', ')}, ?)`,
    [input.id, ...values, reviewedAt],
    conn,
  );
  await writeDuaTranslations(conn, input.id, input);
}

export async function updateDua(conn: PoolConnection, currentId: string, input: DuaInput): Promise<void> {
  const [cols, values] = duaColumns(input);
  // reviewed_at changes only when the reviewer changes. It must be assigned first:
  // MySQL/MariaDB apply SET assignments left to right, so later ones see the new reviewed_by.
  await execute(
    `UPDATE duas SET
       reviewed_at = IF(reviewed_by <=> ?, reviewed_at, IF(? = '', NULL, CURRENT_TIMESTAMP(3))),
       id = ?, ${cols.map((c) => `${c} = ?`).join(', ')}
     WHERE id = ?`,
    [input.reviewed_by, input.reviewed_by, input.id, ...values, currentId],
    conn,
  );
  await writeDuaTranslations(conn, input.id, input);
}

/** Latest content change; lets clients skip re-downloading unchanged data. */
export async function contentVersion(): Promise<string> {
  const [row] = await query(
    'SELECT (SELECT MAX(updated_at) FROM duas) AS duas, (SELECT MAX(updated_at) FROM categories) AS cats',
  );
  const times = [row.duas, row.cats].filter((d): d is Date => d instanceof Date).map((d) => d.getTime());
  return new Date(times.length ? Math.max(...times) : 0).toISOString();
}

export { SUPPORTED_LANGUAGES };
