let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export interface PlayOptions {
  onEnded?: () => void;
  onError?: (err: unknown) => void;
}

export function play(blob: Blob, opts: PlayOptions = {}): HTMLAudioElement {
  stop();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  currentUrl = url;

  audio.addEventListener('ended', () => {
    cleanup();
    opts.onEnded?.();
  });
  audio.addEventListener('error', (e) => {
    cleanup();
    opts.onError?.(e);
  });
  audio.play().catch((err) => {
    cleanup();
    opts.onError?.(err);
  });
  return audio;
}

export function pause(): void {
  currentAudio?.pause();
}

export function resume(): void {
  currentAudio?.play();
}

export function stop(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  cleanup();
}

export function isPlaying(): boolean {
  return !!currentAudio && !currentAudio.paused;
}

function cleanup(): void {
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  currentAudio = null;
}
