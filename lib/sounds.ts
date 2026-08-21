let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  peakGain: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  playTone(ctx, 523.25, now, 0.14, 0.15); // C5
  playTone(ctx, 659.25, now + 0.1, 0.22, 0.15); // E5
}

export function playWrongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  playTone(ctx, 220, now, 0.18, 0.12); // A3
  playTone(ctx, 174.61, now + 0.12, 0.25, 0.12); // F3
}

let navTapAudio: HTMLAudioElement | null = null;

/** Kurzes "Grab"-Geräusch für Tab-Taps, aus einer eigenen Audiodatei. */
export function playNavTapSound() {
  if (typeof window === "undefined") return;
  if (!navTapAudio) {
    navTapAudio = new Audio("/sounds/nav-tap.wav");
  }
  navTapAudio.currentTime = 0;
  navTapAudio.play().catch(() => {});
}
