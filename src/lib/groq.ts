const GROQ_TTS_ENDPOINT = 'https://api.groq.com/openai/v1/audio/speech';
const GROQ_TTS_MODEL = 'playai-tts';

export const GROQ_VOICES = [
  'Arista-PlayAI',
  'Atlas-PlayAI',
  'Basil-PlayAI',
  'Briggs-PlayAI',
  'Calum-PlayAI',
  'Celeste-PlayAI',
  'Cheyenne-PlayAI',
  'Chip-PlayAI',
  'Cillian-PlayAI',
  'Deedee-PlayAI',
  'Fritz-PlayAI',
  'Gail-PlayAI',
  'Indigo-PlayAI',
  'Mamaw-PlayAI',
  'Mason-PlayAI',
  'Mikail-PlayAI',
  'Mitch-PlayAI',
  'Quinn-PlayAI',
  'Thunder-PlayAI',
] as const;

export type GroqVoice = (typeof GROQ_VOICES)[number];

export interface SynthesizeOptions {
  apiKey: string;
  text: string;
  voice: string;
  speed?: number;
}

export async function synthesize({ apiKey, text, voice, speed }: SynthesizeOptions): Promise<Blob> {
  const body: Record<string, unknown> = {
    model: GROQ_TTS_MODEL,
    voice,
    input: text,
    response_format: 'wav',
  };
  if (typeof speed === 'number' && speed !== 1) body.speed = speed;

  const resp = await fetch(GROQ_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Groq TTS failed (${resp.status}): ${detail || resp.statusText}`);
  }

  return await resp.blob();
}
