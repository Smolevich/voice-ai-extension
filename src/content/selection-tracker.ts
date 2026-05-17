let lastSelection = '';

document.addEventListener('selectionchange', () => {
  const sel = window.getSelection()?.toString() ?? '';
  if (sel.trim().length > 0) lastSelection = sel;
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'voice-ai:get-selection') {
    sendResponse({ text: lastSelection });
    return true;
  }
  return false;
});
