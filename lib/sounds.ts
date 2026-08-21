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

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/**
 * Kurzes "Grab"-Geräusch (~0.8s) für Tab-Taps: ein Rausch-Swoosh mit fallender
 * Filterfrequenz, gefolgt von einem dumpfen "Zupacken"-Ton.
 */
export function playNavTapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;

  const swooshDuration = 0.45;
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, swooshDuration);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(2600, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + swooshDuration);
  const swooshGain = ctx.createGain();
  swooshGain.gain.setValueAtTime(0, now);
  swooshGain.gain.linearRampToValueAtTime(0.2, now + 0.03);
  swooshGain.gain.exponentialRampToValueAtTime(0.0001, now + swooshDuration);
  noise.connect(filter).connect(swooshGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + swooshDuration + 0.02);

  const grabStart = now + swooshDuration * 0.6;
  const grabDuration = 0.5;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, grabStart);
  osc.frequency.exponentialRampToValueAtTime(90, grabStart + grabDuration);
  const grabGain = ctx.createGain();
  grabGain.gain.setValueAtTime(0, grabStart);
  grabGain.gain.linearRampToValueAtTime(0.25, grabStart + 0.02);
  grabGain.gain.exponentialRampToValueAtTime(0.0001, grabStart + grabDuration);
  osc.connect(grabGain).connect(ctx.destination);
  osc.start(grabStart);
  osc.stop(grabStart + grabDuration + 0.02);
}
