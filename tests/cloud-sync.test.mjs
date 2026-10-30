import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IdleGame} from '../dist/engine.js';
import {packSave} from '../dist/save-codec.js';
import {SAVE_KEY,BACKUP_KEY} from '../dist/save-store.js';
import {CloudSync,CLOUD_LINK_KEY,CLOUD_RECOVERY_KEY,saveSummary} from '../dist/cloud-sync.js';
import {memoryStorage} from './tackle-fixtures.mjs';

const NOW=1793318400000,copy=value=>JSON.parse(JSON.stringify(value));
let serial=0;
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const reply=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>copy(data)});
const failure=(code,status=409,extra={})=>reply({ok:false,error:{code,message:code},...extra},status);

// This transport models the production account contract, including cookie-owner
// checks, optimistic revisions and idempotency; simulation and storage are real.
function backend(){
 const users=new Map(),requests=[];
 const add=(name,save=null)=>{const id='account-'+name.toLowerCase(),record={id,username:name,createdAt:NOW,revision:save?1:0,save:save?copy(save):null,updatedAt:save?NOW:null,lastUploadId:null,uploads:new Map()};users.set(id,record);return record;};
 const metadata=user=>({user:{id:user.id,username:user.username,createdAt:user.createdAt},revision:user.revision,hasSave:!!user.save,updatedAt:user.updatedAt,lastUploadId:user.lastUploadId,summary:user.save?saveSummary(user.save):null});
 const respond=(channel,request)=>{
  const {pathname,searchParams}=new URL(request.path,'https://angler.test'),route=request.method+' '+pathname,body=request.body;
  if(['POST /api/accounts/register','POST /api/accounts/login','POST /api/accounts/recover'].includes(route)){
   let user=[...users.values()].find(u=>u.username===body.username);
   if(route.endsWith('/register')){if(user)return failure('USERNAME_TAKEN');user=add(body.username);}
   if(!user)return failure('INVALID_CREDENTIALS',401);channel.cookie=user.id;
   return reply({ok:true,...metadata(user),...(route.endsWith('/register')?{recoveryCode:'1234-recovery-fixture'}:{})});
  }
  const user=users.get(channel.cookie);if(!user)return failure('NOT_AUTHENTICATED',401);
  if(route==='GET /api/accounts/me')return reply({ok:true,...metadata(user)});
  if(route==='POST /api/accounts/logout'){
   if(body.accountId&&body.accountId!==user.id)return failure('ACCOUNT_CHANGED');channel.cookie=null;return reply({ok:true});
  }
  if(route==='GET /api/accounts/save'){
   if(searchParams.get('accountId')!==user.id)return failure('ACCOUNT_CHANGED');return reply({ok:true,...metadata(user),userId:user.id,save:user.save});
  }
  if(route==='PUT /api/accounts/save'){
   if(body.accountId!==user.id)return failure('ACCOUNT_CHANGED');
   const digest=JSON.stringify({baseRevision:body.baseRevision,save:body.save}),previous=user.uploads.get(body.uploadId);
   if(previous)return previous.digest===digest?reply({...previous.data,idempotent:true}):failure('UPLOAD_ID_REUSED');
   if(body.baseRevision!==user.revision)return failure('REVISION_CONFLICT',409,metadata(user));
   user.save=copy(body.save);user.revision++;user.updatedAt=NOW+user.revision;user.lastUploadId=body.uploadId;
   const data={ok:true,userId:user.id,revision:user.revision,updatedAt:user.updatedAt,lastUploadId:body.uploadId,summary:saveSummary(user.save)};
   user.uploads.set(body.uploadId,{digest,data:copy(data)});return reply(data);
  }
  return failure('NOT_FOUND',404);
 };
 const channel=(cookie=null)=>{
  const client={cookie,offline:false,gates:[],requests:[]};
  client.hold=(match,stage='before')=>{const gate={match,stage,entered:deferred(),released:deferred()};client.gates.push(gate);return gate;};
  client.fetcher=async(path,options={})=>{
   assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');
   const request={path,method:options.method||'GET',body:options.body?JSON.parse(options.body):null};client.requests.push(request);requests.push(request);
   if(client.offline)throw Error('Network offline');
   const index=client.gates.findIndex(g=>g.match(request)),gate=index<0?null:client.gates.splice(index,1)[0];
   if(gate?.stage==='before'){gate.entered.resolve(request);await gate.released.promise;}
   const response=respond(client,request);
   if(gate?.stage==='after'){gate.entered.resolve(request);await gate.released.promise;}
   if(gate?.stage==='lost'){gate.entered.resolve(request);throw Error('Reply lost after successful commit');}
   if(gate?.stage==='json'){const decode=response.json;response.json=async()=>{gate.entered.resolve(request);await gate.released.promise;return decode();};}
   return response;
  };return client;
 };
 return {users,requests,add,channel,metadata};
}
function device(server,{channel=server.channel(),storage=memoryStorage(),time=NOW}={}){
 const game=new IdleGame({storage,now:()=>time}),adoptions=[];
 const cloud=new CloudSync(game,{storage,fetcher:channel.fetcher,now:()=>time,randomId:()=>`upload_fixture_${String(++serial).padStart(10,'0')}`,onAdopt:event=>adoptions.push(event)});
 return {game,cloud,storage,channel,adoptions};
}
async function registered(){const server=backend(),a=device(server);assert.equal(await a.cloud.register({username:'Alice',password:'fixture-password'}),true);const user=server.users.get(a.cloud.model.user.id);assert.equal(user.revision,1);return {server,a,user};}
async function pair(){const context=await registered(),b=device(context.server,{channel:context.server.channel(context.user.id)});assert.equal(await b.cloud.start(),false);assert.equal(b.cloud.model.status,'choice');assert.equal(await b.cloud.resolveConflict('cloud'),true);assert.equal(b.cloud.link.revision,context.a.cloud.link.revision);return {...context,b};}
const isPut=r=>r.method==='PUT'&&r.path==='/api/accounts/save';
const isMe=r=>r.method==='GET'&&r.path==='/api/accounts/me';
const isRemote=r=>r.method==='GET'&&r.path.startsWith('/api/accounts/save?');
const checks=[],errors=[];
async function test(name,run){try{await run();checks.push(name);}catch(error){errors.push({name,error:error.stack});}}

await test('Two real devices racing on one revision preserve the winner and offer the losing local branch',async()=>{
 const {a,b,user}=await pair();assert(a.game.buySupply('corn',20).ok);assert(b.game.buySupply('maggots',30).ok);
 const localA=copy(a.game.state),gate=a.channel.hold(isPut);const pending=a.cloud.syncNow();await gate.entered.promise;
 assert.equal(await b.cloud.syncNow(),true);const remoteB=copy(user.save);gate.released.resolve();assert.equal(await pending,false);
 assert.equal(a.cloud.model.status,'conflict');assert.equal(user.revision,2);assert.deepEqual(user.save,remoteB);assert.equal(a.game.state.money,localA.money);
 assert.equal(await a.cloud.resolveConflict('cloud'),true);assert.equal(a.game.state.money,b.game.state.money);
 assert.equal(JSON.parse(a.storage.getItem(CLOUD_RECOVERY_KEY)).save.money,localA.money);assert.equal(a.cloud.link.accountId,user.id);
});

await test('Offline progress conflicts explicitly, and choosing local backs up the replaced remote branch before CAS',async()=>{
 const {a,b,user}=await pair();b.channel.offline=true;assert(b.game.buySupply('corn',25).ok);assert.equal(await b.cloud.syncNow(),false);assert.equal(b.cloud.model.status,'offline');
 assert(a.game.buySupply('maggots',20).ok);assert.equal(await a.cloud.syncNow(),true);const remoteBefore=copy(user.save),offlineMoney=b.game.state.money;
 b.channel.offline=false;assert.equal(await b.cloud.syncNow(),false);assert.equal(b.cloud.model.status,'conflict');assert.equal(b.game.state.money,offlineMoney);assert.deepEqual(user.save,remoteBefore);
 assert.equal(await b.cloud.resolveConflict('local'),true);assert.equal(user.save.money,offlineMoney);assert.deepEqual(JSON.parse(b.storage.getItem(CLOUD_RECOVERY_KEY)).save,remoteBefore);
});

await test('Recovery quota failure and failed primary persistence leave local and cloud versions intact',async()=>{
 const {server,user}=await registered(),b=device(server,{channel:server.channel(user.id)});assert(b.game.buySupply('corn',10).ok);await b.cloud.start();
 const before=b.storage.getItem(SAVE_KEY),head=copy(user.save),owner=b.storage.getItem(CLOUD_LINK_KEY),set=b.storage.setItem.bind(b.storage);
 b.storage.setItem=(key,value)=>{if(key===CLOUD_RECOVERY_KEY)throw Error('QuotaExceeded');set(key,value);};assert.equal(await b.cloud.resolveConflict('cloud'),false);
 assert.equal(b.storage.getItem(SAVE_KEY),before);assert.equal(b.storage.getItem(CLOUD_LINK_KEY),owner);assert.deepEqual(user.save,head);assert.match(b.cloud.model.error,/recovery copy/i);
 b.storage.setItem=(key,value)=>{if(key===SAVE_KEY)throw Error('QuotaExceeded');set(key,value);};assert.equal(await b.cloud.resolveConflict('cloud'),false);assert.equal(b.storage.getItem(SAVE_KEY),before);assert.deepEqual(user.save,head);
 b.storage.setItem=set;assert.equal(await b.cloud.resolveConflict('cloud'),true);assert.equal(b.game.state.money,user.save.money);
});

await test('Recovered rolling backups never inherit a different account owner automatically',async()=>{
 const {server,a,user}=await registered(),bobSave=copy(user.save);bobSave.money=777;const bob=server.add('Bob',bobSave),storage=memoryStorage();
 storage.setItem(SAVE_KEY,'{damaged');storage.setItem(BACKUP_KEY,a.storage.getItem(SAVE_KEY));storage.setItem(CLOUD_LINK_KEY,JSON.stringify({accountId:bob.id,revision:bob.revision,played:false,edits:0}));
 const recovered=device(server,{channel:server.channel(bob.id),storage});assert(recovered.game.store.recoveryUsed);assert.equal(recovered.game.state.money,user.save.money);
 const head=copy(bob.save);assert.equal(await recovered.cloud.start(),false);assert.equal(recovered.cloud.model.status,'choice');assert.deepEqual(bob.save,head);assert.equal(recovered.channel.requests.filter(isPut).length,0);
 assert.equal(await recovered.cloud.resolveConflict('cloud'),true);assert.equal(recovered.game.state.money,777);assert.equal(recovered.cloud.needsOwnerCheck,false);
});

await test('A staged interrupted account switch requires a fresh choice on restart',async()=>{
 const {server,a,user}=await registered(),link=JSON.parse(a.storage.getItem(CLOUD_LINK_KEY));a.storage.setItem(CLOUD_LINK_KEY,JSON.stringify({...link,stage:{accountId:user.id,revision:1}}));a.cloud.dispose();
 const restarted=device(server,{channel:a.channel,storage:a.storage});assert.equal(await restarted.cloud.start(),false);assert.equal(restarted.cloud.model.status,'choice');assert.equal(user.revision,1);
});

await test('A stale local tab cannot upload another tab’s primary or overwrite its account metadata',async()=>{
 const {server,a,user}=await registered(),other=device(server,{channel:a.channel,storage:a.storage});assert(other.game.buySupply('corn',10).ok);const latest=a.storage.getItem(SAVE_KEY),link=a.storage.getItem(CLOUD_LINK_KEY),head=copy(user.save);
 assert.equal(await a.cloud.syncNow(),false);assert.equal(a.cloud.model.status,'blocked');assert.equal(a.storage.getItem(SAVE_KEY),latest);assert.equal(a.storage.getItem(CLOUD_LINK_KEY),link);assert.deepEqual(user.save,head);assert.equal(a.channel.requests.filter(isPut).length,1);
});

await test('Lost upload acknowledgements recover after restart through lastUploadId without a false conflict',async()=>{
 const {server,a,user}=await registered();assert(a.game.buySupply('corn',15).ok);const lost=a.channel.hold(isPut,'lost');assert.equal(await a.cloud.syncNow(),false);await lost.entered.promise;
 assert.equal(a.cloud.model.status,'offline');const pending=JSON.parse(a.storage.getItem(CLOUD_LINK_KEY)).pending;assert.equal(user.lastUploadId,pending.id);assert.equal(user.revision,2);
 a.cloud.dispose();const restarted=device(server,{channel:a.channel,storage:a.storage});assert.equal(await restarted.cloud.start(),true);assert.equal(restarted.cloud.model.status,'synced');assert.equal(restarted.cloud.model.conflict,null);assert.equal(restarted.cloud.link.pending,null);assert.equal(restarted.game.state.money,user.save.money);assert.equal(user.revision,3);
});

await test('An edit made during an upload remains pending and is included in the next revision',async()=>{
 const {a,user}=await registered();assert(a.game.buySupply('corn',10).ok);const gate=a.channel.hold(isPut,'after'),pending=a.cloud.syncNow();await gate.entered.promise;
 const committedMoney=user.save.money;assert(a.game.buySupply('maggots',10).ok);const editedMoney=a.game.state.money;assert.notEqual(editedMoney,committedMoney);gate.released.resolve();assert.equal(await pending,true);
 assert.equal(a.cloud.model.status,'pending');assert.equal(a.cloud.link.played,true);assert.equal(user.save.money,committedMoney);assert.equal(await a.cloud.syncNow(),true);assert.equal(user.save.money,editedMoney);assert.equal(a.cloud.model.status,'synced');
});

await test('Logout cancels delayed upload replies and keeps ownership while hiding the previous account',async()=>{
 const {a,user}=await registered();assert(a.game.buySupply('corn',10).ok);const gate=a.channel.hold(isPut,'after'),pending=a.cloud.syncNow();await gate.entered.promise;
 assert.equal(await a.cloud.logout(),true);const link=a.storage.getItem(CLOUD_LINK_KEY);gate.released.resolve();await pending;
 assert.equal(a.cloud.model.user,null);assert.equal(a.cloud.model.status,'guest');assert.equal(a.cloud.link.accountId,user.id);assert.equal(a.storage.getItem(CLOUD_LINK_KEY),link);
});

await test('Logout also invalidates responses whose JSON body is still being decoded',async()=>{
 const {a,user}=await registered(),gate=a.channel.hold(isMe,'json'),pending=a.cloud.syncNow();await gate.entered.promise;
 assert.equal(await a.cloud.logout(),true);gate.released.resolve();await pending;
 assert.equal(a.cloud.model.user,null,'A stale /me JSON body must not sign the logged-out account back into the UI');assert.equal(a.cloud.model.status,'guest');assert.equal(a.cloud.link.accountId,user.id);
});

await test('A different cookie account during PUT is rejected using the captured body accountId',async()=>{
 const {server,a,user}=await registered(),bob=server.add('Bob');assert(a.game.buySupply('corn',10).ok);const gate=a.channel.hold(isPut),pending=a.cloud.syncNow(),packet=await gate.entered.promise;
 assert.equal(packet.body.accountId,user.id);a.channel.cookie=bob.id;gate.released.resolve();assert.equal(await pending,false);assert.equal(a.cloud.model.status,'error');assert.equal(bob.save,null);assert.equal(bob.revision,0);assert.equal(user.revision,1);
});

await test('Remote adoption also guards the account cookie through the GET query accountId',async()=>{
 const {server,user}=await registered(),bob=server.add('Bob'),b=device(server,{channel:server.channel(user.id)});await b.cloud.start();const before=b.storage.getItem(SAVE_KEY),gate=b.channel.hold(isRemote),pending=b.cloud.resolveConflict('cloud'),packet=await gate.entered.promise;
 assert(packet.path.includes('accountId='+encodeURIComponent(user.id)));b.channel.cookie=bob.id;gate.released.resolve();assert.equal(await pending,false);assert.equal(b.storage.getItem(SAVE_KEY),before);assert.equal(b.adoptions.length,0);
});

await test('Logout preserves owner so signing into another empty account cannot auto-upload previous progress',async()=>{
 const {server,a,user}=await registered(),bob=server.add('Bob');assert.equal(await a.cloud.logout(),true);assert.equal(await a.cloud.login({username:'Bob',password:'fixture-password'}),false);
 assert.equal(a.cloud.model.status,'choice');assert.equal(a.cloud.link.accountId,user.id);assert.equal(bob.save,null);assert.equal(bob.revision,0);
});

await test('Old exported saves migrate locally, mark a branch dirty, and keep account identity',async()=>{
 const {a,user}=await registered(),legacy=JSON.parse(fs.readFileSync(new URL('./fixtures/save-2.8.1.json',import.meta.url),'utf8'));legacy.lastAt=NOW;
 assert(a.game.importSave(JSON.stringify(legacy)).ok);assert.equal(a.cloud.link.played,true);assert.equal(a.cloud.link.accountId,user.id);assert.equal(a.cloud.model.status,'pending');assert.equal(await a.cloud.syncNow(),true);assert.equal(user.save.schemaVersion,a.game.state.schemaVersion);assert.equal(user.save.money,legacy.money);
});

await test('Future-schema cloud saves cannot replace or mark over a readable local save',async()=>{
 const {server,user}=await registered();user.save.schemaVersion=999;const b=device(server,{channel:server.channel(user.id)});await b.cloud.start();const before=b.storage.getItem(SAVE_KEY),link=b.storage.getItem(CLOUD_LINK_KEY);
 assert.equal(await b.cloud.resolveConflict('cloud'),false);assert.equal(b.storage.getItem(SAVE_KEY),before);assert.equal(b.storage.getItem(CLOUD_LINK_KEY),link);assert.equal(user.save.schemaVersion,999);assert.equal(b.adoptions.length,0);
});

await test('A newer remote revision arriving while a conflict is open requires a fresh choice',async()=>{
 const {a,b,user}=await pair();assert(a.game.buySupply('corn',5).ok);assert(b.game.buySupply('maggots',5).ok);await a.cloud.syncNow();await b.cloud.syncNow();assert.equal(b.cloud.model.status,'conflict');const firstChoice=b.cloud.model.conflict.revision;
 assert(a.game.buySupply('corn',5).ok);await a.cloud.syncNow();const latest=copy(user.save),backup=b.storage.getItem(CLOUD_RECOVERY_KEY);assert(user.revision>firstChoice);
 assert.equal(await b.cloud.resolveConflict('local'),false);assert.equal(b.cloud.model.conflict.revision,user.revision);assert.deepEqual(user.save,latest);assert.equal(b.storage.getItem(CLOUD_RECOVERY_KEY),backup);
});

await test('A stalled JSON body remains covered by the request timeout after response headers arrive',async()=>{
 const {a}=await registered(),gate=a.channel.hold(isMe,'json'),timers=new Map();let timerId=0;
 const realSet=globalThis.setTimeout,realClear=globalThis.clearTimeout;let pending;
 try{
  globalThis.setTimeout=fn=>{const id=++timerId;timers.set(id,fn);return id;};globalThis.clearTimeout=id=>timers.delete(id);
  pending=a.cloud.request('accounts/me');await gate.entered.promise;
  assert.equal(timers.size,1,'The network timeout must remain active until the JSON body has completed');
  [...timers.values()][0]();await assert.rejects(pending,error=>error.code==='OFFLINE');
 }finally{gate.released.resolve();if(pending)await pending.catch(()=>{});globalThis.setTimeout=realSet;globalThis.clearTimeout=realClear;}
});

await test('Expired sessions complete logout locally and do not leave a persistent logout retry loop',async()=>{
 const {server,a,user}=await registered();a.channel.cookie=null;assert.equal(await a.cloud.logout(),true);assert.equal(a.cloud.model.user,null);assert.equal(a.cloud.model.status,'guest');assert.equal(a.cloud.link.logoutPending,false);assert.equal(a.cloud.link.accountId,user.id);
 a.cloud.dispose();const restarted=device(server,{channel:a.channel,storage:a.storage});await restarted.cloud.start();assert.equal(restarted.cloud.model.user,null);assert.equal(restarted.cloud.model.status,'guest');assert.equal(restarted.cloud.link.logoutPending,false);
});

await test('An interrupted offline logout is cleared when startup finds that the server session has already expired',async()=>{
 const {server,a,user}=await registered();a.channel.offline=true;assert.equal(await a.cloud.logout(),false);assert.equal(a.cloud.link.logoutPending,true);a.cloud.dispose();a.channel.offline=false;a.channel.cookie=null;
 const restarted=device(server,{channel:a.channel,storage:a.storage});await restarted.cloud.start();assert.equal(restarted.cloud.model.user,null);assert.equal(restarted.cloud.model.status,'guest');assert.equal(restarted.cloud.link.logoutPending,false);assert.equal(restarted.cloud.link.accountId,user.id);
});

await test('A session expiring between /me and upload clears account UI without dropping local pending progress',async()=>{
 const {a,user}=await registered();assert(a.game.buySupply('corn',5).ok);const local=a.storage.getItem(SAVE_KEY),gate=a.channel.hold(isPut),pending=a.cloud.syncNow();await gate.entered.promise;a.channel.cookie=null;gate.released.resolve();assert.equal(await pending,false);
 assert.equal(a.cloud.model.user,null);assert.equal(a.cloud.model.status,'guest');assert.equal(a.storage.getItem(SAVE_KEY),local);assert.equal(a.cloud.link.accountId,user.id);assert(a.cloud.link.pending);assert.equal(user.revision,1);
});

await test('A transient cloud-metadata write failure cannot make a real local purchase look safe for automatic replacement',async()=>{
 const {a,b}=await pair(),set=b.storage.setItem.bind(b.storage);let failed=false;
 b.storage.setItem=(key,value)=>{if(key===CLOUD_LINK_KEY&&!failed){failed=true;throw Error('QuotaExceeded');}set(key,value);};
 assert(b.game.buySupply('corn',11).ok);assert(failed);const localMoney=b.game.state.money,localCorn=b.game.state.stock.corn;b.storage.setItem=set;
 assert(a.game.buySupply('maggots',11).ok);await a.cloud.syncNow();const adoptions=b.adoptions.length;
 await b.cloud.syncNow();assert.equal(b.adoptions.length,adoptions,'A failed edit marker must prevent automatic cloud adoption');assert.equal(b.game.state.money,localMoney);assert.equal(b.game.state.stock.corn,localCorn);
});

console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',groups:checks.length,checks,errors},null,2));
if(errors.length)process.exitCode=1;
