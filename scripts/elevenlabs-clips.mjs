#!/usr/bin/env node
// Generate narration clips with ElevenLabs text-to-speech from the transcripts
// (English copy, or narration/translations/<lang>.json). Saves each clip as
// assets/narration/<lang>/<key>.<fingerprint>.m4a, replacing any older or
// placeholder clip for that key. Needs ffmpeg, and an ElevenLabs API key in
// ELEVENLABS_API_KEY (or injected by a proxy).
//
// Usage: node scripts/elevenlabs-clips.mjs [--all] [--only <key>] <voice id> <lang> [lang...]
//   --all   regenerate every clip, not just missing or stale ones
//           (use it to replace placeholder clips)

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AUDIO_DIR, clipName, generate, loadCopy, loadTranslations, scan } from './narration.mjs';

const MODEL = 'eleven_multilingual_v2';
const args = process.argv.slice(2);
const all = args.includes('--all');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const [voiceId, ...langs] = args.filter((a, i) => !a.startsWith('--') && i !== onlyIdx + 1);
if (!voiceId || !langs.length) {
  console.error('Usage: node scripts/elevenlabs-clips.mjs [--all] [--only <key>] <voice id> <lang> [lang...]');
  process.exit(1);
}
const apiKey = process.env.ELEVENLABS_API_KEY ?? 'proxy-injected';

async function speak(text) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: MODEL }),
      },
    );
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const body = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 300)}`);
  }
}

const work = join(tmpdir(), `elevenlabs-clips-${process.pid}`);
mkdirSync(work, { recursive: true });
const copy = loadCopy();
let chars = 0;
try {
  for (const lang of langs) {
    const dir = join(AUDIO_DIR, lang);
    mkdirSync(dir, { recursive: true });
    const translations = loadTranslations(lang, copy);
    const { ok, stale, missing } = scan(lang, copy);
    const existing = new Map([...ok.map((c) => [c.key, [c.file]]), ...stale.map((c) => [c.key, c.files])]);
    const todo = (all ? copy : [...stale, ...missing]).filter((c) => !only || c.key === only);
    let made = 0;
    for (const entry of todo) {
      const t = translations.get(entry.key);
      if (t.state !== 'ok') {
        console.warn(`skip ${lang}/${entry.key}: translation is ${t.state}`);
        continue;
      }
      const mp3 = join(work, 'clip.mp3');
      writeFileSync(mp3, await speak(t.text));
      for (const old of existing.get(entry.key) ?? []) unlinkSync(join(dir, old));
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, '-ac', '1', '-c:a', 'aac', '-b:a', '64k', join(dir, clipName(entry.key, entry.hash))]);
      chars += t.text.length;
      made += 1;
      console.log(`${lang}/${entry.key}`);
    }
    console.log(`${lang}: made ${made} clip(s)`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
  generate();
  console.log(`about ${chars} characters used`);
}
