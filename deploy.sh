#!/usr/bin/env bash
# Hermes Pocket — déploiement en un conteneur nginx.
# Usage : cp .env.example .env  &&  éditer .env  &&  ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "❌ Fichier .env manquant. Fais : cp .env.example .env puis édite-le."; exit 1; }
set -a; . ./.env; set +a

: "${HERMES_API:?HERMES_API manquant dans .env}"
: "${HERMES_KEY:?HERMES_KEY manquant dans .env}"
PORT="${PORT:-8095}"
CONTAINER="${CONTAINER:-hermes-pocket}"

echo "▸ Génération de la config nginx (clé injectée côté serveur)…"
mkdir -p .build
export HERMES_API HERMES_KEY
envsubst '${HERMES_API} ${HERMES_KEY}' < nginx/default.conf.template > .build/default.conf

echo "▸ (Re)lancement du conteneur ${CONTAINER} sur le port ${PORT}…"
docker rm -f "${CONTAINER}" 2>/dev/null || true
docker run -d --name "${CONTAINER}" --restart unless-stopped \
  -p "${PORT}:80" \
  -v "$(pwd)/web:/usr/share/nginx/html:ro" \
  -v "$(pwd)/.build/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine

echo "▸ Test…"
sleep 2
code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/" || true)
echo "   page d'accueil : HTTP ${code}"
echo "✅ Hermes Pocket en ligne : http://<cet-hôte>:${PORT}/"
echo "   Ouvre-le sur ton tailnet, puis 'Ajouter à l'écran d'accueil'."
