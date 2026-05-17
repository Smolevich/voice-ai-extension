const GROQ_TTS_ENDPOINT = 'https://api.groq.com/openai/v1/audio/speech';

// Orpheus replaced PlayAI as Groq's TTS family. Per-request character cap is 200.
export const GROQ_MODELS = {
  english: 'canopylabs/orpheus-v1-english',
  arabic: 'canopylabs/orpheus-arabic-saudi',
} as const;

export const GROQ_VOICES_EN = ['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy'] as const;

export const GROQ_VOICES = GROQ_VOICES_EN;

export const GROQ_CHAR_LIMIT = 200;

export type GroqVoice = (typeof GROQ_VOICES_EN)[number];

export interface SynthesizeOptions {
  apiKey: string;
  text: string;
  voice: string;
  model?: string;
}

export async function synthesize({
  apiKey,
  text,
  voice,
  model = GROQ_MODELS.english,
}: SynthesizeOptions): Promise<Blob> {
  if (text.length > GROQ_CHAR_LIMIT) {
    throw new Error(
      `Groq Orpheus accepts up to ${GROQ_CHAR_LIMIT} characters per request; got ${text.length}. Shorten the selection or switch to the Browser voice source.`,
    );
  }

  const resp = await fetch(GROQ_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: 'wav',
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Groq TTS failed (${resp.status}): ${detail || resp.statusText}`);
  }

  return await resp.blob();
}
