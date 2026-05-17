# First Release Runbook

This is the concrete path from the current repo state to the first Chrome Web Store and Firefox AMO submissions.

## 1. Verify the extension locally

```bash
npm ci
npm run typecheck
npm run build
npm run build:firefox
npm run ff:lint
```

Chrome smoke test:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked extension from `dist/`.
4. Open any normal `https://` page, select text, and use right-click `Speak selected text`.
5. Check popup controls: speak, pause, resume, stop, rate, pitch, voice search.
6. Open options, save a dummy Groq key, switch provider to Groq, confirm the Groq UI appears.
7. Replace the dummy key with a real Groq key only for a real audio test, then remove it after testing.

Firefox smoke test:

1. Run `npm run ff:run`.
2. Use the Firefox instance opened by `web-ext`.
3. Select text on an `https://` page and test context menu, popup, and shortcuts.
4. Open `about:addons`, find the temporary Voice AI add-on, and verify permissions are understandable.
5. Run one final `npm run ff:lint`; AMO reviewers care about this output.

If `web-ext run` is inconvenient, build with `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, click `Load Temporary Add-on`, and select the file `dist-firefox/manifest.json`. Firefox does not load the folder itself in this flow, so the `dist-firefox/` directory can look disabled in the macOS file picker.

## 2. Verify the privacy page

GitHub Pages should serve:

```text
https://smolevich.github.io/voice-ai-extension/
https://smolevich.github.io/voice-ai-extension/privacy.html
```

Use the second URL in both Chrome Web Store and Firefox AMO privacy fields. The policy explicitly says the extension has no telemetry, no author-operated backend, and only contacts `api.groq.com` when the user selects Groq.

## 3. Screenshots

Current Chrome Web Store screenshots are already committed under `docs/screenshots/chrome-store/`:

```text
01-hero.png
02-voice-search.png
03-groq.png
04-settings.png
```

Regenerate both screenshot sets only if the UI changes:

```bash
npx playwright install chromium
npm run screenshots
```

The script writes Chrome Web Store screenshots to `docs/screenshots/chrome-store/`
and Firefox AMO screenshots to `docs/screenshots/amo/`. Both sets are 1280x800
PNG. The AMO set is browser-neutral and avoids Chrome-specific UI.

## 4. Cut the release

```bash
git status --short
npm run typecheck
npm run build
npm run build:firefox
npm run ff:lint
git tag v0.1.0
git push origin main --tags
gh run watch
```

The tag triggers `.github/workflows/release.yml`, which creates a GitHub Release with:

```text
voice-ai-extension-chrome-v0.1.0.zip
voice-ai-extension-firefox-v0.1.0.zip
```

Download those exact release assets for store submission. Do not upload a locally hand-zipped package unless the release workflow failed and you intentionally decide to bypass it.

## 5. Chrome Web Store

Upload page:

```text
https://chrome.google.com/webstore/devconsole
```

1. Pay the one-time Chrome Web Store developer fee if not already paid.
2. Open the Developer Dashboard and click `New item`.
3. Upload `voice-ai-extension-chrome-v0.1.0.zip`.
4. Copy listing text, single purpose, permission justifications, data disclosure answers, and privacy URL from `docs/SUBMISSION.md`.
5. Upload the four Chrome screenshots from `docs/screenshots/chrome-store/`.
6. Submit for review.

Approval notes:

- Keep the single purpose narrow: selected-text text-to-speech.
- Explain `content_scripts` clearly: selection cache only, no page modification.
- Do not imply the extension has a paid Premium tier in v0.1.0; describe it only as roadmap.
- The Groq API key is authentication info stored locally and sent only to Groq.

## 6. Firefox AMO

Upload page:

```text
https://addons.mozilla.org/developers/addon/submit/distribution
```

1. Create a new extension at AMO.
2. Upload `voice-ai-extension-firefox-v0.1.0.zip`.
3. Pick MIT license and Accessibility/Productivity category.
4. Copy AMO listing text from `docs/SUBMISSION.md`.
5. Use the same privacy URL and upload Firefox screenshots from `docs/screenshots/amo/`.
6. If AMO asks for source, provide the public GitHub tag plus this build command:

```bash
npm ci
npm run build:firefox
```

Approval notes:

- The manifest includes `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]`.
- No minified third-party runtime is manually vendored; the package is built by Vite from public source.
- Host access is limited to `https://api.groq.com/*`.

## 7. After approval

Add public store links to `README.md` and tag the release notes with the approved store versions.
