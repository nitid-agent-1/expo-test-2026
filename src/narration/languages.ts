import languages from './languages.json';

/**
 * Narration languages offered in the in-app picker. The on-screen text is
 * always English; the language only chooses which narration audio plays.
 *
 * `code` is the folder name under assets/narration/ and should be a BCP 47
 * language tag. ISO 639-3 codes (for example "quc") work for languages that
 * have no two-letter code. Edit languages.json, not this file.
 */
export type NarrationLanguageInfo = { code: string; name: string };

export const NARRATION_LANGUAGES: readonly NarrationLanguageInfo[] = languages;
