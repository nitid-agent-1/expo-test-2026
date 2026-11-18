import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { CLIPS } from './clips.generated';
import { NARRATION_LANGUAGES } from './languages';
import type { NarrationScript } from './scripts';

const STORAGE_KEY = 'narration.settings.v1';
/** Pause between sections, in ms. */
const SECTION_GAP_MS = 250;
/** In development builds a section with no recorded clips still glows briefly, so gaps are easy to spot. */
const MISSING_CLIP_GLOW_MS = 600;
/** Give up on a clip that never reports finishing (bad file, interruption). */
const CLIP_TIMEOUT_MS = 60_000;

type Settings = { language: string; muted: boolean };
const DEFAULT_SETTINGS: Settings = { language: NARRATION_LANGUAGES[0]?.code ?? 'en', muted: false };

type NarrationContextValue = {
  language: string;
  setLanguage: (code: string) => void;
  muted: boolean;
  toggleMuted: () => void;
  /** True while a screen reader is on; narration is paused so the two don't talk over each other. */
  screenReaderOn: boolean;
  /** The section currently being narrated, or null. */
  activeSection: string | null;
  /** Start narrating a script from the beginning, replacing anything already playing. */
  start: (script: NarrationScript) => void;
  /** Stop narrating. */
  stop: () => void;
  /**
   * Interrupt the screen narration to play a one-off segment, such as the
   * confirmation after tapping an answer. The screen narration does not resume.
   */
  say: (segment: NarrationScript[number]) => void;
};

const NarrationContext = createContext<NarrationContextValue | null>(null);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Play one clip and resolve when it finishes, fails, times out, or is cancelled. */
function playClip(player: AudioPlayer, source: number, cancelRef: { current: (() => void) | null }) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.remove();
      cancelRef.current = null;
      resolve();
    };
    let timer = setTimeout(finish, CLIP_TIMEOUT_MS);
    let timedToDuration = false;
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish || status.error) {
        finish();
        return;
      }
      // Once the clip's length is known, don't wait much past its end.
      if (!timedToDuration && status.isLoaded && status.duration > 0) {
        timedToDuration = true;
        clearTimeout(timer);
        timer = setTimeout(finish, (status.duration - status.currentTime) * 1000 + 1500);
      }
    });
    cancelRef.current = () => {
      player.pause();
      finish();
    };
    player.replace(source);
    player.play();
  });
}

export function NarrationProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [screenReaderOn, setScreenReaderOn] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const runId = useRef(0);
  const cancelClip = useRef<(() => void) | null>(null);
  const currentScript = useRef<NarrationScript | null>(null);
  // The latest settings, readable from inside a running script.
  const live = useRef({ settings, screenReaderOn, loaded });
  useLayoutEffect(() => {
    live.current = { settings, screenReaderOn, loaded };
  }, [settings, screenReaderOn, loaded]);

  useEffect(() => {
    // Narration should be heard even with the ringer switch off, and should lower (not stop) other audio.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  }, []);

  const stopPlayback = useCallback(() => {
    runId.current += 1;
    cancelClip.current?.();
    setActiveSection(null);
  }, []);

  /** Narrate a script. `override` supplies values that changed in this event and have not rendered yet. */
  const run = useCallback(
    async (script: NarrationScript, override: Partial<typeof live.current> = {}) => {
      stopPlayback();
      const id = runId.current;
      const { settings: s, screenReaderOn: reader, loaded: ready } = { ...live.current, ...override };
      if (!ready || s.muted || reader) return;
      const clips = CLIPS[s.language] ?? {};

      for (const segment of script) {
        if (runId.current !== id) return;
        setActiveSection(segment.section);
        let played = false;
        for (const key of segment.keys) {
          if (runId.current !== id) return;
          const source = clips[key];
          if (source === undefined) continue;
          played = true;
          await playClip(player, source, cancelClip);
        }
        if (!played && __DEV__) await sleep(MISSING_CLIP_GLOW_MS);
        if (runId.current !== id) return;
        setActiveSection(null);
        await sleep(SECTION_GAP_MS);
      }
      if (runId.current === id) setActiveSection(null);
    },
    [player, stopPlayback],
  );

  const start = useCallback(
    (script: NarrationScript) => {
      currentScript.current = script;
      void run(script);
    },
    [run],
  );

  const stop = useCallback(() => {
    currentScript.current = null;
    stopPlayback();
  }, [stopPlayback]);

  const say = useCallback(
    (segment: NarrationScript[number]) => {
      currentScript.current = null;
      void run([segment]);
    },
    [run],
  );

  const save = useCallback((next: Settings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  /** Restart the current screen's narration with values that just changed (or stop, if now silent). */
  const restart = useCallback(
    (override: Partial<typeof live.current>) => {
      if (currentScript.current) void run(currentScript.current, override);
      else stopPlayback();
    },
    [run, stopPlayback],
  );

  const setLanguage = useCallback(
    (code: string) => {
      const next = { ...live.current.settings, language: code };
      save(next);
      restart({ settings: next });
    },
    [save, restart],
  );
  const toggleMuted = useCallback(() => {
    const next = { ...live.current.settings, muted: !live.current.settings.muted };
    save(next);
    restart({ settings: next });
  }, [save, restart]);

  // Load saved settings, then narrate the screen that is already showing.
  useEffect(() => {
    let next = DEFAULT_SETTINGS;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Settings>;
        const known = NARRATION_LANGUAGES.some((l) => l.code === saved.language);
        next = {
          language: known && saved.language ? saved.language : DEFAULT_SETTINGS.language,
          muted: saved.muted ?? DEFAULT_SETTINGS.muted,
        };
      })
      .catch(() => {})
      .finally(() => {
        setSettings(next);
        setLoaded(true);
        restart({ settings: next, loaded: true });
      });
  }, [restart]);

  // Pause while a screen reader is on, so the two don't talk over each other.
  useEffect(() => {
    const apply = (on: boolean) => {
      setScreenReaderOn(on);
      restart({ screenReaderOn: on });
    };
    AccessibilityInfo.isScreenReaderEnabled().then(apply).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', apply);
    return () => sub.remove();
  }, [restart]);

  // Stop when the app goes to the background; start the screen again when it returns.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (currentScript.current) void run(currentScript.current);
      } else {
        stopPlayback();
      }
    });
    return () => sub.remove();
  }, [run, stopPlayback]);

  const value = useMemo<NarrationContextValue>(
    () => ({
      language: settings.language,
      setLanguage,
      muted: settings.muted,
      toggleMuted,
      screenReaderOn,
      activeSection,
      start,
      stop,
      say,
    }),
    [settings, setLanguage, toggleMuted, screenReaderOn, activeSection, start, stop, say],
  );

  return <NarrationContext.Provider value={value}>{children}</NarrationContext.Provider>;
}

export function useNarration() {
  const value = useContext(NarrationContext);
  if (!value) throw new Error('useNarration must be used inside <NarrationProvider>');
  return value;
}
