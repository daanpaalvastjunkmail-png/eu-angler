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
page('loadouts');assert.equal(document.documentElement.lang,'en');assert($('#main').textContent.includes('Build your rods. Choose your team.'));assert($('#main').textContent.includes('Your training capacity'));assert.equal(document.querySelectorAll('.rod-slot-container').length,6);assert.equal($('#loadout-preset-select').value,'feeder');assert($('.assembly-illustration .rod-visual'));assert.equal($('#assembly-name').value,'My feeder');assert.equal(document.querySelectorAll('[data-assembly-field]').length,11);assert(!document.querySelector('#rod-preset-select'));assert($('#main').textContent.includes('My assembled rods'));
const money=game.state.money;const before=JSON.stringify(game.state);click('[data-visual-part="reel"]');assert.equal(document.activeElement.dataset.assemblyField,'reel');$('[data-visual-part="hook"]').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(document.activeElement.dataset.assemblyField,'hook');assert.equal(JSON.stringify(game.state),before);
input('#assembly-name','My custom corn feeder');change('[data-assembly-field="bait"]','corn');click('[data-action="save-assembly"]');assert.equal(game.state.rodPresets[0].name,'My custom corn feeder');assert.equal(game.loadout.rods[0].bait,'corn');assert.equal(game.state.money,money);
const carpLine=game.state.rodPresets[1].items.line;assert($('[data-assembly-field="line"] option[value="'+carpLine+'"]').disabled);assert($('#main').textContent.includes('reserved by'));
checks.push('Visible rod and eleven component controls replace the old preset editor; pointer/keyboard hotspots focus real menus, unavailable units are disabled, and naming/updating propagates to loadouts without spending money');
game.state.xp=xpAt(10);game.state.money=10000;game.emit('test');click('[data-action="buy-slot"]:not([disabled])');confirm();assert.equal(game.state.rodSlots,2);change('[data-slot-rod-preset="1"]','rig_karper');input('#loadout-name','Mixed day');click('[data-action="save-loadout"]');assert.equal(game.loadout.rods.length,2);assert.deepEqual(game.loadout.rods.map(r=>r.style),['feeder','karper']);assert($('[data-slot-rod-preset="1"] option[value="rig_feeder"]').disabled);
checks.push('Six rod slots assign actual saved rods, allow mixed feeder/carp fishing and reject duplicate deployment');
click('[data-select-rod-slot="0"]');click('[data-action="new-assembly"]');assert($('[data-action="save-assembly"]').disabled);input('#assembly-name','Second physical feeder');
for(const part of PARTS.filter(p=>p!=='indicator')){const id={rod:'feeder_rod_field',reel:'feeder_reel_field',line:'line_field',hook:'hook_12',terminal:'feeder_terminal_field'}[part];assert(game.buyGear(id).ok);const item=game.state.tackleItems.find(i=>i.gearId===id&&!ownerOf(game.state,i.id));assert(item);change('[data-assembly-field="'+part+'"]',item.id);}
click('[data-action="save-assembly"]');const built=game.state.rodPresets.find(p=>p.name==='Second physical feeder');assert(built?.assembled);change('[data-slot-rod-preset="0"]',built.id);click('[data-action="save-loadout"]');assert.equal(game.loadout.rods[0].sourcePresetId,built.id);
assert(game.buyGear('feeder_rod_scout').ok);const scout=game.state.tackleItems.find(i=>i.gearId==='feeder_rod_scout');change('[data-assembly-field="rod"]',scout.id);click('[data-action="save-assembly"]');assert.equal(game.loadout.rods[0].rod,'feeder_rod_scout');assert(/level 15/i.test($('.academy-card').textContent),$('.academy-card').textContent);page('home');assert($('#start-session').disabled);game.state.xp=xpAt(15);game.emit('test');assert(!$('#start-session').disabled);
checks.push('Building a new rod requires all free components; equipping a heavier tier updates every reference and blocks fishing until the displayed training level is reached');
page('loadouts');click('[data-action="new-loadout"]');change('[data-slot-rod-preset="0"]',built.id);input('#loadout-name','Alternate');click('[data-action="save-loadout"]');assert(game.loadout.rods.some(r=>r.sourcePresetId===built.id));click('[data-dismantle-assembly="'+built.id+'"]');confirm();assert(!game.state.rodPresets.some(p=>p.id===built.id));assert(game.state.loadouts.every(l=>l.rods.every(r=>r.sourcePresetId!==built.id)));assert(!game.quote().valid);assert(Object.values(built.items).every(id=>!ownerOf(game.state,id)));page('statistics');assert($('#forecast-root'));assert(!$('#main').textContent.includes('NaN'));page('loadouts');change('#loadout-preset-select','feeder');
checks.push('Dismantling through the UI frees components and removes the rod from all loadouts; an empty preset and its statistics remain usable');
const p=game.state.rodPresets.find(p=>p.id==='rig_feeder'),item=game.state.tackleItems.find(i=>i.id===p.items.rod);item.condition=0;game.emit('equipment');click('[data-edit-assembly="rig_feeder"]');assert($('.repair-inventory').textContent.includes('free'));const cash=game.state.money;click('[data-repair-rod="'+item.id+'"]');assert.equal(item.condition,100);assert.equal(game.state.money,cash);scout.condition=0;game.emit('equipment');assert($('.repair-inventory').textContent.includes('Scout'));const paidCash=game.state.money;click('[data-repair-rod="'+scout.id+'"]');assert.equal(scout.condition,100);assert.equal(game.state.money,paidCash-GEAR.find(g=>g.id===scout.gearId).price*.35);
change('.topbar [data-language-select]','nl');assert($('#main').textContent.includes('Je scholingscapaciteit'));assert($('#main').textContent.includes('Mijn gebouwde hengels'));assert($('#main').textContent.includes('My custom corn feeder'));change('.topbar [data-language-select]','en');assert($('#main').textContent.includes('Repair workshop'));page('settings');assert($('#main').textContent.includes('App updates & recovery'));assert($('#main').textContent.includes('3.0.0'));
checks.push('Repair controls apply free original-starter and paid purchased-rod repairs; English/Dutch switches preserve custom names and settings expose update/recovery controls');
noErrors();console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Actual DOM, app actions and state; no browser rendering or Android hardware'},null,2));dom.window.close();
