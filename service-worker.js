const CACHE_NAME="senapsis-shell-v1";
const SHELL=["/","/index.html"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("senapsis-shell-")&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(request);
      if(response.ok&&(request.mode==="navigate"||url.pathname.startsWith("/src/")||url.pathname==="/"))await cache.put(request,response.clone());
      return response;
    }catch{
      return await cache.match(request)||(request.mode==="navigate"?await cache.match("/index.html"):undefined)||Response.error();
    }
  })());
});
