import { loadSettings, saveSettings, type Settings, type Provider } from '../lib/storage';
import * as webSpeech from '../lib/web-speech';
import * as groq from '../lib/groq';
import * as audio from '../lib/audio';
import { Combobox, type ComboboxItem } from './combobox';

type PlaybackState = 'idle' | 'playing' | 'paused';

const els = {
  provider: document.getElementById('provider') as HTMLSelectElement,
  voiceInput: document.getElementById('voice-input') as HTMLInputElement,
  voiceList: document.getElementById('voice-list') as HTMLUListElement,
  text: document.getElementById('text') as HTMLTextAreaElement,
  getSelection: document.getElementById('get-selection') as HTMLButtonElement,
  rate: document.getElementById('rate') as HTMLInputElement,
  rateVal: document.getElementById('rate-val') as HTMLSpanElement,
  pitch: document.getElementById('pitch') as HTMLInputElement,
  pitchVal: document.getElementById('pitch-val') as HTMLSpanElement,
  speak: document.getElementById('speak') as HTMLButtonElement,
  pause: document.getElementById('pause') as HTMLButtonElement,
  stop: document.getElementById('stop') as HTMLButtonElement,
  openOptions: document.getElementById('open-options') as HTMLButtonElement,
  status: document.getElementById('status') as HTMLDivElement,
};

let settings: Settings;
let state: PlaybackState = 'idle';

const voiceCombo = new Combobox({
  input: els.voiceInput,
  list: els.voiceList,
  onChange: async (value) => {
    if (settings.provider === 'web-speech') {
      settings.webSpeechVoice = value;
      await saveSettings({ webSpeechVoice: value });
    } else {
      settings.groqVoice = value;
      await saveSettings({ groqVoice: value });
    }
  },
});

init();

async function init() {
  settings = await loadSettings();
  els.provider.value = settings.provider;
  els.rate.value = String(settings.rate);
  els.pitch.value = String(settings.pitch);
  els.rateVal.textContent = settings.rate.toFixed(1);
  els.pitchVal.textContent = settings.pitch.toFixed(1);

  await populateVoices();
  attachListeners();
}

async function populateVoices() {
  if (settings.provider === 'web-speech') {
    const voices = await webSpeech.waitForVoices();
    const items: ComboboxItem[] = voices.map((v) => ({
      value: v.name,
      label: v.name,
      hint: v.lang + (v.default ? ' · default' : ''),
    }));
    voiceCombo.setItems(items);
    const initial = settings.webSpeechVoice || voices.find((v) => v.default)?.name || voices[0]?.name || '';
    voiceCombo.setValue(initial);
    if (initial && initial !== settings.webSpeechVoice) {
      settings.webSpeechVoice = initial;
      await saveSettings({ webSpeechVoice: initial });
    }
  } else {
    const items: ComboboxItem[] = groq.GROQ_VOICES.map((v) => ({ value: v, label: v }));
    voiceCombo.setItems(items);
    voiceCombo.setValue(settings.groqVoice || groq.GROQ_VOICES[0]);
  }
}

function attachListeners() {
  els.provider.addEventListener('change', async () => {
    settings.provider = els.provider.value as Provider;
    await saveSettings({ provider: settings.provider });
    await populateVoices();
  });

  els.rate.addEventListener('input', () => {
    const v = parseFloat(els.rate.value);
    els.rateVal.textContent = v.toFixed(1);
    settings.rate = v;
    saveSettings({ rate: v });
  });

  els.pitch.addEventListener('input', () => {
    const v = parseFloat(els.pitch.value);
    els.pitchVal.textContent = v.toFixed(1);
    settings.pitch = v;
    saveSettings({ pitch: v });
  });

  els.getSelection.addEventListener('click', loadSelectionFromTab);
  els.speak.addEventListener('click', onSpeak);
  els.pause.addEventListener('click', onPause);
  els.stop.addEventListener('click', onStop);
  els.openOptions.addEventListener('click', () => chrome.runtime.openOptionsPage());
}

async function loadSelectionFromTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? '',
    });
    if (result.result) {
      els.text.value = result.result;
      setStatus('');
    } else {
      setStatus('No text selected on this tab.', false);
    }
  } catch (err) {
    setStatus(`Cannot read selection: ${(err as Error).message}`, true);
  }
}

async function onSpeak() {
  const text = els.text.value.trim();
  if (!text) {
    setStatus('Enter or select text first.', true);
    return;
  }

  setUiState('playing');
  setStatus('Speaking...');

  const voice = voiceCombo.getValue();

  if (settings.provider === 'web-speech') {
    webSpeech.speak({
      text,
      voiceName: voice,
      rate: settings.rate,
      pitch: settings.pitch,
      onEnd: () => onFinished(),
      onError: (e) => onFinished(`Speech error: ${e.error}`),
    });
    return;
  }

  if (!settings.groqApiKey) {
    setUiState('idle');
    setStatus('Add your Groq API key in settings to use this provider.', true);
    return;
  }

  try {
    const blob = await groq.synthesize({
      apiKey: settings.groqApiKey,
      text,
      voice,
      speed: settings.rate,
    });
    audio.play(blob, {
      onEnded: () => onFinished(),
      onError: (e) => onFinished(`Playback error: ${String(e)}`),
    });
  } catch (err) {
    onFinished((err as Error).message);
  }
}

function onPause() {
  if (state !== 'playing') return;
  if (settings.provider === 'web-speech') webSpeech.pause();
  else audio.pause();
  setUiState('paused');
}

function onStop() {
  if (settings.provider === 'web-speech') webSpeech.stop();
  else audio.stop();
  setUiState('idle');
  setStatus('');
}

function onFinished(error?: string) {
  setUiState('idle');
  if (error) setStatus(error, true);
  else setStatus('');
}

function setUiState(next: PlaybackState) {
  state = next;
  els.speak.disabled = next === 'playing';
  els.pause.disabled = next !== 'playing';
  els.stop.disabled = next === 'idle';

  if (next === 'paused') {
    els.pause.textContent = 'Resume';
    els.pause.disabled = false;
    els.pause.onclick = () => {
      if (settings.provider === 'web-speech') webSpeech.resume();
      else audio.resume();
      setUiState('playing');
      els.pause.textContent = 'Pause';
      els.pause.onclick = onPause;
    };
  } else {
    els.pause.textContent = 'Pause';
    els.pause.onclick = onPause;
  }
}

function setStatus(text: string, isError = false) {
  els.status.textContent = text;
  els.status.classList.toggle('error', isError);
}
