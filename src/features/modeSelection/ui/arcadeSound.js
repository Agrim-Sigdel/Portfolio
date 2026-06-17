/*
 * arcadeSound: a tiny Web Audio "arcade UI" sound kit for the ModeSelector.
 *
 * No audio assets — every sound is synthesized on the fly with oscillators, so
 * there's nothing to load and nothing to bundle. A single shared AudioContext is
 * created lazily on first use (browsers block audio before a user gesture, and
 * the first hover/keypress is a gesture, so this is safe).
 *
 * Mute state is persisted to localStorage so it survives reloads.
 */

const MUTE_KEY = 'ms-sound-muted';

let ctx = null;
let muted = readMuted();

function readMuted() {
  // Muted by default — sound only plays once the visitor opts in. We only treat
  // it as unmuted when they've explicitly stored that choice.
  try {
    return localStorage.getItem(MUTE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(next) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

function getCtx() {
  if (muted) return null;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // browsers may auto-suspend the context; resume on the gesture that triggered us
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/*
 * Core voice: a single oscillator with an exponential gain envelope. `slideTo`
 * lets a tone glide in pitch (used for the launch whoosh).
 */
function tone({ freq, type = 'sine', dur = 0.12, gain = 0.08, slideTo = null, delay = 0 }) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;

  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);

  // quick attack, smooth decay — keeps clicks from popping
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/* ----------------------------------------------------------- public sounds */

// soft blip when a card becomes highlighted
export function playHover() {
  tone({ freq: 520, type: 'triangle', dur: 0.09, gain: 0.05 });
}

// short tick fired repeatedly while the launch ring is charging.
// `progress` (0..1) raises the pitch so it audibly "fills up".
export function playChargeTick(progress = 0) {
  tone({ freq: 380 + progress * 520, type: 'square', dur: 0.05, gain: 0.035 });
}

// rising whoosh on launch — the "dive into the portal" cue
export function playLaunch() {
  tone({ freq: 220, type: 'sawtooth', dur: 0.6, gain: 0.09, slideTo: 1400 });
  tone({ freq: 660, type: 'sine', dur: 0.5, gain: 0.05, slideTo: 2200, delay: 0.05 });
}

// two-note chime when a previously-locked mode unlocks
export function playUnlock() {
  tone({ freq: 660, type: 'triangle', dur: 0.14, gain: 0.06 });
  tone({ freq: 990, type: 'triangle', dur: 0.18, gain: 0.06, delay: 0.1 });
}
