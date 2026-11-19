#!/usr/bin/env node
// Keeps narration audio in sync with the English copy in src/copy/en.json.
//
// Each clip is named   assets/narration/<lang>/<copy key>.<fingerprint>.<ext>
// e.g.                 assets/narration/es/poem.stanza1.3fa2c19b.m4a
//
// The fingerprint is the first 8 hex digits of the SHA-256 of the key's
// English text, so editing a string marks every language's clip for it stale.
//
// Usage:
//   node scripts/narration.mjs status [--strict]   report in-sync / stale / missing / unknown clips
//   node scripts/narration.mjs generate            write src/narration/clips.generated.ts
//   node scripts/narration.mjs sheet <lang>        write a recording sheet (CSV) for <lang>

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COPY_FILE = join(root, 'src/copy/en.json');
const LANGUAGES_FILE = join(root, 'src/narration/languages.json');
const NOT_NARRATED_FILE = join(root, 'src/narration/not-narrated.json');
const TRANSLATIONS_DIR = join(root, 'narration/translations');
const AUDIO_DIR = join(root, 'assets/narration');
const GENERATED_FILE = join(root, 'src/narration/clips.generated.ts');
const SHEETS_DIR = join(root, 'narration-sheets');
const AUDIO_EXTS = ['m4a', 'mp3', 'aac', 'wav'];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** Flatten nested copy into { 'poem.stanza1': '…' }. */
function flatten(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else flatten(value, path, out);
  }
  return out;
}

export const fingerprint = (text) =>
  createHash('sha256').update(text.normalize('NFC'), 'utf8').digest('hex').slice(0, 8);

/** Copy keys that are narrated: everything except keys or prefixes listed in not-narrated.json. */
function loadCopy() {
  const skip = readJson(NOT_NARRATED_FILE).keys;
  const narrated = (key) => !skip.some((s) => (s.endsWith('.') ? key.startsWith(s) : key === s));
  const entries = flatten(readJson(COPY_FILE));
  return Object.entries(entries)
    .filter(([key]) => narrated(key))
    .map(([key, text]) => ({ key, text, hash: fingerprint(text) }));
}

/**
 * The transcript a narrator reads for each key in a language: the English copy
 * for 'en', otherwise narration/translations/<lang>.json. Each translation
 * records the English fingerprint it was made from ("source"), so a changed
 * English string marks its translation stale as well as its clip.
 */
function loadTranslations(lang, copy) {
  if (lang === 'en') return new Map(copy.map((c) => [c.key, { text: c.text, state: 'ok' }]));
  const file = join(TRANSLATIONS_DIR, `${lang}.json`);
  const table = existsSync(file) ? readJson(file) : {};
  return new Map(
    copy.map((c) => {
      const t = table[c.key];
      if (!t) return [c.key, { text: '', state: 'missing' }];
      return [c.key, { text: t.text, state: t.source === c.hash ? 'ok' : 'stale' }];
    }),
  );
}

const clipName = (key, hash, ext = 'm4a') => `${key}.${hash}.${ext}`;
const CLIP_RE = new RegExp(`^(.+)\\.([0-9a-f]{8})\\.(${AUDIO_EXTS.join('|')})$`);

/** Classify every copy key and every audio file for one language. */
function scan(lang, copy) {
  const dir = join(AUDIO_DIR, lang);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => !f.startsWith('.')) : [];
  const byKey = new Map();
  const unknown = [];
  for (const file of files) {
    const m = CLIP_RE.exec(file);
    if (!m) {
      unknown.push({ file, reason: 'name is not <key>.<fingerprint>.<ext>' });
      continue;
    }
    const [, key, hash, ext] = m;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ file, hash, ext });
  }
  const known = new Set(copy.map((c) => c.key));
  for (const [key, clips] of byKey) {
    if (!known.has(key)) clips.forEach((c) => unknown.push({ file: c.file, reason: `no copy key "${key}"` }));
  }
  const ok = [];
  const stale = [];
  const missing = [];
  for (const entry of copy) {
    const clips = byKey.get(entry.key) ?? [];
    const current = clips.find((c) => c.hash === entry.hash);
    if (current) ok.push({ ...entry, file: current.file });
    else if (clips.length) stale.push({ ...entry, files: clips.map((c) => c.file) });
    else missing.push(entry);
  }
  return { ok, stale, missing, unknown };
}

function status(strict) {
  const copy = loadCopy();
  const languages = readJson(LANGUAGES_FILE);
  let failed = false;
  console.log(`${copy.length} narrated copy keys in src/copy/en.json\n`);
  for (const { code, name } of languages) {
    const r = scan(code, copy);
    console.log(
      `${name} (${code}): ${r.ok.length} in sync, ${r.stale.length} stale, ${r.missing.length} missing, ${r.unknown.length} unknown`,
    );
    if (code !== 'en') {
      const t = [...loadTranslations(code, copy).entries()];
      const missingT = t.filter(([, v]) => v.state === 'missing').map(([k]) => k);
      const staleT = t.filter(([, v]) => v.state === 'stale').map(([k]) => k);
      console.log(`  translations: ${t.length - missingT.length - staleT.length} current, ${staleT.length} stale, ${missingT.length} missing`);
      for (const k of staleT) console.log(`  stale translation  ${k}  (English changed since it was translated)`);
      if (staleT.length || (strict && missingT.length)) failed = true;
    }
    for (const s of r.stale) console.log(`  stale    ${s.key}  (expected ${clipName(s.key, s.hash)}, found ${s.files.join(', ')})`);
    for (const u of r.unknown) console.log(`  unknown  ${u.file}  (${u.reason})`);
    if (r.stale.length || r.unknown.length || (strict && r.missing.length)) failed = true;
  }
  if (failed) {
    console.error('\nNarration audio is out of sync with the copy.');
    process.exitCode = 1;
  }
}

function generate() {
  const copy = loadCopy();
  const languages = readJson(LANGUAGES_FILE);
  const lines = [
    '// Generated by `node scripts/narration.mjs generate`. Do not edit.',
    '// Lists only clips whose fingerprint matches the current English copy.',
    "import type { ClipTable } from './engine';",
    '',
    '/** Number of copy keys that are narrated (see src/narration/not-narrated.json). */',
    `export const NARRATED_KEY_COUNT = ${copy.length};`,
    '',
    '/** In-sync clips per language. `weight` is the length of the clip\'s transcript, used by the progress bar. */',
    'export const CLIPS: Record<string, ClipTable> = {',
  ];
  for (const { code } of languages) {
    const { ok } = scan(code, copy);
    const transcripts = loadTranslations(code, copy);
    lines.push(`  ${JSON.stringify(code)}: {`);
    for (const c of ok) {
      const weight = Math.max(1, (transcripts.get(c.key)?.text || c.text).length);
      lines.push(
        `    ${JSON.stringify(c.key)}: { source: require('../../assets/narration/${code}/${c.file}'), weight: ${weight} },`,
      );
    }
    lines.push('  },');
  }
  lines.push('};', '');
  writeFileSync(GENERATED_FILE, lines.join('\n'));
  console.log(`Wrote ${GENERATED_FILE.replace(root + '/', '')}`);
}

function sheet(lang) {
  if (!lang) throw new Error('Usage: node scripts/narration.mjs sheet <lang>');
  const copy = loadCopy();
  const { ok, stale, missing } = scan(lang, copy);
  const state = new Map([
    ...ok.map((c) => [c.key, 'recorded']),
    ...stale.map((c) => [c.key, 're-record (English changed)']),
    ...missing.map((c) => [c.key, 'to record']),
  ]);
  const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const translations = loadTranslations(lang, copy);
  const rows = [['key', 'status', 'file name', 'English text', 'text to read'].map(csv).join(',')];
  for (const c of copy) {
    const t = translations.get(c.key);
    const read = t.state === 'ok' ? t.text : t.state === 'stale' ? `[translation out of date] ${t.text}` : '[needs translation]';
    rows.push([c.key, state.get(c.key), clipName(c.key, c.hash), c.text, read].map(csv).join(','));
  }
  mkdirSync(SHEETS_DIR, { recursive: true });
  const out = join(SHEETS_DIR, `${lang}.csv`);
  writeFileSync(out, rows.join('\n') + '\n');
  console.log(`Wrote ${out.replace(root + '/', '')}: save each clip into assets/narration/${lang}/ with the name in "file name".`);
}

export { AUDIO_DIR, clipName, generate, LANGUAGES_FILE, loadCopy, loadTranslations, readJson, scan };

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [command, arg] = process.argv.slice(2);
  if (command === 'status') status(arg === '--strict');
  else if (command === 'generate') generate();
  else if (command === 'sheet') sheet(arg);
  else {
    console.error('Usage: node scripts/narration.mjs <status [--strict] | generate | sheet <lang>>');
    process.exitCode = 1;
  }
}
