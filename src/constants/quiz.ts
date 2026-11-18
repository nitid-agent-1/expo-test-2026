import { copy } from '@/copy';

export const LIKE_OPTIONS = [
  { value: 'yes', label: copy.questions.liked.yes },
  { value: 'no', label: copy.questions.liked.no },
] as const;

export type LikeAnswer = (typeof LIKE_OPTIONS)[number]['value'];

/** Stable ids for the feelings; labels come from the copy file. */
export const FEELING_IDS = ['happy', 'calm', 'tired', 'curious', 'anxious', 'excited'] as const;

export type FeelingId = (typeof FEELING_IDS)[number];

export const feelingLabel = (id: FeelingId) => copy.questions.feelings[id];

export const isFeelingId = (value: string): value is FeelingId =>
  (FEELING_IDS as readonly string[]).includes(value);
