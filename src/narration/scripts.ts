import type { CopyKey } from '@/copy';
import { FEELING_IDS, type FeelingId, LIKE_OPTIONS, type LikeAnswer } from '@/constants/quiz';

const LIKE_ANSWERS = LIKE_OPTIONS.map((o) => o.value);

/**
 * A narration segment: one highlighted section of the screen and the clips
 * read while it glows. `section` must match a <NarrationSection id> on screen.
 */
export type NarrationSegment = { section: string; keys: CopyKey[] };
export type NarrationScript = NarrationSegment[];

export const homeScript: NarrationScript = [
  { section: 'home.title', keys: ['home.title'] },
  { section: 'home.readPoem', keys: ['home.readPoem'] },
  { section: 'home.about', keys: ['home.about'] },
];

export const poemScript: NarrationScript = [
  { section: 'poem.image', keys: ['poem.imageAlt', 'poem.imageCaption'] },
  { section: 'poem.heading', keys: ['poem.title', 'poem.byline'] },
  { section: 'poem.stanza1', keys: ['poem.stanza1'] },
  { section: 'poem.stanza2', keys: ['poem.stanza2'] },
  { section: 'poem.stanza3', keys: ['poem.stanza3'] },
  { section: 'poem.stanza4', keys: ['poem.stanza4'] },
  { section: 'poem.next', keys: ['poem.next'] },
];

// Each question and each answer is its own section, so only the part being read glows.
export const questionsScript: NarrationScript = [
  { section: 'questions.liked.prompt', keys: ['questions.liked.prompt'] },
  ...LIKE_ANSWERS.map((a): NarrationSegment => ({ section: `questions.liked.${a}`, keys: [`questions.liked.${a}`] })),
  { section: 'questions.feelings.prompt', keys: ['questions.feelings.prompt', 'questions.feelings.hint'] },
  ...FEELING_IDS.map((f): NarrationSegment => ({
    section: `questions.feelings.${f}`,
    keys: [`questions.feelings.${f}`],
  })),
  { section: 'questions.done', keys: ['questions.done', 'questions.doneHint'] },
];

/** The Summary is read as a chain of existing clips, so it needs no extra recordings. */
export function summaryScript(liked: LikeAnswer | undefined, feelings: FeelingId[]): NarrationScript {
  const likedKey: CopyKey = liked ? `questions.liked.${liked}` : 'summary.noAnswer';
  return [
    { section: 'summary.heading', keys: ['summary.title', 'summary.subtitle'] },
    { section: 'summary.liked', keys: ['summary.likedQuestion', likedKey] },
    {
      section: 'summary.feelings',
      keys: ['summary.feelingsQuestion', ...feelings.map((f): CopyKey => `questions.feelings.${f}`)],
    },
    { section: 'summary.backHome', keys: ['summary.backHome'] },
  ];
}
