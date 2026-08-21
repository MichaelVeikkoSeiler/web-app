const audioCache = new Map<string, HTMLAudioElement>();

function playFile(src: string) {
  if (typeof window === "undefined") return;
  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audioCache.set(src, audio);
  }
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
  playFile("/sounds/plant-doc.wav");
}

/** Ton für den Zonen-Tab. */
export function playZonenSound() {
  playFile("/sounds/zonen.wav");
}

/** Ton für den Tiere-Tab. */
export function playTiereSound() {
  playFile("/sounds/tiere.wav");
}
