#!/usr/bin/env node
// Make robotic placeholder narration clips with text-to-speech, for testing
// before real recordings exist. Writes only clips that are missing or stale,
// so real recordings are never overwritten. Needs espeak-ng and ffmpeg.
//
// Usage: node scripts/placeholder-clips.mjs [lang=en] [espeak voice=en-us]

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AUDIO_DIR, clipName, generate, loadCopy, scan } from './narration.mjs';

const [lang = 'en', voice = 'en-us'] = process.argv.slice(2);
const dir = join(AUDIO_DIR, lang);
mkdirSync(dir, { recursive: true });
const work = join(tmpdir(), `placeholder-clips-${process.pid}`);
mkdirSync(work, { recursive: true });

const copy = loadCopy();
const { stale, missing } = scan(lang, copy);
for (const entry of [...stale, ...missing]) {
  for (const old of entry.files ?? []) unlinkSync(join(dir, old));
  const textFile = join(work, 'text.txt');
  const wav = join(work, 'clip.wav');
  // Read line breaks (poem lines) as short pauses.
  writeFileSync(textFile, entry.text.replace(/\n/g, ',\n'));
  execFileSync('espeak-ng', ['-v', voice, '-s', '160', '-f', textFile, '-w', wav]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-c:a', 'aac', '-b:a', '48k', join(dir, clipName(entry.key, entry.hash))]);
  console.log(`made ${lang}/${clipName(entry.key, entry.hash)}`);
}
rmSync(work, { recursive: true, force: true });
generate();
