import {SCHEMA_VERSION} from '../dist/tackle.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {IdleGame} from '../dist/engine.js';
import {SaveStore,SAVE_KEY,BACKUP_KEY,LEGACY_KEY} from '../dist/save-store.js';
import {memoryStorage} from './tackle-fixtures.mjs';
import {setupUpdates} from '../dist/updates.js';
const checks=[],legacyText=fs.readFileSync(new URL('./fixtures/save-2.8.1.json',import.meta.url),'utf8'),legacy=JSON.parse(legacyText),now=()=>legacy.lastAt;
{
 const storage=memoryStorage();storage.setItem(LEGACY_KEY,legacyText);const g=new IdleGame({storage,now});assert(!g.store.blocked);assert.equal(g.state.schemaVersion,SCHEMA_VERSION);for(const k of ['money','xp','craftXp','net','sessions','records','permits','catchChoices','estate','stats'])assert.deepEqual(g.state[k],legacy[k],k);for(const [id,n]of Object.entries(legacy.stock))assert.equal(g.state.stock[id],n);assert.equal(g.state.session.remaining,legacy.session.remaining);assert.deepEqual(g.state.session.fish,legacy.session.fish);assert.equal(g.state.session.rods.length,2);assert(g.state.session.loadout.rods.every(r=>g.state.rodPresets.some(p=>p.id===r.sourcePresetId&&p.assembled)));assert(g.state.rodPresets.some(p=>p.name==='Alternate maize'&&!p.assembled));assert.equal(g.state.gear.feeder_rod_field,2);assert(g.state.gear.line_field>=4);assert.equal(storage.getItem(LEGACY_KEY),legacyText);assert(storage.getItem(SAVE_KEY));const count=g.state.tackleItems.length;g.save();const again=new IdleGame({storage,now});assert.equal(again.state.tackleItems.length,count);assert.deepEqual(again.state.tackleItems,g.state.tackleItems);
 storage.setItem(LEGACY_KEY,JSON.stringify({...legacy,money:1}));const afterOldTab=new IdleGame({storage,now});assert.equal(afterOldTab.state.money,legacy.money);
 checks.push('A fixed real 2.8.1 save migrates active two-rod fishing, all money/XP/catches/permits/property and alternatives without duplication; old-tab writes cannot overwrite the stable key');
}
{
 const storage=memoryStorage(),g=new IdleGame({storage,now});g.state.money=123.45;g.save();const good=storage.getItem(SAVE_KEY);g.state.money=234.56;g.save();assert.equal(storage.getItem(BACKUP_KEY),good);storage.setItem(SAVE_KEY,'{damaged');const recovered=new IdleGame({storage,now});assert.equal(recovered.state.money,123.45);assert(recovered.store.recoveryUsed);assert.equal(storage.getItem(BACKUP_KEY),good);
 const newer=JSON.stringify({...recovered.state,schemaVersion:99});storage.setItem(SAVE_KEY,newer);const oldApp=new IdleGame({storage,now});assert(oldApp.store.blocked);assert.equal(oldApp.store.error,'NEWER_SAVE');assert.equal(storage.getItem(SAVE_KEY),newer);assert.equal(oldApp.save(),false);assert.equal(oldApp.exportSave(),newer);assert(!oldApp.quote().valid);const before=oldApp.state.lastAt;oldApp.advanceTo(now()+600000);assert.equal(oldApp.state.lastAt,before);
 checks.push('Rolling backup recovers a damaged save; future schemas are protected from reset, simulation and overwrite and can be exported intact');
}
{
 const storage=memoryStorage();storage.setItem(SAVE_KEY,'{broken');storage.setItem(BACKUP_KEY,'bad');const g=new IdleGame({storage,now});assert(g.store.blocked);assert.equal(storage.getItem(SAVE_KEY),'{broken');assert.equal(storage.getItem(BACKUP_KEY),'bad');assert(g.importSave(legacyText).ok);assert(!g.store.blocked);assert.equal(g.state.money,legacy.money);assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).schemaVersion,SCHEMA_VERSION);
 const conflict=JSON.parse(g.exportSave()).save;conflict.rodPresets[1].items.line=conflict.rodPresets[0].items.line;const current=g.state.money;assert(!g.importSave(JSON.stringify(conflict)).ok);assert.equal(g.state.money,current);
 checks.push('Unreadable saves never become a new persisted game; explicit valid imports recover them and conflicting component reservations are rejected');
}
{
 const storage=memoryStorage(),first=new IdleGame({storage,now}),second=new IdleGame({storage,now});second.state.money=765.43;assert(second.save());first.state.money=1;assert(!first.save());assert(first.store.blocked);assert.equal(first.store.error,'OTHER_TAB');assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).money,765.43);
 checks.push('A stale tab cannot overwrite progress saved by another tab');
}
{
 const storage=memoryStorage(),g=new IdleGame({storage,now});g.state.money=456.78;g.save();const good=storage.getItem(SAVE_KEY),set=storage.setItem;storage.setItem=(k,v)=>{if(k===SAVE_KEY&&storage.getItem(BACKUP_KEY))throw Error('QuotaExceededError');set(k,v);};g.state.money=567.89;assert(g.save());assert.equal(storage.getItem(BACKUP_KEY),null);assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).money,567.89);
 storage.setItem=()=>{throw Error('QuotaExceededError');};const retained=storage.getItem(SAVE_KEY),oldState=g.state;assert(!g.importSave(legacyText).ok);assert.equal(g.state,oldState);assert.equal(storage.getItem(SAVE_KEY),retained);g.state.money++;assert(!g.save());assert.equal(storage.getItem(SAVE_KEY),retained);
 checks.push('Quota pressure drops only the disposable backup; failed imports and failed primary writes retain the previous save and live game');
}
{
 const events={},workerEvents={},log=[];let waiting={postMessage:m=>log.push(m.type)},allowed=true,ready=0,reloaded=0;const reg={get waiting(){return waiting},installing:{state:'installing',addEventListener:(n,f)=>workerEvents[n]=f},addEventListener:(n,f)=>events['reg:'+n]=f,update:async()=>log.push('check')};Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{register:async(path,options)=>{assert.equal(path,'./sw.js');assert.equal(options.updateViaCache,'none');return reg;},addEventListener:(n,f)=>events[n]=f}}});globalThis.location={protocol:'https:'};const updates=setupUpdates({sync:()=>log.push('sync'),save:()=>{log.push('save');return allowed;}},{ready:()=>ready++,error:m=>log.push('error'),reload:()=>reloaded++});await updates.check();assert(ready>0);events.controllerchange();assert.equal(reloaded,0);allowed=false;assert(!await updates.install());assert(!log.includes('ACTIVATE_UPDATE'));allowed=true;assert(await updates.install());assert.deepEqual(log.slice(-3),['sync','save','ACTIVATE_UPDATE']);events.controllerchange();assert.equal(reloaded,1);events.controllerchange();assert.equal(reloaded,1);waiting=null;assert(!await updates.install());
 checks.push('Update activation requires a successful save; failed storage blocks activation and reload occurs only after an explicitly requested update');
}
{
 const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),handlers={},logs=[];const cache={addAll:async assets=>{assert(assets.length>30);assert(assets.every(a=>a.cache==='reload'));},match:async()=>null};const context={self:{addEventListener:(n,f)=>handlers[n]=f,skipWaiting:()=>logs.push('activate'),clients:{claim:async()=>logs.push('claim')},location:{origin:'https://example.pages.dev'}},caches:{open:async()=>cache,keys:async()=>['europa-angler-idle-old','unrelated'],delete:async k=>logs.push(k)},Request:class{constructor(url,options){this.url=url;Object.assign(this,options);}},URL,fetch:async()=>({})};vm.runInNewContext(source,context);let work;handlers.install({waitUntil:p=>work=p});await work;assert(!logs.includes('activate'));handlers.message({data:{type:'ACTIVATE_UPDATE'}});assert(logs.includes('activate'));handlers.activate({waitUntil:p=>work=p});await work;assert(logs.includes('europa-angler-idle-old'));assert(!logs.includes('unrelated'));assert(!source.includes('localStorage'));
 checks.push('Service worker precaches a coherent version, waits for activation, removes only old app caches and never touches browser save storage');
}
{
 const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 const redirectedDocument=()=>{
  const response=new Response('<main>Saved fishing game</main>',{status:200,statusText:'OK',headers:{'Content-Type':'text/html','X-Release':'previous'}});
  Object.defineProperty(response,'redirected',{value:true});
  return response;
 };
 for(const brokenPredecessor of [false,true]){
  const handlers={},opened=[],logs=[];let stored=null;
  const current={addAll:async()=>{},match:async()=>stored?stored.clone():redirectedDocument(),put:async(key,response)=>{assert.equal(key,'./index.html');stored=response;}};
  const previous={match:async()=>brokenPredecessor?redirectedDocument():new Response('Working old game')};
  const context={self:{addEventListener:(name,handler)=>handlers[name]=handler,skipWaiting:async()=>logs.push('activate'),clients:{claim:async()=>logs.push('claim')},location:{origin:'https://angler.example'}},caches:{open:async name=>{opened.push(name);return name==='europa-angler-idle-previous'?previous:current;},keys:async()=>['unrelated-cache','europa-angler-idle-previous'],delete:async()=>{}},Request:class{constructor(url,options){this.url=url;Object.assign(this,options);}},Response,URL,fetch:async()=>{throw Error('offline');}};
  vm.runInNewContext(source,context);let installed;
  handlers.install({waitUntil:promise=>installed=promise});await installed;
  assert.equal(stored.redirected,false);assert.equal(stored.status,200);assert.equal(stored.headers.get('Content-Type'),'text/html');assert.equal(await stored.clone().text(),'<main>Saved fishing game</main>');
  assert.equal(logs.includes('activate'),brokenPredecessor);assert(!logs.includes('claim'));assert(!opened.includes('unrelated-cache'));
  let served;handlers.fetch({request:{url:'https://angler.example/',method:'GET',mode:'navigate',redirect:'manual'},respondWith:promise=>served=promise});
  const document=await served;assert.equal(document.redirected,false);assert.equal(document.headers.get('X-Release'),'previous');assert.equal(await document.text(),'<main>Saved fishing game</main>');
 }
 checks.push('Cloudflare-style redirected documents become navigation-safe offline pages; only a broken older app cache triggers automatic worker repair, without claiming or reloading tabs during install');
}
{
 const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),handlers={},network=[];let failCache=false;
 const context={self:{addEventListener:(name,handler)=>handlers[name]=handler,location:{origin:'https://angler.example'}},caches:{open:async()=>{if(failCache)throw Error('Cache unavailable');return{match:async()=>{const response=new Response('Recovered cached game',{headers:{'Content-Type':'text/html'}});Object.defineProperty(response,'redirected',{value:true});return response;}};}},Response,URL,fetch:async request=>{network.push(request.url);return new Response('Live response');}};
 vm.runInNewContext(source,context);
 async function request(mode,url){let served;handlers.fetch({request:{url,mode,method:'GET',redirect:'manual'},respondWith:promise=>served=promise});return served;}
 const cached=await request('navigate','https://angler.example/');assert.equal(cached.redirected,false);assert.equal(await cached.text(),'Recovered cached game');assert.equal(network.length,0);
 failCache=true;
 for(const [mode,url]of [['navigate','https://angler.example/'],['cors','https://angler.example/style.css']])assert.equal(await(await request(mode,url)).text(),'Live response');
 assert.deepEqual(network,['https://angler.example/','https://angler.example/style.css']);
 assert.equal(await request('cors','https://other.example/asset.js'),undefined);
 checks.push('Navigation also repairs an already-cached redirected response; unavailable cache storage falls back to the network for pages and assets, without intercepting other origins');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));

// Account data must never fall back to a cached app shell or enter offline caches.
{
 const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),handlers={};
 const context={self:{addEventListener:(name,handler)=>handlers[name]=handler,location:{origin:'https://angler.example'}},URL};
 vm.runInNewContext(source,context);
 for(const url of ['/api/accounts/me','/api/accounts/save','/api/leaderboard?metric=xp']){
  for(const mode of ['navigate','cors']){
   let intercepted=false;handlers.fetch({request:{url:'https://angler.example'+url,method:'GET',mode},respondWith:()=>intercepted=true});
   assert.equal(intercepted,false,'The service worker must leave account APIs to the network');
  }
 }
 console.log('PASS: account and leaderboard APIs bypass offline service-worker routing');
}
