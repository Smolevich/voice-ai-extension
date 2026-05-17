export interface SpeakOptions {
  text: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
}

export function listVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}

export function waitForVoices(timeoutMs = 1000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = listVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const timer = window.setTimeout(() => resolve(listVoices()), timeoutMs);
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        window.clearTimeout(timer);
        resolve(listVoices());
      },
      { once: true },
    );
  });
}

export function speak({ text, voiceName, rate = 1, pitch = 1, onEnd, onError }: SpeakOptions): void {
  stop();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.pitch = pitch;
  if (voiceName) {
    const match = listVoices().find((v) => v.name === voiceName);
    if (match) utter.voice = match;
  }
  if (onEnd) utter.onend = onEnd;
  if (onError) utter.onerror = onError;
  window.speechSynthesis.speak(utter);
}

export function pause(): void {
  window.speechSynthesis.pause();
}

export function resume(): void {
  window.speechSynthesis.resume();
}

export function stop(): void {
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}
