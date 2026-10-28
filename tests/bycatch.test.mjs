import {assembleRods} from './tackle-fixtures.mjs';
import assert from 'node:assert/strict';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {GEAR,BAITS,SPECIES,WATERS} from '../dist/data.js';
import {canStockSpecies,encounterPool} from '../dist/catch-model.js';
const checks=[],species=id=>SPECIES.find(f=>f.id===id),cents=n=>Math.round((n+Number.EPSILON)*100)/100;
function setup(seed=42,rod={}){
 let now=1800000000000;const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const g=new IdleGame({storage,now:()=>now});g.state.seed=seed;g.state.xp=xpAt(200);g.state.money=1e7;
 g.state.gear=Object.fromEntries(GEAR.map(i=>[i.id,6]));g.state.upgrades.net=6;
 assert(g.saveLoadout(null,'Bycatch test',assembleRods(g,[{...starterRod('karper'),rod:'karper_rod_heritage',line:'line_heritage',...rod}])).ok);assert(g.selectWater('poldermeer').ok);
 g.setPlan({duration:8*3600,reserve:.1});
 return {g,storage,now:()=>now,step:s=>{now+=s*1000;g.advanceTo(now);}};
}
const base=setup(),forecast=base.g.forecast(),row=(f,id)=>f.rows.find(r=>r.id===id);
assert(row(forecast,'brasem').autoShare>.25);assert(row(forecast,'voorn').autoShare>.05);assert(row(forecast,'schub').autoShare>0);assert(row(forecast,'rivierkreeft').autoShare>0);
assert(Math.abs(forecast.rows.reduce((n,r)=>n+r.autoShare,0)-1)<1e-9);
checks.push('Light carp rigs attract substantial bream, roach, carp and low-value crayfish; probabilities still sum to one');
const boilie=setup(42,{bait:'boilies'}).g.forecast(),large=setup(42,{hook:'hook_6',bait:'boilies'}).g.forecast(),combo=setup(42,{bait:'boilies',combo:'boilies_corn'}).g.forecast();
assert(row(boilie,'voorn').autoShare<row(forecast,'voorn').autoShare/5);assert.equal(row(large,'voorn').autoHour,0);assert(row(large,'brasem').autoHour>0);assert(row(large,'schub').autoShare>row(forecast,'schub').autoShare);assert(row(large,'rivierkreeft').autoHour>0);assert(row(combo,'voorn').autoShare>row(boilie,'voorn').autoShare*5);
checks.push('Large hooks exclude tiny fish while boilies reduce small-fish attraction; bream remain possible and adding corn restores roach attraction');
for(const w of WATERS){
 for(const style of ['feeder','karper','dobber'])for(const bait of BAITS){
  const r={...starterRod(style),bait:bait.id,hook:'hook_50'},cray=encounterPool(r,w).find(e=>e.fish.id==='rivierkreeft');
  if(w.sea)assert.equal(cray,undefined);else{assert(cray.weight>0);assert.equal(cray.hookMin,0);assert.equal(cray.hookMax,Infinity);}
 }
}
const crayWeight=(style,water)=>encounterPool({...starterRod(style),bait:'worms'},WATERS.find(w=>w.id===water)).find(e=>e.fish.id==='rivierkreeft').weight;
assert(crayWeight('dobber','poldermeer')<crayWeight('feeder','poldermeer'));assert(crayWeight('karper','poldermeer')>crayWeight('karper','rietplas'));
checks.push('Crayfish can cling to every edible bait on freshwater rods regardless of hook size; float exposure is lower, pressure varies by water, and sea waters contain none');
let count=0;const counts={};let retained;
for(let seed=1;seed<=12;seed++){
 const c=setup(seed*9876543);assert(c.g.startSession().ok);c.step(8*3600);assert.equal(c.g.state.session,null);const rows=c.g.sessionRows();
 count+=rows.length;for(const f of rows){counts[f.species]=(counts[f.species]||0)+1;if(f.species==='rivierkreeft'){assert(f.value>=.01&&f.value<=.06);assert.equal(f.xp,2);assert(!f.trophy);}else{assert(f.weight>=.1&&f.weight<=4);}}
 if(seed===1)retained=c;
}
const measured=count/(12*8);assert(Math.abs(measured/forecast.auto.catches-1)<.06);
for(const f of forecast.rows)if(f.autoShare>.03)assert(Math.abs((counts[f.id]||0)/count-f.autoShare)<.025,`${f.id}: simulated share differs`);
checks.push(`${count} natural carp-rig catches agree with predicted rates (${measured.toFixed(1)}/h vs ${forecast.auto.catches.toFixed(1)}/h) and species shares; crayfish give cents and 2 XP without trophies`);
{
 const c=retained,g=c.g,rows=g.sessionRows(),cray=rows.find(f=>f.species==='rivierkreeft'),fish=rows.find(f=>canStockSpecies(species(f.species)));
 assert(cray&&fish);g.state.estate.owned=true;const before=JSON.stringify(g.state);
 assert(!g.stockFish(cray.id).ok);assert(!g.chooseCatches([fish.id,cray.id],'stock').ok);assert.equal(JSON.stringify(g.state),before);
 assert(g.chooseCatches(rows.map(f=>f.id),'sell').ok);assert(g.chooseCatches([cray.id],'release').ok);assert(g.chooseCatches([fish.id],'stock').ok);g.save();
 const reload=new IdleGame({storage:c.storage,now:c.now});assert.deepEqual(reload.sessionRows(),g.sessionRows());const imported=new IdleGame({storage:null,now:c.now});assert(imported.importSave(reload.exportSave()).ok);assert.deepEqual(imported.sessionRows(),g.sessionRows());
 const cash=reload.state.money,xp=reload.state.xp,total=rows.filter(f=>![fish.id,cray.id].includes(f.id)).reduce((n,f)=>n+f.value,0);const result=reload.settleSession();assert(result.ok);assert.equal(result.releaseXp,1);assert.equal(reload.state.xp,xp+1);assert.equal(reload.state.money,cents(cash+total));assert.equal(reload.estatePopulation,1);assert.equal(reload.state.net.length,0);assert(!reload.awaitingSettlement);assert(!reload.settleSession().ok);
 checks.push('Natural bycatch survives compressed save, reload and readable export; crayfish cannot enter the pond, releasing grants 1 XP, and exact-cent checkout cannot pay twice');
}
{
 const a=setup(720591),b=setup(720591);a.g.setPlan({duration:3600});b.g.setPlan({duration:3600});assert(a.g.startSession().ok);assert(b.g.startSession().ok);a.step(3600);for(let i=0;i<3600;i++)b.step(1);
 assert.deepEqual(a.g.sessionRows(),b.g.sessionRows());assert(Math.abs(a.g.state.stats.playSeconds-b.g.state.stats.playSeconds)<.00001);assert.deepEqual({...a.g.state.stats,playSeconds:0},{...b.g.state.stats,playSeconds:0});
 checks.push('Bycatch simulation is identical during a one-hour offline block and second-by-second live fishing');
}
{
 const c=setup(737372),g=c.g;assert(g.startSession().ok);g.state.tournament={water:'poldermeer',remaining:8*3600,score:0,catches:0};let found=new Set();
 for(let i=0;i<6000&&found.size<3;i++){
  const rt=g.state.session.rods[0];c.step(rt.next+.00001);if(rt.phase!=='bite'||!rt.candidate?.eligible)continue;
  const candidate=structuredClone(rt.candidate),kind=candidate.species==='rivierkreeft'?'crayfish':candidate.encounter;
  rt.candidate.manualRoll=0;const beforeWeight=g.state.tournament.score,beforeCount=g.state.tournament.catches,before=g.state.stats.manualCaught;
  assert(g.strike(0).ok);assert.equal(g.state.stats.manualCaught,before+1);assert.equal(g.state.lastCatch.species,candidate.species);
  if(kind==='crayfish'){assert.equal(g.state.tournament.score,beforeWeight);assert.equal(g.state.tournament.catches,beforeCount);assert(rt.lastOutcome.includes('rivierkreeft'));}
  else{assert.equal(g.state.tournament.score,beforeWeight+candidate.weight);assert.equal(g.state.tournament.catches,beforeCount+1);if(kind==='bycatch')assert(rt.lastOutcome.includes('Bijvangst'));}
  found.add(kind);
 }
 assert(found.has('crayfish')&&found.has('bycatch')&&found.has('target'));
 checks.push('Actively striking natural bites lands target fish, coarse bycatch and crayfish with explanatory outcomes; crayfish never add competition weight or catch count');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
