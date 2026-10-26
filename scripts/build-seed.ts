/**
 * Builds db/seed-data/seed.json from:
 *   1. legacy_*.json  – exported from the old Django SQLite database (categories, duas, ads)
 *   2. the mobile app's bundled duas (Dua-Zikr/src/data/duas.ts) – fuller texts, kept with their app ids
 * Old duas that duplicate an app dua (same title, or same / truncated Arabic) are dropped.
 *
 * Usage: npm run seed:build -- [path/to/Dua-Zikr/src/data/duas.ts]
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LANGS = ['en', 'bn', 'ar', 'de', 'ur', 'es', 'id'] as const;
const seedDir = new URL('../db/seed-data/', import.meta.url);
const appDuasPath = path.resolve(process.argv[2] ?? '../Dua-Zikr/src/data/duas.ts');

const readJson = async (file: string) => JSON.parse(await readFile(new URL(file, seedDir), 'utf8'));

// The app's Quran/Hadith duas carry no category; place them for browsing. Reviewers can change this.
const APP_CATEGORY: Record<string, string | null> = {
  q1: 'ruqyah', q2: 'salah', q3: 'ruqyah', q4: 'ruqyah', q5: 'ruqyah', q6: 'sleep', q7: null, q8: null,
  h1: 'morning', h2: 'evening', h3: 'food-drink', h4: 'food-drink', h5: 'travel',
  h6: 'daily-life', h7: 'daily-life', h8: 'daily-life',
};

const EXTRA_CATEGORIES = [
  {
    slug: 'daily-life',
    icon: 'home',
    color: '#3F51B5',
    translations: {
      en: { name: 'Daily Life', description: 'Duas for everyday moments' },
      bn: { name: 'দৈনন্দিন জীবন', description: 'দৈনন্দিন মুহূর্তের দোয়া' },
      ar: { name: 'الحياة اليومية', description: 'أدعية للحياة اليومية' },
      de: { name: 'Alltag', description: 'Bittgebete für den Alltag' },
    },
  },
];

const normalizeArabic = (s: string) =>
  s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '') // harakat, Quranic marks, tatweel
    .replace(/[^ء-ي]/g, ''); // letters only
const normalizeTitle = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

function parseReference(ref: string) {
  const out: Record<string, unknown> = { source: ref };
  const quran = /^Quran\s+(\d+):(\d+)/i.exec(ref);
  if (quran) {
    out.quran_surah = Number(quran[1]);
    out.quran_ayah = Number(quran[2]);
  } else if (ref) {
    out.hadith_book = ref;
  }
  return out;
}

async function main() {
  const legacyCategories = await readJson('legacy_duas_category.json');
  const legacyDuas = await readJson('legacy_duas_dua.json');
  const legacyAds = await readJson('legacy_duas_ad.json');
  const { DUAS_DATA } = await import(pathToFileURL(appDuasPath).href);

  const categories = [
    ...legacyCategories.map((c: any, i: number) => ({
      slug: c.slug,
      icon: c.icon,
      color: c.color,
      sort_order: i + 1,
      translations: Object.fromEntries(
        LANGS.map((l) => [l, { name: c[`name_${l}`] ?? '', description: c[`description_${l}`] ?? '' }]),
      ),
    })),
    ...EXTRA_CATEGORIES.map((c, i) => ({ ...c, sort_order: legacyCategories.length + i + 1 })),
  ];
  const slugByLegacyId = new Map(legacyCategories.map((c: any) => [c.id, c.slug]));

  const appDuas = Object.values(DUAS_DATA).map((d: any) => {
    const ref: string = d.translations.en?.reference ?? '';
    const type = d.type === 'category' ? (/^Quran/i.test(ref) ? 'quranic' : 'hadith') : d.type;
    return {
      id: d.id,
      type,
      category_slug: d.category ?? APP_CATEGORY[d.id] ?? null,
      arabic_text: d.arabic,
      ...parseReference(ref),
      status: 'published',
      translations: Object.fromEntries(
        Object.entries(d.translations).map(([lang, t]: [string, any]) => [
          lang,
          { title: t.title, transliteration: t.transliteration, translation: t.translation, benefits: t.benefits, explanation: '' },
        ]),
      ),
    };
  });

  const appTitles = new Set(appDuas.map((d) => normalizeTitle(d.translations.en.title)));
  const appArabic = appDuas.map((d) => normalizeArabic(d.arabic_text));
  const dropped: string[] = [];
  const merged: string[] = [];

  const legacyTranslation = (d: any, l: string) => ({
    title: d[`title_${l}`] ?? '',
    transliteration: d[`transliteration_${l}`] ?? '',
    translation: d[`translation_${l}`] ?? '',
    explanation: d[`explanation_${l}`] ?? '',
    benefits: d[`benefits_${l}`] ?? '',
  });

  const oldDuas = legacyDuas
    .filter((d: any) => {
      const arabic = normalizeArabic(d.dua_text);
      const dup =
        appTitles.has(normalizeTitle(d.title_en)) || appArabic.some((a) => a === arabic || a.startsWith(arabic));
      if (!dup) return true;
      dropped.push(`${d.id} (${d.title_en})`);
      // Same Arabic text: the old translations are valid for the app dua, so fill its missing languages.
      appDuas.forEach((app, i) => {
        if (appArabic[i] !== arabic) return;
        const added = LANGS.filter((l) => !(app.translations as any)[l]?.title && d[`title_${l}`]);
        for (const l of added) (app.translations as any)[l] = legacyTranslation(d, l);
        if (added.length) merged.push(`${d.id} -> ${app.id} [${added.join(',')}]`);
      });
      return false;
    })
    .map((d: any) => ({
      id: d.id,
      type: d.type,
      category_slug: slugByLegacyId.get(d.category_id) ?? null,
      priority: d.priority,
      tags: JSON.parse(d.tags || '[]'),
      arabic_text: d.dua_text,
      reciter: d.reciter,
      audio_duration: d.duration,
      audio_url: d.audio_url,
      quran_surah: d.quran_surah,
      quran_ayah: d.quran_ayah,
      quran_juz: d.quran_juz,
      hadith_book: d.hadith_book_name,
      hadith_chapter: d.hadith_chapter,
      hadith_number: d.hadith_number,
      source: d.source,
      when_to_recite: JSON.parse(d.when_to_recite || '[]'),
      // Old rows hold values outside the allowed list.
      frequency: ({ daily_during_ramadan: 'special', as_needed: 'occasional' } as Record<string, string>)[d.frequency] ?? d.frequency,
      difficulty: d.difficulty,
      estimated_time: d.estimated_time,
      related_duas: JSON.parse(d.related_duas || '[]'),
      notes: d.notes,
      status: 'published',
      translations: Object.fromEntries(LANGS.map((l) => [l, legacyTranslation(d, l)])),
    }));

  // Drop the placeholder test ad; the "Premium" ad contradicts the free-forever model, so it starts inactive.
  const ads = legacyAds
    .filter((a: any) => a.title !== 'Test Ads')
    .map((a: any) => ({
      id: String(a.id),
      title: a.title,
      text: a.text,
      action_text: a.action_text,
      action_color: a.action_color,
      text_color: a.text_color,
      title_color: a.title_color,
      link: a.link,
      icon_name: a.icon_name,
      icon_color: a.icon_color,
      is_active: a.title === 'Premium Features' ? false : Boolean(a.is_active),
      priority: a.priority,
    }));

  const seed = { generatedAt: new Date().toISOString(), categories, duas: [...appDuas, ...oldDuas], ads };
  await writeFile(new URL('seed.json', seedDir), JSON.stringify(seed, null, 2) + '\n');
  console.log(
    `seed.json: ${categories.length} categories, ${appDuas.length} app duas + ${oldDuas.length} old duas, ${ads.length} ads`,
  );
  console.log(`dropped duplicate old duas: ${dropped.join(', ') || 'none'}`);
  console.log(`merged old translations: ${merged.join('; ') || 'none'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
