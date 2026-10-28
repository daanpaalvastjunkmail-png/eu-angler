const CACHE='europa-angler-idle-v3.1.2';
const ASSETS=["./assembly-diagram.js", "./assembly-ui.js", "./tackle.js", "./training.js", "./save-store.js", "./release.js", "./updates.js", "./water-panels.js", "./catch-model.js", "./packing-list.js", "./catch-sort.js", "./economy.js", "./save-codec.js", "./rig-presets.js", "./session-rods-ui.js", "./i18n.js", "./i18n-data.js", "./session-planner.js", "./game-view.js", "./fishing-scene.js", "./inline-catches.js", "./forecast.js", "./angling-visuals.js", "./angling-ui.js", "./bite-audio.js", "./journal.js", "./session-ui.js", "./art.js", "./data.js", "./engine.js", "./visuals.js", "./index.html", "./style.css", "./app.js", "./icon.svg", "./icon-192.png", "./icon-512.png", "./manifest.webmanifest", "./vendor/font-0.ttf", "./vendor/font-1.ttf", "./vendor/font-2.ttf", "./vendor/font-3.ttf", "./vendor/font-4.ttf", "./vendor/font-5.ttf", "./vendor/font-6.ttf", "./vendor/font-7.ttf", "./vendor/font-8.ttf", "./vendor/fonts.css", "./vendor/DM-Sans-OFL.txt", "./vendor/Manrope-OFL.txt"];
// Cloudflare redirects /index.html to /. A cached redirected Response cannot
// satisfy a browser navigation with redirect mode "manual" (ERR_FAILED).
async function navigationResponse(response){
 if(!response?.redirected)return response;
 return new Response(await response.blob(),{status:response.status,statusText:response.statusText,headers:response.headers});
}
async function hasBrokenPredecessor(){
 try{
  for(const name of await caches.keys()){
   if(name===CACHE||!name.startsWith('europa-angler-idle-'))continue;
   const response=await(await caches.open(name)).match('./index.html');
   if(response?.redirected)return true;
  }
 }catch{}
 return false;
}
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));
 const document=await cache.match('./index.html');
 if(document?.redirected)await cache.put('./index.html',await navigationResponse(document));
 // A broken predecessor prevents opening the game to press Save & update.
 // Repair that worker automatically, without reloading tabs or touching saves.
 // Ordinary upgrades retain the existing explicit save-before-update flow.
 if(await hasBrokenPredecessor())await self.skipWaiting();
})());});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('europa-angler-idle-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function cachedResponse(request){
 try{
  const cache=await caches.open(CACHE),navigation=request.mode==='navigate';
  const response=await cache.match(navigation?'./index.html':request);
  if(response)return navigation?await navigationResponse(response):response;
 }catch{}
 return fetch(request);
}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(cachedResponse(event.request));});
