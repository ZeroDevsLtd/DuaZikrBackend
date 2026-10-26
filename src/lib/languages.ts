// Every language the API returns. Responses always carry all keys (empty string when
// missing) because the mobile app expects the full object shape from the v1 API.
export const SUPPORTED_LANGUAGES = ['en', 'bn', 'ar', 'de', 'ur', 'es', 'id'] as const;
export type Lang = (typeof SUPPORTED_LANGUAGES)[number];

// Launch languages, shown first in the admin panel.
export const PRIMARY_LANGUAGES: Lang[] = ['en', 'bn', 'ar', 'de'];

export function isLang(value: string): value is Lang {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export type Localized = Record<Lang, string>;

export function emptyLocalized(): Localized {
  return Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l, ''])) as Localized;
}
