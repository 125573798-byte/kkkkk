// Service Worker：离线缓存壳（v2，双通道）
const CACHE_NAME = 'guanjia-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  // 云同步代理请求：网络优先，不缓存
  if (url.pathname.startsWith('/dav/') || url.pathname.startsWith('/nut/')) return;
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        if (resp && resp.status === 200 && request.method === 'GET') {
          caches.open(CACHE_NAME).then(c => c.put(request, resp.clone()));
        }
        return resp;
      }).catch(() => request.mode === 'navigate' ? caches.match('/index.html') : undefined);
    })
  );
});
