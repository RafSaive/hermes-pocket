/* Hermes Pocket — service worker : cache l'app-shell, jamais l'API. */
const CACHE = "hermes-pocket-v2";
const SHELL = [
  "./index.html", "./styles.css", "./app.js", "./manifest.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) =>
    Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Ne jamais mettre en cache les appels API ni les requêtes non-GET
  if (e.request.method !== "GET" || url.pathname.startsWith("/v1/")) return;
  // App-shell : cache d'abord ; le reste (CDN) : réseau puis cache de secours
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
