import {assembleRods} from './tackle-fixtures.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {SUPPLIES,RECIPES} from '../dist/data.js';
import {MAX_SESSION_SECONDS,sessionDurations} from '../dist/session-planner.js';
import {translateText} from '../dist/i18n.js';

// Execute the actual planner handlers. DOM assertions do not claim browser
// layout/rasterisation coverage. Prices come from current game data, not a
// duplicate pricing table in the test.
const checks=[],errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://europa-packing-costs.test/',pretendToBeVisual:true,virtualConsole});
const clock=1800000000000;Date.now=()=>clock;
globalThis.setInterval=()=>1;
const realTimeout=globalThis.setTimeout;
globalThis.setTimeout=(callback,milliseconds,...args)=>{const timer=realTimeout(callback,milliseconds,...args);timer.unref?.();return timer;};
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,location:dom.window.location});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
window.scrollTo=()=>{};window.requestAnimationFrame=()=>1;
let game;const realOnChange=IdleGame.prototype.onChange;
IdleGame.prototype.onChange=function(callback){game=this;return realOnChange.call(this,callback);};
window.addEventListener('error',event=>errors.push(String(event.error||event.message)));
await import('../dist/app.js');
const $=selector=>{const element=document.querySelector(selector);assert(element,'Missing '+selector);return element;};
const noErrors=()=>assert.equal(errors.length,0,errors.join('\n'));
const click=selector=>{const element=$(selector);assert(!element.disabled,'Disabled '+selector);element.click();noErrors();};
const change=(selector,value)=>{const element=$(selector);element.value=String(value);element.dispatchEvent(new window.Event('change',{bubbles:true}));noErrors();};
const cents=value=>Math.round((value+Number.EPSILON)*100)/100;
// Both game languages currently retain Dutch decimal/thousands formatting.
const number=text=>Number(String(text).replace(/−/g,'-').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));
const moneyAt=selector=>{const element=$(selector);assert(element.textContent.includes('€'),'No visible euro price: '+selector);assert(!element.closest('[hidden]'),'Hidden price: '+selector);return number(element.textContent);};
const supplies=Object.fromEntries(SUPPLIES.map(item=>[item.id,item]));
const groupFor=id=>id==='feed'?'feed':id.startsWith('liquid_')?'liquids':'bait';
const steps=sessionDurations(MAX_SESSION_SECONDS);
const drag=seconds=>{const range=$('#plan-duration'),index=steps.indexOf(seconds);assert(index>=0,'Missing duration '+seconds);range.value=String(index);range.dispatchEvent(new window.Event('input',{bubbles:true}));noErrors();assert.equal($('#plan-duration'),range,'Dragging replaced the active range input');};
const checkPacking=()=>{
 const q=game.quote(),root=$('#supply-estimate'),ids=Object.keys(q.required),groups={};
 assert.deepEqual([...root.querySelectorAll('[data-packing-item]')].map(row=>row.dataset.packingItem).sort(),ids.slice().sort(),'Every supply must appear exactly once');
 for(const id of ids){
  const group=groupFor(id),row=$(`[data-packing-item="${id}"]`);groups[group]??=[];groups[group].push(id);
  assert.equal(row.closest('[data-packing-group]')?.dataset.packingGroup,group,'Wrong category for '+id);
  for(const attr of ['data-need','data-packing-value','data-packing-buy','data-packing-missing'])assert(row.querySelector(`[${attr}="${id}"]`),'Missing visible row field '+attr+' for '+id);
  const quantity=$(`[data-need="${id}"]`).textContent,missing=$(`[data-packing-missing="${id}"]`).textContent;
  const visibleQuantity=(value,text)=>text.includes('kg')?Number((value/1000).toFixed(1)):value;
  assert.equal(number(quantity),visibleQuantity(q.required[id],quantity),'Required units differ for '+id);
  assert.equal(number(missing),visibleQuantity(q.missing[id],missing),'Missing units differ for '+id);
  assert.equal(moneyAt(`[data-packing-value="${id}"]`),cents(q.required[id]*supplies[id].price),'Full packed value differs for '+id);
  assert.equal(moneyAt(`[data-packing-buy="${id}"]`),q.costs[id],'Additional purchase cost differs for '+id);
  assert(row.textContent.includes(translateText(supplies[id].name,game.state.settings.language)),'Supply name not translated: '+id);
 }
 let total=0;
 for(const [group,groupIds] of Object.entries(groups)){
  const expected=cents(groupIds.reduce((sum,id)=>sum+q.costs[id],0));
  assert.equal(moneyAt(`[data-packing-subtotal="${group}"]`),expected,'Incorrect category total '+group);total+=expected;
 }
 assert.equal(cents(total),q.suppliesCost,'Category subtotals must equal the actual purchase quote');
 assert.equal(moneyAt('#quote-supplies'),q.suppliesCost);
 assert.equal(moneyAt('#quote-total'),q.total);
 for(const [id,needed] of Object.entries(q.rigNeeds)){
  const row=$(`[data-packing-rig="${id}"]`);assert.equal(row.closest('[data-packing-group]')?.dataset.packingGroup,'rigs');
  assert(row.textContent.includes(translateText(RECIPES.find(recipe=>recipe.id===id).name,game.state.settings.language)));
  assert(!row.hasAttribute('data-packing-item'),'Crafted rigs cannot be autobought as supplies');
  assert(needed>0);
 }
 noErrors();return q;
};

assert(game);assert.equal(game.state.settings.language,'en');
let q=checkPacking();assert.equal(q.suppliesCost,0,'The starter pack should already cover the first session');
assert.equal($('#supply-estimate').querySelector('[data-packing-group="liquids"]'),null);
assert(Object.values(q.required).every(value=>value>0));
for(const id of Object.keys(q.required)){assert.equal(moneyAt(`[data-packing-buy="${id}"]`),0);assert(moneyAt(`[data-packing-value="${id}"]`)>0);}
checks.push('The starter session shows feed and bait exactly once, with positive packed value and €0 additional purchase for already owned stock');

game.state.xp=xpAt(60);game.state.money=1000000;game.state.rodSlots=2;game.state.crafted.rig_basic=2;
const rods=[
 {...starterRod('feeder'),slot:0,bait:'maggots',combo:'corn_maggots',liquid:'liquid_krill',crafted:'rig_basic'},
 {...starterRod('karper'),slot:1,bait:'boilies',combo:'boilies_corn',liquid:'liquid_scopex',crafted:'rig_basic'},
];
Object.assign(game.state.stock,{feed:123.4,maggots:17.25,corn:8.6,boilies:4.4,liquid_krill:2.2,liquid_scopex:1.75});
assert(game.saveLoadout(null,'Packing: feeder + carp cocktails',assembleRods(game,rods)).ok);change('#plan-water','poldermeer');drag(45*60);
q=checkPacking();assert(q.valid,q.error);assert.deepEqual(q.rigNeeds,{});
assert.deepEqual(Object.keys(q.required).sort(),['feed','maggots','corn','boilies','liquid_krill','liquid_scopex'].sort());
for(const id of Object.keys(q.required))assert.equal(q.missing[id],Math.max(0,Math.ceil(q.required[id]-game.state.stock[id]-1e-9)));
assert.equal($('#supply-estimate').querySelectorAll('[data-packing-item="corn"]').length,1,'Two cocktails must aggregate their shared corn');
assert(q.suppliesCost>0);checks.push('Mixed feeder/carp cocktails aggregate shared bait and both liquids, round fractional stock shortages correctly, and keep handmade rigs outside the supply charge');

const moneyBeforePlanning=game.state.money,stockBeforePlanning=JSON.stringify(game.state.stock);
for(const seconds of [8*3600,24*3600,48*3600,MAX_SESSION_SECONDS]){
 drag(seconds);
 for(const reserve of [0,.1,.25]){change('#plan-reserve',reserve);q=checkPacking();assert.equal(q.duration,seconds);assert.equal(game.state.plan.reserve,reserve);}
}
assert.equal(game.state.money,moneyBeforePlanning);assert.equal(JSON.stringify(game.state.stock),stockBeforePlanning);
checks.push('Slider and reserve changes refresh every amount, item price and category subtotal through a seven-day session without spending money or consuming stock');

drag(45*60);change('#plan-reserve',.1);q=game.quote();
for(const [id,required] of Object.entries(q.required))game.state.stock[id]=required+.75;
game.emit('purchase');q=checkPacking();assert.equal(q.suppliesCost,0);
for(const id of Object.keys(q.required)){assert.equal(q.missing[id],0);assert.equal(moneyAt(`[data-packing-buy="${id}"]`),0);assert(moneyAt(`[data-packing-value="${id}"]`)>0);}
assert($('[data-action="buy-missing"]').disabled);
checks.push('A fully stocked loadout keeps its packed-value estimates while all additional costs become €0 and the refill action becomes unavailable');

for(const [id,required] of Object.entries(q.required))game.state.stock[id]=required*.35+.125;
game.emit('purchase');q=checkPacking();assert(q.suppliesCost>0);
const moneyBefore=game.state.money,stockBefore={...game.state.stock},craftBefore=game.state.crafted.rig_basic,permitsBefore=JSON.stringify(game.state.permits);
click('[data-action="buy-missing"]');
assert.equal(game.state.money,cents(moneyBefore-q.suppliesCost));
for(const [id,missing] of Object.entries(q.missing))assert.equal(game.state.stock[id],stockBefore[id]+missing);
assert.equal(game.state.crafted.rig_basic,craftBefore);assert.equal(JSON.stringify(game.state.permits),permitsBefore);
const filled=checkPacking();assert.equal(filled.suppliesCost,0);assert.equal(filled.total,filled.licenseCost+filled.charter);
assert($('[data-action="buy-missing"]').disabled);assert.equal(game.state.session,null);
checks.push('The real refill button deducts exactly the visible category totals, purchases only missing supplies, preserves rigs and permits, and prevents charging again');

for(const language of ['nl','en']){
 change('.topbar [data-language-select]',language);assert.equal(document.documentElement.lang,language);checkPacking();
 assert.equal(game.state.money,cents(moneyBefore-q.suppliesCost));assert.equal(JSON.stringify(game.state.permits),permitsBefore);
}
checks.push('English and Dutch both show translated supply/rig names with unchanged visible unit values, category subtotals, stock and payable costs');

assert.equal(game.sellRigs('rig_basic',2).ok,false,'Mounted rigs cannot be sold');
const ready=checkPacking();assert(ready.valid,ready.error);
const startMoney=game.state.money,startStock={...game.state.stock};click('#start-session');
assert(game.state.session);assert.equal(game.state.money,cents(startMoney-ready.total));assert.equal(game.state.crafted.rig_basic,2);
for(const id of Object.keys(ready.required))assert.equal(game.state.stock[id],startStock[id],'Starting must not rebuy owned supply '+id);
checks.push('Mounted handmade rigs remain reserved and reusable; session start charges the displayed permit without rebuying owned supplies or consuming the assembled rigs');

noErrors();console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Actual app input/click handlers and DOM; no browser rasterisation'},null,2));
dom.window.close();
