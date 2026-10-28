import assert from 'node:assert/strict';
import {IdleGame,starterRod} from '../dist/engine.js';

// Whole early-game journeys, with ordinary starting money and inventory. These
// catch progression dead ends that isolated rich/unlocked fixtures cannot see.
const checks=[],outcomes=[],cents=value=>Math.round((value+Number.EPSILON)*100)/100;
for(const style of ['feeder','karper','dobber']){
 for(let seed=1;seed<=20;seed++){
  let now=1800000000000;
  const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  let game=new IdleGame({storage,now:()=>now});game.state.seed=(seed*2654435761)>>>0;
  assert(game.chooseSessionRod(0,'rig_'+style).ok);let sessions=0;
  const context=()=>`${style}, seed ${seed}, after ${sessions} sessions`;
  const reload=()=>{
   const before=JSON.parse(game.exportSave()).save;
   game=new IdleGame({storage,now:()=>now});
   for(const key of ['money','xp','seed','serial','lastAt'])assert.equal(game.state[key],before[key],`${context()}: reload changed ${key}`);
   assert.deepEqual(game.state.stats,before.stats,`${context()}: reload changed statistics`);
   assert.deepEqual(game.state.records,before.records,`${context()}: reload changed records`);
   assert.deepEqual(game.state.permits,before.permits,`${context()}: reload changed paid permits`);
   assert.deepEqual(game.loadout.rods,before.selectedRods,`${context()}: reload changed equipped rods`);
   for(const [id,quantity] of Object.entries(before.stock))assert.equal(game.state.stock[id],quantity,`${context()}: reload changed stock ${id}`);
   assert.equal(game.state.net.length,0);assert.equal(game.state.session,null);assert.deepEqual(game.state.catchChoices,{});
  };
  const completeSession=()=>{
   game.setPlan({duration:900,reserve:.1});const quote=game.quote(),money=game.state.money;
   assert(quote.valid,`${context()}: ${quote.error}`);
   assert(quote.affordable,`${context()}: cannot pay ${quote.total} with ${money}`);
   assert(game.startSession().ok);assert.equal(game.state.money,cents(money-quote.total));
   now+=900000;game.advanceTo(now);assert.equal(game.state.session,null);
   assert(Math.abs(game.state.lastSession.seconds-900)<.00001,`${context()}: session stopped early`);
   const atWater=game.state.net.length;
   if(atWater){
    assert(game.awaitingSettlement);assert(game.sessionRows('checkout').every(fish=>fish.choice==='sell'));
    const before=game.state.money,sales=game.state.net.reduce((sum,fish)=>sum+fish.value,0);
    assert(!game.startSession().ok,'Unprocessed fish must block the next outing');
    assert(game.settleSession().ok);assert.equal(game.state.money,cents(before+sales));assert(!game.awaitingSettlement);
   }
   assert(Number.isFinite(game.state.money)&&game.state.money>=0);
   assert(Object.values(game.state.stock).every(quantity=>Number.isFinite(quantity)&&quantity>=0));
   reload();sessions++;
  };
  while(game.level<10&&sessions<100)completeSession();
  assert(game.level>=10,`${context()}: first extra rod did not unlock within 25 hours`);
  const firstLevelTenMinutes=sessions*15;
  assert.equal(game.state.rodSlots,1);assert(game.buySlot().ok,`${context()}: cannot afford the second slot`);
  assert(game.setSessionRods([
   {...starterRod('feeder'),slot:0},{...starterRod('karper'),slot:1},
  ]).ok);
  const caughtBefore=game.state.stats.caught;
  completeSession();
  assert(game.state.stats.caught>caughtBefore,`${context()}: the mixed outing produced no fish`);
  assert.equal(game.state.rodSlots,2);
  assert.deepEqual(game.loadout.rods.map(rod=>[rod.slot,rod.style]),[[0,'feeder'],[1,'karper']]);
  outcomes.push({style,seed,minutes:firstLevelTenMinutes,money:game.state.money});
 }
 checks.push(`Twenty ordinary ${style} journeys reach level 10 without running out of money, settle and reload every outing, buy the second slot and complete a paid mixed feeder/carp session that also survives reload`);
}
const summaries=['feeder','karper','dobber'].map(style=>{
 const runs=outcomes.filter(row=>row.style===style);
 return {style,runs:runs.length,minutesToLevel10:[Math.min(...runs.map(row=>row.minutes)),Math.max(...runs.map(row=>row.minutes))],moneyAfterMixedOuting:[cents(Math.min(...runs.map(row=>row.money))),cents(Math.max(...runs.map(row=>row.money)))]};
});
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,runs:outcomes.length,summaries},null,2));
