import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

const isFirefox = process.env.TARGET === 'firefox';

const background = isFirefox
  ? { scripts: ['src/background.ts'] }
  : { service_worker: 'src/background.ts', type: 'module' as const };

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
  background,
  permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
  host_permissions: ['https://api.groq.com/*'],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/selection-tracker.ts'],
      run_at: 'document_idle',
    },
  ],
  commands: {
    'speak-selection': {
      suggested_key: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S',
      },
      description: 'Speak the currently selected text',
    },
    'stop-speaking': {
      suggested_key: {
        default: 'Ctrl+Shift+X',
        mac: 'Command+Shift+X',
      },
      description: 'Stop speaking',
    },
  },
  browser_specific_settings: {
    gecko: {
      id: 'voice-ai-extension@smolevich.com',
      strict_min_version: '121.0',
      data_collection_permissions: { required: ['none'] },
    },
  },
});
