// Country Cycles Killearn — KEEF sound utility.
//
// Plays short MP4/AAC UI sounds. Respects autoplay restrictions: nothing
// plays until the first user interaction unlocks audio. Mute preference
// persists in localStorage.
//
// Usage:
//   import { keefSound, SOUNDS } from './sound.js';
//   keefSound.unlockOnFirstGesture();
//   keefSound.play(SOUNDS.HELLO);
//   keefSound.loop(SOUNDS.LOADING); ...; keefSound.stopLoop();
//   keefSound.toggleMute();

const SOUND_BASE = 'assets/sounds/';

export const SOUNDS = {
  HELLO:    'keef_01_hello',
  QUESTION: 'keef_02_question',
  SUCCESS:  'keef_03_success',
  LOADING:  'keef_04_loading',
  TIP:      'keef_05_tip',
  UNSURE:   'keef_06_unsure',
  SCAN:     'keef_07_scan',
  STOP:     'keef_08_stop',
};

const STORAGE_KEY = 'keef-muted';

class KeefSound {
  constructor() {
    this.muted = this._loadMuted();
    this.unlocked = false;
    this._loop = null;        // currently looping HTMLAudioElement
    this._listeners = new Set();
    this._cache = new Map();  // pose -> HTMLAudioElement (preloaded)
  }

  _loadMuted() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (_) { return false; }
  }

  _saveMuted() {
    try { localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0'); } catch (_) {}
  }

  /** Subscribe to mute-state changes (returns an unsubscribe function). */
  onMuteChange(fn) {
    this._listeners.add(fn);
    fn(this.muted);
    return () => this._listeners.delete(fn);
  }

  _notify() {
    for (const fn of this._listeners) fn(this.muted);
  }

  isMuted() { return this.muted; }

  setMuted(muted) {
    const next = !!muted;
    if (next === this.muted) return;
    this.muted = next;
    this._saveMuted();
    if (this.muted) this.stopLoop();
    this._notify();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Wire the unlock to fire on the first user gesture (any tap / click /
   * keydown). iOS requires audio playback to start inside a user-gesture
   * handler; once that happens, subsequent plays are allowed.
   */
  unlockOnFirstGesture() {
    if (this.unlocked) return;
    const handler = () => this._unlock();
    const opts = { once: true, passive: true };
    document.addEventListener('pointerdown', handler, opts);
    document.addEventListener('keydown', handler, opts);
    document.addEventListener('touchstart', handler, opts);
  }

  _unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    // Prime each audio element by playing it muted for one tick. iOS Safari
    // permits future plays once an Audio has been activated in a gesture.
    for (const name of Object.values(SOUNDS)) {
      const a = this._get(name);
      const wasMuted = a.muted;
      a.muted = true;
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { a.pause(); a.currentTime = 0; a.muted = wasMuted; })
         .catch(() => { a.muted = wasMuted; });
      }
    }
  }

  _get(name) {
    if (this._cache.has(name)) return this._cache.get(name);
    const a = new Audio(`${SOUND_BASE}${name}.mp4`);
    a.preload = 'auto';
    a.crossOrigin = 'anonymous';
    this._cache.set(name, a);
    return a;
  }

  /** Play a one-shot. No-op if muted or audio not yet unlocked. */
  play(name) {
    if (this.muted || !this.unlocked) return;
    const a = this._get(name);
    try { a.pause(); a.currentTime = 0; } catch (_) {}
    a.loop = false;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  /** Start a looping sound. Stops any previously running loop. */
  loop(name) {
    if (this.muted || !this.unlocked) return;
    this.stopLoop();
    const a = this._get(name);
    a.loop = true;
    a.currentTime = 0;
    this._loop = a;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  stopLoop() {
    if (!this._loop) return;
    try {
      this._loop.pause();
      this._loop.loop = false;
      this._loop.currentTime = 0;
    } catch (_) {}
    this._loop = null;
  }
}

export const keefSound = new KeefSound();
