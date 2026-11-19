#!/usr/bin/env node
// Generate narration clips with ElevenLabs text-to-speech from the transcripts
// (English copy, or narration/translations/<lang>.json). Saves each clip as
// assets/narration/<lang>/<key>.<fingerprint>.mp3, replacing any older or
// placeholder clip for that key only after the new clip is saved. Needs an
// ElevenLabs API key in ELEVENLABS_API_KEY (or injected by a proxy).
//
// Usage: node scripts/elevenlabs-clips.mjs [--all] [--only <key>] <voice id> <lang> [lang...]
//   --all   regenerate every clip, not just missing or stale ones
//           (use it to replace placeholder clips)

import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { AUDIO_DIR, clipName, generate, loadCopy, loadTranslations, scan } from './narration.mjs';

const MODEL = 'eleven_multilingual_v2';
// Mono speech at 64 kbps keeps clips small.
const OUTPUT_FORMAT = 'mp3_44100_64';
const API_URL = process.env.ELEVENLABS_API_URL ?? 'https://api.elevenlabs.io';
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
      `${API_URL}/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`,
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
      const audio = await speak(t.text);
      // Save under a temporary name first, so a failure never leaves the key without a clip.
      const name = clipName(entry.key, entry.hash, 'mp3');
      const tmp = join(dir, `.${name}.partial`);
      writeFileSync(tmp, audio);
      for (const old of existing.get(entry.key) ?? []) if (old !== name) unlinkSync(join(dir, old));
      renameSync(tmp, join(dir, name));
      chars += t.text.length;
      made += 1;
      console.log(`${lang}/${entry.key}`);
    }
    console.log(`${lang}: made ${made} clip(s)`);
  }
} finally {
  generate();
  console.log(`about ${chars} characters used`);
}
