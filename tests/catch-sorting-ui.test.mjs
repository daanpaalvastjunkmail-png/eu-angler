import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame} from '../dist/engine.js';
import {recordCatch} from '../dist/journal.js';

// Run the actual app handlers. Sorting must affect the catch table alone and
// must never change fishing, destination choices or the settlement batch.
const checks=[],errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://europa-catch-sort.test/',pretendToBeVisual:true,virtualConsole});
let clock=1800000000000;Date.now=()=>clock;
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
const page=id=>click(`.nav-item[data-page="${id}"]`);
const rowIds=()=>[...document.querySelectorAll('[data-journal-row]')].map(row=>row.dataset.journalRow);
const economicState=()=>JSON.stringify({money:game.state.money,xp:game.state.xp,session:game.state.session?.id,net:game.state.net,choices:game.state.catchChoices});
const sortedIds=(source,sort,direction,limit)=>source.map((row,index)=>({row,index})).sort((a,b)=>{
 const field={time:'at',weight:'weight',value:'value'}[sort];
 return (a.row[field]-b.row[field])*(direction==='asc'?1:-1)||a.index-b.index;
}).slice(0,limit).map(({row})=>row.id);
const assertOrder=(sort,direction,limit=12,selected='latest')=>{
 assert.equal($('[data-catch-sort]').value,sort);assert.equal($('[data-catch-sort-direction]').value,direction);
 assert.deepEqual(rowIds(),sortedIds(game.sessionRows(selected),sort,direction,limit));
};

assert(game);assert.equal(game.state.settings.language,'en');game.state.money=100000;
click('#start-session');
const session=game.state.session;assert(session);
session.startedAt=clock-120000;session.remaining=session.duration-120;
const fixtures=Array.from({length:26},(_,index)=>({
 id:'sort-fish-'+index,species:index%2?'voorn':'schub',name:index%2?'Blankvoorn':'Schubkarper',
 weight:index===0?40:index===2?7:index===3?4:1+index/10,
 value:index===1?900:10+index*7,xp:10,water:session.water,
 at:session.startedAt+index*4000,method:index%2?'auto':'manual',trophy:false
}));
session.fish=[];
for(const [index,fish]of fixtures.entries())recordCatch(game,session,fish,index===4?5:0);
session.caught=fixtures.length;session.weight=fixtures.reduce((sum,fish)=>sum+fish.weight,0);session.value=fixtures.reduce((sum,fish)=>sum+fish.value,0);
game.state.net=fixtures.filter((_,index)=>index!==4).map(fish=>({...fish}));
game.state.stats.caught=fixtures.length;game.state.stats.sold=1;
game.emit('catch');noErrors();
const scene=$('#scene-foreground');
assertOrder('time','desc');assert.equal(rowIds()[0],'sort-fish-25');assert.equal(rowIds().length,12);
change('[data-catch-choice="sort-fish-25"]','release');
change('[data-catch-choice="sort-fish-14"]','');
const baseline=economicState();
checks.push('Real current-catch controls default to newest first, display 12 of 26 mixed catches and accept release or deselect choices without paying them');

for(const [sort,direction]of [['weight','desc'],['weight','asc'],['value','asc'],['value','desc'],['time','asc'],['time','desc']]){
 change('[data-catch-sort]',sort);change('[data-catch-sort-direction]',direction);
 assertOrder(sort,direction);assert.equal(economicState(),baseline);
 assert.equal($('#scene-foreground'),scene,'Sorting must preserve the live SVG and deployed rods');
 assert.equal(document.activeElement,$('[data-catch-sort-direction]'),'Updated sorting controls keep keyboard focus');
 assert.equal(game.state.catchChoices['sort-fish-25'],'release');assert.equal(game.state.catchChoices['sort-fish-14'],'pending');
}
change('[data-catch-sort]','weight');
assert.equal(rowIds()[0],'sort-fish-0','The heaviest fish was among the oldest and outside the original visible 12');
change('[data-catch-sort]','value');assert.equal(rowIds()[0],'sort-fish-1','The most valuable fish was also outside the original visible 12');
assert.equal(economicState(),baseline);
checks.push('Actual field and direction changes sort the complete session before pagination, preserve scene identity and focus, and keep money, XP, session ID and per-fish decisions unchanged');

change('[data-catch-sort]','weight');
const candidate={id:'sort-new-catch',species:'schub',name:'Schubkarper',weight:50,value:350,xp:5,water:session.water,trophy:false,eligible:true,autoRoll:.99,manualRoll:0};
Object.assign(session.rods[0],{phase:'bite',candidate,biteStartedAt:clock-500,deadline:clock+5000,next:3.2,total:6});
game.emit('tick');
click('.scene-strike-button[data-strike="0"]');
assert.equal(game.state.session,session);assert.equal(game.state.lastCatch.id,candidate.id);assert.equal(session.manualCaught,1);
assert.equal(rowIds()[0],candidate.id);assertOrder('weight','desc');assert.equal($('#scene-foreground'),scene);
assert.equal(game.state.catchChoices['sort-fish-25'],'release');assert.equal(game.state.catchChoices['sort-fish-14'],'pending');
assert.equal($('#home-catch-count').textContent,'27');
checks.push('A fish landed through the real Reel in handler is inserted in its selected weight order immediately, without replacing the scene or clearing earlier catch decisions');

const afterCatch=economicState();
click('[data-action="more-home-catches"]');assert.equal(rowIds().length,24);assertOrder('weight','desc',24);
assert.equal($('#scene-foreground'),scene);assert.equal(economicState(),afterCatch);
page('sessions');assertOrder('weight','desc',50);assert.equal(rowIds().length,27);
assert(document.querySelector('[data-journal-row="sort-fish-4"] .catch-disposition'),'Earlier automatic sales stay in the sorted ledger');
change('[data-catch-sort]','value');change('[data-catch-sort-direction]','asc');assertOrder('value','asc',50);
assert.equal($('[data-catch-choice="sort-fish-25"]').value,'release');assert.equal($('[data-catch-choice="sort-fish-14"]').value,'');
assert.equal(economicState(),afterCatch);
page('home');assertOrder('value','asc',24);assert.equal(rowIds().length,24);assert.equal(economicState(),afterCatch);
checks.push('Load more retains sorting; session history and current catches share both preferences while retaining all records, historical automatic sales and chosen destinations');

// Put the sole pending choice outside the current 24-row page before stopping.
page('sessions');change('[data-catch-choice="sort-fish-14"]','sell');change('[data-catch-choice="sort-fish-1"]','');
page('home');assert(!document.querySelector('[data-catch-choice="sort-fish-1"]'));
click('[data-action="stop-session"]');
assert(!$('#modal').hidden);assert.equal($('#modal').dataset.kind,'checkout');click('#close-modal');
assert.equal(game.state.session,null);assert(game.awaitingSettlement);assert.equal(game.state.net.length,26);
assertOrder('value','asc',24,'checkout');assert(!document.querySelector('[data-catch-choice="sort-fish-1"]'));
assert($('[data-action="settle-session"]').disabled,'A hidden pending fish must still block mandatory checkout');
assert.equal($('[data-pending-catches]').dataset.pendingCatches,'1');
const pending=economicState();$('[data-action="settle-session"]').click();noErrors();assert.equal(economicState(),pending);
checks.push('Stopping the real session enters mandatory checkout; a deselected fish hidden by pagination still blocks payout and departure without changing any state');

click('[data-journal-bulk="sell"]');
assert(game.sessionRows('checkout').every(fish=>fish.choice==='sell'),'Bulk decisions apply to every held fish, including rows beyond the visible limit');
change('[data-catch-choice="sort-fish-0"]','release');
const checkout=game.sessionRows('checkout'),cashBefore=game.state.money,xpBefore=game.state.xp,soldBefore=game.state.stats.sold;
const expectedCash=checkout.filter(fish=>fish.id!=='sort-fish-0').reduce((sum,fish)=>sum+fish.value,0);
click('[data-action="settle-session"]');
assert.equal(game.state.net.length,0);assert(!game.awaitingSettlement);
assert.equal(game.state.money,cashBefore+expectedCash);assert.equal(game.state.xp,xpBefore+3);
assert.equal(game.state.stats.sold,soldBefore+checkout.length-1);
assert.equal(game.sessionRows('latest').find(fish=>fish.id==='sort-fish-0').disposition,4);
assert.equal(game.sessionRows('latest').find(fish=>fish.id==='sort-fish-1').disposition,1,'The valuable fish beyond the visible page must be paid');
assert.equal(game.sessionRows('latest').find(fish=>fish.id==='sort-fish-4').disposition,5,'The historical automatic sale must never be paid again');
checks.push('Bulk sell reaches hidden fish and one complete sorted checkout pays all 25 selected sales exactly once, adds the explicit release XP and preserves the earlier automatic sale');

const finished=economicState();assert($('[data-action="settle-session"]').disabled);$('[data-action="settle-session"]').click();
page('sessions');assertOrder('value','asc',50);assert.equal(rowIds().length,27);
assert($('[data-action="settle-session"]').disabled);$('[data-action="settle-session"]').click();noErrors();
assert.equal(economicState(),finished);assert(!document.querySelector('[data-catch-choice]'));
checks.push('Sorted processed history remains complete and read-only; repeated checkout clicks cannot replay cash or XP rewards');

noErrors();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Real app event handlers and DOM state; no browser rasterisation'},null,2));
dom.window.close();
