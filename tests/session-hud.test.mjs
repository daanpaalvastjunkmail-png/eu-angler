import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {fishingView} from '../dist/game-view.js';
import {assembleRods} from './tackle-fixtures.mjs';

const checks=[];
const setup=()=>new IdleGame({storage:null,now:()=>1800000000000});
const documentFor=game=>new JSDOM(fishingView(game));

{
 const game=setup(),before=JSON.stringify(game.state),dom=documentFor(game),document=dom.window.document;
 assert(!document.querySelector('.scene-session-hud,[data-action="stop-session"],[data-live="remaining"]'),'An idle scene must not show a running timer or a stop action');
 assert(!document.querySelector('[data-change-bait]'),'The idle scene leaves bait selection to the trip planner');
 assert(document.querySelector('.scene-header .game-scene-title')&&document.querySelector('.scene-header .scene-top-tools'),'Location and tools share a flowing header');
 assert.equal(JSON.stringify(game.state),before,'Scene rendering must not change game state');
 dom.window.close();
 checks.push('Idle scenes retain their location and tools without an active timer, stop action or live bait editor');
}

{
 const game=setup();assert(game.startSession().ok);
 game.state.settings.language='nl';game.state.session.duration=7200;game.state.session.remaining=3661;
 const before=JSON.stringify(game.state),dom=documentFor(game),document=dom.window.document,hud=document.querySelector('.scene-session-hud'),scene=document.querySelector('.game-scene');
 assert(scene.classList.contains('is-session-active'));
 assert.equal(scene.querySelector('.scene-top-content').firstElementChild,hud,'Active controls precede the location inside the graphic');
 assert.equal(hud.nextElementSibling.className,'scene-header');
 assert.equal(hud.querySelector('[data-live="remaining"]').textContent,'1:01:01');
 assert.equal(hud.querySelector('[data-live="remaining"]').getAttribute('role'),'timer');
 assert.equal(hud.querySelector('[data-live="remaining"]').getAttribute('aria-live'),'off','Per-second countdowns must not repeatedly interrupt screen readers');
 assert(Math.abs(parseFloat(hud.querySelector('[data-live-width="sessionProgress"]').style.width)-(1-3661/7200)*100)<1e-8);
 assert.equal(document.querySelectorAll('[data-action="stop-session"]').length,1);
 assert.equal(hud.querySelector('[data-action="stop-session"]').textContent,'Sessie stoppen');
 assert(hud.hasAttribute('data-no-translate'));assert(hud.textContent.includes('1 hengel in het water'));
 assert.equal(JSON.stringify(game.state),before,'Displaying time and progress must not advance the session');
 dom.window.close();
 game.state.settings.language='en';game.state.session.remaining=59.01;
 const english=documentFor(game);
 assert.equal(english.window.document.querySelector('[data-live="remaining"]').textContent,'1:00');
 assert(english.window.document.querySelector('.scene-session-hud').textContent.includes('Session active'));
 assert.equal(english.window.document.querySelector('[data-action="stop-session"]').textContent,'Stop session');
 english.window.close();
 checks.push('The active graphic owns one bilingual stop action, an accessible true countdown and progress before its location heading');
}

{
 const game=setup();game.state.xp=xpAt(300);game.state.rodSlots=6;game.state.money=1e7;
 const rods=assembleRods(game,['feeder','karper','dobber','feeder','karper','dobber'].map((style,slot)=>({...starterRod(style),slot})));
 assert(game.setSessionRods(rods).ok);assert(game.startSession().ok);
 const phases=['waiting','nibble','bite','rescue','landed','broken'];
 game.state.session.rods.forEach((rod,index)=>rod.phase=phases[index]);
 const before=JSON.stringify(game.state),dom=documentFor(game),document=dom.window.document,controls=[...document.querySelectorAll('.scene-rod-control')];
 assert.equal(document.querySelector('.scene-rod-controls').dataset.rodCount,'6');
 assert.equal(controls.length,6);assert.equal(document.querySelectorAll('[data-scene-line]').length,6);
 assert.equal(document.querySelectorAll('[data-action="stop-session"]').length,1,'Six rods still share exactly one session stop action');
 controls.forEach((control,index)=>{
  assert.equal(control.dataset.phase,phases[index]);assert.equal(control.dataset.rodSlot,String(index));
  assert.equal(control.querySelector('kbd').textContent,String(index+1));
  const strike=control.querySelector(`[data-strike="${index}"]`),bait=control.querySelector(`[data-change-bait="${index}"]`),outcome=control.querySelector(`[data-outcome="${index}"]`);
  assert(strike&&bait&&outcome,'Every rod has independently addressed strike, bait and outcome controls');
  assert(outcome.compareDocumentPosition(bait)&dom.window.Node.DOCUMENT_POSITION_FOLLOWING,'Bait follows strike/outcome feedback in each card');
  assert.equal(bait.disabled,phases[index]==='broken','A broken rod cannot open its live bait editor');
 });
 assert.equal(JSON.stringify(game.state),before);
 dom.window.close();
 checks.push('Six mixed rods keep individual physical numbers, simultaneous phases and strike controls with live bait actions beneath their outcomes');
}

{
 const game=setup();assert(game.startSession().ok);game.stopSession();
 const dom=documentFor(game);
 assert(!dom.window.document.querySelector('.scene-session-hud,[data-action="stop-session"],[data-change-bait]'),'Stopping clears all active-only controls');
 assert.equal(dom.window.document.querySelectorAll('.scene-rod-control').length,game.loadout.rods.length,'The rods remain visible after stopping');
 dom.window.close();
 const css=await readFile(new URL('../dist/session-hud.css',import.meta.url),'utf8');
 const styles=new JSDOM(`<style>${css}</style><section class="game-view"><button class="scene-session-stop">Stop session</button></section>`);
 assert(parseFloat(styles.window.getComputedStyle(styles.window.document.querySelector('button')).minHeight)>=44,'The stop action must retain a touch-sized target');
 styles.window.close();
 checks.push('Session end removes active-only controls; real HUD CSS keeps the stop action large enough for touch');
}

console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,limit:'Real game state and DOM checks; no browser layout or screenshot verification'},null,2));
