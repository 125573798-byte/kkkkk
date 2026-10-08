// 管家koofr PWA - 离线缓存
const CACHE='koofr-pwa-v1.0.0.2';
const ASSETS=['./','./index.html','./offline.html','./manifest.webmanifest','./icons/icon-72.png','./icons/icon-96.png','./icons/icon-128.png','./icons/icon-144.png','./icons/icon-152.png','./icons/icon-192.png','./icons/icon-384.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS.filter(u=>!u.startsWith('http'))).then(()=>self.skipWaiting()))
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.map(k=>k!==CACHE&&caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // CDN 资源：缓存优先，失败则回退到已缓存的 index（保证功能完整）
  if(url.origin!==location.origin){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(r=>r||fetch(req).then(f=>{
      c.put(req,f.clone());return f;
    })).catch(()=>c.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).catch(()=>caches.match('./offline.html'))));
});
