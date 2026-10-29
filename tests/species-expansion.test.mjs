import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {SPECIES,BAITS,GEAR,WATERS} from '../dist/data.js';
import {SPECIES_INFO} from '../dist/species-info.js';
import {forecastRod} from '../dist/forecast.js';
import {assembleRods,memoryStorage} from './tackle-fixtures.mjs';
const originalIds=new Set(['voorn','ruisvoorn','brasem','zeelt','kroes','schub','spiegel','winde','barbeel','baars','snoek','graskarper','meerval','steur','zeebaars','kabeljauw','heilbot','tonijn','blauwvintonijn','zwaardvis','rivierkreeft']);
const added=SPECIES.filter(f=>!originalIds.has(f.id)),checks=[];
assert.equal(new Set(SPECIES.map(f=>f.id)).size,SPECIES.length);
assert(added.length>=30,'Expansion must add substantial playable diversity');
for(const id of originalIds)assert(SPECIES.some(f=>f.id===id),'Existing save identity retained: '+id);
for(const fish of SPECIES){
 const info=SPECIES_INFO[fish.id];
 assert(info?.family&&info.group&&info.form&&info.pattern&&info.description&&info.habitat,fish.id+' has an illustrated field-guide entry');
 assert(WATERS.some(w=>w.fish.includes(fish.id)),fish.id+' has a reachable habitat');
 if(fish.kind!=='crayfish')assert(BAITS.some(b=>b.attracts.includes(fish.id)),fish.id+' has a favoured bait');
 if(info.variantOf){assert(SPECIES_INFO[info.variantOf]);assert.equal(info.scientificName,SPECIES_INFO[info.variantOf].scientificName);}
 assert(fish.min>0&&fish.max>fish.min&&fish.value>0);
}
for(const water of WATERS){assert.equal(new Set(water.fish).size,water.fish.length);for(const id of water.fish)assert(SPECIES.some(f=>f.id===id),water.id+' references existing fish');}
checks.push(`${added.length} new entries occupy actual waters with bait preferences; all original catch IDs remain, and carp patterns share one species identity`);
function setup(seed=42){
 let now=1800000000000;const storage=memoryStorage(),g=new IdleGame({storage,now:()=>now});
 g.state.seed=seed;g.state.xp=xpAt(300);g.state.money=1e10;g.state.legacy.count=1;g.state.upgrades.net=5;
 return {g,storage,now:()=>now,advance:s=>{now+=s*1000;g.advanceTo(now);}};
}
const model=setup().g,plans=[];
for(const fish of added){
 let best=null;
 for(const water of WATERS.filter(w=>w.fish.includes(fish.id)))for(const style of fish.styles)for(const bait of BAITS.filter(b=>b.attracts.includes(fish.id)))for(const hook of GEAR.filter(i=>i.category==='hook')){
  const rod={...starterRod(style),rod:`${style}_rod_sovereign`,reel:`${style}_reel_sovereign`,terminal:`${style}_terminal_sovereign`,line:'line_sovereign',hook:hook.id,bait:bait.id};
  const forecast=forecastRod(model,rod,water),row=forecast.rows.find(r=>r.id===fish.id);
  assert(Number.isFinite(forecast.auto.catches)&&forecast.auto.catches>=0);
  assert(Math.abs(forecast.rows.reduce((n,f)=>n+f.prior,0)-1)<1e-9);
  assert(forecast.rows.every(f=>Number.isFinite(f.autoHour)&&f.autoHour>=0));
  if(row.autoHour>(best?.rate||0))best={fish,water,rod,rate:row.autoHour};
 }
 assert(best&&best.rate>.1,fish.id+' must have a usable hook, line, style and bait combination');
 plans.push(best);
}
checks.push('Every new fish has a finite, positive real forecast using available tackle; no water pools contain negative or unnormalised probabilities');
let caughtTotal=0;const natural=[];
for(const plan of plans){
 let found=false;
 for(let attempt=1;attempt<=4&&!found;attempt++){
  const c=setup(attempt*9876543),g=c.g;
  assert(g.setSessionRods(assembleRods(g,[plan.rod])).ok);
  assert(g.selectWater(plan.water.id).ok);
  assert(g.setPlan({duration:8*3600,reserve:.1}).ok);
  assert(g.startSession().ok);
  c.advance(8*3600);
  const rows=g.sessionRows();caughtTotal+=rows.length;
  for(const row of rows)assert(row.weight>0&&row.value>0&&Number.isFinite(row.xp),'Tiny fish must retain nonzero weights and sale values');
  const catches=rows.filter(f=>f.species===plan.fish.id);
  if(!catches.length)continue;
  found=true;g.save();
  const loaded=new IdleGame({storage:c.storage,now:c.now});
  assert.deepEqual(loaded.sessionRows(),rows,plan.fish.id+' survives compressed local save');
  const imported=new IdleGame({storage:null,now:c.now});
  assert(imported.importSave(loaded.exportSave()).ok);
  assert.deepEqual(imported.sessionRows(),rows,plan.fish.id+' survives readable export and import');
  assert(imported.state.records[plan.fish.id].count>=catches.length);
  natural.push({id:plan.fish.id,water:plan.water.id,bait:plan.rod.bait,hook:plan.rod.hook,naturalCatches:catches.length,forecastPerHour:+plan.rate.toFixed(2)});
 }
 assert(found,plan.fish.id+' must be naturally caught in seeded sessions');
}
checks.push(`All ${added.length} additions caught naturally among ${caughtTotal} simulated catches; collection records and full catch journals survive save/load and export/import`);
// Small bottom fish should be accessible with fine hooks and filtered by specimen tackle.
for(const id of ['riviergrondel','witvinriviergrondel','zwartbekgrondel','marmergrondel']){
 const p=plans.find(x=>x.fish.id===id),fine=forecastRod(model,{...p.rod,hook:'hook_16'},p.water).rows.find(f=>f.id===id),large=forecastRod(model,{...p.rod,hook:'hook_6'},p.water).rows.find(f=>f.id===id);
 assert(fine.autoHour>0,id+' reachable with fine hook');assert.equal(large.autoHour,0,id+' excluded by specimen hook');
}
checks.push('All four gudgeons/gobies can be targeted with fine hooks; specimen hooks correctly exclude them');
for(const file of ['save-2.8.1.json','save-3.0.0.json']){
 const raw=await fs.readFile(new URL('./fixtures/'+file,import.meta.url),'utf8'),game=new IdleGame({storage:null});
 assert(game.importSave(raw).ok,'Legacy save imports: '+file);
 const data=JSON.parse(raw),saved=data.save||data;
 assert.equal(game.state.money,saved.money,'Adding fish must not rebalance existing cash');
 for(const [id,record]of Object.entries(saved.records||{}))assert.deepEqual(game.state.records[id],record,'Existing collection record preserved: '+id);
}
checks.push('Both historical save formats retain their existing money and collection records');
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,natural},null,2));
