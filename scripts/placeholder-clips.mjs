#!/usr/bin/env node
// Make robotic placeholder narration clips with text-to-speech, for testing
// before real recordings exist. Speaks the English copy for 'en', otherwise
// the current translation in narration/translations/<lang>.json. Writes only
// clips that are missing or stale, so real recordings are never overwritten.
// Needs espeak-ng and ffmpeg.
//
// Usage: node scripts/placeholder-clips.mjs <lang> [espeak voice]
//        (the voice defaults to placeholderVoice in src/narration/languages.json)

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AUDIO_DIR, clipName, generate, LANGUAGES_FILE, loadCopy, loadTranslations, readJson, scan } from './narration.mjs';

const [lang, voiceArg] = process.argv.slice(2);
if (!lang) {
  console.error('Usage: node scripts/placeholder-clips.mjs <lang> [espeak voice]');
  process.exit(1);
}
const info = readJson(LANGUAGES_FILE).find((l) => l.code === lang);
if (!info) {
  console.error(`"${lang}" is not in src/narration/languages.json`);
  process.exit(1);
}
const voice = voiceArg ?? info.placeholderVoice ?? lang;

const dir = join(AUDIO_DIR, lang);
mkdirSync(dir, { recursive: true });
const work = join(tmpdir(), `placeholder-clips-${process.pid}`);
mkdirSync(work, { recursive: true });

const copy = loadCopy();
const translations = loadTranslations(lang, copy);
const { stale, missing } = scan(lang, copy);
let made = 0;
for (const entry of [...stale, ...missing]) {
  const t = translations.get(entry.key);
  if (t.state !== 'ok') {
    console.warn(`skip ${entry.key}: translation is ${t.state}`);
    continue;
  }
  for (const old of entry.files ?? []) unlinkSync(join(dir, old));
  const textFile = join(work, 'text.txt');
  const wav = join(work, 'clip.wav');
  // Read line breaks (poem lines) as short pauses.
  writeFileSync(textFile, t.text.replace(/\n/g, ',\n'));
  execFileSync('espeak-ng', ['-v', voice, '-s', '160', '-f', textFile, '-w', wav]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-c:a', 'aac', '-b:a', '48k', join(dir, clipName(entry.key, entry.hash))]);
  made += 1;
}
console.log(`${lang}: made ${made} clip(s) with voice ${voice}`);
rmSync(work, { recursive: true, force: true });
generate();
