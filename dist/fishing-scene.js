import {GEAR} from './data.js';

// The foreground uses the same 1200 × 600 coordinates as the fishing view.
// Everything that moves is driven by the real rod runtime, never by a fake bite timer.
let sequence=0;
// Hook-setting is a short, local visual response to a successful manual input.
// Keeping it on rendered lines prevents it from entering saves or the simulation.
const hookSets=new WeakMap();
const hookSetDuration=540;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phases={waiting:'Wachten op beet',nibble:'Voorzichtige tikjes',bite:'Beet',rescue:'Beet — sla nu aan',landed:'Vis geland',missed:'Beet gemist',recovering:'Opnieuw uitwerpen'};
const ring=(x,y,n,tip=false)=>`<g class="fishing-guide ${tip?'fishing-tip-guide':''}" data-guide="${n}" transform="translate(${x} ${y}) rotate(-64)"><path d="M0 0v-6" stroke="#6c7a75" stroke-width="1.5"/><ellipse cy="-8" rx="${tip?2.8:4}" ry="${tip?4:6.2}" fill="#1a2e29" stroke="#c0c9ba" stroke-width="1.25"/><ellipse cy="-8" rx="${tip?1.8:2.7}" ry="${tip?2.8:4.5}" fill="#547466" fill-opacity=".2" stroke="#344a40" stroke-width=".6"/></g>`;
// Keep each complete rig, including its water contact and line, in its own lane.
// One rod retains the original raised-feeder view; multiple rigs share the full scene.
const layout=(index,count)=>{
 if(count<=1)return 'translate(0 0)';
 const cell=1200/count,scale=Math.min(1,(cell-28)/700),handleX=(index+1)*cell-12;
 return `translate(${handleX.toFixed(3)} 593) scale(${scale.toFixed(6)}) translate(-1058 -593)`;
};
const rodNumber=(r,index)=>Number.isInteger(r?.slot)?r.slot+1:index+1;
// A feeder sits higher on its front rest; the water contact stays in world space.
const feederTilt='rotate(10 1058 593)';
function liftedPoint(x,y,degrees){const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=x-1058,dy=y-593;return [1058+dx*c-dy*s,593+dx*s+dy*c];}
const raisedFeederPoint=(x,y)=>liftedPoint(x,y,10);
const pointText=p=>p.map(n=>n.toFixed(2)).join(' ');
function feederCastLine(x=480,y=299,cx=542,cy=328,lift=0){
 const eye=(gx,gy,angle=-64)=>{const a=angle*Math.PI/180;return [gx+8*Math.sin(a),gy-8*Math.cos(a)];};
 const guides=[[874,500],[786,455],[694,408],[607,365]].map(([gx,gy])=>eye(gx,gy));
 for(const t of [.44,.76,1]){const u=1-t,gx=u*u*606+2*u*t*cx+t*t*x,gy=u*u*363+2*u*t*cy+t*t*y,angle=Math.atan2(2*u*(cy-363)+2*t*(y-cy),2*u*(cx-606)+2*t*(x-cx))*180/Math.PI+90;guides.push(eye(gx,gy,angle));}
 return 'M'+[[849,535],...guides].map(([gx,gy])=>pointText(liftedPoint(gx,gy,10+lift))).join('L')+'L430 285';
}

function otherCastLine(x,y,cx,cy,targetY,lift){
 const point=(px,py)=>pointText(liftedPoint(px,py,lift));
 return 'M'+[[849,535],[876,494],[785,451],[692,403],[606,359]].map(([px,py])=>point(px,py)).join('L')+`Q${point(cx,cy-4)} ${point(x,y-4)}Q${point(455,Math.min(y,targetY)-10)} 430 ${targetY.toFixed(2)}`;
}

function hookSetPose(line,now,reduced,hasRuntime){
 const hook=hookSets.get(line),elapsed=hook?Math.max(0,now-hook.start):hookSetDuration;
 if(!hasRuntime||elapsed>=hookSetDuration){hookSets.delete(line);line.dataset.hookset='false';return {angle:0,highlight:0};}
 line.dataset.hookset='true';
 // An accessibility preference change also stops motion that is already playing.
 if(reduced||hook.reduced)return {angle:0,highlight:.8};
 const amount=elapsed<100?1-(1-elapsed/100)**3:elapsed<140?1:(1-(elapsed-140)/400)**3;
 return {angle:12*amount,highlight:.85*(1-elapsed/hookSetDuration)};
}

export function triggerHookSet(svg,index,now=Date.now(),reduced=false){
 if(!svg||!Number.isInteger(index)||index<0||!Number.isFinite(now))return false;
 const root=svg.matches?.('.fishing-foreground')?svg:svg.querySelector?.('.fishing-foreground');
 const line=root?.querySelector(`[data-scene-line="${index}"]`);
 if(!line?.querySelector('.fishing-strike-motion'))return false;
 hookSets.set(line,{start:now,reduced:Boolean(reduced)});
 line.dataset.hookset='true';
 line.querySelector('.fishing-hookset-highlight')?.setAttribute('opacity',reduced?'.8':'.85');
 return true;
}


function singleRod(r,index,id,count){
 const style=r.style||'feeder',feeder=style==='feeder',float=style==='dobber',carp=style==='karper',indicator=GEAR.find(g=>g.id===r.indicator),premium=(GEAR.find(g=>g.id===r.rod)?.power||1)>2,reelPremium=(GEAR.find(g=>g.id===r.reel)?.power||1)>2;
 const tip=feeder?'#e9ce83':float?'#a9c8bb':'#afbeb2',spool=reelPremium?'#acb8b4':'#7e9086';
 const elevation=feeder?feederTilt:'rotate(0)',legs=feeder?`M${pointText(raisedFeederPoint(748,433))}L723 574M${pointText(raisedFeederPoint(909,510))}L922 585`:'M748 433l-25 141m186-64 13 75';
 const tag=feeder?'FEEDER':float?'DOBBER':carp?'KARPER':'ZEE';
 const cork=Array.from({length:15},(_,i)=>{const x=941+i*4.5,y=537+i*2.15;return `<path d="M${x} ${y-4}l${i%2?3:1} 5m2-3 2 2" stroke="#786949" stroke-width="${i%3===0?1.3:.65}" opacity=".7"/>`;}).join('');
 const bell=feeder&&indicator?`<g class="fishing-bell-anchor" transform="translate(563 341)"><g class="fishing-scene-bell"><path d="M-3-2l4-18 7-2" fill="none" stroke="#a2b399" stroke-width="2"/><rect x="-3" y="-10" width="10" height="6" rx="2" fill="#63815e" stroke="#bacba7"/><g fill="url(#${id}-brass)" stroke="#e2d1a3" stroke-width=".65"><path d="M-8-21q-3-13 4-15q8 0 7 13l-11 2Z"/><path d="M7-24q-3-13 4-15q8 0 7 13l-11 2Z"/></g><circle cx="-2" cy="-20" r="2" fill="#f3db9d"/><circle cx="13" cy="-23" r="2" fill="#f3db9d"/>${indicator.id.includes('smart')?'<circle class="fishing-signal-led" cx="2" cy="-6" r="2.8" fill="#d6f5a0"/>':''}</g></g>`:'';
 const alarm=(carp||style==='zee')&&indicator?`<g transform="translate(742 427)"><rect x="-12" y="-7" width="27" height="32" rx="6" fill="#20392c" stroke="#8b9d83" stroke-width="1.7"/><path d="M-8-6v-8m18 8v-8M-9-14q9 14 20 0" fill="none" stroke="#abb9a1" stroke-width="3"/><circle class="fishing-signal-led" cx="2" cy="3" r="4" fill="#ccf296"/><path d="M-3 14h10m-10 4h10" stroke="#5c7053" stroke-width="1.2"/></g><path class="fishing-hanger" d="M750 440v26m-5 0h10" stroke="#b7cd9d" stroke-width="2"/>`:'';
 const floatArt=float?`<g class="fishing-float-target"><ellipse class="fishing-float-shadow" cx="430" cy="295" rx="13" ry="3" fill="#173b32" opacity=".22"/><g class="fishing-scene-float" transform="translate(0 0)"><path d="M430 287v23" stroke="#abb6a0" stroke-width="1.4"/><ellipse cx="430" cy="280" rx="5.7" ry="15" fill="#8c7049" stroke="#d5be88" stroke-width=".8"/><path d="M426 274h8" stroke="#3b4631" stroke-width="4"/><path d="M430 267v-32" stroke="#c7d4b4" stroke-width="2.7"/><path class="fishing-float-antenna" d="M430 252v-25" stroke="${indicator?.id==='float_glow'?'#daff8b':indicator?'#f0d47a':'#f0a87e'}" stroke-width="4.5" stroke-linecap="round" ${indicator?.id==='float_glow'?`filter="url(#${id}-glow)"`:''}/><path d="M428 243h4m-4 6h4" stroke="#586443" stroke-width="2"/></g><ellipse class="fishing-target-ripple" cx="430" cy="288" rx="29" ry="6" fill="none" stroke="#d5e1bf" stroke-width="1.2" opacity=".45"/><ellipse cx="430" cy="288" rx="43" ry="9" fill="none" stroke="#a8cab1" stroke-width=".7" opacity=".2"/></g>`:`<g class="fishing-bottom-target"><ellipse class="fishing-target-ripple" cx="430" cy="286" rx="24" ry="5" fill="none" stroke="#c5d8ba" stroke-width="1" opacity=".3"/><ellipse cx="430" cy="286" rx="38" ry="8" fill="none" stroke="#aec8ad" stroke-width=".65" opacity=".14"/></g>`;
 return `<g class="fishing-scene-line" data-scene-line="${index}" data-style="${style}" data-rod-slot="${rodNumber(r,index)-1}" data-active="true" data-phase="waiting" aria-label="Hengel ${rodNumber(r,index)}, ${tag.toLowerCase()}"><g class="fishing-scene-rig" transform="${layout(index,count)}" opacity="1">
 <ellipse cx="908" cy="583" rx="174" ry="13" fill="#071a12" opacity=".25"/>
 ${floatArt}
 <g class="fishing-rod-pod" fill="none" stroke-linecap="round"><path d="${legs}" stroke="#111f19" stroke-width="7"/><path d="${legs}" stroke="url(#${id}-metal)" stroke-width="4.5"/><g transform="${elevation}"><path d="M742 447l165 71" stroke="#26372e" stroke-width="5"/><path d="M743 446l164 71" stroke="#89978a" stroke-width="1.4"/><path d="M736 422q9 19 21 8m140 73q8 16 20 7" stroke="#15291d" stroke-width="8"/><path d="M736 421q9 19 21 8m140 72q8 16 20 7" stroke="#86977b" stroke-width="2"/><path d="M743 459l5-26m162 102-2-23" stroke="#a7b49a" stroke-width="1.3" opacity=".6"/></g><path d="M724 575l-21 9m21-9 17 9m181 1-17 8m17-8 17 4" stroke="#344235" stroke-width="4"/></g>
 <path class="fishing-cast-line" d="${feeder?feederCastLine():'M849 535L876 494L785 451L692 403L606 359Q537 322 480 299L430 285'}" fill="none" stroke="#e2e7cf" stroke-width=".95" stroke-linecap="round" opacity=".65"/>
 <g class="fishing-strike-motion" transform="rotate(0 1058 593)"><g class="fishing-rod-elevation" transform="${elevation}"><g class="fishing-rod-blank"><path d="M1058 593L923 529" stroke="#101a15" stroke-width="19" stroke-linecap="round"/><path d="M1058 591L1027 576" stroke="#283e30" stroke-width="16" stroke-linecap="round"/><path d="M1028 577L940 535" stroke="url(#${id}-cork)" stroke-width="14" stroke-linecap="round"/>${cork}<path d="M1049 587l5-10m-28-2 5-10m-90-30 5-10" stroke="#15251b" stroke-width="4"/><path d="M942 536L902 517" stroke="#1a2b23" stroke-width="13"/><path d="M936 532L908 519" stroke="#677c6c" stroke-width="1.6" opacity=".8"/><path d="M926 528l4-8m-12 5 4-8m-12 4 4-8" stroke="#929d8d" stroke-width="1.1"/>
 <path d="M905 519L604 365L605 360L909 508Z" fill="url(#${id}-graphite)" stroke="#0b1f18" stroke-width="1.3"/><path d="M905 510L606 362" stroke="${premium?'#bdccc4':'#92a994'}" stroke-width="1.5" opacity=".85"/><path d="M895 513l-7 8m-91-55-4 6m-86-51-4 7m-91-50-3 5" stroke="#162d24" stroke-width="6"/><path d="M892 511l-7 8m-90-55-4 6m-87-51-3 6m-91-50-3 5" stroke="#a6b6a3" stroke-width=".8" opacity=".65"/>
 <path class="fishing-large-tip fishing-large-tip-shadow" d="M606 363Q542 329 480 299" fill="none" stroke="#13291f" stroke-width="${feeder?4.4:5.5}" stroke-linecap="round"/><path class="fishing-large-tip fishing-large-tip-color" d="M606 362Q542 328 480 299" fill="none" stroke="${tip}" stroke-width="${feeder?2.3:1.5}" stroke-linecap="round"/>
 ${ring(874,500,0)}${ring(786,455,1)}${ring(694,408,2)}${ring(607,365,3)}${ring(551,335,4,true)}${ring(508,313,5,true)}${ring(480,299,6,true)}
 </g>
 <g class="fishing-reel"><path d="M918 526l-21 5-14 26-27-7" fill="none" stroke="#172b22" stroke-width="9" stroke-linejoin="round"/><path d="M918 523l-21 6-15 25-27-7" fill="none" stroke="#a0b19f" stroke-width="3.4" stroke-linejoin="round"/><path d="M849 529q-17 3-20 19l19 17 27-12-1-14Z" fill="url(#${id}-reel)" stroke="#172c23" stroke-width="2"/><path d="M838 546q9-12 25-3" fill="none" stroke="#b8c3b1" stroke-width="1.4"/><circle cx="851" cy="551" r="8" fill="#1c3027" stroke="#7d9180" stroke-width="1.5"/><circle cx="851" cy="551" r="3.5" fill="#b9c1aa"/>
 <g class="fishing-large-spool"><ellipse cx="836" cy="530" rx="23" ry="14" transform="rotate(24 836 530)" fill="${spool}" stroke="#d0d7c2" stroke-width="1.7"/><ellipse cx="836" cy="530" rx="17" ry="10" transform="rotate(24 836 530)" fill="#344c3b" stroke="#879a82" stroke-width="2"/><path d="M820 525l30 11m-28-15 30 11m-27-15 29 11m-35 1 28 11" stroke="#b3c0a5" stroke-width="1.3" opacity=".9"/><ellipse cx="836" cy="530" rx="7" ry="5" transform="rotate(24 836 530)" fill="#222f28" stroke="#d5d6b8" stroke-width="1.3"/><path d="M831 528l10 4" stroke="#d9d8b7" stroke-width="1.2"/></g>
 <path d="M814 533q-13-31 20-34q25 0 25 30" fill="none" stroke="#d2dac8" stroke-width="2"/><circle cx="859" cy="529" r="3.7" fill="#b7c2a7" stroke="#354d3c"/><path d="M857 555l17 14 17-4" fill="none" stroke="#bcc7ae" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="896" cy="564" rx="12" ry="5" transform="rotate(-20 896 564)" fill="#213b2b" stroke="#93a483" stroke-width="1.5"/><path d="M892 562l8-2" stroke="#a1ac8d" stroke-width="1"/>
 </g>
 <path class="fishing-hookset-highlight" d="M1058 587L1028 573M941 530L906 512" fill="none" stroke="#e3edbd" stroke-width="3" stroke-linecap="round" opacity="0"/>
 ${bell}</g></g>${alarm}
 <g class="fishing-bite-halo" opacity="0"><ellipse cx="430" cy="287" rx="52" ry="13" fill="#e0f4a3" opacity=".07"/><ellipse cx="430" cy="287" rx="46" ry="10" fill="none" stroke="#d8eea1" stroke-width="1.4" opacity=".65"/></g>
 </g><title>Hengel ${rodNumber(r,index)} · ${esc(tag)}</title></g>`;
}

export function fishingForeground(rods,activeIndex=0){
 const rigs=(Array.isArray(rods)?rods:[]).slice(0,6),id=`fishing-foreground-${++sequence}`;
 return `<g class="fishing-foreground" data-visible-rods="${rigs.length}"><defs>
 <linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b0bbaa"/><stop offset=".45" stop-color="#55675a"/><stop offset=".7" stop-color="#899c87"/><stop offset="1" stop-color="#394c3e"/></linearGradient>
 <linearGradient id="${id}-graphite" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#718b7f"/><stop offset=".4" stop-color="#233f33"/><stop offset="1" stop-color="#101e18"/></linearGradient>
 <linearGradient id="${id}-cork" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#cfb689"/><stop offset=".45" stop-color="#ac9167"/><stop offset="1" stop-color="#746746"/></linearGradient>
 <linearGradient id="${id}-reel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#899c88"/><stop offset=".5" stop-color="#48634f"/><stop offset="1" stop-color="#263d30"/></linearGradient>
 <linearGradient id="${id}-brass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ede2b1"/><stop offset=".4" stop-color="#a68b4f"/><stop offset=".7" stop-color="#d7c38a"/><stop offset="1" stop-color="#857548"/></linearGradient>
 <filter id="${id}-glow" x="-200%" y="-40%" width="500%" height="180%"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 </defs>${rigs.map((r,index)=>singleRod(r,index,id,rigs.length)).join('')}</g>`;
}

export function paintFishingForeground(svg,session,activeIndex=0,now=0,reduced=false){
 if(!svg)return;
 const root=svg.matches?.('.fishing-foreground')?svg:svg.querySelector('.fishing-foreground');
 if(!root)return;
 const lines=[...root.querySelectorAll('[data-scene-line]')];
 root.dataset.visibleRods=String(lines.length);
 for(const line of lines){
  const index=Number(line.dataset.sceneLine),rt=session?.rods?.[index],phase=rt?.phase||'waiting',live=phase==='bite'||phase==='rescue',nibble=phase==='nibble',float=line.dataset.style==='dobber',feeder=line.dataset.style==='feeder',carp=line.dataset.style==='karper'||line.dataset.style==='zee';
  line.dataset.phase=phase;line.dataset.active='true';
  const hook=hookSetPose(line,now,reduced,Boolean(rt));
  line.querySelector('.fishing-strike-motion')?.setAttribute('transform',`rotate(${hook.angle.toFixed(3)} 1058 593)`);
  line.querySelector('.fishing-hookset-highlight')?.setAttribute('opacity',hook.highlight.toFixed(3));
  const number=Number(line.dataset.rodSlot)+1;
  line.setAttribute('aria-label',`Hengel ${number}, ${phases[phase]||phases.waiting}`);
  const rig=line.querySelector('.fishing-scene-rig');rig.setAttribute('transform',layout(index,lines.length));rig.setAttribute('opacity','1');
  const wave=reduced?.55:(.5+.5*Math.sin(now/(feeder?92:140))),amp=live?(feeder?34+wave*25:17+wave*16):nibble?(feeder?3+wave*11:2+wave*5):phase==='landed'?11:0;
  const x=480-amp*.18,y=299+amp,cx=542-amp*.02,cy=328+amp*.08;
  line.querySelectorAll('.fishing-large-tip').forEach(p=>p.setAttribute('d',`M606 363Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`));
  for(const guide of line.querySelectorAll('.fishing-tip-guide')){
   const t=Number(guide.dataset.guide)===4?.44:Number(guide.dataset.guide)===5?.76:1,u=1-t,gx=u*u*606+2*u*t*cx+t*t*x,gy=u*u*363+2*u*t*cy+t*t*y,angle=Math.atan2(2*u*(cy-363)+2*t*(y-cy),2*u*(cx-606)+2*t*(x-cx))*180/Math.PI+90;
   guide.setAttribute('transform',`translate(${gx.toFixed(2)} ${gy.toFixed(2)}) rotate(${angle.toFixed(2)})`);
  }
  const targetY=float?(live?310+wave*5:nibble?286+wave*6:285):285;
  line.querySelector('.fishing-cast-line')?.setAttribute('d',feeder?feederCastLine(x,y,cx,cy,hook.angle):otherCastLine(x,y,cx,cy,targetY,hook.angle));
  const assembly=line.querySelector('.fishing-scene-float');if(assembly)assembly.setAttribute('transform',`translate(${nibble&&!reduced?Math.sin(now/160)*1.4:0} ${live?29+wave*7:nibble?wave*7:0})`);
  const bell=line.querySelector('.fishing-scene-bell');if(bell)bell.setAttribute('transform',`rotate(${live?(reduced?10:Math.sin(now/58)*19):nibble?(reduced?3:Math.sin(now/85)*6):0} 0 -8)`);
  const bellAnchor=line.querySelector('.fishing-bell-anchor');if(bellAnchor)bellAnchor.setAttribute('transform',`translate(563 ${341+amp*.22})`);
  const spool=line.querySelector('.fishing-large-spool');if(spool)spool.setAttribute('transform',`rotate(${live&&carp&&!reduced?(now/2)%360:0} 836 530)`);
  line.querySelectorAll('.fishing-signal-led').forEach(led=>{led.setAttribute('opacity',live?(reduced?1:.5+.5*Math.sin(now/65)):nibble?'.6':'.22');});
  const halo=line.querySelector('.fishing-bite-halo');if(halo)halo.setAttribute('opacity',live?(reduced?'.8':String(.55+wave*.4)):'0');
  const ripple=line.querySelector('.fishing-target-ripple');if(ripple){ripple.setAttribute('rx',String(live?32+wave*12:nibble?25+wave*5:float?29:24));ripple.setAttribute('opacity',live?'.7':nibble?'.5':float?'.4':'.25');}
 }
}
