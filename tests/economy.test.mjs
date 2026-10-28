import {addTackle} from '../dist/tackle.js';
import {assembleRods} from './tackle-fixtures.mjs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {WATERS,GEAR,SUPPLIES,SPECIES,SLOT_LEVELS,SLOT_COSTS,RECIPES,BOATS,ESTATE_PRICE,ESTATE_UPGRADE_BASE} from '../dist/data.js';
import {SESSION_CAP,OFFLINE_HOURS,permitCost,charterCost,fishSaleValue} from '../dist/economy.js';
const checks=[],round=n=>Math.round(n*100)/100;
function setup({persist=true}={}){let now=1800000000000;const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},g=new IdleGame({storage:persist?storage:null,now:()=>now});g.state.seed=123456;return {g,storage,now:()=>now,advance:seconds=>{now+=seconds*1000;g.advanceTo(now);},elapse:seconds=>{now+=seconds*1000;}};}
function equip(c,waterId='poldermeer',count=2){const g=c.g,w=WATERS.find(w=>w.id===waterId),level=Math.max(18,w.level);g.state.xp=xpAt(level);g.state.money=1e12;g.state.legacy.count=1;g.state.rodSlots=6;for(const x of GEAR)g.state.gear[x.id]=6;const style=w.sea?'zee':'feeder',tier=level>=250?'sovereign':level>=160?'apex':level>=90?'heritage':level>=45?'specialist':level>=20?'river':level>=8?'scout':'field';const hook=level>=200?'hook_50':level>=120?'hook_10':level>=80?'hook_2':level>=40?'hook_4':level>=20?'hook_6':'hook_8';const rods=Array.from({length:count},(_,slot)=>({...starterRod(style),slot,rod:`${style}_rod_${tier}`,reel:`${style}_reel_${tier}`,terminal:`${style}_terminal_${tier}`,line:`line_${tier}`,hook}));assert(g.setSessionRods(assembleRods(g,rods)).ok);assert(g.selectWater(waterId).ok);return g;}
{
 assert.equal(SESSION_CAP,7*86400);assert.deepEqual(OFFLINE_HOURS,[8,16,24,48,96,168]);assert.equal(permitCost('rietplas',60),1);assert.equal(permitCost('rietplas',900),2);assert.equal(permitCost('poldermeer',8*3600),9);assert.equal(permitCost('poldermeer',SESSION_CAP),32);
 for(const water of WATERS){let previous=0;for(let seconds=60;seconds<=SESSION_CAP;seconds+=60){const price=permitCost(water,seconds);assert(price>=previous,`${water.id} price falls at ${seconds}s`);previous=price;}assert(permitCost(water,SESSION_CAP)<permitCost(water,3600)*168);assert(permitCost(water,8*3600)>=permitCost(water,8*3600-1));assert(charterCost(water,SESSION_CAP)>=charterCost(water,8*3600));if(!water.sea)assert.equal(charterCost(water,SESSION_CAP),0);}
 checks.push('Fixed water tariffs are monotonic minute-by-minute through a week, with continuous longer-pass discounts and no eight-hour price cliff');
}
{
 const c=setup(),g=equip(c);g.setPlan({duration:8*3600});const q=g.quote(),one=g.quote({loadout:{...g.loadout,rods:[g.loadout.rods[0]]}});assert.equal(q.licenseCost,one.licenseCost);assert(q.expectedGross>one.expectedGross);assert(q.consumablesCost>one.consumablesCost);const forecast=g.forecast(),replacement=Object.entries(q.rates).reduce((n,[id,rate])=>n+rate*480*SUPPLIES.find(s=>s.id===id).price,0);assert.equal(q.expectedGross,round(forecast.auto.value*8));assert.equal(q.consumablesCost,round(replacement));assert.equal(q.expectedNet,round(q.expectedGross-q.consumablesCost-q.licenseCost-q.charter));const cash=g.state.money;assert(g.buyLicense().ok);assert.equal(round(cash-g.state.money),q.licenseCost);assert.equal(g.state.permits.poldermeer,q.licenseExpiry);assert.equal(g.quote().licenseCost,0);
 checks.push('Two rods improve earnings without increasing the permit; quote, direct permit purchase and full replacement-cost profit agree');
}
{
 const results=[];for(const water of WATERS){const c=setup(),g=equip(c,water.id);for(const duration of [3600,8*3600,SESSION_CAP]){g.setPlan({duration});const q=g.quote();assert(q.valid,`${water.id}: ${q.error}`);assert(q.expectedNet>0,`${water.id} ${duration}s should have a positive expected margin`);if(duration===8*3600)results.push({water:water.id,license:q.licenseCost,charter:q.charter,gross:q.expectedGross,consumables:q.consumablesCost,net:q.expectedNet});}if(water.sea){const charter=g.quote().charter;assert(charter>0);g.state.fleet.push({id:'own',type:'cutter',mode:'port',remaining:0,duration:0});assert.equal(g.quote().charter,0);}}
 checks.push('Sensible unlocked two-rod freshwater and sea loadouts retain positive expected margins at one hour, eight hours and one week');
 console.log(JSON.stringify({tariffExamples:results},null,2));
}
{
 const c=setup(),g=c.g;g.setPlan({duration:SESSION_CAP+86400});assert.equal(g.state.plan.duration,SESSION_CAP);assert.equal(g.state.plan.license,SESSION_CAP);assert.equal(g.sessionCap,SESSION_CAP);assert.equal(g.offlineCap,8*3600);const q=g.quote();assert(q.valid);assert(q.offlineLimited);assert.equal(q.offlineSeconds,8*3600);g.state.money=1e8;assert(g.startSession().ok);assert.equal(g.state.session.duration,SESSION_CAP);const expiry=g.state.permits.rietplas;const reloaded=new IdleGame({storage:c.storage,now:c.now});assert.equal(reloaded.state.plan.duration,SESSION_CAP);assert.equal(reloaded.state.session.duration,SESSION_CAP);assert.equal(reloaded.state.session.remaining,SESSION_CAP);assert.equal(reloaded.state.permits.rietplas,expiry);const raw=JSON.parse(reloaded.exportSave());raw.save.upgrades.offline=5;assert(reloaded.importSave(JSON.stringify(raw)).ok);assert.equal(reloaded.state.session.duration,SESSION_CAP);assert.equal(reloaded.offlineCap,SESSION_CAP);for(let level=0;level<OFFLINE_HOURS.length;level++){reloaded.state.upgrades.offline=level;assert.equal(reloaded.offlineCap,OFFLINE_HOURS[level]*3600);}
 checks.push('Week-long plans and running sessions survive reload/import independently of the progressive offline-processing allowance');
}
{
 const c=setup(),g=c.g;g.state.money=1e8;g.state.upgrades.autosell=1;g.state.settings.autosell=true;g.state.settings.keepTrophies=false;g.setPlan({duration:SESSION_CAP});assert(g.startSession().ok);c.elapse(9*3600);const reload=new IdleGame({storage:c.storage,now:c.now});assert.equal(reload.state.session,null);assert.equal(reload.welcome.processed,8*3600);assert(Math.abs(reload.state.lastSession.seconds-8*3600)<.00001);assert(reload.state.lastSession.reason.includes('Offline'));assert.equal(reload.state.permits.rietplas,1800000000000+SESSION_CAP*1000);
 checks.push('A week permit does not grant unpurchased offline progress: a nine-hour absence processes eight hours and retains the paid permit');
}
{
 const c=setup({persist:false}),g=equip(c,'poldermeer');g.state.xp=xpAt(300);g.state.upgrades.offline=5;g.state.upgrades.autosell=1;g.state.upgrades.rodrest=2;g.state.upgrades.autostrike=3;g.state.upgrades.stealth=3;g.state.settings.autosell=true;g.state.settings.keepTrophies=false;const rods=['feeder','feeder','karper','karper','karper','dobber'].map((style,slot)=>({...starterRod(style),slot,rod:`${style}_rod_sovereign`,reel:`${style}_reel_sovereign`,terminal:`${style}_terminal_sovereign`,line:'line_sovereign',hook:'hook_8'}));assert(g.setSessionRods(assembleRods(g,rods)).ok);g.setPlan({duration:SESSION_CAP,reserve:.1});const quote=g.quote(),beforeStock={...g.state.stock},begin=performance.now();assert(g.startSession().ok);const paid=g.state.money;c.advance(SESSION_CAP);const elapsed=performance.now()-begin;assert.equal(g.state.session,null,'event guard must not truncate a full six-rod week');assert(Math.abs(g.state.lastSession.seconds-SESSION_CAP)<.00001);assert(Math.abs(g.state.stats.playSeconds-SESSION_CAP)<.001);assert(g.state.stats.caught>40000);assert.equal(g.state.sessions[0].fish.length,g.state.stats.caught);assert(g.state.money>paid);for(const[id,rate]of Object.entries(quote.rates)){const purchased=quote.missing[id],expected=(beforeStock[id]||0)+purchased-rate*SESSION_CAP/60;assert(Math.abs(g.state.stock[id]-expected)<.001,`${id} consumption must cover exactly one week`);}assert(elapsed<20000,`full week exceeded 20s: ${elapsed}ms`);console.log(JSON.stringify({sixRodWeek:{seconds:SESSION_CAP,catches:g.state.stats.caught,elapsedMs:Math.round(elapsed),value:g.state.lastSession.value,jsonCharacters:JSON.stringify(g.state).length,jsonUtf16Bytes:JSON.stringify(g.state).length*2}},null,2));
 checks.push('A full six-rod week reaches its exact boundary with all catches and supply consumption intact, without the previous event-loop truncation');
}

{
 const f=id=>SPECIES.find(f=>f.id===id);
 assert.equal(fishSaleValue(.08,f('voorn').value),.16);assert.equal(fishSaleValue(.2,f('voorn').value),.4);assert.equal(fishSaleValue(1,f('brasem').value),2.5);assert.equal(fishSaleValue(10,f('schub').value),50);assert.equal(fishSaleValue(100,f('tonijn').value),2400);assert.equal(fishSaleValue(.2,f('voorn').value,2),.44);
 const c=setup(),g=c.g;assert.equal(g.state.money,150);g.setPlan({duration:900});assert(g.startSession().ok);c.advance(900);assert(g.state.net.some(f=>f.value<1),'Small fish must have sub-euro values');for(const caught of g.state.net)assert.equal(caught.value,fishSaleValue(caught.weight,f(caught.species).value));const rows=g.forecast().rods[0].rows;for(const row of rows)assert.equal(row.value,fishSaleValue(row.mean,f(row.id).value));
 checks.push('New catches and statistics share cent-precision fish prices, including sub-euro small fish and market prestige');
}
{
 const summaries=[];
 for(const scenario of ['starter15m','polderTwoRods1h']){
  let totalNet=0,totalGross=0,totalCaught=0,forecastNet=0;
  for(let seed=1;seed<=80;seed++){
   const c=setup({persist:false}),g=scenario==='starter15m'?c.g:equip(c);g.state.seed=(seed*2654435761)>>>0;g.state.stock={};g.state.upgrades.net=5;g.setPlan({duration:scenario==='starter15m'?900:3600,reserve:0});const quote=g.quote();assert(quote.expectedNet>0);forecastNet=quote.expectedNet;assert(g.startSession().ok);c.advance(g.state.plan.duration);assert.equal(g.state.session,null);assert(Math.abs(g.state.lastSession.seconds-g.state.plan.duration)<.00001);totalNet+=g.state.lastSession.value-quote.total;totalGross+=g.state.lastSession.value;totalCaught+=g.state.lastSession.caught;
   for(const row of g.state.net)assert.equal(row.value,fishSaleValue(row.weight,SPECIES.find(s=>s.id===row.species).value));
  }
  const actualNet=totalNet/80;assert(actualNet>0,scenario+' must stay profitable including all replaced supplies');assert(Math.abs(actualNet-forecastNet)/forecastNet<.12,scenario+' forecast should track sampled real sessions within 12%');summaries.push({scenario,samples:80,net:round(actualNet),gross:round(totalGross/80),catches:round(totalCaught/80),forecastNet});
 }
 console.log(JSON.stringify({balanceSamples:summaries},null,2));checks.push('Eighty seeded starter and two-rod Polder sessions remain profitable after all feed and permits, and agree with the forecast');
}
{
 const c=setup(),g=c.g;assert(g.startSession().ok);c.advance(300);assert(g.state.net.length);const held=g.state.net[0];held.value=777.75;const encoded=g.state.session.fish.find(r=>(typeof r[0]==='number'?'fish_'+r[0]:r[0])===held.id);encoded[3]=777.75;g.state.catchChoices[held.id]='release';g.state.money=98765.43;addTackle(g.state,'feeder_rod_field',2);g.state.stock.feed=1234.5;g.state.fleetBank=4321.09;g.state.estate.bank=123.45;g.state.estate.owned=true;const runtime=g.state.session.rods[0];runtime.phase='bite';runtime.candidate={id:'fish_999999',species:'voorn',name:'Blankvoorn',weight:.2,value:99.25,xp:9,water:'rietplas',eligible:true,autoRoll:.1,manualRoll:.1};runtime.next=3.2;runtime.total=3.2;runtime.biteStartedAt=c.now();runtime.deadline=c.now()+6000;const snapshot=JSON.parse(g.exportSave()).save;
 const reloaded=new IdleGame({storage:c.storage,now:c.now});const imported=setup().g;imported.now=c.now;assert(imported.importSave(JSON.stringify({save:snapshot})).ok);
 for(const restored of [reloaded,imported]){assert.equal(restored.state.money,98765.43);assert.equal(restored.state.net.find(f=>f.id===held.id).value,777.75);assert.equal(restored.state.catchChoices[held.id],'release');assert.equal(restored.state.session.fish.find(r=>r[3]===777.75)[3],777.75);assert.equal(restored.state.session.rods[0].candidate.value,99.25);assert.equal(restored.state.gear.feeder_rod_field,3);assert.equal(restored.state.stock.feed,1234.5);assert.equal(restored.state.fleetBank,4321.09);assert.equal(restored.state.estate.bank,123.45);assert.deepEqual(restored.state.permits,snapshot.permits);}
 checks.push('Reload and JSON import preserve existing cash, historical and pending catch prices, gear, bait, paid permits and business balances');
}
{
 const c=setup(),g=c.g;g.state.xp=xpAt(10);assert(g.buySlot().ok);assert(g.buyGear('feeder_rod_field').ok);assert(g.buyGear('feeder_reel_field').ok);assert(g.state.money>=10,'Starter cash can afford a second basic setup once level 10 is reached');assert.deepEqual(SLOT_LEVELS,[1,10,40,90,170,300]);assert(SLOT_COSTS.every((x,i)=>i===0||x>SLOT_COSTS[i-1]));assert.equal(ESTATE_PRICE,25000);assert.equal(ESTATE_UPGRADE_BASE,15000);
 for(const recipe of RECIPES){const materials=Object.entries(recipe.cost).reduce((sum,[id,n])=>sum+n*SUPPLIES.find(s=>s.id===id).price,0);assert(recipe.value>materials,recipe.id+' crafting keeps a positive margin');assert(recipe.value<materials*3,'Crafting resale stays proportional to materials');}
 for(const boat of BOATS){assert(boat.fishValue*.85>boat.fuel);assert(boat.price>boat.income*100,'Boats remain a long-term investment');}
 checks.push('Cheaper first gear and second slot fit the starting budget while crafting, fleet margins and escalating unlock investments remain coherent');
}

console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
