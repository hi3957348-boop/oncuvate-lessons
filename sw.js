/* 온큐베이트 리딩 PWA 서비스워커 */
const CACHE='oncuvate-v4';
const SHELL=['./app.html','./free.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;               // MQTT·CDN 등 외부는 통과
  e.respondWith(caches.match(req).then(cached=>{
    const net=fetch(req).then(res=>{ if(res&&res.status===200){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return res; }).catch(()=>cached);
    return cached||net;                                   // 캐시 우선(열어본 책 오프라인) + 백그라운드 갱신
  }));
});