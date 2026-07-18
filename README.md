<!-- 🇬🇧 English · [🇫🇷 Français](README.fr.md) -->

# Hermes Pocket

**A clean, lightweight mobile & desktop client for [Hermes Agent](https://github.com/NousResearch/hermes-agent).**

Hermes Agent is great, but its web UI is a terminal — not ideal on a phone: copy‑paste is painful and you can't attach a photo or a document. **Hermes Pocket** is an installable **PWA** that connects to the Hermes API and gives you a real chat experience:

- 💬 **Smooth chat** with native copy‑paste (iOS, Android, macOS, Windows)
- 📷 **Photos & images** — from the camera roll or the camera, sent to Hermes as vision input
- 📎 **Documents** — PDF, Word, txt, code… : text is extracted *in the browser* and injected into the message
- 🔴 **Streaming replies** (token by token) with a live tool‑progress indicator
- 🗂️ **Multiple conversations**, stored locally on the device
- 📱 **Installable**: "Add to Home Screen" → opens full‑screen like a native app
- 🔒 **Fully private**: self‑hosted, the API key stays server‑side

> One code file per role, nothing to compile. Works with **any Hermes Agent instance**, not just yours.

---

## Table of contents

1. [How it works](#how-it-works)
2. [Prerequisite: enable the Hermes API](#1-prerequisite-enable-the-hermes-api)
3. [Deploy (Docker)](#2-deploy-docker)
4. [Install the app](#3-install-the-app)
5. [Configuration](#configuration)
6. [Security](#security)
7. [Known limitations](#known-limitations)
8. [Repository layout](#repository-layout)
9. [Roadmap](#roadmap)
10. [Credits & license](#credits--license)

---

## How it works

```
┌────────────┐     HTTPS/tailnet     ┌────────────────────┐     127.0.0.1     ┌──────────────┐
│  Hermes    │ ───────────────────▶  │  nginx (this repo) │ ───────────────▶  │ Hermes Agent │
│  Pocket    │   /v1/chat/completions│  • serves the PWA  │   /v1 + Bearer    │  API server  │
│  (PWA)     │ ◀───────────────────  │  • injects the key │ ◀───────────────  │  :8642       │
└────────────┘        SSE            └────────────────────┘                   └──────────────┘
```

The PWA speaks the **OpenAI Chat Completions** format (`/v1/chat/completions`, SSE streaming) — the standard format exposed by the [Hermes API server](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server). The nginx proxy serves the static files **and** relays `/v1` to Hermes while adding the `Authorization: Bearer` header, which avoids CORS issues and **keeps the key out of the browser**.

---

## 1. Prerequisite: enable the Hermes API

The Hermes API server is **disabled by default**. On the machine running Hermes, add to `~/.hermes/.env`:

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=a-long-secret-key            # make one up
API_SERVER_HOST=0.0.0.0                      # reachable from the proxy host
API_SERVER_PORT=8642
```

Then restart the gateway:

```bash
hermes gateway
# → [API Server] API server listening on http://0.0.0.0:8642
```

Verify:

```bash
curl http://HERMES-HOST:8642/v1/models \
  -H "Authorization: Bearer a-long-secret-key"
```

> 🛡️ **Important:** the API exposes Hermes' full toolset, **including command execution**. Never expose it to the public Internet. Keep it on a private network (Tailscale, LAN) behind the key.

---

## 2. Deploy (Docker)

On any Docker host on your private network (ideally the same box as Hermes, or a neighbouring VM):

```bash
git clone https://github.com/<you>/hermes-pocket.git
cd hermes-pocket
cp .env.example .env
nano .env          # set HERMES_API, HERMES_KEY, PORT
./deploy.sh
```

`deploy.sh` renders the nginx config (with the key injected), (re)starts an `nginx:alpine` container, and tests the page:

```
✅ Hermes Pocket is live: http://<this-host>:8095/
```

> No Docker? Any static web server can serve the `web/` folder, but you'll have to handle the `/v1` relay and CORS yourself. The provided proxy is the simplest path.

---

## 3. Install the app

On your **iPhone/iPad** (Safari) or **Mac/PC**:

1. Open `http://<host>:8095/` (private network active).
2. Open **Settings** (⚙︎) and check the model (`hermes-agent` by default). Leave the URL empty (the proxy handles it).
3. **iOS**: Share → "Add to Home Screen". **macOS Safari**: Share → "Add to Dock". **Chrome**: install icon in the address bar.

The app then opens full‑screen, like a native application.

---

## Configuration

Two modes, switchable in the app (⚙︎):

| Mode | Base URL | API key | CORS |
|------|----------|---------|------|
| **Proxy (recommended)** | *(empty)* | *(empty — injected by nginx)* | not required |
| **Direct** | `http://host:8642` | your key | set `API_SERVER_CORS_ORIGINS` on Hermes |

`deploy.sh` variables (`.env` file):

| Variable | Purpose |
|----------|---------|
| `HERMES_API` | URL of the Hermes API server as seen from the proxy host |
| `HERMES_KEY` | the `API_SERVER_KEY` configured on Hermes |
| `PORT` | port Hermes Pocket is served on (default `8095`) |
| `CONTAINER` | Docker container name |

---

## Security

- The API key is injected by **nginx server‑side**: in proxy mode it never appears in the PWA.
- In direct mode, the key is stored **only on the device** (localStorage) — for personal use.
- The Hermes API can run commands: **private network required** (Tailscale/LAN), never public.
- Conversations are stored **locally** in the browser (localStorage); nothing is sent anywhere except to your Hermes.

---

## Known limitations

- **Documents = extracted text.** The Hermes API does not accept file uploads; Hermes Pocket extracts the **text** from PDF/Word/txt in the browser and injects it into the message. *Scanned* PDFs (images) therefore yield no text (OCR not included in v1).
- **Images** are sent via the vision path (base64) — requires a multimodal model on the Hermes side.
- History is kept **per device** (no cross‑device sync in v1).

---

## Repository layout

```
hermes-pocket/
├── web/                      # the PWA (static files)
│   ├── index.html            #   page structure
│   ├── styles.css            #   dark theme, layout
│   ├── app.js                #   all the logic (comments in French)
│   ├── manifest.json         #   PWA metadata
│   ├── sw.js                 #   service worker (app‑shell cache)
│   └── icons/                #   192 / 512 / apple‑touch icons
├── nginx/
│   └── default.conf.template # proxy: serves the PWA + relays /v1 (key injected)
├── deploy.sh                 # one‑container nginx deploy
├── .env.example              # variables to copy to .env
├── LICENSE                   # MIT
├── README.md                 # English (this file)
└── README.fr.md              # French
```

> Note: source‑code comments are written in French.

---

## Roadmap

- [ ] v1.1 — Upload documents to the Hermes **FILES** space (beyond text extraction)
- [ ] Local OCR for scanned PDFs
- [ ] Voice mode (speech‑to‑text / text‑to‑speech)
- [ ] Cross‑device conversation sync
- [ ] tvOS app for TV display

Contributions welcome (issues & PRs).

---

## Credits & license

Created by **Rafael Saive** — Le Chemin Numérique — [lecheminnumerique.be](https://lecheminnumerique.be) · [lcn.ac](https://lcn.ac)

Hermes Agent is a project by [Nous Research](https://github.com/NousResearch/hermes-agent) (not affiliated with this client).

Released under the **MIT** license — see [`LICENSE`](./LICENSE).
