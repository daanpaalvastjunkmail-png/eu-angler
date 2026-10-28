import assert from 'node:assert/strict';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {GEAR} from '../dist/data.js';
import {PARTS,addTackle,ownerOf,assemblyError,repairQuote} from '../dist/tackle.js';
import {trainingQuote,rodPoints,rodRating,rodRisk} from '../dist/training.js';
import {assembleRods,memoryStorage} from './tackle-fixtures.mjs';
const checks=[],clone=structuredClone;
function setup(level=1){let now=1800000000000;const storage=memoryStorage(),g=new IdleGame({storage,now:()=>now});g.state.xp=xpAt(level);g.state.money=1e6;return {g,storage,advance:s=>{now+=s*1000;g.advanceTo(now);},now:()=>now};}
{
 const {g}=setup();assert.equal(g.state.settings.language,'en');assert.equal(g.state.schemaVersion,4);assert.equal(g.state.rodPresets.length,3);const ids=g.state.rodPresets.flatMap(p=>Object.values(p.items));assert.equal(new Set(ids).size,ids.length);assert(g.state.rodPresets.every(p=>!assemblyError(g.state,p)));assert.equal(g.state.tackleItems.filter(i=>i.starter&&GEAR.find(g=>g.id===i.gearId).category==='rod').length,3);
 const before=clone(g.state);assert(!g.saveRodPreset(null,'Duplicate',starterRod('feeder')).ok);assert.deepEqual(g.state,before);assert(!g.saveRodPreset('missing','Missing',starterRod('feeder')).ok);
 checks.push('Three starter assemblies have exclusive component units; building with occupied parts fails atomically');
}
{
 const a=starterRod('feeder'),b={...starterRod('karper'),rod:'karper_rod_scout'},t7={...a,rod:'feeder_rod_sovereign'};
 for(const [level,rods,allowed,used] of [[9,[a,a],false,4],[10,[a,a],true,4],[14,[a,b],false,5],[15,[a,b],true,5],[17,[b,b],false,6],[18,[b,b],true,6],[300,Array(6).fill(t7),true,156]]){const t=trainingQuote(level,rods);assert.equal(t.allowed,allowed);assert.equal(t.used,used);}
 assert.equal(rodPoints({...a,reel:'feeder_reel_river'}),5);
 const {g}=setup(10);g.state.rodSlots=2;const rods=assembleRods(g,[b,b]);assert(!g.setSessionRods(rods).ok);g.state.xp=xpAt(18);assert(g.setSessionRods(rods).ok);assert.equal(g.quote().valid,true);
 checks.push('Training gates two T1 at 10, T1+T2 at 15 and two T2 at 18; reel tier counts and six T7 require 156 points');
}
{
 const {g}=setup(10);const p=clone(g.state.rodPresets[0]);assert(g.setSessionRods([{...p.rod,sourcePresetId:p.id}]).ok);assert(g.saveRodPreset(p.id,'My maize feeder',{...p.rod,bait:'corn'},p.items).ok);assert(g.state.selectedRods.every(r=>r.sourcePresetId!==p.id||r.bait==='corn'));
 g.state.rodSlots=2;assert(!g.setSessionRods([{...p.rod,bait:'corn',sourcePresetId:p.id},{...p.rod,bait:'corn',sourcePresetId:p.id}]).ok);
 assert(g.deleteRodPreset(p.id).ok);assert(g.state.selectedRods.every(r=>r.sourcePresetId!==p.id));assert(Object.values(p.items).every(id=>!ownerOf(g.state,id)));assert(!g.quote().valid);assert(g.saveRodPreset(null,'Rebuilt',p.rod,p.items).ok);assert(g.validate(g.state).selectedRods.length===0);
 checks.push('Edits update selected rods; duplicate deployment is rejected; dismantling clears the selection and releases parts while preserving an empty plan');
}
{
 const c=setup(18),g=c.g;g.state.rodSlots=2;assert(g.setSessionRods(assembleRods(g,[starterRod('feeder'),starterRod('karper')])).ok);assert(g.startSession().ok);const p=g.state.rodPresets.find(p=>p.id==='rig_feeder');assert(!g.saveRodPreset(p.id,'Busy',p.rod,p.items).ok);assert(!g.deleteRodPreset(p.id).ok);g.damageRod(0,100);assert(g.state.session);assert.equal(g.state.session.rods[0].phase,'broken');assert.equal(g.state.session.rates.feed,8);const broken=g.rodItem(g.state.session.loadout.rods[0]);assert.equal(broken.condition,0);assert(!g.repairRod(broken.id).ok);g.save();const reloaded=new IdleGame({storage:c.storage,now:c.now});assert.equal(reloaded.state.session.rods[0].phase,'broken');assert.equal(reloaded.state.session.rates.feed,8);const feed=reloaded.state.stock.feed;reloaded.advanceTo(c.now()+60000);assert(Math.abs(reloaded.state.stock.feed-(feed-8))<1e-8);assert.equal(reloaded.state.session.rods[0].caught,0);reloaded.damageRod(1,100);assert.equal(reloaded.state.session,null);const cash=reloaded.state.money;assert(reloaded.repairRod(broken.id).ok);assert.equal(reloaded.state.money,cash);assert.equal(reloaded.state.tackleItems.find(i=>i.id===broken.id).condition,100);
 checks.push('Deployed rods cannot be edited, dismantled or repaired; one broken line stops its supplies while the other fishes, persists across reload, and original starter repairs are free');
}
{
 const {g}=setup(20);assert(g.buyGear('feeder_rod_field',2).ok);const bought=g.state.tackleItems.filter(i=>i.gearId==='feeder_rod_field'&&!i.starter);assert.equal(bought.length,2);bought[0].condition=0;const q=repairQuote(g.state,bought[0].id);assert.equal(q.cost,8.75);const cash=g.state.money;assert(g.repairRod(bought[0].id).ok);assert.equal(g.state.money,cash-8.75);bought[0].condition=0;g.state.money=0;assert(!g.repairRod(bought[0].id).ok);assert.equal(bought[0].condition,0);g.state.money=1000;
 for(const id of ['line_field','hook_12','feeder_terminal_field','feeder_bell']){const before=g.state.gear[id]||0;assert(g.buyGear(id,2).ok);assert.equal(g.state.gear[id],before+2);}const p=g.state.rodPresets[0];g.state.tackleItems.find(i=>i.id===p.items.rod).condition=0;const items=clone(p.items);assert(g.deleteRodPreset(p.id).ok);assert(!g.saveRodPreset(null,'Cannot heal',p.rod,items).ok);
 checks.push('Every component is purchased in units; bought Field rods have paid repairs below replacement, insufficient cash fails atomically and dismantling does not heal damage');
}
{
 const {g}=setup(20);g.state.crafted.rig_basic=1;const p=g.state.rodPresets[0];assert(g.saveRodPreset(p.id,'Crafted',{...p.rod,crafted:'rig_basic'},p.items).ok);assert(!g.sellRigs('rig_basic',10).ok);const carp=g.state.rodPresets[1];assert(!g.saveRodPreset(carp.id,'Duplicate rig',{...carp.rod,crafted:'rig_basic'},carp.items).ok);assert(g.startSession().ok);assert.equal(g.state.crafted.rig_basic,1);assert.deepEqual(g.quote().rigNeeds,{});
 checks.push('Handmade rigs are reserved by physical assemblies, cannot be double-mounted or sold, and remain mounted between sessions');
}
{
 const {g}=setup(200);const r={...starterRod('feeder'),hook:'hook_6',baitSize:'large',line:'line_heritage'};assert(rodRisk(r).chance>0);assert.equal(rodRisk(starterRod('feeder')).chance,0);const rods=assembleRods(g,[r]);assert(g.setSessionRods(rods).ok);assert(g.startSession().ok);g.roll=()=>0;const item=g.rodItem(g.state.session.loadout.rods[0]);item.condition=20;g.state.net.push({id:'held',species:'voorn',weight:.2,value:.4,xp:5,at:g.now(),water:'rietplas'});g.catchAttempt(0);assert.equal(item.condition,0);assert.equal(g.state.session,null);assert(g.awaitingSettlement);assert(!g.startSession().ok);
 const d=setup(200).g;assert(d.setSessionRods(assembleRods(d,[{...starterRod('feeder'),line:'line_heritage'}])).ok);assert(d.startSession().ok);d.roll=()=>0;const runtime=d.state.session.rods[0];runtime.phase='nibble';runtime.candidate={weight:rodRating(d.loadout.rods[0])+5};const di=d.rodItem(d.loadout.rods[0]);di.condition=30;d.catchAttempt(0);assert.equal(di.condition,0);assert.equal(d.state.session,null);
 checks.push('Oversized hook/bait casts and oversized fish on strong line can break a weak rod; held catches still require settlement');
}
{
 const a=setup(200),b=setup(200);for(const c of [a,b]){c.g.state.seed=123456;c.g.state.upgrades.net=5;assert(c.g.setSessionRods(assembleRods(c.g,[{...starterRod('feeder'),hook:'hook_6',line:'line_heritage',baitSize:'large'}])).ok);assert(c.g.startSession().ok);}a.advance(900);for(let i=0;i<900;i++)b.advance(1);assert.equal(a.g.state.stats.caught,b.g.state.stats.caught);assert.equal(a.g.state.xp,b.g.state.xp);assert.deepEqual(a.g.state.tackleItems,b.g.state.tackleItems);assert.equal(a.g.state.seed,b.g.state.seed);
 checks.push('Offline blocks and live ticks produce identical overload damage, catch counts, XP and random state');
}
{
 const {g}=setup(100);const r=assembleRods(g,[{...starterRod('feeder'),rod:'feeder_rod_scout'}])[0];const id=r.sourcePresetId;assert(g.prestige().ok);assert(g.state.rodPresets.some(p=>p.id===id&&!p.assembled));assert(!g.resolveRodPreset(id).ok);assert.equal(g.state.gear.feeder_rod_scout||0,0);assert(g.quote().valid);assert(g.validate(g.state));
 checks.push('Prestige preserves saved designs without retaining reset equipment or duplicating starter units');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
