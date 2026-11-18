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

```bash
npm run narration:status        # in sync / stale / missing / unknown clips per language
npm run narration:sheet -- es   # recording sheet with exact file names: narration-sheets/es.csv
npm run narration:generate      # regenerate src/narration/clips.generated.ts after adding clips
```
