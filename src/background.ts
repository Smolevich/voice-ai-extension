import { DEFAULTS, loadSettings } from './lib/storage';
import { synthesize as groqSynthesize } from './lib/groq';

const CONTEXT_MENU_ID = 'voice-ai-speak-selection';

function registerContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Speak selected text',
      contexts: ['selection'],
    });
  });
}

chrome.runtime.onInstalled.addListener(registerContextMenu);
chrome.runtime.onStartup.addListener(registerContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;
  const text = await resolveSelection(tab.id, info.selectionText ?? '');
  if (!text) return;
  await speakInTab(tab.id, text);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;
  if (command === 'stop-speaking') {
    await stopInTab(tab.id);
    return;
  }
  if (command !== 'speak-selection') return;
  const text = await resolveSelection(tab.id, '');
  if (!text) return;
  await speakInTab(tab.id, text);
});

async function resolveSelection(tabId: number, fallback: string): Promise<string> {
  let cached = '';
  try {
    const resp: { text?: string } | undefined = await chrome.tabs.sendMessage(tabId, {
      type: 'voice-ai:get-selection',
    });
    cached = (resp?.text ?? '').trim();
  } catch {
    // content script not present (e.g. chrome:// URL, store page, fresh install)
  }
  const fb = fallback.trim();
  if (cached.length > fb.length) return cached;
  if (fb) return fb;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection()?.toString() ?? '',
    });
    return (result.result ?? '').trim();
  } catch {
    return '';
  }
}

async function speakInTab(tabId: number, text: string): Promise<void> {
  const settings = await loadSettings();
  if (settings.provider === 'groq' && settings.groqApiKey) {
    await speakWithGroqInTab(tabId, text, settings);
    return;
  }
  await speakWithWebSpeechInTab(tabId, text, settings);
}

async function stopInTab(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      window.speechSynthesis.cancel();
      document.querySelectorAll('audio[data-voice-ai]').forEach((el) => {
        const audio = el as HTMLAudioElement;
        audio.pause();
        audio.currentTime = 0;
        audio.remove();
      });
    },
  });
}

async function speakWithWebSpeechInTab(
  tabId: number,
  text: string,
  settings: typeof DEFAULTS,
): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (t: string, voiceName: string, rate: number, pitch: number) => {
      const utter = new SpeechSynthesisUtterance(t);
      utter.rate = rate;
      utter.pitch = pitch;
      const apply = () => {
        if (voiceName) {
          const match = window.speechSynthesis.getVoices().find((v) => v.name === voiceName);
          if (match) utter.voice = match;
        }
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', apply, { once: true });
        window.setTimeout(apply, 500);
      } else {
        apply();
      }
    },
    args: [text, settings.webSpeechVoice, settings.rate, settings.pitch],
  });
}

async function speakWithGroqInTab(
  tabId: number,
  text: string,
  settings: typeof DEFAULTS,
): Promise<void> {
  const blob = await groqSynthesize({
    apiKey: settings.groqApiKey,
    text,
    voice: settings.groqVoice,
  });
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (b64: string) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.dataset.voiceAi = '1';
      document.body?.appendChild(audio);
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url);
        audio.remove();
      });
      audio.play();
    },
    args: [base64],
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
