// Generate 1280x800 PNG screenshots for Chrome Web Store and Firefox AMO listings.
//
// Usage:
//   npx playwright install chromium   # one-time
//   npm run screenshots
//
// Output:
//   docs/screenshots/chrome-store/{01..04}-*.png
//   docs/screenshots/amo/{01..04}-*.png

import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distPath = path.join(root, 'dist');
const outputDirs = [
  path.join(root, 'docs/screenshots/chrome-store'),
  path.join(root, 'docs/screenshots/amo'),
];

const FRAME_W = 1280;
const FRAME_H = 800;
const POPUP_W = 360;
const POPUP_H = 560;
const WIKI_URL = 'https://en.wikipedia.org/wiki/Text-to-speech';

async function main() {
  await fs.access(path.join(distPath, 'manifest.json')).catch(() => {
    throw new Error('dist/ missing — run `npm run build` first.');
  });
  await Promise.all(outputDirs.map((outDir) => fs.mkdir(outDir, { recursive: true })));

  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: FRAME_W, height: FRAME_H },
    args: [
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
      `--window-size=${FRAME_W},${FRAME_H + 120}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--no-welcome',
      '--disable-sync',
      '--disable-signin-promo',
      '--password-store=basic',
      '--use-mock-keychain',
    ],
  });

  let sw;
  // Poll for the active service worker first, as it might register immediately
  for (let i = 0; i < 20; i++) {
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      sw = workers[0];
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (!sw) {
    try {
      sw = await context.waitForEvent('serviceworker', { timeout: 4000 });
    } catch (err) {
      const workers = context.serviceWorkers();
      if (workers.length > 0) {
        sw = workers[0];
      } else {
        throw new Error('Could not find extension service worker. Make sure the extension builds correctly.');
      }
    }
  }

  const extensionId = sw.url().split('/')[2];
  console.log('extension id:', extensionId);

  const popupUrl = `chrome-extension://${extensionId}/src/popup/index.html`;
  const optionsUrl = `chrome-extension://${extensionId}/src/options/index.html`;

  const wikiBuf = await snapWikiBackdrop(context);

  // 01-hero — default popup with sample text
  await setStorage(sw, {});
  await composeWithPopup(context, popupUrl, wikiBuf, '01-hero.png', async (popup) => {
    await popup.evaluate(() => {
      document.getElementById('text').value =
        'Speech synthesis is the artificial production of human speech.';
    });
  });

  // 02-voice-search — combobox open with filter
  await composeWithPopup(context, popupUrl, wikiBuf, '02-voice-search.png', async (popup) => {
    await popup.evaluate(() => {
      const input = document.getElementById('voice-input');
      input.focus();
      input.value = 'en';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // 03-groq — provider switched, Groq voices listed
  await setStorage(sw, {
    provider: 'groq',
    groqApiKey: 'gsk_demo_xxxxxxxxxxxxxxxxxxxx',
    groqVoice: 'diana',
  });
  await composeWithPopup(context, popupUrl, wikiBuf, '03-groq.png', async (popup) => {
    await popup.evaluate(() => {
      document.getElementById('text').value =
        'Premium Orpheus voice via your free Groq API key.';
      const input = document.getElementById('voice-input');
      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // 04-settings — standalone options page
  await setStorage(sw, {});
  const options = await context.newPage();
  await options.setViewportSize({ width: FRAME_W, height: FRAME_H });
  await options.goto(optionsUrl, { waitUntil: 'networkidle' });
  await options.waitForTimeout(300);
  const optionsBuf = await options.screenshot({
    clip: { x: 0, y: 0, width: FRAME_W, height: FRAME_H },
  });
  await writeOutputs('04-settings.png', optionsBuf);
  await options.close();

  await context.close();
  console.log('all screenshots in:');
  for (const outDir of outputDirs) console.log(' ', outDir);
}

async function snapWikiBackdrop(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: FRAME_W, height: FRAME_H });
  await page.goto(WIKI_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const p = document.querySelector('.mw-parser-output > p:not(.mw-empty-elt)');
    if (!p) return;
    const range = document.createRange();
    range.selectNodeContents(p);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.waitForTimeout(200);
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: FRAME_W, height: FRAME_H },
  });
  await page.close();
  return buf;
}

async function composeWithPopup(context, popupUrl, wikiBuf, name, prepare) {
  const popup = await context.newPage();
  await popup.setViewportSize({ width: POPUP_W, height: POPUP_H });
  await popup.goto(popupUrl, { waitUntil: 'networkidle' });
  await popup.waitForTimeout(800); // speechSynthesis voices load asynchronously
  await prepare(popup);
  await popup.waitForTimeout(300);
  const fg = await popup.screenshot();
  await popup.close();
  await compose(wikiBuf, fg, name);
}

async function setStorage(sw, patch) {
  await sw.evaluate(async (p) => {
    await chrome.storage.sync.clear();
    if (p && Object.keys(p).length) await chrome.storage.sync.set(p);
  }, patch);
}

async function compose(bgBuf, fgBuf, name) {
  const padding = 32;
  const left = FRAME_W - POPUP_W - padding;
  const top = padding;
  const out = await sharp(bgBuf)
    .composite([{ input: fgBuf, top, left, blend: 'over' }])
    .png()
    .toBuffer();
  await writeOutputs(name, out);
}

async function writeOutputs(name, buf) {
  await Promise.all(outputDirs.map((outDir) => fs.writeFile(path.join(outDir, name), buf)));
  console.log('wrote', outputDirs.map((outDir) => path.relative(root, path.join(outDir, name))).join(' and '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
