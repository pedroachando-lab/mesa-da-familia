/* Service worker: guarda a app para abrir sem rede e recebe os avisos do Firebase Cloud Messaging. */
importScripts('firebase-config.js');
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
);

const CACHE = 'mesa-familia-v1';
const SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // A própria app: rede primeiro, cópia guardada se não houver rede.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => keep(req, r)).catch(() => caches.match(req).then(r => r || caches.match('./'))));
    return;
  }
  // Bibliotecas do Firebase e tipos de letra: cópia guardada primeiro.
  if ((url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) ||
      url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => keep(req, res))));
  }
});

const cfg = self.FIREBASE_CONFIG || {};
if (cfg.apiKey && !String(cfg.apiKey).startsWith('COLE')) {
  firebase.initializeApp(cfg);
  firebase.messaging(); // mostra automaticamente as notificações enviadas com "notification"
}
