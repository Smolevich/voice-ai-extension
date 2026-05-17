import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'Voice AI — TTS Extension',
  short_name: 'Voice AI',
  version: pkg.version,
  description:
    'Read selected text aloud. Free with built-in browser voices, or bring your own Groq API key for premium-quality voices.',
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Voice AI',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
  host_permissions: ['https://api.groq.com/*'],
  browser_specific_settings: {
    gecko: {
      id: 'voice-ai-extension@smolevich.com',
      strict_min_version: '121.0',
      data_collection_permissions: { required: ['none'] },
    },
  },
});
