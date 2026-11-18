export const LIKE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

export type LikeAnswer = (typeof LIKE_OPTIONS)[number]['value'];

export const FEELINGS = ['Happy', 'Calm', 'Tired', 'Curious', 'Anxious', 'Excited'] as const;
