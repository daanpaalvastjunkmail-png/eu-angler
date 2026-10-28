import assert from 'node:assert/strict';
import {IdleGame} from '../dist/engine.js';
import {SESSION_CAP} from '../dist/economy.js';
const checks=[];
function setup(seed=123456){let now=1800000000000;const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},g=new IdleGame({storage,now:()=>now});g.state.seed=seed;return {g,storage,now:()=>now,advance:seconds=>{now+=seconds*1000;g.advanceTo(now);},elapse:seconds=>{now+=seconds*1000;}};}
{
 const {g}=setup();assert.equal(g.state.plan.duration,900);assert.equal(g.state.plan.license,900);for(const duration of [60,300,600,900,1800,2700,3600,7200]){assert(g.setPlan({duration,license:48*3600}).ok);assert.equal(g.state.plan.duration,duration);assert.equal(g.state.plan.license,duration);}g.setPlan({duration:-5});assert.equal(g.state.plan.duration,60);assert.equal(g.state.plan.license,60);g.setPlan({duration:999999});assert.equal(g.state.plan.duration,SESSION_CAP);assert.equal(g.state.plan.license,SESSION_CAP);g.setPlan({reserve:.25,license:60});assert.equal(g.state.plan.duration,SESSION_CAP);assert.equal(g.state.plan.license,SESSION_CAP);assert.equal(g.state.plan.reserve,.25);const over=g.quote({plan:{duration:48*3600,reserve:.1}});assert(over.valid);assert(over.offlineLimited);assert.equal(over.offlineSeconds,8*3600);checks.push('One normalized duration drives session and permit, from one minute to one week independently of the offline limit');
}
{
 const {g}=setup(),q=g.quote();assert.equal(q.duration,900);assert.equal(q.licenseDuration,900);assert.equal(q.licenseCost,2);assert.equal(q.total,2);const short=g.quote({plan:{duration:60,license:48*3600,reserve:.1}});assert(short.valid);assert.equal(short.licenseCost,1);assert.equal(short.licenseExpiry,g.now()+60000);assert.equal(short.required.feed,14);assert.equal(short.required.maggots,2);const hour=g.quote({plan:{duration:3600,license:60,reserve:.1}});assert.equal(hour.licenseCost,3);assert.equal(hour.licenseDuration,3600);assert.equal(hour.licenseExpiry,g.now()+3600000);const day=g.quote({plan:{duration:8*3600,license:60,reserve:.1}});assert.equal(day.licenseCost,6);checks.push('Supply estimates and automatic permit cost use chosen time; contradictory legacy license fields cannot overcharge or underquote');
}
{
 const c=setup(),g=c.g;g.setPlan({duration:60,license:3600});const cash=g.state.money,q=g.quote();assert(g.startSession().ok);assert.equal(g.state.session.duration,60);assert.equal(g.state.session.remaining,60);assert.equal(g.state.permits.rietplas,c.now()+60000);assert.equal(g.state.money,cash-q.total);assert.equal(g.state.stats.permits,1);checks.push('Starting a one-minute session buys exactly a one-minute pass once and pays the displayed total');
}
{
 const c=setup(),g=c.g;g.state.permits.rietplas=c.now()+120000;g.setPlan({duration:300});const q=g.quote();assert(!q.hasLicense);assert.equal(q.licenseCost,1);assert.equal(q.licenseExpiry,c.now()+420000);assert(g.startSession().ok);assert.equal(g.state.session.duration,300);assert.equal(g.state.permits.rietplas,q.licenseExpiry);const d=setup();d.g.state.permits.rietplas=d.now()+120000;d.g.setPlan({duration:300,license:3600});const cash=d.g.state.money;assert(d.g.buyLicense().ok);assert.equal(d.g.state.money,cash-q.licenseCost);assert.equal(d.g.state.permits.rietplas,q.licenseExpiry);assert.equal(d.g.quote().licenseCost,0);checks.push('A partial paid permit retains its remaining time; both purchase paths add the selected duration for the same price');
}
{
 const c=setup(),g=c.g;g.state.permits.rietplas=c.now()+3600000;g.setPlan({duration:900});const expiry=g.state.permits.rietplas,q=g.quote(),cash=g.state.money;assert(q.hasLicense);assert.equal(q.licenseCost,0);assert(g.startSession().ok);assert.equal(g.state.money,cash-q.suppliesCost-q.charter);assert.equal(g.state.permits.rietplas,expiry);assert.equal(g.state.stats.permits,0);checks.push('Previously purchased permits that already cover the session are respected without charging again or discarding time');
}
{
 const c=setup(),g=c.g;g.setPlan({duration:900});assert(g.startSession().ok);c.advance(120);const raw=JSON.parse(g.exportSave());raw.save.plan={duration:300,license:48*3600,reserve:.25};const active=structuredClone(raw.save.session),expiry=raw.save.permits.rietplas;assert(g.importSave(JSON.stringify(raw)).ok);assert.deepEqual(g.state.plan,{duration:300,license:300,reserve:.25});assert.equal(g.state.session.duration,active.duration);assert.equal(g.state.session.remaining,active.remaining);assert.equal(g.state.session.startedAt,active.startedAt);assert.equal(g.state.permits.rietplas,expiry);const reload=new IdleGame({storage:c.storage,now:c.now});assert.equal(reload.state.plan.license,300);assert.equal(reload.state.session.duration,900);assert(Math.abs(reload.state.session.remaining-780)<1e-8);assert.equal(reload.state.permits.rietplas,expiry);raw.save.plan.duration=48*3600;raw.save.upgrades.offline=1;assert(g.importSave(JSON.stringify(raw)).ok);assert.equal(g.state.plan.duration,48*3600);assert.equal(g.state.plan.license,48*3600);assert.equal(g.state.session.duration,900);assert.equal(g.state.permits.rietplas,expiry);raw.save.upgrades.offline=5;assert(g.importSave(JSON.stringify(raw)).ok);assert.equal(g.state.plan.duration,48*3600);assert.equal(g.state.plan.license,48*3600);checks.push('Import and reload retain long plan durations independently of the offline upgrade, preserving running sessions and paid passes');
}
{
 const live=setup(),offline=setup();for(const c of [live,offline]){c.g.setPlan({duration:60});assert(c.g.startSession().ok);}for(let i=0;i<60;i++)live.advance(1);offline.elapse(60);const reload=new IdleGame({storage:offline.storage,now:offline.now});assert.equal(live.g.state.session,null);assert.equal(reload.state.session,null);assert(Math.abs(live.g.state.lastSession.seconds-60)<1e-6);assert(Math.abs(reload.state.lastSession.seconds-60)<1e-6);assert.equal(live.g.state.stats.caught,reload.state.stats.caught);assert.equal(live.g.state.xp,reload.state.xp);assert(Math.abs(live.g.state.stock.feed-reload.state.stock.feed)<1e-6);assert(reload.state.net.length>0);assert(reload.awaitingSettlement);assert(!reload.startSession().ok);const count=reload.state.net.length,value=reload.state.net.reduce((n,f)=>n+f.value,0),cash=reload.state.money;assert.equal(reload.settleSession().sold,count);assert.equal(reload.state.money,Math.round((cash+value+Number.EPSILON)*100)/100);assert(!reload.awaitingSettlement);assert(reload.startSession().ok);assert.equal(reload.state.permits.rietplas,offline.now()+60000);checks.push('A minute ends identically live and offline, requires catch checkout and then purchases a fresh matching pass for the next session');
}
{
 const {g}=setup(),hour=3600;
 for(const [requested,expected] of [[24,24],[25,24],[36,24],[36.01,48],[48,48],[60,48],[72,72],[84,72],[96,96],[108,96],[120,120],[132,120],[144,144],[156,144],[168,168]]){
  assert(g.setPlan({duration:requested*hour}).ok);
  assert.equal(g.state.plan.duration,expected*hour);
  assert.equal(g.state.plan.license,expected*hour);
  const quote=g.quote({plan:{duration:requested*hour}});
  assert.equal(quote.duration,expected*hour);assert.equal(quote.licenseDuration,expected*hour);
 }
 assert(g.setPlan({duration:12345}).ok);assert.equal(g.state.plan.duration,12345,'Existing shorter arbitrary durations must be preserved');
 checks.push('Future plans and quotes use whole days after 24 hours, with former half-day ties rounded down and short durations preserved');
}
{
 const hour=3600;
 for(const [legacyHours,plannedHours] of [[36,24],[60,48]]){
  const c=setup(),g=c.g;assert(g.startSession().ok);
  const raw=JSON.parse(g.exportSave());
  raw.save.plan={duration:legacyHours*hour,license:legacyHours*hour,reserve:.25};
  raw.save.session.duration=legacyHours*hour;
  raw.save.session.remaining=legacyHours*hour-120;
  raw.save.session.startedAt=c.now()-120000;
  raw.save.permits.rietplas=c.now()+(legacyHours*hour-120)*1000;
  const legacySession=structuredClone(raw.save.session),expiry=raw.save.permits.rietplas;
  const verify=game=>{
   assert.deepEqual(game.state.plan,{duration:plannedHours*hour,license:plannedHours*hour,reserve:.25});
   assert.equal(game.state.session.duration,legacySession.duration);
   assert.equal(game.state.session.remaining,legacySession.remaining);
   assert.equal(game.state.session.startedAt,legacySession.startedAt);
   assert.equal(game.state.permits.rietplas,expiry);
  };
  assert(g.importSave(JSON.stringify(raw)).ok);verify(g);
  c.storage.setItem('europa-angler-idle-v2',JSON.stringify(raw.save));
  const reloaded=new IdleGame({storage:c.storage,now:c.now});verify(reloaded);
  verify(new IdleGame({storage:c.storage,now:c.now}));
 }
 checks.push('Import and reload migrate old 36h/60h plans to daily steps while preserving each running session, remaining time and paid permit');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
