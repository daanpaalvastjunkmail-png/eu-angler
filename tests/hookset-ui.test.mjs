import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';

// These run the real event routes and transient SVG painter. jsdom does not
// rasterise the scene, so this suite checks input targeting and animation state.
const errors=[],checks=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://europa-hookset.test/',pretendToBeVisual:true,virtualConsole});
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
const line=index=>$(`[data-scene-line="${index}"]`);
const angle=index=>Number(line(index).querySelector('.fishing-strike-motion').getAttribute('transform').match(/-?\d+(?:\.\d+)?/)[0]);
const highlight=index=>Number(line(index).querySelector('.fishing-hookset-highlight').getAttribute('opacity'));
const active=()=>[0,1].map(index=>line(index).dataset.hookset==='true');
const tick=milliseconds=>{clock+=milliseconds;game.emit('tick');noErrors();};
const click=selector=>{const element=$(selector);if(typeof element.click==='function')element.click();else element.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));noErrors();};
const key=(number,options={})=>{document.activeElement?.blur();window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'Digit'+number,key:String(number),bubbles:true,...options}));noErrors();};
const arm=(index,options={})=>{
 const species=index?'schub':'voorn';
 Object.assign(game.state.session.rods[index],{phase:'bite',candidate:{id:'fish_'+game.state.serial++,species,name:index?'Schubkarper':'Blankvoorn',weight:index?1:.3,value:7,xp:10,water:game.state.session.water,trophy:false,eligible:true,autoRoll:.99,manualRoll:0,...options},biteStartedAt:clock-500,deadline:clock+5000,next:3.2,total:6});
};

assert(game);game.state.money=100000;game.state.xp=xpAt(40);game.state.rodSlots=3;
assert(game.saveLoadout(null,'Feeder and carp · physical positions 1 / 3',[
 {...starterRod('feeder'),slot:0},{...starterRod('karper'),slot:2},
]).ok);
game.setPlan({duration:60,reserve:.1});click('#start-session');
assert(game.state.session);assert.equal(game.state.session.rods.length,2);
assert.deepEqual([...document.querySelectorAll('.scene-rod-control kbd')].map(element=>element.textContent),['1','3']);
const scene=$('#scene-foreground');
arm(0);arm(1);game.emit('tick');
click('.scene-strike-button[data-strike="0"]');
assert.equal(game.state.session.manualCaught,1);assert.deepEqual(game.state.session.rods.map(rod=>rod.caught),[1,0]);
assert.equal(game.state.session.rods[1].phase,'bite','Striking the feeder must preserve the carp bite');
assert.deepEqual(active(),[true,false]);assert.equal($('#scene-foreground'),scene,'An accepted strike must animate the current scene rather than replace it');
tick(120);assert.equal(angle(0),12);assert.equal(angle(1),0);
tick(430);assert.deepEqual(active(),[false,false]);assert.equal(angle(0),0);assert.equal(highlight(0),0);
checks.push('A real feeder reel-in button catches only its fish and animates its current scene rod to the lift peak, then resets without moving the carp rod');

// Clicking the visible carp blank exercises the SVG route rather than its button.
click('[data-scene-line="1"] .fishing-rod-blank path');
assert.equal(game.state.session.manualCaught,2);assert.deepEqual(game.state.session.rods.map(rod=>rod.caught),[1,1]);
assert.deepEqual(active(),[false,true]);assert.equal($('#scene-foreground'),scene);
tick(120);assert.equal(angle(1),12);assert.equal(angle(0),0);
// A repeat during the cooldown must neither create a fish nor restart the lift.
key(3);click('[data-scene-line="1"] .fishing-rod-blank path');
assert.equal(game.state.session.manualCaught,2);
tick(430);assert.deepEqual(active(),[false,false],'Ignored spam must not restart the original 540ms feedback');
checks.push('Clicking a visible carp rod uses the same transient lift; immediate keyboard and SVG spam cannot duplicate a catch or restart its feedback');

clock+=300;arm(0);arm(1);game.emit('tick');
const beforeEmpty=JSON.stringify({caught:game.state.session.caught,phase:game.state.session.rods.map(rod=>rod.phase)});
key(2);assert.equal(JSON.stringify({caught:game.state.session.caught,phase:game.state.session.rods.map(rod=>rod.phase)}),beforeEmpty);assert.deepEqual(active(),[false,false]);
key(3);
assert.equal(game.state.session.manualCaught,3);assert.deepEqual(game.state.session.rods.map(rod=>rod.caught),[1,2]);
assert.equal(game.state.session.rods[0].phase,'bite');assert.deepEqual(active(),[false,true],'Physical key 3 must animate runtime 1 in the third physical position');
tick(120);assert.equal(angle(1),12);assert.equal(angle(0),0);
tick(430);assert.deepEqual(active(),[false,false]);
checks.push('Physical keyboard position 3 targets the second deployed rod and its own lift; empty position 2 leaves both fishing and visual states untouched');

// Reject invalid DOM input, disabled controls and modified/repeated keyboard input.
const beforeInvalid=JSON.stringify({caught:game.state.session.caught,phase:game.state.session.rods.map(rod=>rod.phase),early:game.state.session.earlyStrikes});
key(3);key(1,{repeat:true});key(1,{ctrlKey:true});key(7);
const invalidButton=document.createElement('button');invalidButton.dataset.strike='99';document.body.append(invalidButton);invalidButton.click();invalidButton.remove();
const disabled=$('.scene-strike-button[data-strike="0"]');disabled.disabled=true;disabled.click();disabled.disabled=false;
assert.equal(JSON.stringify({caught:game.state.session.caught,phase:game.state.session.rods.map(rod=>rod.phase),early:game.state.session.earlyStrikes}),beforeInvalid);
assert.deepEqual(active(),[false,false]);
checks.push('Invalid rod targets, disabled controls, landed-rod spam, repeated keys and modified keys never create hook-setting feedback or change fishing outcomes');

clock+=300;game.state.settings.reducedMotion=true;arm(0);game.emit('tick');
click('.scene-strike-button[data-strike="0"]');
assert.equal(game.state.session.manualCaught,4);assert.deepEqual(active(),[true,false]);assert.equal(angle(0),0);assert.equal(highlight(0),.8);
tick(120);assert.equal(angle(0),0);assert.equal(highlight(0),.8);assert.equal(angle(1),0);
tick(430);assert.deepEqual(active(),[false,false]);assert.equal(highlight(0),0);
checks.push('The real app passes reduced-motion settings into hook-setting: an accepted catch gets a steady brief handle highlight without a rod swing');

clock+=300;game.state.settings.reducedMotion=false;arm(0,{manualRoll:1});game.emit('tick');
const caught=game.state.session.caught;click('.scene-strike-button[data-strike="0"]');
assert.equal(game.state.session.caught,caught);assert.equal(game.state.session.rods[0].phase,'missed');assert.deepEqual(active(),[true,false]);
tick(120);assert.equal(angle(0),12);tick(430);assert.deepEqual(active(),[false,false]);
checks.push('An accepted manual attempt that loses the fish still gives hook-setting feedback while preserving its real missed outcome and catch total');

noErrors();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Real app event handlers and SVG DOM animation states; no browser rasterisation'},null,2));
dom.window.close();
