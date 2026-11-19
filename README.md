# expo-test-2026

A minimal "Hello, world" Expo app (SDK 58, React Native 0.88, React 19.3, Expo Router, TypeScript).

## Run

```bash
npm install
npx expo start
```

Screens live in `src/app/`: `index.tsx` (Hello world) links to `about.tsx`.

## Checks

```bash
npm run typecheck
```

## Copy and narration

All on-screen text lives in `src/copy/en.json` and is read through `copy` in
`src/copy/index.ts`. The screens are always in English. Each string's key is its
dotted path, for example `poem.stanza1` or `questions.feelings.happy`.

Narration audio is recorded per language and saved under
`assets/narration/<lang>/<key>.<fingerprint>.m4a`. The fingerprint is the first
8 hex digits of the SHA-256 of the English text, so changing a string marks
its clips in every language as stale. Narration languages are listed in
`src/narration/languages.json`.

Each screen narrates itself when it opens (`src/narration/scripts.ts` lists the
sections and clips, in order), and the section being read glows. Tapping an
answer plays its own confirmation clip ("You selected “Happy”."). The globe
button in the header picks the narration language and the speaker button
mutes narration; both are remembered. Narration pauses while VoiceOver or
TalkBack is on. Keys listed in `src/narration/not-narrated.json` (header
titles, About, the narration controls) are never narrated.

The clips in `assets/narration/` are robotic text-to-speech placeholders for
testing. Replace them with real recordings using the same
file names.

Narration languages: English, Spanish (`es`) and Korean (`ko`). Each non-English
language has a transcript in `narration/translations/<code>.json`: the text the
narrator reads for every key, plus the English fingerprint it was translated
from (`source`). When an English string changes, `narration:status` flags both
the translation and the clip as stale. The Spanish and Korean translations,
including the poem (an original translation of Carroll's invented words), are
drafts that should be reviewed by native speakers, and their clips are robotic
placeholders like the English ones.

To add a language: add it to `src/narration/languages.json`, write
`narration/translations/<code>.json`, run the sheet command below, record the
clips with the listed file names into `assets/narration/<code>/`, then run
`narration:generate`.

```bash
npm run narration:status        # in sync / stale / missing / unknown clips per language
npm run narration:sheet -- es   # recording sheet with exact file names: narration-sheets/es.csv
npm run narration:generate      # regenerate src/narration/clips.generated.ts after adding clips
npm run narration:placeholders -- es  # robotic test clips for missing/stale keys (needs espeak-ng and ffmpeg)
```

To voice clips with ElevenLabs (needs an API key with Text to Speech
access in `ELEVENLABS_API_KEY`; `--all` also replaces placeholder clips):

```bash
npm run narration:elevenlabs -- --all XrExE9yKIg1WjnnlVkGX en es ko   # Matilda, eleven_multilingual_v2
```
