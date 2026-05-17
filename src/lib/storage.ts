export type Provider = 'web-speech' | 'groq';

export interface Settings {
  provider: Provider;
  groqApiKey: string;
  groqVoice: string;
  webSpeechVoice: string;
  rate: number;
  pitch: number;
}

export const DEFAULTS: Settings = {
  provider: 'web-speech',
  groqApiKey: '',
  groqVoice: 'Fritz-PlayAI',
  webSpeechVoice: '',
  rate: 1,
  pitch: 1,
};

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return stored as Settings;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch);
}
