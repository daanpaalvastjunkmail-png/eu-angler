import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {sessionRodPicker} from '../dist/session-rods-ui.js';
import {assemblyWorkshop,assemblyDraftFrom,draftWithRod,academyCard} from '../dist/assembly-ui.js';
import {assembleRods} from './tackle-fixtures.mjs';
const checks=[],g=new IdleGame({storage:null,now:()=>1800000000000}),doc=html=>new JSDOM(html).window.document;
// A level unlock offers a purchase; it does not create an unusable selector.
const planner=new IdleGame({storage:null,now:()=>1800000000000});
for(const [level,bought,visible,nextLevel] of [[1,1,1,10],[9,1,1,10],[10,2,2,40],[39,2,2,40],[40,3,3,90],[90,4,4,170],[170,5,5,300],[300,6,6,null]]){
 planner.state.xp=xpAt(level);planner.state.rodSlots=bought;
 const view=doc(sessionRodPicker(planner)),positions=[...view.querySelectorAll('[data-session-rod-slot]')],progress=view.querySelector('.session-slot-progress'),fieldset=view.querySelector('.session-rod-positions');
 assert.deepEqual(positions.map(el=>Number(el.dataset.sessionRodSlot)),Array.from({length:visible},(_,i)=>i),`Only usable slots at level ${level}`);
 assert(!view.querySelector('[data-action="buy-slot"]'));
 assert(progress.compareDocumentPosition(fieldset)&view.defaultView.Node.DOCUMENT_POSITION_FOLLOWING,'Unlock information precedes the choices');
 if(nextLevel)assert.equal(progress.querySelector('strong').textContent,`Level ${nextLevel}`);
 else assert(progress.textContent.includes('Alle zes'));
}
planner.state.xp=xpAt(10);planner.state.rodSlots=1;planner.state.money=0;
let purchaseView=doc(sessionRodPicker(planner));assert.equal(purchaseView.querySelectorAll('[data-session-rod-slot]').length,1);assert(purchaseView.querySelector('[data-action="buy-slot"]').disabled);assert(purchaseView.querySelector('.session-slot-unlock').textContent.includes('Hengelplaats 2'));
planner.state.money=10000;purchaseView=doc(sessionRodPicker(planner));assert(!purchaseView.querySelector('[data-action="buy-slot"]').disabled);assert(planner.buySlot().ok);purchaseView=doc(sessionRodPicker(planner));assert.equal(purchaseView.querySelectorAll('[data-session-rod-slot]').length,2);assert.equal(purchaseView.querySelector('.session-slot-progress strong').textContent,'Level 40');
checks.push('Future positions stay hidden across every level threshold; an affordable purchase adds the next selector and updates the unlock note above it');
g.state.xp=xpAt(10);g.state.rodSlots=2;
let d=doc(sessionRodPicker(g));assert.equal(d.querySelectorAll('.session-rod-position').length,2);assert.equal(d.querySelectorAll('[data-session-rod-slot]').length,2);for(const s of d.querySelectorAll('select'))assert(!s.closest('button'));assert(d.querySelector('[data-session-rod-slot="1"] option[value="rig_feeder"]').disabled);assert(!d.querySelector('[data-session-rod-slot="1"] option[value="rig_karper"]').disabled);assert(!d.querySelector('#loadout-preset-select'));checks.push('The planner shows usable positions with duplicate protection and explains the next level above the list');
const p=g.state.rodPresets[0],draft=assemblyDraftFrom(p);draft.name='<script>custom</script>';const before=JSON.stringify(g.state);d=doc(assemblyWorkshop(g,draft));assert.equal(d.querySelector('#assembly-name').value,draft.name);assert(!d.querySelector('script'));assert(d.querySelector('svg.rod-visual'));for(const field of ['rod','reel','line','hook','terminal','indicator','bait','baitSize','combo','liquid','crafted'])assert(d.querySelector('[data-assembly-field="'+field+'"]').getAttribute('aria-label'));assert(!d.querySelector('#assembly-style'));assert.equal(d.querySelector('[data-assembly-method]').textContent,'Feeder');assert.equal(JSON.stringify(g.state),before);checks.push('The workshop has eleven component controls, a method determined by the rod and escaped custom names without changing state');
for(const preset of g.state.rodPresets){
 const view=doc(assemblyWorkshop(g,assemblyDraftFrom(preset))),stage=view.querySelector('.assembly-stage'),controls=view.querySelector('.assembly-component-grid');
 assert.equal(stage.querySelectorAll('figure').length,2);assert(!stage.querySelector('select'),'Selectors must not cover the drawing');
 assert(stage.compareDocumentPosition(controls)&view.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
 for(const field of ['rod','reel','line','indicator','terminal','hook','bait']){
  const link=stage.querySelector(`.assembly-callout[data-visual-part="${field}"]`),target=view.getElementById(link?.getAttribute('aria-controls'));
  assert.equal(target?.dataset.assemblyField,field,`${preset.rod.style}: ${field} callout selects the matching component`);
 }
 const leaderLink=stage.querySelector('.assembly-leader-label');assert.equal(view.getElementById(leaderLink.getAttribute('aria-controls')).dataset.assemblyField,'terminal');
 assert(stage.querySelector('.assembly-rig-diagram .assembly-leader'));assert(stage.querySelector('.assembly-rig-diagram [data-visual-part="hook"]'));assert(stage.querySelector('.assembly-rig-diagram [data-visual-part="bait"]'));
 for(const link of stage.querySelectorAll('[aria-controls]'))assert(view.getElementById(link.getAttribute('aria-controls')));
}
checks.push('Every starter method has separate rod and rig drawings, visible leader/hook/bait, and component callouts linked to controls below the illustration');
const carp=g.state.rodPresets.find(p=>p.id==='rig_karper'),items={...carp.items};assert(g.deleteRodPreset(carp.id).ok);const switched=draftWithRod(g,draft,items.rod);assert.equal(switched.rod.style,'karper');assert.equal(switched.items.reel,items.reel);assert.equal(switched.items.terminal,items.terminal);assert.equal(switched.items.line,p.items.line);assert.equal(switched.items.hook,p.items.hook);assert(g.saveRodPreset(p.id,'Converted feeder',switched.rod,switched.items).ok);assert.equal(g.state.selectedRods[0].style,'karper');assert.equal(g.state.tackleItems.length,JSON.parse(before).tackleItems.length);checks.push('Choosing a different rod changes method, finds available matching reel/mount, preserves compatible shared components and grants no items');
g.state.xp=xpAt(18);const rods=assembleRods(g,[{...starterRod('feeder'),rod:'feeder_rod_scout'}, {...starterRod('karper'),rod:'karper_rod_scout'}]);g.state.xp=xpAt(15);d=doc(academyCard(g,rods));assert(d.body.textContent.includes('level 18'));assert.equal(d.querySelectorAll('.academy-tiers>span').length,7);assert.equal(d.querySelectorAll('.academy-lessons>div').length,20);checks.push('Training still shows tier costs and the complete level-300 path independently from saved presets');
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
