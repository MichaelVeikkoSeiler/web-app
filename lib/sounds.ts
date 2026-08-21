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

const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Spielt eine Sound-Datei ab. `gain` > 1 verstärkt sie über die normale
 * Maximallautstärke hinaus (via Web-Audio-GainNode), ein Compressor
 * verhindert dabei hörbares Clipping der lautesten Stellen.
 */
function playFile(src: string, gain = 1) {
  if (typeof window === "undefined") return;
  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audioCache.set(src, audio);
    if (gain > 1) {
      const ctx = getAudioContext();
      if (ctx) {
        const source = ctx.createMediaElementSource(audio);
        const gainNode = ctx.createGain();
        gainNode.gain.value = gain;
        const compressor = ctx.createDynamicsCompressor();
        source.connect(gainNode).connect(compressor).connect(ctx.destination);
      }
    }
  }
  if (audioCtx?.state === "suspended") audioCtx.resume();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function playCorrectSound() {
  playFile("/sounds/correct.wav");
}

export function playWrongSound() {
  playFile("/sounds/incorrect.wav");
}

export function playQuizEndSound() {
  playFile("/sounds/quiz-end.wav");
}

/** Kurzes "Grab"-Geräusch für Tab-Taps. */
export function playNavTapSound() {
  playFile("/sounds/nav-tap.wav");
}

/** Ton für Plant Doc: Tab-Tap und "Neuer Fall". */
export function playPlantDocSound() {
  playFile("/sounds/plant-doc.wav", 2.4);
}

/** Ton für den Zonen-Tab. */
export function playZonenSound() {
  playFile("/sounds/zonen.wav");
}

/** Ton für den Tiere-Tab. */
export function playTiereSound() {
  playFile("/sounds/tiere.wav", 1.8);
}
