# Voice AI Extension — Project Instructions

## Project Overview

Public Chrome/Firefox extension for text-to-speech. Sister project to `~/pet-projects/voice-ai` (private monorepo with bot, web, backend). This repo is **public** because Chrome Web Store rules require it for an open distribution.

Goal: install → works in 2 seconds (Web Speech) → upgrade to free Groq voices in 2 minutes → optional paid premium via `voice.smolevich.com` later.

## Architecture: voice tiers

| Tier | Provider | Status |
|---|---|---|
| 1 | Web Speech API (browser-native) | shipped in v0.1.0 |
| 2 | Groq BYOK (PlayAI TTS via OpenAI-compatible endpoint) | shipped in v0.1.0 |
| 3 | Local Kokoro-82M via `kokoro-js` (opt-in, ~400MB RAM) | roadmap |
| 4 | Premium via `voice.smolevich.com` (JWT auth, server-side keys) | roadmap |

Decision rationale: see conversation that produced v0.1.0. Key constraints — code in the public repo must contain no secrets, BYOK keys live only in `chrome.storage.sync` on user device, premium tier (when built) proxies through `voice.smolevich.com` so provider keys stay server-side.

## Tech Stack

- **Build**: Vite 5 + TypeScript 5 + `@crxjs/vite-plugin` 2
- **Target**: Manifest V3 (Chrome 88+, Firefox 121+, Edge, Brave)
- **Storage**: `chrome.storage.sync` (cross-browser via the `chrome` namespace shim)
- **Audio**: native `HTMLAudioElement` for blob playback, `window.speechSynthesis` for Web Speech
- **No framework** — vanilla TS + plain HTML/CSS. Bundle size matters for Web Store review.

## Key files

```
manifest.config.ts          # Manifest V3 declaration (typed via crxjs)
vite.config.ts              # build config
src/background.ts           # service worker (context menu only)
src/popup/{index.html,main.ts,popup.css}   # toolbar popup UI
src/options/{index.html,main.ts,options.css}  # settings page
src/lib/
  web-speech.ts             # window.speechSynthesis wrapper
  groq.ts                   # Groq PlayAI TTS client
  audio.ts                  # blob playback controller
  storage.ts                # typed settings get/set
icons/icon{16,48,128}.png   # placeholder — replace before store submission
```

## Conventions

- **Commits**: authored by Stanislav Shupilkin only. **No `Co-Authored-By` lines.** No `🤖 Generated with Claude Code` footer.
- **Commit messages**: imperative, focused on the why where non-obvious. Multi-line for non-trivial changes.
- **Code style**: TypeScript strict, no `any`, no leading-underscore function names, prefer named exports.
- **No comments unless non-obvious why** — well-named code documents itself.
- **Secrets**: never. The extension's only secret-handling surface is the Groq API key, and it stays in `chrome.storage.sync`. Never log it. Never include it in error messages sent anywhere.

## Permissions policy

Manifest permissions are deliberately minimal. Before adding any new permission, check:
- Is it required for a v1 feature, or speculative?
- Will it trigger a hard review by Chrome Web Store (e.g. `<all_urls>` content scripts, `tabs`, `webRequest`)?
- Can `activeTab` + `chrome.scripting.executeScript` on user gesture replace it?

Current set: `storage`, `activeTab`, `scripting`, `contextMenus`, `host_permissions: api.groq.com`. Don't grow this without reason.

## Development workflow

```bash
npm install
npm run dev        # Vite + HMR
npm run build      # production → dist/
npm run typecheck  # tsc --noEmit
npm run zip        # build + zip dist/ for store upload
```

Load `dist/` as unpacked extension in `chrome://extensions` (Developer mode) for manual testing.

## Release process (when v0.2+ ships)

1. Bump version in `package.json` — crxjs reads it for the manifest.
2. `npm run typecheck && npm run build`
3. Manual smoke test of all flows in Chrome + Firefox.
4. `npm run zip` → `voice-ai-extension.zip`
5. Tag: `git tag v0.x.y && git push --tags`
6. Upload zip to Chrome Web Store Developer Dashboard + Firefox Add-ons.

## Out of scope for this repo

- Backend logic (proxy, billing, auth) — lives in `~/pet-projects/voice-ai/bot/`.
- Marketing site — lives in `~/pet-projects/voice-ai/web/`.
- This repo must stay self-contained: nothing here imports from the private repo, nothing references private deployment hosts.
