import {APP_VERSION} from './release.js';
export function setupUpdates(game,{ready=()=>{},error=()=>{},reload=()=>location.reload()}={}){
 let registration=null,requested=false;
 const announce=()=>{if(registration?.waiting)ready();};
 const supported='serviceWorker' in navigator&&/^https?:$/.test(location.protocol);
 const pending=supported?navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{registration=reg;announce();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')announce();});});return reg;}).catch(()=>null):Promise.resolve(null);
 if(supported)navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requested){requested=false;reload();}});
 return {version:APP_VERSION,async check(){const reg=await pending;if(!reg){error('Updates zijn beschikbaar via je vaste online speladres.');return false;}await reg.update();announce();return !!reg.waiting;},async install(){const reg=await pending;if(!reg?.waiting)return false;game.sync();if(!game.save()){error('Je voortgang kon niet worden opgeslagen. Download eerst een opslagbestand; de update is niet gestart.');return false;}requested=true;reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});return true;}};
}
