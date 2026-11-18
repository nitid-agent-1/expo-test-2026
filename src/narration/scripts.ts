import type { CopyKey } from '@/copy';
import { type FeelingId, type LikeAnswer } from '@/constants/quiz';

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

export const questionsScript: NarrationScript = [
  {
    section: 'questions.liked',
    keys: ['questions.liked.prompt', 'questions.liked.yes', 'questions.liked.no'],
  },
  {
    section: 'questions.feelings',
    keys: [
      'questions.feelings.prompt',
      'questions.feelings.hint',
      'questions.feelings.happy',
      'questions.feelings.calm',
      'questions.feelings.tired',
      'questions.feelings.curious',
      'questions.feelings.anxious',
      'questions.feelings.excited',
    ],
  },
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
