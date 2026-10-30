import assert from 'node:assert/strict';
import {PARTS,ownerOf} from '../dist/tackle.js';
import {GEAR} from '../dist/data.js';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame,xpAt} from '../dist/engine.js';

// Exercise disclosure state while the real session and checkout UI keep running.
const checks=[],errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://europa-water-panels.test/',pretendToBeVisual:true,virtualConsole});
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
const click=selector=>{const element=$(selector);assert(!element.disabled,'Disabled '+selector);element.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));noErrors();};
const change=(selector,value)=>{const element=$(selector);element.value=String(value);element.dispatchEvent(new window.Event('change',{bubbles:true}));noErrors();};
const page=id=>click(`.nav-item[data-page="${id}"]`);

const input=(selector,value)=>{const el=$(selector);el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}));};
const confirm=()=>click('[data-modal-action="1"]');
assert.equal(document.querySelectorAll('.session-rod-position').length,1);assert.equal(document.querySelectorAll('[data-session-rod-slot]').length,1);assert(!document.querySelector('#plan-loadout'));assert($('.session-rod-picker').textContent.includes('CHOOSE YOUR RODS'));
change('[data-session-rod-slot="0"]','rig_karper');assert.equal(game.loadout.rods[0].style,'karper');assert.equal($('.session-rod-picker select').value,'rig_karper');change('[data-session-rod-slot="0"]','rig_feeder');
page('loadouts');assert.equal(document.documentElement.lang,'en');assert($('#main').textContent.includes('Build your own rod presets.'));assert($('#main').textContent.includes('Your training capacity'));assert(!document.querySelector('#loadout-preset-select,#loadout-name,#assembly-style,[data-action="save-loadout"]'));assert($('.assembly-illustration .rod-visual'));assert.equal($('#assembly-name').value,'My feeder');assert.equal(document.querySelectorAll('[data-assembly-field]').length,7);assert($('#main').textContent.includes('My assembled rods'));
const money=game.state.money,before=JSON.stringify(game.state);
for(const field of ['rod','reel','line','indicator','terminal','hook']){
 click(`.assembly-callout[data-visual-part="${field}"]`);assert.equal(document.activeElement.dataset.assemblyField,field);
 assert.equal(document.querySelectorAll('.assembly-part.field-selected').length,1);assert(document.activeElement.closest('.field-selected'));
 assert([...document.querySelectorAll('.assembly-stage .part-selected')].every(el=>el.dataset.visualPart===field));
}
$('.assembly-rig-diagram [data-visual-part="hook"]').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(document.activeElement.dataset.assemblyField,'hook');
$('.assembly-leader-label').dispatchEvent(new window.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));assert.equal(document.activeElement.dataset.assemblyField,'terminal');assert.equal(JSON.stringify(game.state),before);noErrors();
checks.push('All numbered drawing labels and keyboard actions focus and highlight the correct component without changing the saved equipment');
input('#assembly-name','My custom corn feeder');assert(!document.querySelector('[data-assembly-field="bait"]'));click('[data-action="save-assembly"]');assert.equal(game.state.rodPresets[0].name,'My custom corn feeder');page('home');change('[data-trip-bait-slot="0"][data-trip-bait-field="bait"]','bait:corn');assert.equal(game.loadout.rods[0].bait,'corn');assert.equal(game.state.money,money);page('loadouts');
const carpLine=game.state.rodPresets[1].items.line;assert($('[data-assembly-field="line"] option[value="'+carpLine+'"]').disabled);assert($('#main').textContent.includes('reserved by'));
checks.push('The real planner chooses individual rods; the workshop has no method or whole-loadout selector, and component edits preserve names and reserved units');
game.state.xp=xpAt(10);game.state.money=10000;game.emit('test');page('home');click('[data-action="buy-slot"]:not([disabled])');confirm();assert.equal(game.state.rodSlots,2);change('[data-session-rod-slot="1"]','rig_karper');assert.equal(game.loadout.rods.length,2);assert.deepEqual(game.loadout.rods.map(r=>r.style),['feeder','karper']);assert($('[data-session-rod-slot="1"] option[value="rig_feeder"]').disabled);assert($('#supply-estimate').textContent.includes('Sweetcorn'));
checks.push('Buying an unlocked position enables a second preset directly in step 01 and refreshes the packing list immediately');
page('loadouts');click('[data-action="new-assembly"]');assert($('[data-action="save-assembly"]').disabled);input('#assembly-name','Second physical feeder');
for(const part of PARTS.filter(p=>p!=='indicator')){const id={rod:'feeder_rod_field',reel:'feeder_reel_field',line:'line_field',hook:'hook_12',terminal:'feeder_terminal_field'}[part];assert(game.buyGear(id).ok);const item=game.state.tackleItems.find(i=>i.gearId===id&&!ownerOf(game.state,i.id));assert(item);change('[data-assembly-field="'+part+'"]',item.id);}
click('[data-action="save-assembly"]');const built=game.state.rodPresets.find(p=>p.name==='Second physical feeder');assert(built?.assembled);page('home');change('[data-session-rod-slot="0"]',built.id);assert.equal(game.loadout.rods[0].sourcePresetId,built.id);
page('loadouts');assert(game.buyGear('feeder_rod_scout').ok);const scout=game.state.tackleItems.find(i=>i.gearId==='feeder_rod_scout');change('[data-assembly-field="rod"]',scout.id);click('[data-action="save-assembly"]');assert.equal(game.loadout.rods[0].rod,'feeder_rod_scout');assert(/level 15/i.test($('.academy-card').textContent));page('home');assert($('#start-session').disabled);game.state.xp=xpAt(15);game.emit('test');assert(!$('#start-session').disabled);
checks.push('Building requires free physical components; selecting heavier rods still blocks a session until the training level is reached');
page('loadouts');for(const id of ['karper_rod_field','karper_reel_field','karper_terminal_field'])assert(game.buyGear(id).ok);const carpItem=game.state.tackleItems.find(i=>i.gearId==='karper_rod_field'&&!ownerOf(game.state,i.id));change('[data-assembly-field="rod"]',carpItem.id);assert.equal($('[data-assembly-method]').textContent,'Carp');assert(!document.querySelector('#assembly-style'));click('[data-action="save-assembly"]');assert.equal(game.loadout.rods[0].style,'karper');assert.equal(game.state.rodPresets.find(p=>p.id===built.id).rod.style,'karper');
checks.push('Choosing a carp rod in the component menu automatically changes method and compatible components without a separate fishing-style control');
click('[data-dismantle-assembly="'+built.id+'"]');confirm();assert(!game.state.rodPresets.some(p=>p.id===built.id));assert(!game.state.selectedRods.some(r=>r.sourcePresetId===built.id));assert(Object.values(game.state.rodPresets.find(p=>p.id==='rig_karper').items).every(id=>ownerOf(game.state,id)));page('home');change('[data-session-rod-slot="1"]','');assert.equal(game.state.selectedRods.length,0);assert($('#start-session').disabled);page('statistics');assert($('#forecast-root'));assert(!$('#main').textContent.includes('NaN'));page('loadouts');
checks.push('Dismantling removes the preset from the session selection; an empty selection and its statistics remain usable');
const p=game.state.rodPresets.find(p=>p.id==='rig_feeder'),item=game.state.tackleItems.find(i=>i.id===p.items.rod);item.condition=0;game.emit('equipment');click('[data-edit-assembly="rig_feeder"]');assert($('.repair-inventory').textContent.includes('free'));const cash=game.state.money;click('[data-repair-rod="'+item.id+'"]');assert.equal(item.condition,100);assert.equal(game.state.money,cash);scout.condition=0;game.emit('equipment');const paidCash=game.state.money;click('[data-repair-rod="'+scout.id+'"]');assert.equal(scout.condition,100);assert.equal(game.state.money,paidCash-GEAR.find(g=>g.id===scout.gearId).price*.35);
page('home');change('[data-session-rod-slot="0"]','rig_feeder');change('[data-session-rod-slot="1"]','rig_karper');click('#start-session');assert(game.state.session);assert($('.session-rod-positions').disabled);const selected=JSON.stringify(game.state.selectedRods);assert(!game.chooseSessionRod(0,'rig_dobber').ok);assert.equal(JSON.stringify(game.state.selectedRods),selected);page('loadouts');click('[data-edit-assembly="rig_feeder"]');assert($('[data-action="save-assembly"]').disabled);assert($('[data-dismantle-assembly="rig_feeder"]').disabled);page('home');click('[data-action="stop-session"]');
checks.push('Free starter repairs, paid purchased-rod repairs and busy-rod restrictions still work; the planner cannot switch equipment mid-session');
change('.topbar [data-language-select]','nl');assert($('.session-rod-picker').textContent.includes('KIES JE HENGELS'));page('loadouts');assert($('#main').textContent.includes('Je scholingscapaciteit'));assert($('#main').textContent.includes('My custom corn feeder'));change('.topbar [data-language-select]','en');assert($('#main').textContent.includes('Repair workshop'));assert(!/loadout/i.test($('#navigation').textContent+$('#main').textContent));page('settings');assert($('#main').textContent.includes('3.4.0'));assert(!/loadout/i.test($('#main').textContent));
checks.push('English and Dutch cover the new flow, custom preset names are preserved and all whole-loadout text and controls are gone');
noErrors();console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Actual DOM, app actions and state; no browser rasterization'},null,2));dom.window.close();
