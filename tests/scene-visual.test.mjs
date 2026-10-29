import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {IdleGame,starterRod} from '../dist/engine.js';
import {rodArt} from '../dist/angling-visuals.js';
import {fishingForeground,paintFishingForeground} from '../dist/fishing-scene.js';
import {fishingView} from '../dist/game-view.js';

// These are DOM, SVG-state and computed-CSS checks. jsdom does not provide
// browser layout or rasterisation, so this suite does not claim screenshot QA.
const checks=[],errors=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>errors.push(String(error)));
const css=(await fs.readFile(new URL('../dist/style.css',import.meta.url),'utf8'))+'\n'+(await fs.readFile(new URL('../dist/atelier.css',import.meta.url),'utf8'));
function documentFor(body){return new JSDOM(`<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`,{url:'https://europa-angler.test/',virtualConsole,pretendToBeVisual:true});}
function foreground(rods,selected=0){return documentFor(`<svg class="fishing-view-svg" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">${fishingForeground(rods,selected)}</svg>`);}
const fixture=(style,indicator=null)=>({...starterRod(style),indicator});
const phaseSession=phases=>({rods:phases.map(phase=>({phase}))});
const tipEnd=line=>line.querySelector('.fishing-large-tip').getAttribute('d').match(/-?\d+(?:\.\d+)?/g).slice(-2).map(Number);

{
 const game=new IdleGame({storage:null,now:()=>1800000000000}),dom=documentFor(fishingView(game)),document=dom.window.document,scene=document.querySelector('.game-scene'),illustration=scene.querySelector('#scene-foreground');
 assert(illustration.querySelector('.fishing-foreground'),'The large real rod must be drawn inside the fishing view');
 assert(document.querySelector('.game-view .scene-rod-controls [data-strike]'),'Each line must have a strike control in the fishing view');
 assert.equal(document.querySelector('.scene-rod-controls').previousElementSibling.className,'scene-control-toolbar','Modes and guidance must stay immediately above all per-rod controls');
 assert(document.querySelector('.scene-rod-control [data-signal-text]')&&document.querySelector('.scene-rod-control [data-bite-progress]'),'Each rod must show its true bite cue and remaining reaction window');
 assert.equal(illustration.getAttribute('viewBox'),'0 0 1200 600');
 assert.equal(illustration.getAttribute('preserveAspectRatio'),'xMidYMax meet','Every rod must remain visible without cropping the composite view');
 assert(scene.querySelector('.atelier-scene-background[src]'),'The landscape must fill the scene independently of the uncropped rods');
 const sceneStyle=dom.window.getComputedStyle(scene),illustrationStyle=dom.window.getComputedStyle(illustration);
 assert.equal(sceneStyle.aspectRatio,'auto','The landscape fills the responsive stage while the rods retain their proportions');
 assert.equal(dom.window.getComputedStyle(document.querySelector('.scene-rod-controls')).gridTemplateColumns,'repeat(auto-fit,minmax(min(100%,230px),1fr))');
 assert(Number.parseFloat(dom.window.getComputedStyle(document.querySelector('.scene-strike-button')).minHeight)>=44,'Every line must have a usable strike target');
 assert.equal(illustrationStyle.width,'100%');assert.equal(illustrationStyle.height,'100%','The scene SVG must fill the stage rather than inherit small icon sizing');
 assert(!document.querySelector('.bite-station,.rod-monitor'),'The fishing view must not create separate tiny rod-monitor cards');
 assert.equal(document.querySelectorAll('[data-focus-line],#scene-strike-hud').length,0,'No selected-rod HUD may hide the other controls');
 assert.equal(document.querySelectorAll('.scene-rod-control').length,game.loadout.rods.length);
 assert(scene.querySelector('[aria-live="polite"]'),'Real bite announcements must remain accessible');
 checks.push('The foreground uses bottom-aligned meet and a separate full-size landscape; each rod has its own visible strike action and bite window');
 dom.window.close();
}

{
 const dom=documentFor(`<button class="rod-monitor">${rodArt(fixture('feeder'))}</button><section class="rod-studio">${rodArt(fixture('dobber'),{editor:true})}</section><button class="button"><svg viewBox="0 0 24 24"></svg></button>`),{document,getComputedStyle}=dom.window;
 for(const svg of document.querySelectorAll('.rod-visual')){
  const computed=getComputedStyle(svg);
  assert.equal(computed.width,'100%','Rod illustrations must use the available width');
  assert.equal(computed.height,'auto','Rod SVG must retain its aspect ratio instead of inheriting the 19px button-icon height');
  assert(Number.parseFloat(computed.maxHeight)>=175,'Rod illustration must be allowed a readable height');
 }
 const icon=getComputedStyle(document.querySelector('.button svg'));
 assert(Number.parseFloat(icon.width)<=24&&Number.parseFloat(icon.height)<=24,'Fixing rod images must preserve small button icons');
 checks.push('Real CSS keeps monitor and editor rod SVGs proportional; small button icons remain small');
 dom.window.close();
}

{
 const rods=[fixture('feeder','feeder_bell'),fixture('karper','carp_alarm'),fixture('dobber','float_glow'),fixture('feeder'),fixture('karper'),fixture('zee','sea_ratchet')];
 const dom=foreground(rods),svg=dom.window.document.querySelector('svg'),root=svg.querySelector('.fishing-foreground'),session=phaseSession(['bite','rescue','nibble','waiting','landed','bite']);
 const before=JSON.stringify(session);
 assert.equal(root.querySelectorAll('[data-scene-line]').length,6);
 assert.equal(root.querySelectorAll('.fishing-large-spool').length,6);
 const initialTransforms=[...root.querySelectorAll('.fishing-scene-rig')].map(rig=>rig.getAttribute('transform'));
 assert.equal(new Set(initialTransforms).size,6,'Each complete rig needs its own lane');
 for(const ignoredSelection of [0,1,2,3,4,5,99,-2]){
  paintFishingForeground(svg,session,ignoredSelection,1234,true);
  assert.equal(root.querySelectorAll('[data-active="true"]').length,6,'All rods stay equally visible rather than selecting just one');
  assert.equal(root.dataset.visibleRods,'6');
  assert.equal(root.dataset.activeLine,undefined,'There must be no selected foreground rod');
  assert.deepEqual([...root.querySelectorAll('.fishing-scene-rig')].map(rig=>rig.getAttribute('transform')),initialTransforms,'A legacy selection argument must not enlarge, shrink or reorder any rig');
  for(const line of root.querySelectorAll('[data-scene-line]')){
   assert.equal(line.dataset.phase,session.rods[Number(line.dataset.sceneLine)].phase,'Each line keeps its own actual bite state');
   assert.equal(line.querySelector('.fishing-scene-rig').getAttribute('opacity'),'1');
  }
 }
 assert.equal(JSON.stringify(session),before,'Painting rods must not advance or mutate the fishing simulation');
 const game=new IdleGame({storage:null,now:()=>1800000000000});game.state.selectedRods=rods.map((rod,slot)=>({...rod,slot}));
 const controls=documentFor(fishingView(game));
 assert.equal(controls.window.document.querySelectorAll('.scene-rod-control').length,6);
 assert.equal(controls.window.document.querySelectorAll('.scene-rod-control .scene-strike-button').length,6);
 assert.deepEqual([...controls.window.document.querySelectorAll('.scene-rod-control')].map(el=>el.dataset.rodSlot),['0','1','2','3','4','5']);
 controls.window.close();
 checks.push('All six rods stay equally visible in separate stable lanes, keep individual bite phases and receive their own strike controls');
 dom.window.close();
}

{
 const dom=foreground([fixture('feeder','feeder_bell')]),svg=dom.window.document.querySelector('svg'),line=svg.querySelector('[data-scene-line]');
 paintFishingForeground(svg,phaseSession(['waiting']),0,1000,true);const idle=tipEnd(line),idleGuide=line.querySelector('[data-guide="6"]').getAttribute('transform'),idleLine=line.querySelector('.fishing-cast-line').getAttribute('d');
 paintFishingForeground(svg,phaseSession(['nibble']),0,1000,true);const nibble=tipEnd(line);
 paintFishingForeground(svg,phaseSession(['bite']),0,1000,true);const bite=tipEnd(line);
 assert(nibble[1]>idle[1]&&bite[1]>nibble[1]+20,'A real feeder bite must bend the tip further than small pre-bite taps');
 assert.notEqual(line.querySelector('[data-guide="6"]').getAttribute('transform'),idleGuide,'The tip guide must follow the bending blank');
 assert.notEqual(line.querySelector('.fishing-cast-line').getAttribute('d'),idleLine,'The cast line must stay attached to the bending tip');
 assert.notEqual(line.querySelector('.fishing-scene-bell').getAttribute('transform'),'rotate(0 0 -8)');
 assert(Number(line.querySelector('.fishing-bite-halo').getAttribute('opacity'))>0);
 paintFishingForeground(svg,null,0,1000,true);
 assert.deepEqual(tipEnd(line),idle,'Ending a session must clear a previous visible bend');
 assert.equal(line.querySelector('.fishing-scene-bell').getAttribute('transform'),'rotate(0 0 -8)');
 assert.equal(line.dataset.phase,'waiting');
 checks.push('Feeder taps, full bend, attached line and ringing bell follow actual bite phases and reset after the session');
 dom.window.close();
}

{
 const dom=foreground([fixture('dobber','float_glow')]),svg=dom.window.document.querySelector('svg'),line=svg.querySelector('[data-scene-line]'),float=line.querySelector('.fishing-scene-float');
 paintFishingForeground(svg,phaseSession(['waiting']),0,1800,true);const idle=float.getAttribute('transform');
 paintFishingForeground(svg,phaseSession(['nibble']),0,1800,true);const nibble=float.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number);
 paintFishingForeground(svg,phaseSession(['bite']),0,1800,true);const bite=float.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number);
 assert.equal(idle,'translate(0 0)');
 assert(nibble[1]>0&&nibble[1]<10);
 assert(bite[1]>25&&bite[1]>nibble[1]*3,'The float must visibly dip under on a real bite');
 assert(line.querySelector('.fishing-float-antenna').hasAttribute('filter'),'The equipped glow antenna must render its visible effect');
 assert.equal(line.querySelector('.fishing-large-spool').getAttribute('transform'),'rotate(0 836 530)','A float bite must not pretend to run a carp spool');
 paintFishingForeground(svg,phaseSession(['missed']),0,1800,true);assert.equal(float.getAttribute('transform'),'translate(0 0)');
 checks.push('A real float bite dips the visible antenna; small taps stay distinct and the glow upgrade is displayed');
 dom.window.close();
}

{
 for(const style of ['karper','zee']){
  const dom=foreground([fixture(style,style==='karper'?'carp_alarm':'sea_ratchet')]),svg=dom.window.document.querySelector('svg'),line=svg.querySelector('[data-scene-line]'),spool=line.querySelector('.fishing-large-spool'),led=line.querySelector('.fishing-signal-led');
  paintFishingForeground(svg,phaseSession(['waiting']),0,1000);const idle=spool.getAttribute('transform'),dim=Number(led.getAttribute('opacity'));
  paintFishingForeground(svg,phaseSession(['bite']),0,1000);const running=spool.getAttribute('transform');
  assert.notEqual(running,idle);assert(Number(led.getAttribute('opacity'))>dim);
  paintFishingForeground(svg,phaseSession(['rescue']),0,1300);assert.notEqual(spool.getAttribute('transform'),running,'A rescuable missed bite must continue to show a running spool');
  paintFishingForeground(svg,phaseSession(['landed']),0,1400);assert.equal(spool.getAttribute('transform'),idle);
  dom.window.close();
 }
 checks.push('Carp and sea spools run during true bites and rescue windows; fitted alarm LEDs brighten and reset');
}

{
 const rods=[fixture('feeder','feeder_smartclip'),fixture('karper','carp_receiver'),fixture('dobber','float_glow')],dom=foreground(rods),svg=dom.window.document.querySelector('svg'),session=phaseSession(['bite','rescue','nibble']);
 paintFishingForeground(svg,session,1,1000,true);const steady=svg.innerHTML;
 paintFishingForeground(svg,session,1,9999,true);assert.equal(svg.innerHTML,steady,'Reduced motion must hold a visible, steady bite pose');
 paintFishingForeground(svg,session,1,9999,false);assert.notEqual(svg.innerHTML,steady);
 const more=dom.window.document.createElementNS('http://www.w3.org/2000/svg','svg');more.innerHTML=fishingForeground(rods,2);svg.after(more);
 const ids=[...dom.window.document.querySelectorAll('[id]')].map(element=>element.id);assert.equal(new Set(ids).size,ids.length,'Multiple foregrounds must not collide on SVG gradient or glow IDs');
 assert.equal(dom.window.document.querySelectorAll('[data-scene-line]').length,6);
 checks.push('Reduced motion preserves readable steady bite poses; multiple foregrounds keep unique SVG resources');
 dom.window.close();
}

{
 const dom=foreground(Array.from({length:8},()=>fixture('feeder'))),svg=dom.window.document.querySelector('svg');
 assert.equal(svg.querySelectorAll('[data-scene-line]').length,6,'The scene must respect the six-rod maximum');
 const empty=foreground([]);assert.equal(empty.window.document.querySelectorAll('[data-scene-line]').length,0);paintFishingForeground(empty.window.document.querySelector('svg'),null);paintFishingForeground(null,null);
 checks.push('Empty loadouts render safely and foregrounds respect the six-rod maximum');
 dom.window.close();empty.window.close();
}

assert.equal(errors.length,0,errors.join('\n'));
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,domErrors:errors.length,limit:'Computed CSS and SVG DOM states; no browser layout, screenshot or audio audition'},null,2));
