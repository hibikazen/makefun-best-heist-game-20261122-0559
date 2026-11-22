// Tiny sound effects with the Web Audio API: no audio files, no network.
// A soft blip for loot, a rising tick while the alarm climbs, a sting when
// caught, and a short arpeggio for the getaway. Muted until the player
// interacts, as browsers require.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ac.currentTime + when);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + dur + 0.02);
}

export function sfxPickup() {
  tone(660, 0.12, 'sine', 0.09);
  tone(990, 0.18, 'sine', 0.08, 0.09);
}

export function sfxAlarmTick() {
  tone(220, 0.07, 'square', 0.03);
}

export function sfxSpotted() {
  tone(180, 0.25, 'sawtooth', 0.07);
  tone(140, 0.3, 'sawtooth', 0.07, 0.12);
}

export function sfxCaught() {
  tone(160, 0.4, 'sawtooth', 0.09);
  tone(90, 0.6, 'sawtooth', 0.09, 0.15);
}

export function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.11));
}

export function sfxTool() {
  tone(440, 0.1, 'triangle', 0.07);
  tone(330, 0.14, 'triangle', 0.06, 0.07);
}
