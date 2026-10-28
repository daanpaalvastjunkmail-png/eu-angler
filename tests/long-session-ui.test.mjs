import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {MAX_SESSION_SECONDS,sessionDurations,durationLabel} from '../dist/session-planner.js';
import {translateText} from '../dist/i18n.js';

// Run the actual app's input, change and reel-in handlers. jsdom verifies DOM
// state, not the browser's rasterisation or the perceived motion of the rod.
const checks=[],errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://europa-long-session.test/',pretendToBeVisual:true,virtualConsole});
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
// Numeric presentation stays nl-NL in both UI languages; dots group thousands.
const number=text=>Number(String(text).replace(/−/g,'-').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));
const steps=sessionDurations(MAX_SESSION_SECONDS),hour=3600;
const drag=(seconds,range=$('#plan-duration'))=>{const index=steps.indexOf(seconds);assert(index>=0,'Missing duration '+seconds);range.value=String(index);range.dispatchEvent(new window.Event('input',{bubbles:true}));noErrors();return range;};
const checkEconomy=()=>{const quote=game.quote();assert.equal(number($('#expected-gross').textContent),quote.expectedGross);assert.equal(number($('#expected-consumables').textContent),-quote.consumablesCost);assert.equal(number($('#expected-net').textContent),quote.expectedNet);assert.equal(number($('#quote-license').textContent),quote.licenseCost);assert.equal(number($('#quote-total').textContent),quote.total);return quote;};

assert(game);assert.equal(game.state.settings.language,'en');
game.state.xp=xpAt(10);game.state.money=1000000;game.state.rodSlots=2;
assert(game.saveLoadout(null,'Feeder + carp week test',[{...starterRod('feeder'),slot:0},{...starterRod('karper'),slot:1}]).ok);
change('#plan-water','poldermeer');
const range=$('#plan-duration');
assert.equal(Number(range.max),steps.length-1);assert.equal(steps.at(-1),MAX_SESSION_SECONDS);
for(const seconds of steps){
 drag(seconds,range);
 assert.equal($('#plan-duration'),range,'Dragging must preserve the live input element');
 assert.equal(game.state.plan.duration,seconds);assert.equal(game.state.plan.license,seconds);
 assert.equal(range.getAttribute('aria-valuetext'),translateText(durationLabel(seconds),'en'));
 assert.equal($('#duration-offline-note').hidden,seconds<=game.offlineCap);
 const quote=checkEconomy();assert(quote.valid,quote.error);
}
assert.equal($('#session-duration-label').textContent,'7 days');
checks.push('All 26 slider positions reach an affordable valid week with one matching permit duration, preserve the input while dragging and refresh exact price/profit estimates');

const keyboardRange=$('#plan-duration');
assert.equal(keyboardRange.type,'range');assert.equal(keyboardRange.min,'0');assert.equal(keyboardRange.step,'1');
drag(24*hour,keyboardRange);
for(const key of ['ArrowRight','ArrowLeft','Home','End']){
 const event=new window.KeyboardEvent('keydown',{key,code:key,bubbles:true,cancelable:true});
 keyboardRange.dispatchEvent(event);
 assert.equal(event.defaultPrevented,false,'Game shortcuts must not prevent native slider keyboard controls');
}
// jsdom has no native range keyboard movement; supply the value/input event
// produced by an ArrowRight press at the 24-hour mark, then its change commit.
keyboardRange.value=String(steps.indexOf(24*hour)+1);
keyboardRange.dispatchEvent(new window.Event('input',{bubbles:true}));
assert.equal(game.state.plan.duration,48*hour);assert.equal($('#session-duration-label').textContent,'2 days');
const keyboardQuote=checkEconomy(),keyboardMoney=game.state.money;
keyboardRange.dispatchEvent(new window.Event('change',{bubbles:true}));
assert.equal(game.state.plan.duration,48*hour);assert.equal(game.quote().total,keyboardQuote.total);assert.equal(game.state.money,keyboardMoney);
noErrors();drag(MAX_SESSION_SECONDS);
checks.push('Native range keyboard events are not intercepted; committing the next position after 24 hours selects two days and never purchases anything');

const weekQuote=game.quote();
for(const [id,required]of Object.entries(weekQuote.required)){
 const display=$(`[data-need="${id}"]`).textContent;
 const expected=id==='feed'&&required>=1000?Number((required/1000).toFixed(1)):required;
 assert.equal(number(display),expected,'Week-long pack-list amount differs for '+id);
 if(id==='feed')assert(display.includes('kg'));
}
assert.equal($('#duration-offline-note').hidden,false);assert($('#duration-offline-note').textContent.includes('8'));
assert.equal($('#storage-duration-note').hidden,false,'A week with limited storage needs a capacity warning');
assert($('#storage-duration-note').textContent.includes(String(game.capacity)));
game.state.upgrades.offline=5;game.emit('test');
assert.equal(game.offlineCap,MAX_SESSION_SECONDS);assert.equal($('#duration-offline-note').hidden,true);
assert.equal(game.state.plan.duration,MAX_SESSION_SECONDS);assert.equal(Number($('#plan-duration').max),steps.length-1);
game.state.upgrades.offline=0;game.emit('test');
assert.equal($('#duration-offline-note').hidden,false);assert.equal(game.state.plan.duration,MAX_SESSION_SECONDS);
checks.push('Week-long pack-list amounts match the engine quote; storage and eight-hour absence warnings are explicit and the offline warning disappears at the week upgrade without shortening the plan');

for(const language of ['nl','en']){
 change('.topbar [data-language-select]',language);checkEconomy();
 assert.equal(document.documentElement.lang,language);
 assert.equal($('#session-duration-label').textContent,language==='nl'?'7 dagen':'7 days');
 assert.equal(document.querySelector('#session-duration-help'),null,'Implementation notes should not appear under the duration slider');
 const note=$('#duration-offline-note').textContent,economy=$('#plan-economy').textContent;
 if(language==='nl'){
  assert(note.includes('Bij afwezigheid'));assert(economy.includes('Geschatte sessiewinst'));
 }else{
  assert(!note.includes('Bij afwezigheid'),'The new offline warning must be translated');
  assert(!economy.includes('Geschatte sessiewinst'),'Profit labels must be translated');
 }
 assert.equal(game.state.plan.duration,MAX_SESSION_SECONDS);assert.equal(game.state.plan.license,MAX_SESSION_SECONDS);
}
checks.push('No implementation explanation is shown; the absence warning and profit estimate switch between English and Dutch while preserving exact quote values and duration');

drag(8*hour);
let quote=checkEconomy();assert.equal(quote.licenseCost,9,'Two rods at Poldermeer for eight hours should buy the shared capped permit');
assert.equal(game.loadout.rods.length,2);assert.equal($('#duration-offline-note').hidden,true);
drag(MAX_SESSION_SECONDS);quote=checkEconomy();
const moneyBefore=game.state.money;
click('#start-session');
assert(game.state.session);assert.equal(game.state.session.duration,MAX_SESSION_SECONDS);assert.equal(game.state.session.remaining,MAX_SESSION_SECONDS);
assert.equal(game.state.permits.poldermeer,quote.licenseExpiry);assert.equal(game.state.permits.poldermeer,clock+MAX_SESSION_SECONDS*1000);
assert.equal(game.state.money,Number((moneyBefore-quote.total).toFixed(2)));assert.equal(game.state.stats.permits,1);
for(const [id,needed]of Object.entries(quote.required))assert(game.state.stock[id]>=needed,'Starting must supply the complete planned duration for '+id);
checks.push('Two mixed rods pay €9 for eight hours at Poldermeer; starting a week buys one correctly priced week permit and the complete displayed supplies exactly once');

const candidate=(species,name,weight)=>({id:'fish_'+game.state.serial++,species,name,weight,value:7,xp:10,water:'poldermeer',trophy:false,eligible:true,autoRoll:.99,manualRoll:0});
const [feeder,carp]=game.state.session.rods;
Object.assign(feeder,{phase:'bite',candidate:candidate('brasem','Brasem',.8),biteStartedAt:clock-500,deadline:clock+5000,next:3.2});
Object.assign(carp,{phase:'bite',candidate:candidate('schub','Schubkarper',1.5),biteStartedAt:clock-500,deadline:clock+5000,next:3.2});
game.emit('tick');
const scene=$('#scene-foreground'),carpLine=$('[data-scene-line="1"]'),carpPosition=carpLine.querySelector('.fishing-scene-rig').getAttribute('transform');
click('.scene-strike-button[data-strike="0"]');
assert.equal(game.state.session.manualCaught,1);assert.equal(feeder.phase,'landed');assert.equal(carp.phase,'bite');
assert.equal($('[data-scene-line="0"]').dataset.hookset,'true','Accepted reel-in must trigger the visual hook-set');
assert.notEqual(carpLine.dataset.hookset,'true','Another deployed rod must not animate when the feeder is struck');
assert.equal($('#scene-foreground'),scene);assert.equal(carpLine.querySelector('.fishing-scene-rig').getAttribute('transform'),carpPosition);
clock+=300;click('.scene-strike-button[data-strike="1"]');
assert.equal(game.state.session.manualCaught,2);assert.equal(carp.phase,'landed');assert.equal($('[data-scene-line="1"]').dataset.hookset,'true');
checks.push('Each accepted reel-in click triggers a hook-set on its own physical rod, lands only that fish and preserves the shared scene and other rod position');

noErrors();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Actual app handlers and DOM/SVG state; no browser rasterisation'},null,2));
dom.window.close();
