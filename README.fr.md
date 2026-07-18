<!-- 🇫🇷 Français · [🇬🇧 English](README.md) -->

# Hermes Pocket

**Un client mobile & desktop, propre et léger, pour [Hermes Agent](https://github.com/NousResearch/hermes-agent).**

Hermes Agent est génial, mais son interface web est un terminal — pas idéal sur téléphone : copier-coller pénible, impossible de joindre une photo ou un document. **Hermes Pocket** est une **PWA** (application web installable) qui se branche sur l'API de Hermes et offre une vraie expérience de chat :

- 💬 **Chat fluide** avec copier-coller natif (iOS, Android, macOS, Windows)
- 📷 **Photos & images** — depuis la pellicule ou l'appareil photo, envoyées à Hermes en vision
- 📎 **Documents** — PDF, Word, txt, code… : le texte est extrait *dans le navigateur* et injecté dans le message
- 🔴 **Réponses en streaming** (token par token) avec indicateur d'outils en cours
- 🗂️ **Conversations multiples**, sauvegardées localement sur l'appareil
- 📱 **Installable** : « Ajouter à l'écran d'accueil » → s'ouvre en plein écran comme une app native
- 🔒 **100 % privé** : se déploie chez toi, la clé API reste côté serveur

> Un seul fichier de code par rôle, aucune dépendance à compiler. Fonctionne avec **n'importe quelle instance Hermes Agent**.

---

## Comment ça marche

```
┌────────────┐     HTTPS/tailnet     ┌────────────────────┐     127.0.0.1     ┌──────────────┐
│  Hermes    │ ───────────────────▶  │  nginx (ce projet) │ ───────────────▶  │ Hermes Agent │
│  Pocket    │   /v1/chat/completions│  • sert la PWA     │   /v1 + Bearer    │  API server  │
│  (PWA)     │ ◀───────────────────  │  • injecte la clé  │ ◀───────────────  │  :8642       │
└────────────┘        SSE            └────────────────────┘                   └──────────────┘
```

La PWA parle le format **OpenAI Chat Completions** (`/v1/chat/completions`, streaming SSE) — le format standard exposé par l'[API server de Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server). Le proxy nginx sert les fichiers statiques **et** relaie `/v1` vers Hermes en ajoutant l'en-tête `Authorization: Bearer`, ce qui évite le CORS et **garde la clé hors du navigateur**.

---

## 1. Prérequis : activer l'API de Hermes

L'API server de Hermes est **désactivée par défaut**. Sur la machine où tourne Hermes, ajoute à `~/.hermes/.env` :

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=une-cle-longue-et-secrete     # invente-la
API_SERVER_HOST=0.0.0.0                       # joignable depuis l'hôte du proxy
API_SERVER_PORT=8642
```

Puis relance la passerelle :

```bash
hermes gateway
# → [API Server] API server listening on http://0.0.0.0:8642
```

Vérifie :

```bash
curl http://ADRESSE-HERMES:8642/v1/models \
  -H "Authorization: Bearer une-cle-longue-et-secrete"
```

> 🛡️ L'API donne accès à tout l'outillage de Hermes, **y compris l'exécution de commandes**. Ne l'expose **jamais** sur Internet — réseau privé (Tailscale/LAN) + clé uniquement.

---

## 2. Déploiement (Docker)

```bash
git clone https://github.com/<toi>/hermes-pocket.git
cd hermes-pocket
cp .env.example .env
nano .env          # HERMES_API, HERMES_KEY, PORT
./deploy.sh
```

`deploy.sh` génère la config nginx (clé injectée), (re)lance un conteneur `nginx:alpine`, teste la page, et affiche :

```
✅ Hermes Pocket en ligne : http://<cet-hôte>:8095/
```

---

## 3. Installer l'app

Sur **iPhone/iPad** (Safari) ou **Mac/PC** :

1. Ouvre `http://<hôte>:8095/` (réseau privé actif).
2. **Réglages** (⚙︎) : vérifie le modèle (`hermes-agent`). Laisse l'URL vide (proxy).
3. **iOS** : Partager → « Sur l'écran d'accueil ». **macOS Safari** : Partager → « Ajouter au Dock ». **Chrome** : icône d'installation.

---

## Configuration

| Mode | URL de base | Clé API | CORS |
|------|-------------|---------|------|
| **Proxy (recommandé)** | *(vide)* | *(vide — injectée par nginx)* | non requis |
| **Direct** | `http://hote:8642` | ta clé | définir `API_SERVER_CORS_ORIGINS` côté Hermes |

Variables `.env` : `HERMES_API`, `HERMES_KEY`, `PORT` (défaut `8095`), `CONTAINER`.

---

## Sécurité

- Clé injectée par **nginx** : en mode proxy elle n'est jamais dans la PWA.
- Mode direct : clé stockée **sur l'appareil** uniquement (localStorage).
- API Hermes = exécution de commandes → **réseau privé obligatoire**.
- Conversations stockées **en local** dans le navigateur.

---

## Limitations connues

- **Documents = texte extrait** côté navigateur (PDF/Word/txt). Les PDF scannés (images) ne donnent pas de texte (pas d'OCR en v1).
- **Images** via la voie vision (base64) → modèle multimodal requis côté Hermes.
- Historique **par appareil** (pas de synchro en v1).

---

## Structure du dépôt

```
hermes-pocket/
├── web/                      # la PWA (statique)
│   ├── index.html            #   structure
│   ├── styles.css            #   thème sombre
│   ├── app.js                #   logique (commentée en français)
│   ├── manifest.json  sw.js  #   PWA + service worker
│   └── icons/                #   192 / 512 / apple-touch
├── nginx/default.conf.template  # proxy : sert la PWA + relaie /v1
├── deploy.sh                 # déploiement conteneur nginx
├── .env.example              # variables → .env
├── LICENSE                   # MIT
└── README.md / README.fr.md
```

---

## Feuille de route

- [ ] v1.1 — Upload de documents vers l'espace **FILES** de Hermes
- [ ] OCR local (PDF scannés)
- [ ] Mode vocal (dictée / synthèse)
- [ ] Synchro des conversations entre appareils
- [ ] App tvOS

---

## Crédits & licence

Créé par **Rafael Saive** — [Le Chemin Numérique ASBL](https://lcn.ac) (`lcn.ac`).
Hermes Agent est un projet de [Nous Research](https://github.com/NousResearch/hermes-agent) (non affilié).
Licence **MIT** — voir [`LICENSE`](./LICENSE).
