import en from './en.json';

/**
 * All on-screen copy. The visual language is always English; narration audio
 * in other languages is keyed by the dotted path of each string (for example
 * `poem.stanza1`). See scripts/narration.mjs.
 */
export const copy = en;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every copy key, as a dotted path: 'home.title', 'questions.feelings.happy', … */
export type CopyKey = Leaves<typeof en>;

/** Look up copy by its dotted key. */
export function text(key: CopyKey): string {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string;
}
