import type { AudioPlayer, AudioStatus } from 'expo-audio';

import type { CopyKey } from '@/copy';

import type { NarrationScript, NarrationSegment } from './scripts';

/** A recorded clip and its weight in the progress bar (the length of its transcript). */
export type ClipEntry = { source: number; weight: number };
export type ClipTable = Partial<Record<CopyKey, ClipEntry>>;

export type EngineState = {
  /** The section currently glowing, or null. */
  activeSection: string | null;
  /** True while narration is actually under way (including short gaps between sections). */
  running: boolean;
};

/** Pause between sections, in ms. */
const SECTION_GAP_MS = 250;
/** In development builds a section with no recorded clip still glows briefly, so gaps are easy to spot. */
const MISSING_CLIP_GLOW_MS = __DEV__ ? 600 : 0;
/** Give up on a clip that never reports finishing (bad file, interruption) until its length is known. */
const CLIP_TIMEOUT_MS = 60_000;

type Item = { section: string; clip?: ClipEntry };

/** Minimal observable value for useSyncExternalStore. */
class Store<T> {
  private listeners = new Set<() => void>();
  constructor(private value: T) {}
  get = () => this.value;
  set(next: T) {
    if (Object.is(next, this.value)) return;
    this.value = next;
    this.listeners.forEach((l) => l());
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

function toItems(segments: NarrationSegment[], clips: ClipTable): Item[] {
  return segments.flatMap((segment) => {
    const items: Item[] = segment.keys
      .map((key) => clips[key])
      .filter((clip): clip is ClipEntry => clip !== undefined)
      .map((clip) => ({ section: segment.section, clip }));
    // A section with no recorded clips still gets a (silent) turn so it can glow.
    return items.length ? items : [{ section: segment.section }];
  });
}

/**
 * Plays a screen's narration script clip by clip through one audio player.
 * Narration can be blocked (paused by the user, a screen reader, the app in the
 * background, settings still loading) and unblocked, and it resumes exactly
 * where it stopped. A one-off segment (an answer confirmation) can interrupt
 * the screen; afterwards the screen carries on from the start of the clip that
 * was interrupted.
 */
export class NarrationEngine {
  readonly state = new Store<EngineState>({ activeSection: null, running: false });
  /** 0–1 through the current screen's narration. */
  readonly progress = new Store<number>(0);

  private player: AudioPlayer | null = null;
  private clips: ClipTable = {};
  private blocked = true;

  private script: NarrationScript | null = null;
  private page: { items: Item[]; index: number; total: number; done: number; finished: boolean } | null = null;
  private interrupt: { items: Item[]; index: number } | null = null;

  /** True when the player holds the current item's clip, started (it may be paused). */
  private clipActive = false;
  private clipTimed = false;
  private stepTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  attach(player: AudioPlayer) {
    this.player = player;
  }

  setClips(clips: ClipTable) {
    if (clips === this.clips) return;
    this.clips = clips;
    // A new language: start the screen again in that language.
    if (this.script) this.start(this.script);
  }

  setBlocked(blocked: boolean) {
    if (blocked === this.blocked) return;
    this.blocked = blocked;
    if (blocked) this.halt();
    else this.continue();
  }

  /** Narrate a screen from the beginning. */
  start(script: NarrationScript) {
    this.reset();
    this.script = script;
    const items = toItems(script, this.clips);
    const total = items.reduce((sum, item) => sum + (item.clip?.weight ?? 0), 0);
    this.page = { items, index: 0, total, done: 0, finished: false };
    this.continue();
  }

  /** Start the current screen again from the beginning. */
  restart() {
    if (this.script) this.start(this.script);
  }

  /** Stop narrating (the screen lost focus). */
  stop() {
    this.reset();
    this.script = null;
  }

  /** Play a one-off segment, then carry on with the screen. Silent while blocked. */
  say(segment: NarrationSegment) {
    if (this.blocked) return;
    const items = toItems([segment], this.clips).filter((item) => item.clip);
    if (!items.length) return;
    this.clearTimers();
    if (this.clipActive) {
      // Restart the interrupted clip from its beginning afterwards.
      this.player?.pause();
      this.clipActive = false;
    }
    this.interrupt = { items, index: 0 };
    this.publishProgress(0);
    this.playCurrent();
  }

  /** Feed every playback status update from the player here. */
  onStatus = (status: AudioStatus) => {
    if (!this.clipActive) return;
    if (status.didJustFinish || status.error) {
      this.clipActive = false;
      this.clearTimers();
      this.advance();
      return;
    }
    if (!this.clipTimed && status.isLoaded && status.duration > 0 && status.playing) {
      this.clipTimed = true;
      this.armWatchdog((status.duration - status.currentTime) * 1000 + 1500);
    }
    if (!this.interrupt && status.duration > 0) this.publishProgress(status.currentTime / status.duration);
  };

  private current(): Item | undefined {
    if (this.interrupt) return this.interrupt.items[this.interrupt.index];
    if (this.page && !this.page.finished) return this.page.items[this.page.index];
    return undefined;
  }

  private setState(patch: Partial<EngineState>) {
    const prev = this.state.get();
    const next = { ...prev, ...patch };
    if (next.activeSection !== prev.activeSection || next.running !== prev.running) this.state.set(next);
  }

  private continue() {
    if (this.blocked || !this.current()) return;
    this.setState({ running: true });
    if (this.clipActive && this.player) {
      this.player.play();
      const { duration, currentTime } = this.player;
      this.armWatchdog(duration > 0 ? (duration - currentTime) * 1000 + 1500 : CLIP_TIMEOUT_MS);
    } else if (!this.stepTimer) {
      this.playCurrent();
    }
  }

  private halt() {
    this.clearTimers();
    if (this.clipActive) this.player?.pause();
    this.setState({ running: false });
  }

  private playCurrent() {
    const item = this.current();
    if (!item) return;
    this.setState({ activeSection: item.section, running: true });
    if (!item.clip || !this.player) {
      this.stepTimer = setTimeout(() => {
        this.stepTimer = null;
        this.advance();
      }, MISSING_CLIP_GLOW_MS);
      return;
    }
    this.clipActive = true;
    this.clipTimed = false;
    this.player.replace(item.clip.source);
    this.player.play();
    this.armWatchdog(CLIP_TIMEOUT_MS);
  }

  private advance() {
    if (this.interrupt) {
      this.interrupt.index += 1;
      if (this.interrupt.index < this.interrupt.items.length) {
        this.playCurrent();
        return;
      }
      this.interrupt = null;
      this.publishProgress(0);
      // Carry on with the screen, restarting the clip that was interrupted.
      if (this.page && !this.page.finished) this.playAfterGap();
      else this.setState({ activeSection: null, running: false });
      return;
    }
    const page = this.page;
    if (!page || page.finished) return;
    const finished = page.items[page.index];
    page.done += finished?.clip?.weight ?? 0;
    page.index += 1;
    if (page.index >= page.items.length) {
      page.finished = true;
      this.progress.set(1);
      this.setState({ activeSection: null, running: false });
      return;
    }
    this.publishProgress(0);
    const sameSection = page.items[page.index].section === finished?.section;
    if (sameSection) this.playCurrent();
    else this.playAfterGap();
  }

  /** Clear the glow, wait briefly, then play the current item. */
  private playAfterGap() {
    this.setState({ activeSection: null });
    this.stepTimer = setTimeout(() => {
      this.stepTimer = null;
      if (!this.blocked) this.playCurrent();
    }, SECTION_GAP_MS);
  }

  private publishProgress(clipFraction: number) {
    const page = this.page;
    if (!page) {
      this.progress.set(0);
      return;
    }
    if (page.finished) {
      this.progress.set(1);
      return;
    }
    if (page.total === 0) {
      this.progress.set(page.items.length ? page.index / page.items.length : 0);
      return;
    }
    const weight = page.items[page.index]?.clip?.weight ?? 0;
    const fraction = Math.min(1, Math.max(0, clipFraction));
    this.progress.set(Math.min(1, (page.done + weight * fraction) / page.total));
  }

  private armWatchdog(ms: number) {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      this.watchdog = null;
      if (!this.clipActive) return;
      this.clipActive = false;
      this.player?.pause();
      this.advance();
    }, ms);
  }

  private clearTimers() {
    if (this.stepTimer) clearTimeout(this.stepTimer);
    if (this.watchdog) clearTimeout(this.watchdog);
    this.stepTimer = null;
    this.watchdog = null;
  }

  private reset() {
    this.clearTimers();
    if (this.clipActive) this.player?.pause();
    this.clipActive = false;
    this.page = null;
    this.interrupt = null;
    this.progress.set(0);
    this.setState({ activeSection: null, running: false });
  }
}
