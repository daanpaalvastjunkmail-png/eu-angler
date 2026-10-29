import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {IdleGame,starterRod} from '../dist/engine.js';
import {fishingView} from '../dist/game-view.js';
import {fishingForeground,paintFishingForeground} from '../dist/fishing-scene.js';

const checks=[];
const rigs=[
 {...starterRod('feeder'),indicator:'feeder_bell'},
 {...starterRod('karper'),indicator:'carp_alarm'},
 {...starterRod('dobber'),indicator:'float_glow'},
 {...starterRod('feeder'),indicator:'feeder_smartclip'},
 {...starterRod('karper'),indicator:'carp_receiver'},
 starterRod('karper'),
].map((rod,slot)=>({...rod,slot}));
const makeSvg=rods=>new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${fishingForeground(rods)}</svg>`);
const sessionFor=phases=>({rods:phases.map(phase=>({phase}))});

{
 for(const count of [1,2,3,6]){
  const game=new IdleGame({storage:null,now:()=>1800000000000});
  game.state.selectedRods=rigs.slice(0,count);
  
  const dom=new JSDOM(fishingView(game)),document=dom.window.document,view=document.querySelector('#fishing-game');
  const lines=[...view.querySelectorAll('[data-scene-line]')],controls=[...view.querySelectorAll('.scene-rod-control')];
  assert.equal(lines.length,count);assert.equal(controls.length,count);
  assert.equal(view.querySelector('#scene-foreground').getAttribute('preserveAspectRatio'),'xMidYMax meet','The camera must not crop the side rods');
  assert(!view.querySelector('[data-focus-line],#scene-strike-hud'),'All rods have their own controls rather than a selected-rod switch');
  for(let index=0;index<count;index++){
   assert.equal(lines[index].dataset.sceneLine,String(index));
   assert.equal(controls[index].dataset.liveRod,String(index));
   assert.equal(controls[index].querySelectorAll(`[data-strike="${index}"]`).length,1);
   assert(controls[index].querySelector(`[data-signal-text="${index}"]`));
   assert(controls[index].querySelector(`[data-bite-progress="${index}"]`));
   assert(controls[index].querySelector(`[data-outcome="${index}"]`));
   assert.equal(lines[index].querySelector('.fishing-scene-rig').getAttribute('opacity'),'1','All rods must remain equally visible');
  }
  assert(view.querySelector('.scene-rod-controls').compareDocumentPosition(view.querySelector('.game-session-summary'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  dom.window.close();
 }
 checks.push('One, two, three and six rods have equal visible rigs, matching individual strike controls and a camera that preserves the full scene');
}

{
 const dom=makeSvg(rigs),svg=dom.window.document.querySelector('svg'),phases=['bite','rescue','nibble','waiting','landed','missed'],session=sessionFor(phases),original=JSON.stringify(session);
 paintFishingForeground(svg,session,0,1234,true);
 const lines=[...svg.querySelectorAll('[data-scene-line]')],transforms=lines.map(line=>line.querySelector('.fishing-scene-rig').getAttribute('transform'));
 assert.equal(new Set(transforms).size,6,'Every complete rig must have its own lane');
 assert.deepEqual(lines.map(line=>line.dataset.phase),phases,'Every rod must show its own simultaneous runtime state');
 assert.notEqual(lines[0].querySelector('.fishing-large-tip').getAttribute('d'),lines[3].querySelector('.fishing-large-tip').getAttribute('d'),'A feeder bite bends independently from another waiting feeder');
 assert(Number(lines[1].querySelector('.fishing-bite-halo').getAttribute('opacity'))>0,'The second rod rescue stays visible alongside the feeder bite');
 assert.notEqual(lines[2].querySelector('.fishing-scene-float').getAttribute('transform'),'translate(0 0)','The float nibble remains visible while other rods bite');
 const visible=svg.innerHTML;
 paintFishingForeground(svg,session,5,1234,true);assert.equal(svg.innerHTML,visible,'Changing a legacy focus argument must never hide, move, dim or reorder any rod');
 assert.equal(JSON.stringify(session),original,'Rendering must leave simulation state untouched');
 for(const line of lines){
  const transform=line.querySelector('.fishing-scene-rig').getAttribute('transform'),[anchorX,anchorY,scale]=transform.match(/-?\d+(?:\.\d+)?/g).map(Number),index=Number(line.dataset.sceneLine),cell=1200/6;
  const left=anchorX+(378-1058)*scale,right=anchorX+(1080-1058)*scale;
  assert(left>=index*cell&&right<=(index+1)*cell,'Each complete rig and water contact must fit inside its own lane');
  assert.equal(anchorY,593,'All rods must share the same bank height');
 }
 dom.window.close();
 checks.push('Six mixed rods display independent simultaneous bite phases in separate lanes without focus changes mutating the view or simulation');
}

{
 const dom=makeSvg([rigs[0]]),svg=dom.window.document.querySelector('svg'),line=svg.querySelector('[data-scene-line]');
 assert.equal(line.querySelector('.fishing-scene-rig').getAttribute('transform'),'translate(0 0)');
 assert.equal(line.querySelector('.fishing-rod-elevation').getAttribute('transform'),'rotate(10 1058 593)','The raised feeder geometry must stay intact');
 for(const phase of ['waiting','nibble','bite','rescue']){
  paintFishingForeground(svg,sessionFor([phase]),5,1234,true);
  const cast=line.querySelector('.fishing-cast-line').getAttribute('d');
  assert(cast.endsWith('L430 285'),'The feeder line must keep its world-space water contact while its elevated tip bends');
  assert.equal(line.querySelector('.fishing-scene-rig').getAttribute('transform'),'translate(0 0)','A single feeder must retain its large original position');
 }
 dom.window.close();
 checks.push('Single-rod raised feeder, pod position and attached cast line remain intact through real bite and rescue states');
}

{
 const sparse=[{...rigs[0],slot:0},{...rigs[1],slot:2},{...rigs[2],slot:5}],game=new IdleGame({storage:null});
 game.state.selectedRods=sparse;
 const dom=new JSDOM(fishingView(game)),document=dom.window.document;
 assert.deepEqual([...document.querySelectorAll('.scene-rod-control')].map(control=>control.dataset.rodSlot),['0','2','5']);
 assert.deepEqual([...document.querySelectorAll('.scene-rod-control kbd')].map(kbd=>kbd.textContent),['1','3','6']);
 assert.deepEqual([...document.querySelectorAll('[data-scene-line]')].map(line=>line.dataset.sceneLine),['0','1','2'],'Runtime indices must stay separate from physical rod-slot numbers');
 assert(document.querySelector('[data-scene-line="2"]').getAttribute('aria-label').includes('Hengel 6'));
 dom.window.close();
 checks.push('Sparse physical positions preserve player-facing rod numbers while strike controls retain matching runtime indices');
}

console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,limit:'SVG and DOM state checks; no browser rasterisation'},null,2));
