const CONTEXT_MENU_ID = 'voice-ai-speak-selection';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Speak selected text',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText || !tab?.id) return;
  chrome.runtime.sendMessage({
    type: 'speak-from-context-menu',
    text: info.selectionText,
  });
});
