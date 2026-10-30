import assert from 'node:assert/strict';
import {IdleGame,xpAt} from '../dist/engine.js';
import {BAIT_FIELDS,HARDWARE_FIELDS} from '../dist/rig-presets.js';
import {sameSetup,refreshSelectionReferences,SCHEMA_VERSION} from '../dist/tackle.js';
import {SUPPLIES} from '../dist/data.js';
import {memoryStorage} from './tackle-fixtures.mjs';

const checks=[],clone=structuredClone,pick=(rod,fields)=>Object.fromEntries(fields.map(key=>[key,rod[key]]));
function setup(level=60,two=true){let now=1800000000000;const storage=memoryStorage(),g=new IdleGame({storage,now:()=>now});g.state.xp=xpAt(level);g.state.money=1e5;if(two){g.state.rodSlots=2;assert(g.chooseSessionRod(1,'rig_karper').ok);}return {g,storage,now:()=>now,advance:seconds=>{now+=seconds*1000;g.advanceTo(now);}};}
const richBait={bait:'worms',combo:'worms_maggots',baitSize:'small',liquid:'liquid_scopex'};

{
 const {g}=setup(),presets=clone(g.state.rodPresets),inventory=clone(g.state.tackleItems),other=clone(g.loadout.rods[1]),training=g.training(),forecast=g.forecast();
 assert(g.setPlannedBait(0,richBait).ok);assert.deepEqual(pick(g.loadout.rods[0],BAIT_FIELDS),richBait);assert(sameSetup(g.loadout.rods[0],presets[0].rod));assert.deepEqual(g.state.rodPresets,presets);assert.deepEqual(g.state.tackleItems,inventory);assert.deepEqual(g.loadout.rods[1],other);assert.deepEqual(g.training(),training);
 const quote=g.quote();assert(quote.valid);assert.equal(quote.rates.worms,1.2);assert.equal(quote.rates.maggots,.72);assert.equal(quote.rates.corn,.65);assert.equal(quote.rates.liquid_scopex,.5);assert.notDeepEqual(g.forecast(),forecast);
 assert(g.setSessionRods(clone(g.loadout.rods)).ok);assert.deepEqual(pick(g.loadout.rods[0],BAIT_FIELDS),richBait);
 checks.push('Per-trip bait controls actual forecasts, stock estimates and consumption without changing hardware, presets, another rod or training requirements');
}
{
 const {g,storage,now}=setup();assert(g.setPlannedBait(0,richBait).ok);const oldPreset=clone(g.state.rodPresets[0]);refreshSelectionReferences(g.state);assert.deepEqual(pick(g.loadout.rods[0],BAIT_FIELDS),richBait);
 assert(g.buyGear('feeder_rod_scout').ok);const rod=g.state.tackleItems.find(item=>item.gearId==='feeder_rod_scout');
 assert(g.saveRodPreset(oldPreset.id,'New hardware',{...oldPreset.rod,rod:rod.gearId,bait:'corn'},{...oldPreset.items,rod:rod.id}).ok);
 assert.equal(g.loadout.rods[0].rod,rod.gearId);assert.deepEqual(pick(g.loadout.rods[0],BAIT_FIELDS),richBait);assert(g.chooseSessionRod(0,oldPreset.id).ok);assert.deepEqual(pick(g.loadout.rods[0],BAIT_FIELDS),richBait);
 const loaded=new IdleGame({storage,now});assert.equal(loaded.state.schemaVersion,SCHEMA_VERSION);assert.equal(SCHEMA_VERSION,5);assert.deepEqual(pick(loaded.loadout.rods[0],BAIT_FIELDS),richBait);assert.equal(loaded.loadout.rods[0].rod,rod.gearId);
 checks.push('Selection refresh, reselecting the same physical rod, hardware editing and schema-5 reload retain the independent trip bait');
}
{
 const {g}=setup();assert(g.startSession().ok);const before=clone(g.state),target=before.session.loadout.rods[0];
 const quote=g.sessionBaitQuote(0,richBait);assert(quote.valid&&quote.changed&&quote.affordable);assert.equal(quote.remaining,900);assert.equal(quote.required.feed,300);assert.equal(quote.required.worms,18);assert.equal(quote.required.maggots,11);assert.equal(quote.required.corn,10);assert.equal(quote.required.liquid_scopex,8);assert.equal(quote.missing.liquid_scopex,8);assert.equal(quote.total,.36);assert.deepEqual(g.state,before,'Quoting is read-only');
 const result=g.changeSessionBait(0,richBait);assert(result.ok);assert.equal(result.cost,quote.total);assert.equal(g.state.money,before.money-quote.total);assert.equal(g.state.session.cost,Math.round((before.session.cost+quote.total)*100)/100);assert.deepEqual(g.state.session.rates,quote.rates);assert.deepEqual(pick(g.state.session.loadout.rods[0],HARDWARE_FIELDS),pick(target,HARDWARE_FIELDS));assert.deepEqual(g.state.session.loadout.rods[1],before.session.loadout.rods[1]);assert.deepEqual(g.state.session.rods[1],before.session.rods[1]);assert.deepEqual(g.state.rodPresets,before.rodPresets);assert.deepEqual(g.state.tackleItems,before.tackleItems);assert.deepEqual(g.state.permits,before.permits);assert.deepEqual(g.state.net,before.net);assert.deepEqual(g.state.sessions,before.sessions);
 for(const key of ['id','duration','remaining','startedAt','caught','weight','xp','value','fish','boat','charter'])assert.deepEqual(g.state.session[key],before.session[key],key);
 assert.equal(g.state.session.rods[0].phase,'waiting');assert.equal(g.state.session.rods[0].candidate,null);assert.equal(g.state.session.rods[0].caught,before.session.rods[0].caught);assert.deepEqual(pick(g.state.selectedRods[0],BAIT_FIELDS),richBait);assert.deepEqual(pick(g.state.selectedRods[1],BAIT_FIELDS),pick(before.selectedRods[1],BAIT_FIELDS));
 checks.push('Live re-baiting pays the quoted remainder once, updates rates and only recasts the chosen rod while preserving session clock, catches, permits, hardware and the other line');
}
{
 const {g}=setup(10),invalid=[{bait:'missing'},{bait:'worms',combo:'corn_maggots'},{combo:'worms_maggots'},{bait:'krill'},{liquid:'liquid_scopex'},{liquid:'corn'},{liquid:false},{baitSize:'huge'},{baitSize:null},{bait:undefined},{rod:'feeder_rod_sovereign'},[],null];
 for(const patch of invalid){const before=clone(g.state);assert.equal(g.setPlannedBait(0,patch).ok,false);assert.deepEqual(g.state,before);}
 for(const slot of [-1,2,.5,'0']){const before=clone(g.state);assert(!g.setPlannedBait(slot,{bait:'corn'}).ok);assert.deepEqual(g.state,before);}
 assert(g.startSession().ok);for(const patch of invalid){const before=clone(g.state),quote=g.sessionBaitQuote(0,patch);assert(!quote.valid);assert.equal(quote.code,'INVALID_BAIT');assert.equal(g.changeSessionBait(0,patch).ok,false);assert.deepEqual(g.state,before);}
 assert.equal(g.sessionBaitQuote(9,{bait:'corn'}).code,'INVALID_ROD');assert(!g.setPlannedBait(0,{bait:'corn'}).ok);
 checks.push('Malformed patches, unknown fields, stealth gear swaps, unavailable bait/liquids/combinations, incompatible cocktails and invalid slots fail without purchases or state mutation');
}
{
 const {g}=setup();assert(g.startSession().ok);g.state.stock.liquid_scopex=0;g.state.money=0;let before=clone(g.state),quote=g.sessionBaitQuote(0,richBait);assert(quote.valid&&!quote.affordable);assert(quote.total>0);assert(!g.changeSessionBait(0,richBait).ok);assert.deepEqual(g.state,before);
 g.state.money=100;for(const phase of ['nibble','bite','rescue']){g.state.session.rods[0].phase=phase;g.state.session.rods[0].candidate={species:'voorn',weight:.3,value:.6,xp:9};before=clone(g.state);quote=g.sessionBaitQuote(0,richBait);assert.equal(quote.code,'BITE_ACTIVE');assert(!g.changeSessionBait(0,richBait).ok);assert.deepEqual(g.state,before);}
 g.state.session.rods[0].phase='waiting';g.state.session.rods[0].candidate=null;g.state.stock.liquid_scopex=20;before=clone(g.state);quote=g.sessionBaitQuote(0,richBait);assert.equal(quote.total,0);assert(g.changeSessionBait(0,richBait).ok);assert.equal(g.state.money,before.money);assert.equal(g.state.stock.liquid_scopex,20);
 before=clone(g.state);quote=g.sessionBaitQuote(0,richBait);assert(quote.valid&&!quote.changed);assert.equal(quote.total,0);assert(g.changeSessionBait(0,richBait).ok);assert.deepEqual(g.state,before,'Selecting the current bait does not reroll a cast or repurchase supplies');
 checks.push('Insufficient funds and active bites are protected; existing stock is reused, and selecting unchanged bait cannot reroll casts or charge twice');
}
{
 const {g,advance,storage,now}=setup();assert(g.startSession().ok);assert(g.changeSessionBait(0,richBait).ok);const session=clone(g.state.session),selected=clone(g.state.selectedRods),cash=g.state.money;g.save();
 const loaded=new IdleGame({storage,now});assert.deepEqual(loaded.state.selectedRods,selected);assert.deepEqual(loaded.state.session.loadout,session.loadout);assert.deepEqual(loaded.state.session.rates,session.rates);assert.equal(loaded.state.session.cost,session.cost);assert.equal(loaded.state.money,cash);assert.equal(loaded.state.session.remaining,session.remaining);
 const stock=clone(g.state.stock);advance(1);for(const [id,rate]of Object.entries(session.rates))assert(Math.abs(g.state.stock[id]-(stock[id]-rate/60))<1e-9,id);
 assert(g.stop().ok);assert.equal(g.state.sessions[0].cost,session.cost);assert.deepEqual(pick(g.loadout.rods[0],BAIT_FIELDS),richBait);
 checks.push('Changed bait survives active-session reload, consumes the new combined rates on the next tick, remains planned for the next trip and records re-bait cost in the session journal');
}
{
 const {g}=setup();assert(g.startSession().ok);g.damageRod(1,100);const before=clone(g.state);assert.equal(g.sessionBaitQuote(1,{bait:'maggots'}).code,'BROKEN_ROD');assert(!g.changeSessionBait(1,{bait:'maggots'}).ok);assert.deepEqual(g.state,before);
 const quote=g.sessionBaitQuote(0,richBait);assert(quote.valid);assert.equal(quote.rates.feed,12);assert.equal(quote.rates.corn,undefined);assert(g.changeSessionBait(0,richBait).ok);assert.equal(g.state.session.rods[1].phase,'broken');assert.deepEqual(g.state.session.rods[1],before.session.rods[1]);
 checks.push('A broken rod cannot be re-baited, remains broken and contributes no supply requirement when another live rod changes bait');
}
{
 const {g}=setup(),legacy=clone(g.state);legacy.rodPresets[0].rod={...legacy.rodPresets[0].rod,...richBait};legacy.selectedRods[0]={...legacy.selectedRods[0],...richBait};
 const imported=new IdleGame({storage:memoryStorage(),now:g.now});assert(imported.importSave(JSON.stringify(legacy)).ok);assert.deepEqual(pick(imported.loadout.rods[0],BAIT_FIELDS),richBait);assert.deepEqual(imported.state.rodPresets,legacy.rodPresets);assert.deepEqual(imported.state.tackleItems,legacy.tackleItems);for(const supply of SUPPLIES)assert.equal(imported.state.stock[supply.id]||0,legacy.stock[supply.id]||0);assert.equal(imported.state.money,legacy.money);
 imported.state.xp=xpAt(10);assert(imported.resolveRodPreset('rig_feeder').ok,'Locked legacy bait must not make valid assembled hardware unavailable');const preset=imported.state.rodPresets[0];assert(imported.saveRodPreset(preset.id,'Hardware name',preset.rod,preset.items).ok,'Workshop can still edit hardware without exposing old bait');assert(imported.setPlannedBait(0,{bait:'corn',baitSize:'normal',combo:'none',liquid:null}).ok);
 checks.push('Old schema-5 preset bait and inventories import unchanged; hidden legacy bait cannot block hardware editing or choosing an available bait for the trip');
}
{
 const {g}=setup(60),now=g.now();assert(g.startSession().ok);const current=clone(g.state.session);g.state.stock.feed=0;g.state.stock.worms=0;g.state.stock.maggots=0;g.state.stock.corn=0;g.state.session.remaining=61;
 const quote=g.sessionBaitQuote(0,richBait);assert.equal(quote.required.feed,21);assert.equal(quote.required.worms,2);assert.equal(quote.required.maggots,1);assert.equal(quote.required.corn,1);assert.equal(quote.required.liquid_scopex,1);const sum=Object.entries(quote.missing).reduce((total,[id,count])=>total+Math.round(count*SUPPLIES.find(item=>item.id===id).price*100)/100,0);assert.equal(quote.total,Math.round(sum*100)/100);
 assert(g.changeSessionBait(0,richBait).ok);assert.equal(g.state.session.remaining,61);assert.equal(g.state.session.startedAt,now);assert.equal(g.state.session.duration,current.duration);assert.equal(g.state.permits.rietplas,now+current.duration*1000);
 checks.push('A late-session bait change buys rounded units for only the remaining seconds, including shared supply needs, without extending the session or permit');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
