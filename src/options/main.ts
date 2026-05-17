import { loadSettings, saveSettings, type Provider } from '../lib/storage';

const els = {
  groqKey: document.getElementById('groq-key') as HTMLInputElement,
  saveGroq: document.getElementById('save-groq') as HTMLButtonElement,
  clearGroq: document.getElementById('clear-groq') as HTMLButtonElement,
  groqStatus: document.getElementById('groq-status') as HTMLParagraphElement,
  providerRadios: document.querySelectorAll<HTMLInputElement>('input[name="provider"]'),
};

init();

async function init() {
  const settings = await loadSettings();
  if (settings.groqApiKey) els.groqKey.value = settings.groqApiKey;
  for (const radio of els.providerRadios) {
    radio.checked = radio.value === settings.provider;
    radio.addEventListener('change', async () => {
      if (radio.checked) await saveSettings({ provider: radio.value as Provider });
    });
  }

  els.saveGroq.addEventListener('click', async () => {
    const key = els.groqKey.value.trim();
    await saveSettings({ groqApiKey: key });
    setStatus(els.groqStatus, key ? 'Key saved.' : 'Key cleared.', 'success');
  });

  els.clearGroq.addEventListener('click', async () => {
    els.groqKey.value = '';
    await saveSettings({ groqApiKey: '' });
    setStatus(els.groqStatus, 'Key cleared.', 'success');
  });
}

function setStatus(el: HTMLElement, msg: string, kind: 'success' | 'error') {
  el.textContent = msg;
  el.classList.remove('success', 'error');
  el.classList.add(kind);
  window.setTimeout(() => {
    el.textContent = '';
    el.classList.remove('success', 'error');
  }, 3000);
}
