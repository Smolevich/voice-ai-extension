# Store Submission — Drafts and Checklist

Ready-to-paste content for Chrome Web Store, Firefox AMO, and Edge Add-ons.

---

## 💰 Costs at a glance

| Store | Dev account fee | Per-extension fee | Renewal | Notes |
|---|---|---|---|---|
| **Chrome Web Store** | **$5 one-time** | $0 | none | Single fee covers unlimited extensions on the account |
| **Firefox AMO** (addons.mozilla.org) | **Free** | $0 | none | No charges, ever |
| **Microsoft Edge Add-ons** | **Free** | $0 | none | Uses the same Chrome MV3 zip |
| **Opera Add-ons** | **Free** | $0 | none | Uses the same Chrome MV3 zip |

Other costs that may apply outside the stores:
- `voice.smolevich.com` domain — already paid as part of the parent project
- Privacy policy hosting — free (GitHub Pages from this public repo)
- Payment processor (LemonSqueezy / Paddle or similar Merchant-of-Record) — only relevant when the Premium tier ships, not for v0.1.0. MoR is preferred over Stripe to offload VAT / sales-tax compliance across jurisdictions.

Bottom line for v0.1.0 submission: **$5 total**, paid once for Chrome.

---

## ✅ Pre-submission checklist

- [ ] $5 Chrome Web Store developer fee paid
- [ ] 128×128 store icon (replace placeholder via `scripts/build-icons.sh`)
- [ ] 4 screenshots at exactly 1280×800 PNG
- [ ] Privacy policy live at `https://smolevich.github.io/voice-ai-extension/privacy.html`
- [ ] `git tag v0.1.0 && git push --tags` → grab signed zips from GitHub Releases
- [ ] Smoke-tested in Chrome
- [ ] Smoke-tested in Firefox via `npm run ff:run`

---

## 🟢 Chrome Web Store

Upload page:

```text
https://chrome.google.com/webstore/devconsole
```

Open the Developer Dashboard, click **New item**, and upload the Chrome zip from the GitHub Release:

```text
voice-ai-extension-chrome-v0.1.0.zip
```

Do not upload `dist/` directly to Chrome Web Store. `dist/` is only for local unpacked testing.

### Basic info

| Field | Value (copy-paste) |
|---|---|
| **Name** | `Voice AI — Free Text to Speech` |
| **Summary** (max 132 chars) | `Read any selected text aloud. Free browser voices built in, or bring your own Groq API key for premium AI voices.` |
| **Category** | Productivity *(alternative: Accessibility — sometimes preferred by reviewers)* |
| **Language** | English (United States) |
| **Visibility** | Public |

### Detailed description (≤ 16,000 chars)

```
Voice AI reads any text you select on the web — instantly, with no signup, no ads, and no limits.

🎙️ TWO FREE VOICE MODES

• Browser voices (default). Uses your operating system's built-in text-to-speech engine. Zero setup. Works offline. No quota. 50+ voices on macOS, 30+ on Windows.

• Premium AI voices via Groq (optional). Bring your free Groq API key and unlock 6 expressive Orpheus voices — Autumn, Diana, Hannah, Austin, Daniel, Troy. Groq's free tier currently allows 200 characters per request and 100 requests per day per account — enough to try the voices and read a few short articles daily. For heavier use, Groq offers a pay-as-you-go Dev Tier at $22 per 1M characters. Current limits and pricing: https://console.groq.com/docs/rate-limits and https://console.groq.com/settings/billing.

No subscription. No paywall. You keep the key.

🎯 MADE FOR READING

• Select any text on any page → right-click "Speak selected text", or press ⌘+Shift+S
• Pause, resume, stop at any moment
• Adjust speed (0.5×–2×) and pitch on the fly
• Search across all your installed voices by name or language

🔒 PRIVACY BY DESIGN

• Open source under MIT license: github.com/Smolevich/voice-ai-extension
• Your text never goes to our servers — only to the provider you chose
• Your Groq API key is stored locally in your browser via chrome.storage.sync. We never see it.
• Zero telemetry. Zero analytics. Zero ads.

⌨️ KEYBOARD SHORTCUTS

• ⌘+Shift+S (Ctrl+Shift+S on Windows/Linux) — speak the current selection
• ⌘+Shift+X (Ctrl+Shift+X) — stop

Both can be remapped in chrome://extensions/shortcuts.

📖 HOW TO USE

1. Install the extension.
2. Select text on any page.
3. Right-click → "Speak selected text" — or press ⌘+Shift+S.
4. (Optional) Open Settings → paste your free Groq API key (get one in 2 minutes at console.groq.com/keys) → switch the voice source to Groq in the popup.

🆓 WHAT YOU'LL PAY: NOTHING

The extension is free forever. Browser voices have no quota and no provider account is needed. Groq's free tier (200 characters/request, 100 requests/day) lets you sample premium voices and read a few short articles daily; heavier use goes through Groq's $22/1M-character Dev Tier. There is no hidden Premium subscription on our side — what you see is what you get. Groq pricing: https://console.groq.com/docs/rate-limits

A managed Premium subscription with curated voices is on the roadmap at voice.smolevich.com for users who'd rather not handle API keys themselves, but the core extension stays free. A local on-device voice option (private, offline) is also planned — note that it will involve a one-time model download and meaningful RAM usage, with quality and performance depending on browser and hardware.

📬 FEEDBACK

Issues, pull requests and feature ideas welcome at github.com/Smolevich/voice-ai-extension.
```

### Single purpose

```
Voice AI reads selected text from any web page aloud, using built-in browser voices or a user-supplied Groq API key for higher-quality text-to-speech.
```

### Permission justifications

| Permission | Justification (copy-paste verbatim) |
|---|---|
| `storage` | `Persist user settings (selected voice, speed, pitch, optional Groq API key) across browser sessions and across the user's devices via chrome.storage.sync.` |
| `activeTab` | `Read text the user has selected on the current page when they explicitly invoke the extension via popup, context menu, or keyboard shortcut.` |
| `scripting` | `Inject the speech synthesis call into the current tab so audio plays from the page context, and read window.getSelection() when the user clicks "Get selection" in the popup. Always triggered by a user gesture.` |
| `contextMenus` | `Add a "Speak selected text" item to the right-click menu when text is selected, providing the primary way users invoke the extension.` |
| `host_permissions: https://api.groq.com/*` | `Send the user's selected text to Groq's Text-to-Speech API using the user's own API key. Required only when the user has explicitly chosen Groq as the voice source.` |
| `content_scripts on http://*/*, https://*/*` | `Track the last non-empty text selection on each page so the context menu and keyboard shortcut can speak the user's full selection on macOS Chrome, where right-clicking outside the selection collapses it to a single word. The content script only reads selection; it never modifies the page.` |

### Data usage disclosure (Privacy tab)

Check the following:

| Category | Collected? | Why / How |
|---|---|---|
| Personally identifiable information | No | We do not collect any. |
| Health info | No | — |
| Financial info | No | — |
| Authentication info | **Yes** | The user's Groq API key, **stored locally on the user's device only**. Sent only to api.groq.com, the service the user authorized by creating the key. Never transmitted to us. |
| Personal communications | No | — |
| Location | No | — |
| Web history | No | — |
| User activity | No | — |
| Website content | No | The selected text is read at the moment of the click and sent only to the voice provider chosen by the user. It is never stored, logged, or transmitted to us. |

Compliance certifications (all should be checked **Yes**):
- ✅ I do not sell or transfer user data to third parties, except for the approved use cases
- ✅ I do not use or transfer user data for purposes unrelated to the item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

```
https://smolevich.github.io/voice-ai-extension/privacy.html
```

The source lives at `docs/privacy.html` and is served through GitHub Pages.

### Screenshots

Four 1280×800 PNGs live in `docs/screenshots/store/`. Order matters — the first is the marquee, shown on listing search results.

1. `01-hero.png`
2. `02-voice-search.png`
3. `03-groq.png`
4. `04-settings.png`

### Icon

128×128 PNG. Generate with `scripts/build-icons.sh path/to/icon-source.png` once a real icon exists.

### Tags / search terms

`text to speech, tts, read aloud, accessibility, speech, voice, groq, free, open source, chrome extension`

---

## 🦊 Firefox AMO (addons.mozilla.org)

Upload page:

```text
https://addons.mozilla.org/developers/addon/submit/distribution
```

Upload the Firefox zip from the GitHub Release:

```text
voice-ai-extension-firefox-v0.1.0.zip
```

For local testing in `about:debugging`, Firefox asks for a file, not a folder. Select `dist-firefox/manifest.json`; the `dist-firefox/` folder itself may be disabled in the file picker.

### Basic info

| Field | Value |
|---|---|
| **Name** | `Voice AI — Free Text to Speech` |
| **Summary** (max 250 chars) | `Read any selected text aloud, free. Uses your browser's built-in voices by default, or premium AI voices via your own Groq API key. Open source under MIT. No tracking, no ads, no sign-up.` |
| **Categories** (pick up to 2) | Accessibility · Other (or Productivity) |
| **License** | MIT |
| **Support email** | (your email) |
| **Support website** | `https://github.com/Smolevich/voice-ai-extension` |

### Detailed description

```
Voice AI reads any text you select on the web — instantly, with no signup, no ads, and no limits.

TWO FREE VOICE MODES

• Browser voices (default) — uses Firefox's built-in TTS engine and your operating system's voices. Zero setup. Works offline. No quota.

• Premium AI voices via Groq (optional) — bring your free Groq API key and unlock 6 expressive Orpheus voices (Autumn, Diana, Hannah, Austin, Daniel, Troy). Groq free tier: 200 characters/request, 100 requests/day. Pay-as-you-go Dev Tier available. Limits: https://console.groq.com/docs/rate-limits

No subscription. No paywall. You keep the key.

FEATURES

• Right-click "Speak selected text" or press Ctrl+Shift+S
• Pause, resume, stop at any moment
• Adjust speed (0.5×–2×) and pitch on the fly
• Type-to-search across all installed voices
• Customizable keyboard shortcuts via about:addons

PRIVACY

• Open source under MIT — github.com/Smolevich/voice-ai-extension
• Your text never reaches our servers, only the voice provider you select
• Your Groq API key stays in your browser via storage.sync; we never see it
• Zero telemetry, analytics, or ads

USAGE

1. Install the extension
2. Select text on any page
3. Right-click → "Speak selected text" — or press Ctrl+Shift+S
4. (Optional) Open Settings → paste your free Groq API key → switch the voice source to Groq

Issues and PRs welcome at github.com/Smolevich/voice-ai-extension.
```

### Tags

`text-to-speech`, `tts`, `read aloud`, `accessibility`, `voice`, `speech`, `groq`, `open source`

### Source code

Firefox sometimes requires source code if a reviewer can't reproduce the build from the submitted xpi. Our build is:

- Source: this Git repo at the tagged commit
- Build: `npm ci && npm run build:firefox`
- Output: `dist-firefox/`

If the reviewer asks for source: provide a `git archive --format=zip HEAD -o source-vX.Y.Z.zip` of the tagged commit, plus link to the public GitHub repo. Mention that no obfuscation is used — output is plain ES2022 chunked by Vite.

### Add-on Type

Bootstrapped extension (Manifest V3 — Firefox 121+).

---

## 🟦 Microsoft Edge Add-ons (later, optional)

Submission flow at `partner.microsoft.com/en-us/dashboard/microsoftedge/`. Use the **same Chrome zip** from the GitHub Release. Reuse Chrome metadata above. No additional fees.

---

## 🟥 Opera Add-ons (later, optional)

Submission flow at `addons.opera.com/developer/`. Also accepts the Chrome zip. No fees.

---

## 📋 Post-submission

- Chrome review: 1–3 business days first round; 1 day each resubmission
- Firefox AMO: 1–7 days depending on queue; usually 1–2 days
- Edge: 1–7 days
- Track public listings here once approved:
  - Chrome: `chrome.google.com/webstore/detail/<id>`
  - Firefox: `addons.mozilla.org/firefox/addon/voice-ai/`
  - Edge: `microsoftedge.microsoft.com/addons/detail/<id>`

Add badges to `README.md` once live.
