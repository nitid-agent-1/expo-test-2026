import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { CLIPS } from './clips.generated';
import { NarrationEngine } from './engine';
import { NARRATION_LANGUAGES } from './languages';
import type { NarrationScript, NarrationSegment } from './scripts';

const STORAGE_KEY = 'narration.settings.v1';

type Settings = { language: string; paused: boolean };
const DEFAULT_SETTINGS: Settings = { language: NARRATION_LANGUAGES[0]?.code ?? 'en', paused: false };

type NarrationContextValue = {
  engine: NarrationEngine;
  language: string;
  setLanguage: (code: string) => void;
  /** The user's play/pause choice. Applies across screens and is remembered between launches. */
  paused: boolean;
  /** Pause if narrating; otherwise play (resuming where it stopped, or replaying a finished screen). */
  togglePlayback: () => void;
  /** Narrate the current screen from the top (and un-pause). */
  restart: () => void;
  /** True while a screen reader is on; narration is held so the two don't talk over each other. */
  screenReaderOn: boolean;
  /** Narrate a screen from the beginning (called when it gains focus). */
  start: (script: NarrationScript) => void;
  /** Stop narrating (called when the screen loses focus). */
  stop: () => void;
  /** Play a one-off segment, such as an answer confirmation, then carry on with the screen. */
  say: (segment: NarrationSegment) => void;
};

const NarrationContext = createContext<NarrationContextValue | null>(null);

export function NarrationProvider({ children }: { children: ReactNode }) {
  // Frequent status updates keep the progress bar smooth.
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const [engine] = useState(() => new NarrationEngine());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [screenReaderOn, setScreenReaderOn] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    // Narration should be heard even with the ringer switch off, and should lower (not stop) other audio.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  }, []);

  useEffect(() => {
    engine.attach(player);
    const sub = player.addListener('playbackStatusUpdate', engine.onStatus);
    return () => sub.remove();
  }, [engine, player]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Settings> & { muted?: boolean };
        const known = NARRATION_LANGUAGES.some((l) => l.code === saved.language);
        setSettings({
          language: known && saved.language ? saved.language : DEFAULT_SETTINGS.language,
          // Earlier versions called this setting "muted".
          paused: saved.paused ?? saved.muted ?? DEFAULT_SETTINGS.paused,
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderOn).catch(() => {});
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderOn);
    const app = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => {
      reader.remove();
      app.remove();
    };
  }, []);

  // Keep the engine in step with the language and with everything that holds narration back.
  useEffect(() => {
    engine.setClips(CLIPS[settings.language] ?? {});
  }, [engine, settings.language]);
  useEffect(() => {
    engine.setBlocked(!loaded || settings.paused || screenReaderOn || !appActive);
  }, [engine, loaded, settings.paused, screenReaderOn, appActive]);

  const save = useCallback((update: (prev: Settings) => Settings) => {
    setSettings((prev) => {
      const next = update(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setLanguage = useCallback((code: string) => save((s) => ({ ...s, language: code })), [save]);

  const togglePlayback = useCallback(() => {
    if (engine.state.get().running) save((s) => ({ ...s, paused: true }));
    else if (settings.paused) save((s) => ({ ...s, paused: false }));
    else engine.restart();
  }, [engine, save, settings.paused]);

  const restart = useCallback(() => {
    engine.restart();
    if (settings.paused) save((s) => ({ ...s, paused: false }));
  }, [engine, save, settings.paused]);

  const start = useCallback((script: NarrationScript) => engine.start(script), [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const say = useCallback((segment: NarrationSegment) => engine.say(segment), [engine]);

  const value = useMemo<NarrationContextValue>(
    () => ({
      engine,
      language: settings.language,
      setLanguage,
      paused: settings.paused,
      togglePlayback,
      restart,
      screenReaderOn,
      start,
      stop,
      say,
    }),
    [engine, settings, setLanguage, togglePlayback, restart, screenReaderOn, start, stop, say],
  );

  return <NarrationContext.Provider value={value}>{children}</NarrationContext.Provider>;
}

export function useNarration() {
  const value = useContext(NarrationContext);
  if (!value) throw new Error('useNarration must be used inside <NarrationProvider>');
  return value;
}

/** The glowing section and whether narration is running. Re-renders only when those change. */
export function useNarrationState() {
  const { engine } = useNarration();
  return useSyncExternalStore(engine.state.subscribe, engine.state.get);
}

/** 0–1 through the current screen's narration. Updates about ten times a second while playing. */
export function useNarrationProgress() {
  const { engine } = useNarration();
  return useSyncExternalStore(engine.progress.subscribe, engine.progress.get);
}
