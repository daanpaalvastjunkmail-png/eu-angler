/** Required deployment gate: the actual Worker executes in workerd, including
 * native node:crypto.scrypt and a SQLite Durable Object (no storage/auth mocks).
 *
 * Run after npm install: npm run test:runtime
 * Missing Miniflare or an unsupported local runtime is a failure, never a skip.
 * Some restricted sandboxes cannot start workerd; run this gate in the build
 * environment before deploy. A syntax check alone does not validate the runtime.
 *
 * Primary API references:
 * https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare
 * https://developers.cloudflare.com/workers/testing/miniflare/storage/durable-objects/
 * https://developers.cloudflare.com/workers/testing/miniflare/core/modules/
 *
 * cf:false prevents a request for Cloudflare metadata. Persistence is disabled;
 * SQLite belongs only to this Miniflare instance and is removed by dispose().
 * No remote bindings, production origin, Wrangler credentials or real accounts.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {IdleGame} from '../dist/engine.js';
import {packSave} from '../dist/save-codec.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const config=JSON.parse(await readFile(new URL('../wrangler.json',import.meta.url),'utf8'));
assert(config.compatibility_flags?.includes('nodejs_compat'),'Production configuration must enable native Node compatibility');
const binding=config.durable_objects?.bindings?.find(item=>item.name==='ACCOUNTS');
assert.equal(binding?.class_name,'AccountHub','The test must target the production account Durable Object');
assert(config.migrations?.some(item=>item.new_sqlite_classes?.includes('AccountHub')),'Production migration must create a SQLite Durable Object');

let Miniflare;
try { ({Miniflare}=await import('miniflare')); }
catch {
 throw new Error('Required workerd test could not start: install the declared Miniflare 4 development dependency with npm install. Runtime verification has NOT passed.');
}
const bundle=await build({
 absWorkingDir:root,entryPoints:[config.main],bundle:true,format:'esm',platform:'neutral',
 target:'es2022',external:['node:*'],write:false,logLevel:'silent',
});
assert.equal(bundle.outputFiles.length,1,'The production Worker must bundle into one ES module');
const runtime=new Miniflare({
 name:'europa-angler-runtime-test',modules:true,script:bundle.outputFiles[0].text,
 // node:* imports remain native; this virtual path only locates the ES module.
 scriptPath:path.join(root,'work','accounts-runtime-bundle.mjs'),
 compatibilityDate:config.compatibility_date,compatibilityFlags:config.compatibility_flags,
 durableObjects:{ACCOUNTS:{className:binding.class_name,useSQLite:true}},
 durableObjectsPersist:false,cachePersist:false,cf:false,host:'127.0.0.1',port:0,
 serviceBindings:{ASSETS:()=>new Response('runtime asset fixture',{headers:{'Content-Type':'text/plain'}})},
 outboundService:()=>new Response('Outbound requests are disabled in runtime tests',{status:503}),
});
const origin='https://europa-angler.runtime.test';
const checks=[];
const within=async(promise,label,milliseconds=30000)=>{
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out; runtime verification has NOT passed.')),milliseconds);})]);}
 finally{clearTimeout(timer);}
};
const api=async(route,{method='GET',body,cookie:sessionCookie,headers={},expect=200,code}={})=>{
 const h={'Sec-Fetch-Site':'same-origin',...(method==='GET'?{}:{Origin:origin,'Content-Type':'application/json'}),...(sessionCookie?{Cookie:sessionCookie}:{}),...headers};
 const response=await within(runtime.dispatchFetch(origin+'/api/'+route,{method,headers:h,...(body===undefined?{}:{body:JSON.stringify(body)})}),method+' '+route);
 let payload;
 try{payload=await response.json();}catch{throw new Error(method+' '+route+' returned non-JSON; runtime verification has NOT passed.');}
 assert.equal(response.status,expect,method+' '+route+': expected HTTP '+expect+', received '+response.status+' ('+(payload?.error?.code||'no error code')+')');
 assert.equal(payload.ok,expect<400,method+' '+route+': API outcome must match its HTTP status');
 assert(response.headers.get('Cache-Control')?.includes('no-store'),method+' '+route+': account responses must never be cached');
 if(code)assert.equal(payload.error?.code,code,method+' '+route+': wrong API error');
 return {response,payload};
};
const sessionFrom=response=>{
 const header=response.headers.get('Set-Cookie')||'';
 assert(/^__Host-europa-session=[A-Za-z0-9_-]{43};/.test(header),'Authentication must issue an opaque host-only session cookie');
 for(const flag of ['Path=/','HttpOnly','Secure','SameSite=Strict'])assert(header.includes(flag),'Session cookie is missing '+flag);
 assert(!/Domain=/i.test(header),'A __Host- session cookie must not have a Domain attribute');
 return header.split(';',1)[0];
};
const fixture=({xp=12000,catches=800,biggest=4.82,money=450,large=false}={})=>{
 const now=Date.now(),game=new IdleGame({storage:null,now:()=>now});
 game.state.xp=xp;game.state.money=money;game.state.stats.caught=catches;game.state.stats.bestWeight=biggest;
 if(large){
  // Real-shaped historical catches span multiple 64 KiB SQLite BLOB chunks.
  game.state.net=Array.from({length:800},(_,i)=>({id:'runtime_catch_'+i,species:'voorn',weight:.1+(i%20)/100,value:1.25,xp:2,at:now-i*1000,water:'rietplas'}));
 }
 const save=JSON.parse(JSON.stringify(packSave(game.state)));
 if(large)assert(Buffer.byteLength(JSON.stringify(save))>65536,'The chunk-storage fixture must span more than one SQLite chunk');
 return save;
};
const put=(cookie,accountId,baseRevision,save,uploadId=randomUUID())=>api('accounts/save',{method:'PUT',cookie,body:{accountId,baseRevision,uploadId,save}});
const get=(cookie,accountId)=>api('accounts/save?accountId='+encodeURIComponent(accountId),{cookie});

try {
 await within(runtime.ready,'Starting Miniflare/workerd');
 const asset=await within(runtime.dispatchFetch(origin+'/'),'Static asset routing');
 assert.equal(await asset.text(),'runtime asset fixture');
 await api('accounts/me',{expect:401,code:'NOT_AUTHENTICATED'});
 const empty=await api('leaderboard?metric=xp');
 assert.equal(empty.payload.total,0);assert.deepEqual(empty.payload.entries,[]);
 checks.push('Actual Worker routing and SQLite initialization start with an empty isolated account store');

 const username='Runtime_Angler',password='River journal runtime password 1!';
 const registered=await api('accounts/register',{method:'POST',body:{username,password},expect:201});
 const accountId=registered.payload.user.id,deviceA=sessionFrom(registered.response),recovery=registered.payload.recoveryCode;
 assert.equal(registered.payload.user.username,username);assert.equal(registered.payload.revision,0);assert.equal(registered.payload.hasSave,false);
 assert(typeof recovery==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{8}){4}$/.test(recovery),'Registration must return a one-time recovery code');
 const loggedIn=await api('accounts/login',{method:'POST',body:{username:username.toLowerCase(),password}});
 const deviceB=sessionFrom(loggedIn.response);
 assert.equal(loggedIn.payload.user.id,accountId);assert(deviceA!==deviceB,'Each device needs its own revocable session');
 assert.equal(Object.hasOwn(loggedIn.payload,'recoveryCode'),false,'Recovery codes must not be returned on ordinary sign-in');
 const me=await api('accounts/me',{cookie:deviceB});
 assert.equal(me.payload.user.id,accountId);assert.equal(Object.hasOwn(me.payload,'recoveryCode'),false);
 await api('accounts/login',{method:'POST',body:{username,password:'Wrong runtime password!'},expect:401,code:'INVALID_CREDENTIALS'});
 checks.push('Registration and case-insensitive login exercise native scrypt and issue separate secure device sessions');

 const first=fixture({large:true}),firstUpload=randomUUID();
 const saved1=await put(deviceA,accountId,0,first,firstUpload);
 assert.equal(saved1.payload.revision,1);assert.equal(saved1.payload.summary.xp,first.xp);assert.equal(saved1.payload.summary.catches,first.stats.caught);assert.equal(saved1.payload.summary.biggest,first.stats.bestWeight);
 const fromPhone=await get(deviceB,accountId);
 assert.equal(fromPhone.payload.userId,accountId);assert.equal(fromPhone.payload.revision,1);assert.deepEqual(fromPhone.payload.save,first,'The second device must read the exact stored save across multiple SQLite chunks');
 const second={...first,xp:35000,money:720,stats:{...first.stats,caught:801,bestWeight:7.5}},secondUpload=randomUUID();
 const saved2=await put(deviceB,accountId,1,second,secondUpload);assert.equal(saved2.payload.revision,2);
 await api('accounts/save',{method:'PUT',cookie:deviceA,body:{accountId,baseRevision:1,uploadId:randomUUID(),save:{...first,money:999}},expect:409,code:'REVISION_CONFLICT'});
 const unchanged=await get(deviceA,accountId);assert.equal(unchanged.payload.revision,2);assert.deepEqual(unchanged.payload.save,second,'A stale device must not overwrite the current cloud save');
 const retry=await put(deviceB,accountId,1,second,secondUpload);assert.equal(retry.payload.revision,2);assert.equal(retry.payload.idempotent,true);
 await api('accounts/save',{method:'PUT',cookie:deviceB,body:{accountId,baseRevision:1,uploadId:secondUpload,save:{...second,money:721}},expect:409,code:'UPLOAD_ID_REUSED'});
 checks.push('Two devices round-trip a multi-chunk save; stale revisions are rejected and exact upload retries are idempotent');

 const competitorName='Runtime_ReedWalker';
 const competitor=await api('accounts/register',{method:'POST',body:{username:competitorName,password:'Another runtime password 2!'},expect:201});
 const competitorCookie=sessionFrom(competitor.response),competitorId=competitor.payload.user.id;
 await put(competitorCookie,competitorId,0,fixture({xp:120000,catches:600,biggest:6.2}));
 const publicFields=['rank','username','xp','catches','biggest','prestige','level','updatedAt'].sort();
 for(const [metric,names,ownRank]of [['xp',[competitorName,username],2],['catches',[username,competitorName],1],['biggest',[username,competitorName],1]]){
  const board=await api('leaderboard?metric='+metric,{cookie:deviceB});
  assert.equal(board.payload.total,2);assert.deepEqual(board.payload.entries.map(row=>row.username),names);assert.equal(board.payload.ownEntry.rank,ownRank);
  for(const row of board.payload.entries)assert.deepEqual(Object.keys(row).sort(),publicFields,'Public leaderboard entries must expose only display names and game statistics');
 }
 const publicBoard=await api('leaderboard?metric=xp');assert.equal(publicBoard.payload.ownEntry,null);
 await api('accounts/save?accountId='+encodeURIComponent(competitorId),{cookie:deviceA,expect:409,code:'ACCOUNT_CHANGED'});
 await api('accounts/save',{expect:401,code:'NOT_AUTHENTICATED'});
 checks.push('Real SQLite leaderboards sort all three metrics, report own rank, and keep account identifiers and saves private');

 await api('accounts/login',{method:'POST',body:{username,password},headers:{Origin:'https://other-origin.test'},expect:403,code:'ORIGIN_REJECTED'});
 await api('accounts/me',{cookie:deviceA,headers:{'Sec-Fetch-Site':'cross-site'},expect:403,code:'ORIGIN_REJECTED'});
 checks.push('Cross-origin mutations and cross-site account reads are rejected by the deployed request guard');

 const newPassword='Recovered river journal password 3!';
 await api('accounts/recover',{method:'POST',body:{username,password:newPassword,recoveryCode:'00000000-00000000-00000000-00000000-00000000'},expect:401,code:'INVALID_CREDENTIALS'});
 const recovered=await api('accounts/recover',{method:'POST',body:{username,password:newPassword,recoveryCode:recovery}});
 const recoveredDevice=sessionFrom(recovered.response);
 assert.equal(recovered.payload.user.id,accountId);assert.equal(recovered.payload.revision,2);
 assert(typeof recovered.payload.recoveryCode==='string'&&recovered.payload.recoveryCode!==recovery,'Recovery must rotate its one-time code');
 await api('accounts/me',{cookie:deviceA,expect:401,code:'NOT_AUTHENTICATED'});
 await api('accounts/me',{cookie:deviceB,expect:401,code:'NOT_AUTHENTICATED'});
 await api('accounts/login',{method:'POST',body:{username,password},expect:401,code:'INVALID_CREDENTIALS'});
 await api('accounts/recover',{method:'POST',body:{username,password:newPassword,recoveryCode:recovery},expect:401,code:'INVALID_CREDENTIALS'});
 const afterRecovery=await get(recoveredDevice,accountId);assert.equal(afterRecovery.payload.revision,2);assert.deepEqual(afterRecovery.payload.save,second);
 const freshLogin=await api('accounts/login',{method:'POST',body:{username,password:newPassword}}),freshDevice=sessionFrom(freshLogin.response);
 checks.push('Password recovery uses native scrypt, rotates the code, revokes both old sessions and preserves the exact cloud save');

 const logout=await api('accounts/logout',{method:'POST',cookie:recoveredDevice,body:{accountId}});
 assert(logout.response.headers.get('Set-Cookie')?.includes('Max-Age=0'),'Logout must expire the browser session cookie');
 await api('accounts/me',{cookie:recoveredDevice,expect:401,code:'NOT_AUTHENTICATED'});
 const stillSignedIn=await api('accounts/me',{cookie:freshDevice});assert.equal(stillSignedIn.payload.user.id,accountId);
 await api('accounts/logout',{method:'POST',cookie:freshDevice,body:{accountId}});
 await api('accounts/me',{cookie:freshDevice,expect:401,code:'NOT_AUTHENTICATED'});
 checks.push('Logout revokes only the chosen device session and expires its secure cookie');
} finally {
 await within(runtime.dispose(),'Disposing the isolated workerd runtime',15000);
}
console.log(JSON.stringify({status:'PASS',runtime:'workerd / Miniflare 4 / SQLite Durable Objects / native scrypt',groups:checks.length,checks},null,2));
