import { z } from 'zod';
import { DIFFICULTIES, DUA_STATUSES, DUA_TYPES, FREQUENCIES } from './content.js';
import { SUPPORTED_LANGUAGES } from './languages.js';

const str = (max: number) => z.string().trim().max(max).default('');
const hexColor = z
  .string()
  .trim()
  .regex(/^(#[0-9a-fA-F]{6})?$/, 'Must be a hex color like #2c5530')
  .default('');
const nullableInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().int().nullable(),
);
const stringList = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean) : v),
  z.array(z.string().trim().max(200)).max(50).default([]),
);

const langMap = <T extends z.ZodTypeAny>(schema: T) =>
  z.object(Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l, schema.optional()])) as Record<string, z.ZodOptional<T>>);

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes'),
  icon: str(50),
  color: hexColor,
  sort_order: z.coerce.number().int().default(0),
  translations: langMap(z.object({ name: str(150), description: str(5000) })).default({}),
});

export const duaSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dash or underscore'),
    type: z.enum(DUA_TYPES).default('hadith'),
    category_id: nullableInt,
    priority: z.coerce.number().int().min(1).max(5).default(3),
    tags: stringList,
    arabic_text: z.string().trim().min(1, 'Arabic text is required').max(20000),
    reciter: str(100),
    audio_duration: str(10),
    audio_url: z.union([z.literal(''), z.url().max(500)]).default(''),
    quran_surah: nullableInt,
    quran_ayah: nullableInt,
    quran_juz: nullableInt,
    hadith_book: str(100),
    hadith_chapter: str(100),
    hadith_number: str(50),
    source: str(200),
    authenticity: str(30),
    when_to_recite: stringList,
    frequency: z.enum(FREQUENCIES).default('daily'),
    difficulty: z.enum(DIFFICULTIES).default('beginner'),
    estimated_time: str(10).transform((v) => v || '00:00:30'),
    related_duas: stringList,
    notes: str(5000),
    status: z.enum(DUA_STATUSES).default('draft'),
    reviewed_by: str(100),
    translations: langMap(
      z.object({
        title: str(255),
        transliteration: str(20000),
        translation: str(20000),
        explanation: str(20000),
        benefits: str(20000),
      }),
    ).default({}),
  })
  .refine((d) => Boolean(d.translations.en?.title), {
    message: 'English title is required',
    path: ['translations'],
  });

export const adSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dash or underscore'),
  title: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(2000),
  action_text: z.string().trim().min(1).max(100),
  action_color: hexColor.transform((v) => v || '#2c5530'),
  text_color: hexColor.transform((v) => v || '#495057'),
  title_color: hexColor.transform((v) => v || '#2c5530'),
  link: z.url().max(500),
  icon_name: z.string().trim().min(1).max(50),
  icon_color: hexColor.transform((v) => v || '#2c5530'),
  is_active: z.preprocess((v) => v === true || v === 'true' || v === 1 || v === '1' || v === 'on', z.boolean()),
  priority: z.coerce.number().int().default(1),
});

export type CategoryBody = z.infer<typeof categorySchema>;
export type DuaBody = z.infer<typeof duaSchema>;
export type AdBody = z.infer<typeof adSchema>;
