import {SAVE_KEY} from './save-store.js';
import {packSave} from './save-codec.js';
import {levelAt} from './engine.js';

export const CLOUD_LINK_KEY='europa-angler-cloud-link-v1';
export const CLOUD_RECOVERY_KEY='europa-angler-cloud-recovery-v1';
const passive=new Set(['tick','catch','level','equipment','water-panel']);
const clone=value=>JSON.parse(JSON.stringify(value));
const fault=(code,message=code)=>Object.assign(new Error(message),{code});
export function saveSummary(save){return {level:levelAt(save?.xp||0),xp:save?.xp||0,catches:save?.stats?.caught||0,bestWeight:save?.stats?.bestWeight||0,prestige:save?.legacy?.count||0,updatedAt:save?.lastAt||0};}
const summary=(s,updatedAt)=>s?{...s,bestWeight:s.bestWeight??s.biggest??0,updatedAt:updatedAt??s.updatedAt}:null;

/** Cookies remain HttpOnly. This metadata contains only ownership/revision data.
 * Cloud writes are CAS operations; local and remote branches are never merged.
 */
export class CloudSync{
 constructor(game,{fetcher=globalThis.fetch?.bind(globalThis),storage=game.storage,enabled=true,now=()=>Date.now(),onUpdate=()=>{},onAdopt=()=>{},download=()=>false,randomId=()=>globalThis.crypto.randomUUID(),requestTimeout=15000,canAdopt=()=>true}={}){
  this.game=game;this.fetcher=fetcher;this.storage=storage;this.enabled=enabled&&!!fetcher&&!!storage;this.now=now;this.onUpdate=onUpdate;this.onAdopt=onAdopt;this.download=download;this.randomId=randomId;this.requestTimeout=requestTimeout;this.canAdopt=canAdopt;
  this.epoch=0;this.operation=null;this.upload=null;this.remote=null;this.suppress=false;this.paused=false;this.recoveryDownload=null;this.needsOwnerCheck=!!(game.store.recoveryUsed||game.store.migrated);
  try{this.linkText=storage?.getItem(CLOUD_LINK_KEY)||null;this.link=this.linkText?JSON.parse(this.linkText):{};if(!this.link||typeof this.link!=='object'||Array.isArray(this.link))throw Error();}catch{this.link={};this.needsOwnerCheck=true;}
  this.model={available:this.enabled,hasRecoveryBackup:!!storage?.getItem(CLOUD_RECOVERY_KEY),status:'guest',user:null,local:saveSummary(game.state),cloud:null,conflict:null,recoveryCode:null,error:null,lastSyncedAt:null,busy:false,leaderboard:{metric:'xp',loading:false,error:null,rows:[],ownRank:null,total:0}};
  this.previousBeforeSave=game.beforeUserSave;this.previousBeforePersist=game.beforePersist;
  game.beforePersist=()=>{this.previousBeforePersist?.();if(this.pendingMarker)this.persist(this.link);};
  game.beforeUserSave=()=>{this.previousBeforeSave?.();if(!this.suppress)this.markLocalEdit();};
  this.unsubscribe=game.onChange(event=>{if(this.suppress||passive.has(event.type))return;if(this.model.user&&this.model.status==='synced'){this.model.status='pending';this.emit();}});
 }
 markLocalEdit(){this.pendingMarker=true;this.link={...this.link,edits:(this.link.edits||0)+1,played:true};try{this.persist(this.link);}catch(error){this.needsOwnerCheck=true;this.fail(error);}}
 emit(){this.model.local=saveSummary(this.game.state);this.onUpdate(this.model);}
 persist(link){if(!this.storage)throw fault('LOCAL_STORAGE','Local storage is unavailable.');const current=this.storage.getItem(CLOUD_LINK_KEY)||null;if(current!==this.linkText)throw fault('OTHER_TAB','Another tab changed this account. Reload this tab.');const text=JSON.stringify(link);this.storage.setItem(CLOUD_LINK_KEY,text);this.linkText=text;this.link=link;this.pendingMarker=false;}
 assertLocal(){if(!this.storage||this.game.store.blocked||this.storage.getItem(SAVE_KEY)!==this.game.store.last||(this.storage.getItem(CLOUD_LINK_KEY)||null)!==this.linkText)throw fault('OTHER_TAB','Your local save is protected. Reload this tab before synchronising.');}
 snapshot(){this.assertLocal();this.game.sync();if(!this.game.save())throw fault('LOCAL_STORAGE','Your progress could not be saved on this device. Download a backup first.');this.assertLocal();return {save:packSave(this.game.state),text:this.game.store.last,edit:this.link.edits||0};}
 async request(path,{method='GET',body,epoch=this.epoch}={}){
  if(!this.enabled)throw fault('UNAVAILABLE','Accounts are available at the online game address.');
  const controller=typeof AbortController==='function'?new AbortController():null;
  let timeout;
  const work=(async()=>{
   let response;try{response=await this.fetcher('/api/'+path,{method,credentials:'same-origin',cache:'no-store',signal:controller?.signal,headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});}
   catch{if(epoch!==this.epoch)throw fault('STALE_REQUEST');throw fault('OFFLINE','No connection. Your progress remains on this device.');}
   if(epoch!==this.epoch)throw fault('STALE_REQUEST');
   let data;try{data=await response.json();}catch{if(epoch!==this.epoch)throw fault('STALE_REQUEST');throw fault('UNAVAILABLE','The account service is not available yet. Your local game is safe.');}
   if(epoch!==this.epoch)throw fault('STALE_REQUEST');
   if(!response.ok||data.ok===false)throw Object.assign(fault(data.error?.code||'SERVER_ERROR',data.error?.message||'The account service could not complete this request.'),{status:response.status,data});
   return data;
  })();
  try{return await Promise.race([work,new Promise((_,reject)=>{timeout=setTimeout(()=>{controller?.abort();reject(fault(epoch===this.epoch?'OFFLINE':'STALE_REQUEST','No connection. Your progress remains on this device.'));},this.requestTimeout);})]);}finally{clearTimeout(timeout);}
 }
 fail(error){if(error.code==='STALE_REQUEST')return false;if(error.status===401){this.model.user=null;this.model.conflict=null;this.model.recoveryCode=null;this.model.status='guest';this.model.error=error.message;this.model.errorCode=error.code;this.emit();return false;}this.model.error=error.message;this.model.errorCode=error.code;this.model.status=error.code==='OFFLINE'?'offline':error.code==='OTHER_TAB'?'blocked':'error';this.emit();return false;}
 async run(fn){if(this.operation)return this.operation;this.model.busy=true;this.model.error=null;this.model.errorCode=null;this.emit();const operation=Promise.resolve().then(fn).catch(e=>this.fail(e)).finally(()=>{if(this.operation===operation){this.operation=null;this.model.busy=false;this.emit();}});this.operation=operation;return operation;}
 async start(){if(!this.enabled)return;return this.run(async()=>{if(this.link.logoutPending){try{await this.request('accounts/logout',{method:'POST',body:{accountId:this.link.accountId}});}catch(error){if(error.status!==401)throw error;}this.persist({...this.link,logoutPending:false});return;}return this.refresh();});}
 async refresh(){
  if(this.paused)return false;let data;
  try{data=await this.request('accounts/me');}catch(error){if(error.status===401){this.model.user=null;this.model.conflict=null;this.model.recoveryCode=null;this.model.status='guest';this.emit();return false;}throw error;}
  this.model.user=data.user;return this.reconcile(data);
 }
 async authenticate(kind,body){if(this.operation)return false;this.epoch++;this.paused=false;return this.run(async()=>{
  this.assertLocal();this.model.status='connecting';this.emit();const data=await this.request('accounts/'+kind,{method:'POST',body});this.model.user=data.user;this.model.recoveryCode=data.recoveryCode||null;
  if(this.link.logoutPending)this.persist({...this.link,logoutPending:false});return this.reconcile({...data,hasSave:data.hasSave??data.revision>0});
 });}
 register(body){return this.authenticate('register',body);}
 login(body){return this.authenticate('login',body);}
 recover({username,recoveryCode,newPassword}){return this.authenticate('recover',{username,recoveryCode,password:newPassword});}
 async reconcile(data){
  this.assertLocal();this.model.cloud=summary(data.summary,data.updatedAt);this.model.lastSyncedAt=data.updatedAt||null;
  const same=this.link.accountId===data.user.id;
  if(same&&this.link.pending&&data.lastUploadId===this.link.pending.id){const played=(this.link.edits||0)!==this.link.pending.edit;this.persist({...this.link,revision:data.revision,pending:null,played});this.upload=null;}
  if(this.link.stage||this.needsOwnerCheck||(!same&&(this.link.accountId||data.hasSave))){return this.offer(data,'choice');}
  if(!same){this.persist({...this.link,accountId:data.user.id,revision:0,played:true,pending:null,stage:null});}
  if(data.revision!==this.link.revision){
   if(!this.link.played&&!this.link.pending&&same&&data.hasSave&&this.canAdopt()){const edit=this.link.edits||0;const remote=await this.getRemote();if((this.link.edits||0)===edit&&!this.link.played&&this.canAdopt())return this.adopt(remote);}
   return this.offer(data,'conflict');
  }
  this.model.conflict=null;return this.uploadCurrent();
 }
 offer(data,status='conflict'){this.remote=null;this.model.cloud=summary(data.summary,data.updatedAt);this.model.conflict={local:saveSummary(this.game.state),cloud:summary(data.summary,data.updatedAt),revision:data.revision,hasSave:data.hasSave??data.revision>0};this.model.status=status;this.emit();return false;}
 async getRemote(){const id=this.model.user.id;const remote=await this.request('accounts/save?accountId='+encodeURIComponent(id));if(remote.userId!==id)throw fault('ACCOUNT_CHANGED','The account changed in another tab. Sign in again.');return remote;}
 async uploadCurrent(){
  if(!this.model.user||this.paused||this.model.conflict)return false;
  if(this.link.accountId!==this.model.user.id)throw fault('ACCOUNT_CHANGED','Choose which progress belongs to this account first.');
  let packet=this.upload;
  if(!packet){const snapshot=this.snapshot();packet={accountId:this.model.user.id,baseRevision:this.link.revision||0,uploadId:this.randomId(),save:clone(snapshot.save),edit:snapshot.edit};
   this.persist({...this.link,pending:{id:packet.uploadId,revision:packet.baseRevision,edit:packet.edit}});this.upload=packet;
  }
  this.model.status='saving';this.emit();let data;
  try{const {edit,...body}=packet;data=await this.request('accounts/save',{method:'PUT',body});}
  catch(error){if(error.code==='REVISION_CONFLICT'){this.upload=null;return this.offer({...error.data,hasSave:true},'conflict');}throw error;}
  this.assertLocal();if(this.model.user?.id!==packet.accountId)throw fault('STALE_REQUEST');
  this.persist({...this.link,revision:data.revision,pending:null,played:(this.link.edits||0)!==packet.edit,stage:null});this.upload=null;
  this.model.cloud=summary(data.summary,data.updatedAt);this.model.lastSyncedAt=data.updatedAt;this.model.status=this.link.played?'pending':'synced';this.model.error=null;this.emit();return true;
 }
 syncNow(){if(this.model.conflict)return Promise.resolve(false);return this.run(()=>this.refresh());}
 async resolveConflict(choice){return this.run(async()=>{
  if(!this.model.conflict||!this.model.user)return false;this.assertLocal();const remote=await this.getRemote();
  if(remote.revision!==this.model.conflict.revision){return this.offer({...remote,hasSave:!!remote.save},'conflict');}
  if(choice==='cloud'){if(!remote.save)throw fault('NO_CLOUD_SAVE','This account has no cloud save yet.');return this.adopt(remote,{explicit:true});}
  if(choice!=='local')return false;
  // Keep the cloud branch before explicitly replacing it, as well as the local
  // branch before adoption. A quota failure leaves both current versions intact.
  if(remote.save)this.backup(JSON.stringify(remote.save),'replace-cloud',{accountId:this.model.user.id,revision:remote.revision});
  this.persist({...this.link,accountId:this.model.user.id,revision:remote.revision,pending:null,stage:null,played:true});this.upload=null;this.needsOwnerCheck=false;this.model.conflict=null;return this.uploadCurrent();
 });}
 backup(text,reason,owner=this.link){this.assertLocal();const record=JSON.stringify({game:'Europa Angler',savedAt:this.now(),reason,owner:{accountId:owner.accountId||null,revision:owner.revision||0},save:JSON.parse(text)});try{this.storage.setItem(CLOUD_RECOVERY_KEY,record);this.model.hasRecoveryBackup=true;}catch{throw fault('BACKUP_FULL','There is not enough room for a recovery copy. Download your save and free device storage before replacing progress.');}}
 async adopt(remote,{explicit=false}={}){
  this.assertLocal();const id=this.model.user?.id;if(!remote.save||remote.userId!==id)throw fault('ACCOUNT_CHANGED','The account changed. Sign in again.');
  // Validation must finish before writing either the save or ownership marker.
  try{this.game.validate(remote.save);}catch{throw fault('INVALID_CLOUD_SAVE','This cloud save needs a newer game version or cannot be read. Your local progress has been kept.');}
  const before=this.snapshot(),oldLink={...this.link};this.backup(before.text,'load-cloud');
  this.persist({...this.link,stage:{accountId:id,revision:remote.revision},played:true});
  let result;this.suppress=true;try{result=this.game.importSave(JSON.stringify(remote.save));}finally{this.suppress=false;}
  if(!result?.ok){this.persist(oldLink);throw fault('LOCAL_STORAGE','The cloud save could not be stored on this device. Your previous progress has been kept.');}
  this.persist({...this.link,accountId:id,revision:remote.revision,pending:null,stage:null,played:false});this.upload=null;this.needsOwnerCheck=false;
  this.model.conflict=null;this.model.cloud=summary(remote.summary,remote.updatedAt);this.model.lastSyncedAt=remote.updatedAt;this.model.status='synced';this.model.error=null;this.onAdopt({explicit});this.emit();return true;
 }
 async logout(){const id=this.model.user?.id;if(!id)return false;this.epoch++;this.operation=null;this.paused=true;return this.run(async()=>{
  this.persist({...this.link,logoutPending:true});try{await this.request('accounts/logout',{method:'POST',body:{accountId:id}});}catch(error){if(error.status!==401)throw error;}this.persist({...this.link,logoutPending:false});this.upload=null;this.model.user=null;this.model.conflict=null;this.model.recoveryCode=null;this.model.status='guest';this.model.error=null;this.emit();return true;
 });}
 async downloadLocalBackup(){try{const snap=this.snapshot();return await this.download(JSON.stringify({game:'Europa Angler Idle',exportedAt:new Date(this.now()).toISOString(),save:snap.save},null,2),'Europa-Angler-backup.json','application/json')!==false;}catch(error){return this.fail(error);}}
 async downloadRecoveryBackup(){try{const text=this.storage?.getItem(CLOUD_RECOVERY_KEY);if(!text)return false;return await this.download(text,'Europa-Angler-cloud-recovery.json','application/json')!==false;}catch(error){return this.fail(error);}}
 async downloadRecoveryCode(){if(!this.model.recoveryCode)return false;return this.download('Europa Angler\nUsername: '+this.model.user.username+'\nRecovery code: '+this.model.recoveryCode+'\nKeep this private. It can reset your password.\n','Europa-Angler-account-recovery.txt','text/plain');}
 acknowledgeRecoveryCode(){this.model.recoveryCode=null;this.emit();}
 async loadLeaderboard(metric='xp'){
  if(!['xp','catches','biggest'].includes(metric))return;const ticket=this.boardTicket=(this.boardTicket||0)+1;this.model.leaderboard={...this.model.leaderboard,metric,loading:true,error:null};this.emit();
  try{const data=await this.request('leaderboard?metric='+metric);if(ticket!==this.boardTicket)return;this.model.leaderboard={metric,loading:false,error:null,rows:(data.entries||[]).map(row=>({...row,bestWeight:row.biggest,isCurrentUser:row.username===this.model.user?.username})),ownRank:data.ownEntry?.rank||null,ownEntry:data.ownEntry,total:data.total||0};}
  catch(error){if(ticket!==this.boardTicket)return;this.model.leaderboard={...this.model.leaderboard,loading:false,error:error.message,errorCode:error.code};}this.emit();
 }
 refreshLeaderboard(){return this.loadLeaderboard(this.model.leaderboard.metric);}
 dispose(){this.epoch++;this.paused=true;this.unsubscribe?.();this.game.beforeUserSave=this.previousBeforeSave;this.game.beforePersist=this.previousBeforePersist;}
}
