import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {WATERS,SPECIES} from '../dist/data.js';

// Use the application's own navigation, filters and live update handlers.
// jsdom checks DOM state; it does not claim a browser screenshot review.
const errors=[],checks=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://europa-statistics.test/',pretendToBeVisual:true,virtualConsole});
let clock=1800000000000;Date.now=()=>clock;
globalThis.setInterval=()=>1;
const originalTimeout=globalThis.setTimeout;
globalThis.setTimeout=(callback,milliseconds,...args)=>{const timer=originalTimeout(callback,milliseconds,...args);timer.unref?.();return timer;};
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
const snapshot=()=>JSON.stringify(game.state);
const number=(value,d=1)=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d}).format(value||0);
const forecastRate=()=>$('.forecast-summary>div:first-child>b').firstChild.textContent;
const waterById=id=>WATERS.find(water=>water.id===id);
const assertForecast=(loadout,water)=>{
 const forecast=game.forecast(loadout,water);
 assert.equal(forecastRate(),number(forecast.auto.catches),'Displayed automatic rate must be calculated from the selected source and rods');
 const rows=[...document.querySelectorAll('.species-forecast tbody tr')];
 assert.equal(rows.length,water.fish.length,'Every local species must remain visible, including incompatible species');
 assert.deepEqual(rows.map(row=>row.querySelector('td strong').textContent),forecast.rows.map(row=>row.name));
 for(const [index,row]of rows.entries()){
  assert.equal(row.classList.contains('unavailable-species'),forecast.rows[index].autoHour===0);
  assert.equal(row.querySelectorAll('.forecast-reasons>div').length,loadout.rods.length,'Each local species must explain each selected rod');
 }
 assert.equal(document.querySelectorAll('.rod-explanations>article').length,loadout.rods.length);
 return forecast;
};

assert(game);assert.equal(game.state.settings.language,'en');
assert(!document.querySelector('#main #forecast-root'),'At the water must no longer append the statistics table');
assert.equal($('.nav-item[data-page="statistics"]>span').textContent,'Statistics');
page('statistics');assert.equal($('#page-label').textContent,'Statistics');
assert($('#main #forecast-root .forecast-panel'));assert.equal($('#main [data-live="caught"]').textContent,'0');
assert(!document.querySelector('#fishing-game'),'Statistics must be a separate page');
const beforeLanguage=snapshot();
change('.topbar [data-language-select]','nl');
assert.equal($('#page-label').textContent,'Statistieken');
const afterLanguage=JSON.parse(snapshot()),beforeLanguageState=JSON.parse(beforeLanguage);
afterLanguage.settings.language=beforeLanguageState.settings.language;
assert.deepEqual(afterLanguage,beforeLanguageState,'Changing language must only change its setting');
assertForecast(game.loadout,game.water);
checks.push('Statistics has its own English/Dutch navigation entry and page; the water view no longer contains forecasts, and changing language preserves progress');

for(const id of ['loadouts','waters','sessions','contests','shop','craft','estate','fleet','progress','settings','home','statistics']){
 page(id);assert($('#main').innerHTML.length>300);
 assert.equal(Boolean(document.querySelector('#forecast-root')),id==='statistics','Forecasts must appear only on Statistics');
}
assert.equal(document.querySelectorAll('.nav-item').length,15);
checks.push('All twelve pages navigate through the actual app, and only Statistics renders the forecast section');

game.state.xp=xpAt(300);game.state.money=1e9;game.state.legacy.count=3;
const displayedSpecies=new Set();
for(const water of WATERS){
 // All water models are inspected as read-only forecasts, including sea waters;
 // buying a boat is not required to inspect a calculated catch table.
 game.state.selectedWater=water.id;game.emit('test');
 assert.equal($('#forecast-source').value,'plan');
 const before=snapshot();assertForecast(game.loadout,water);
 for(const species of water.fish)displayedSpecies.add(species);
 change('#forecast-rod','0');assertForecast({ ...game.loadout,rods:[game.loadout.rods[0]] },water);
 change('#forecast-rod','all');assertForecast(game.loadout,water);
 assert.equal(snapshot(),before,'Inspecting catch rates and rod filters must not change the save');
}
assert.equal(displayedSpecies.size,SPECIES.length);
checks.push('Every water lists all its local species and real material limits; all 20 fish species and crayfish are covered, and read-only rod filtering spends nothing or alters any save data');

game.state.xp=xpAt(10);game.state.legacy.count=0;game.state.rodSlots=2;
assert(game.setSessionRods([{...starterRod('feeder'),slot:0},{...starterRod('karper'),slot:1}]).ok);
assert(game.selectWater('poldermeer').ok);page('statistics');
assert.equal($('#forecast-rod').options.length,3);
const beforeFilters=snapshot(),allMarkup=$('#forecast-root').innerHTML;
const total=assertForecast(game.loadout,game.water).auto.catches;
change('#forecast-rod','0');
assertForecast({...game.loadout,rods:[game.loadout.rods[0]]},game.water);
assert.notEqual($('#forecast-root').innerHTML,allMarkup);
change('#forecast-rod','1');assertForecast({...game.loadout,rods:[game.loadout.rods[1]]},game.water);
assert(total>game.forecast({...game.loadout,rods:[game.loadout.rods[1]]},game.water).auto.catches);
change('#forecast-rod','all');assertForecast(game.loadout,game.water);
assert.equal(snapshot(),beforeFilters);
checks.push('Mixed feeder/carp forecasts can show both rods or either single rod; table rows, explanations and automatic catch rates follow the chosen rig without editing its loadout');

page('home');game.setPlan({duration:300,reserve:.1});click('#start-session');
assert(game.state.session);const activeLoadout=structuredClone(game.state.session.loadout);
const beforeRodChange=structuredClone(game.state.selectedRods);assert(!game.chooseSessionRod(0,'rig_dobber').ok);assert.deepEqual(game.state.selectedRods,beforeRodChange);change('#plan-water','rietplas');
const sessionBeforeNavigation=snapshot();page('statistics');
assert.equal($('#forecast-source').value,'session');
assertForecast(activeLoadout,waterById('poldermeer'));
assert.equal(snapshot(),sessionBeforeNavigation,'Opening Statistics must preserve the running session and planned next setup');
change('#forecast-rod','1');assertForecast({...activeLoadout,rods:[activeLoadout.rods[1]]},waterById('poldermeer'));
change('#forecast-source','plan');assert.equal($('#forecast-rod').value,'all');
assert.equal($('#forecast-rod').options.length,3);assertForecast(game.loadout,waterById('rietplas'));
change('#forecast-source','session');assert.equal($('#forecast-rod').value,'all');
assert.equal($('#forecast-rod').options.length,3);assertForecast(activeLoadout,waterById('poldermeer'));
assert.equal(snapshot(),sessionBeforeNavigation,'Source changes must not restart the active session, swap gear or charge another permit');
checks.push('Statistics stays accessible during fishing and separates the immutable current feeder/carp session from a planned rods and a different next water; source changes reset only the view filter');

const runtime=game.state.session.rods[0];
Object.assign(runtime,{phase:'bite',candidate:{id:'fish_'+game.state.serial++,species:'brasem',name:'Brasem',weight:.7,value:7,xp:10,water:'poldermeer',trophy:false,eligible:true,autoRoll:.99,manualRoll:0},biteStartedAt:clock-500,deadline:clock+5000,next:3.2});
const previousCaught=game.state.stats.caught;
assert(game.strike(0).ok);assert.equal(game.state.stats.caught,previousCaught+1);
assert.equal($('#main [data-live="caught"]').textContent,String(previousCaught+1),'Statistics must update its catch total when a real fish is landed');
assert($('#forecast-root'));
checks.push('Landing an actual candidate updates the displayed Statistics catch total through the live app listener');

assert(game.stop().ok);assert(game.awaitingSettlement);
const checkoutBefore=snapshot();page('statistics');
assert($('#forecast-root'));assert.equal($('#forecast-source').value,'plan');
assert(![...$('#forecast-source').options].some(option=>option.value==='session'),'A finished session must not remain an active forecast source');
assertForecast(game.loadout,game.water);
assert.equal(snapshot(),checkoutBefore,'Viewing Statistics while checking out must neither sell nor lose pending fish');
page('home');assert($('#session-catches'));assert(game.awaitingSettlement);
assert.equal(snapshot(),checkoutBefore,'Returning to the catch choices must keep every fish and its decision');
checks.push('Read-only Statistics remains available during mandatory catch checkout; an ended session source falls back to planning and all unprocessed fish stay at the water');

noErrors();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Actual app navigation, filters and live DOM; no browser rasterisation'},null,2));
dom.window.close();
