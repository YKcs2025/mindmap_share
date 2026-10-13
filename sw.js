// オフラインでも開けるようにするための Service Worker
// アプリ本体を更新したら VERSION を変えると、次回起動時に新しい版に入れ替わります。
const VERSION = 'mindmap-v6';
const APP = ['./', './index.html', './mindmap.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  // ネット優先（最新版を取得）→ 失敗したらキャッシュ（オフライン時）
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./mindmap.html')))
  );
});
