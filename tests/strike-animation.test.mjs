import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {starterRod} from '../dist/engine.js';
import {fishingForeground,paintFishingForeground,triggerHookSet} from '../dist/fishing-scene.js';

const checks=[];
const rigs=[
 {...starterRod('feeder'),indicator:'feeder_bell'},
 {...starterRod('karper'),indicator:'carp_alarm'},
 {...starterRod('dobber'),indicator:'float_glow'},
 starterRod('feeder'),starterRod('karper'),starterRod('karper'),
];
const make=(rods=rigs)=>{
 const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${fishingForeground(rods)}</svg>`);
 const svg=dom.window.document.querySelector('svg');
 return {dom,svg,lines:[...svg.querySelectorAll('[data-scene-line]')]};
};
const runtime=phases=>({rods:phases.map(phase=>({phase}))});
const motion=line=>line.querySelector('.fishing-strike-motion');
const angle=line=>Number(motion(line).getAttribute('transform').match(/-?\d+(?:\.\d+)?/)[0]);
const cast=line=>line.querySelector('.fishing-cast-line').getAttribute('d');
const rotate=(x,y,degrees)=>{const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [1058+(x-1058)*c-(y-593)*s,593+(x-1058)*s+(y-593)*c];};
const near=(actual,expected)=>actual.forEach((value,index)=>assert(Math.abs(value-expected[index])<=.02,`${actual} must follow lifted eye ${expected}`));

{
 const {dom,svg,lines}=make(),session=runtime(rigs.map(()=>'waiting')),before=JSON.stringify(session);
 paintFishingForeground(svg,session,0,1000);
 const baseCast=cast(lines[0]),other=lines.slice(1).map(line=>line.outerHTML),pod=lines[0].querySelector('.fishing-rod-pod').outerHTML,lane=lines[0].querySelector('.fishing-scene-rig').getAttribute('transform');
 assert(triggerHookSet(svg,0,1000));
 paintFishingForeground(svg,session,0,1000);assert.equal(angle(lines[0]),0);
 paintFishingForeground(svg,session,0,1050);assert(angle(lines[0])>9&&angle(lines[0])<12,'The hook set must lift promptly');
 paintFishingForeground(svg,session,0,1100);assert.equal(angle(lines[0]),12);
 paintFishingForeground(svg,session,0,1130);assert.equal(angle(lines[0]),12,'The rod must hold briefly at the top of the lift');
 assert.equal(lines[0].querySelector('.fishing-rod-elevation').getAttribute('transform'),'rotate(10 1058 593)','The previously raised feeder angle must be preserved inside the lift');
 assert.equal(lines[0].querySelector('.fishing-rod-pod').outerHTML,pod,'Lifting the rod must leave the rest standing in place');
 assert.equal(lines[0].querySelector('.fishing-scene-rig').getAttribute('transform'),lane,'The hook set must not shift the entire fishing lane');
 assert(motion(lines[0]).contains(lines[0].querySelector('.fishing-reel')),'The reel must travel with the lifted rod');
 assert(!motion(lines[1]).contains(lines[1].querySelector('.fishing-signal-led')),'A carp alarm must remain on the fixed rest');
 const path=cast(lines[0]);assert.notEqual(path,baseCast);assert(path.endsWith('L430 285'),'The line must retain its fixed contact with the water');
 const vertices=path.match(/-?\d+(?:\.\d+)?/g).map(Number),eyeA=-64*Math.PI/180;
 near(vertices.slice(0,2),rotate(849,535,22));
 near(vertices.slice(2,4),rotate(874+8*Math.sin(eyeA),500-8*Math.cos(eyeA),22));
 const tipTransform=lines[0].querySelector('[data-guide="6"]').getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number),[gx,gy,tipAngle]=tipTransform,a=tipAngle*Math.PI/180;
 near(vertices.slice(-4,-2),rotate(gx+8*Math.sin(a),gy-8*Math.cos(a),22));
 assert.deepEqual(lines.slice(1).map(line=>line.outerHTML),other,'Setting one hook must not move or flash another rod');
 paintFishingForeground(svg,session,0,1340);assert(angle(lines[0])>0&&angle(lines[0])<12,'The rod must ease back after its quick lift');
 paintFishingForeground(svg,session,0,1540);assert.equal(angle(lines[0]),0);assert.equal(cast(lines[0]),baseCast);assert.equal(lines[0].dataset.hookset,'false');
 assert.equal(Number(lines[0].querySelector('.fishing-hookset-highlight').getAttribute('opacity')),0);
 assert.equal(JSON.stringify(session),before,'Hook-setting must never change the fishing simulation');
 dom.window.close();
 checks.push('A quick independent hook-setting lift carries rod and reel, retains feeder elevation and an attached line, leaves the stand and water fixed, then returns cleanly');
}

{
 for(const count of [1,2,6]){
  const {dom,svg,lines}=make(rigs.slice(0,count)),session=runtime(Array.from({length:count},()=>'landed'));
  paintFishingForeground(svg,session,0,1000,true);
  const lanes=lines.map(line=>line.querySelector('.fishing-scene-rig').getAttribute('transform'));
  assert(triggerHookSet(svg,0,1000));
  if(count>1)assert(triggerHookSet(svg,count-1,1100));
  paintFishingForeground(svg,session,0,1100);
  assert.equal(angle(lines[0]),12);if(count>1)assert.equal(angle(lines.at(-1)),0);
  paintFishingForeground(svg,session,0,1200);
  assert(angle(lines[0])>0&&angle(lines[0])<12);if(count>1)assert.equal(angle(lines.at(-1)),12);
  assert.deepEqual(lines.map(line=>line.querySelector('.fishing-scene-rig').getAttribute('transform')),lanes);
  assert(lines.every(line=>line.dataset.phase==='landed'),'Visual motion must retain actual simulation outcomes');
  dom.window.close();
 }
 checks.push('One, two and six rod scenes support independent overlapping lifts while preserving lane positions and actual outcomes');
}

{
 const {dom,svg,lines}=make(rigs.slice(0,3)),session=runtime(['waiting','missed','waiting']);
 paintFishingForeground(svg,session,0,1000);
 assert(triggerHookSet(svg,1,1000,true));
 paintFishingForeground(svg,session,0,1000,true);const still=lines[1].outerHTML;
 paintFishingForeground(svg,session,0,1300,true);assert.equal(lines[1].outerHTML,still,'Reduced motion must give steady feedback rather than swinging or flashing');
 assert.equal(angle(lines[1]),0);assert(Number(lines[1].querySelector('.fishing-hookset-highlight').getAttribute('opacity'))>0);
 assert.equal(lines[1].dataset.phase,'missed','An accepted early or missed strike may show its lift feedback without pretending a catch');
 paintFishingForeground(svg,session,0,1540,true);assert.equal(lines[1].dataset.hookset,'false');assert.equal(Number(lines[1].querySelector('.fishing-hookset-highlight').getAttribute('opacity')),0);
 assert(triggerHookSet(svg,0,1600));paintFishingForeground(svg,session,0,1700);assert.equal(angle(lines[0]),12);
 paintFishingForeground(svg,session,0,1710,true);assert.equal(angle(lines[0]),0,'Enabling reduced motion must immediately stop an in-flight lift');
 dom.window.close();
 checks.push('Reduced motion provides a brief steady highlight, clears on time and stops an existing lift when the preference changes');
}

{
 const {dom,svg,lines}=make(),session=runtime(rigs.map(()=>'waiting'));
 paintFishingForeground(svg,session,0,1000);
 const before=svg.innerHTML;
 for(const index of [-1,6,100,1.5,NaN,Infinity])assert.equal(triggerHookSet(svg,index,1000),false);
 assert.equal(triggerHookSet(null,0,1000),false);assert.equal(triggerHookSet(svg,0,NaN),false);assert.equal(svg.innerHTML,before,'Invalid inputs must not change the rendered scene');
 triggerHookSet(svg,0,1000);paintFishingForeground(svg,session,0,1100);assert.equal(angle(lines[0]),12);
 paintFishingForeground(svg,null,0,1120);assert.equal(angle(lines[0]),0);assert.equal(lines[0].dataset.hookset,'false');
 paintFishingForeground(svg,session,0,1150);assert.equal(angle(lines[0]),0,'An ended session must not revive a previous lift');
 const isolated=make(rigs.slice(0,1));paintFishingForeground(isolated.svg,runtime(['waiting']),0,1150);assert.equal(angle(isolated.lines[0]),0,'New DOM scenes must not inherit another scene’s transient animation');
 isolated.dom.window.close();dom.window.close();
 checks.push('Invalid targets have no effect; session end clears hook-setting and a newly rendered scene starts clean');
}

console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,limit:'SVG DOM animation states; no browser rasterisation'},null,2));
