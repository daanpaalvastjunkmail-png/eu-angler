import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {JSDOM} from 'jsdom';
import {IdleGame,xpAt} from '../dist/engine.js';
import {assemblyWorkshop,assemblyDraftFrom} from '../dist/assembly-ui.js';
import {renderTripBait,renderLiveBait,renderLiveBaitEditor,renderLiveBaitQuote,decodeBaitChoice,baitChoiceValue,baitSummary} from '../dist/trip-bait-ui.js';

const checks=[],dom=new JSDOM('<!doctype html><body><main></main></body>'),root=dom.window.document.querySelector('main');
const render=html=>{root.innerHTML=html;return root;};
const game=new IdleGame({storage:null,now:()=>1800000000000});
let rod=game.state.selectedRods[0];
const original=JSON.stringify(game.state);
render(renderTripBait(game));
assert.equal(root.querySelectorAll('[data-bait-rod-slot]').length,1);
assert.deepEqual([...root.querySelectorAll('select')].map(el=>el.dataset.tripBaitField),['bait','baitSize','liquid']);
assert([...root.querySelectorAll('select')].every(el=>el.dataset.tripBaitSlot==='0'));
for(const select of root.querySelectorAll('select'))assert(root.querySelector(`label[for="${select.id}"]`));
assert.deepEqual([...root.querySelector('[data-trip-bait-field="bait"]').options].map(o=>o.value),['bait:maggots','bait:corn']);
assert.equal(root.querySelector('[data-trip-bait-field="liquid"]').options.length,1);
assert(root.querySelector('.trip-bait-section').hasAttribute('data-no-translate'));
assert.equal(JSON.stringify(game.state),original);
checks.push('The trip planner renders three accessible choices for every selected rod, exposes only unlocked bait, and does not mutate the game');

game.state.xp=xpAt(55);game.state.rodSlots=3;
const carp=game.state.rodPresets.find(p=>p.id==='rig_karper');
carp.name='\"><img src=x onerror="window.pwned=true"><script>attack()</script>&';
game.state.selectedRods.push({...carp.rod,sourcePresetId:carp.id,slot:2,combo:'boilies_corn',bait:'corn',baitSize:'large',liquid:'liquid_krill'});
render(renderTripBait(game));
assert.equal(root.querySelectorAll('[data-bait-rod-slot]').length,2);
assert.equal(root.querySelectorAll('[data-trip-bait-slot="1"]').length,0);
const third=root.querySelector('[data-bait-rod-slot="2"]');
assert.equal(third.querySelector('[data-user-text]').textContent,carp.name);
assert.equal(root.querySelector('script,img,[onerror]'),null);
assert.equal(third.querySelector('[data-trip-bait-field="bait"]').value,'combo:boilies_corn');
assert.equal(third.querySelector('[data-trip-bait-field="baitSize"]').value,'large');
assert.equal(third.querySelector('[data-trip-bait-field="liquid"]').value,'liquid_krill');
assert(root.querySelector('option[value="combo:corn_maggots"]'));
assert(!root.querySelector('option[value="combo:bacon_worms"]'));
assert(!root.querySelector('option[value="combo:none"]'));
assert(!root.querySelector('optgroup,[data-trip-bait-field="combo"]'));
assert.equal(root.querySelectorAll('.trip-bait-fields select').length,6);
checks.push('Bait mixes share the ordinary bait menu; sparse slots keep their physical numbers and hostile custom rod names remain text');

assert.deepEqual(decodeBaitChoice('bait:worms',{bait:'corn',combo:'corn_maggots'}),{bait:'worms',combo:'none'});
assert.deepEqual(decodeBaitChoice('combo:corn_maggots',{bait:'maggots'}),{bait:'maggots',combo:'corn_maggots'});
assert.deepEqual(decodeBaitChoice('combo:corn_maggots',{bait:'worms'}),{bait:'corn',combo:'corn_maggots'});
for(const value of ['combo:none','combo:missing','bait:feed','bait:corn:extra','__proto__:x',null])assert.equal(decodeBaitChoice(value),null);
assert.equal(baitChoiceValue({bait:'corn',combo:'none'}),'bait:corn');
assert.equal(baitChoiceValue({bait:'maggots',combo:'corn_maggots'}),'combo:corn_maggots');
assert.equal(baitSummary(game,{bait:'corn',combo:'corn_maggots'}),'Corn + maggot');
checks.push('Choice decoding clears old mixes for single bait, preserves a valid mix base, and rejects unknown or non-bait values');

game.state.settings.language='nl';
render(renderTripBait(game));assert(root.textContent.includes('Kies je aas'));assert(root.querySelector('[data-trip-bait-field="bait"]').textContent.includes('Maïs + made'));
game.state.session={loadout:{rods:game.state.selectedRods.map(r=>({...r}))},rods:[{phase:'waiting'},{phase:'bite'}]};
render(renderTripBait(game));assert(root.querySelector('.trip-bait-rods').disabled);assert(root.textContent.includes('Je hengels vissen'));
game.state.session=null;game.state.net.push({id:'fixture'});
render(renderTripBait(game));assert(root.querySelector('.trip-bait-rods').disabled);assert(root.textContent.includes('Handel je vangsten af'));
game.state.net=[];game.store.blocked=true;
render(renderTripBait(game));assert(root.querySelector('.trip-bait-rods').disabled);assert(root.textContent.includes('opslagwaarschuwing'));game.store.blocked=false;
checks.push('Native fieldset locking covers live sessions, unsettled catches and protected saves, with Dutch explanations');

game.state.settings.language='en';game.state.session={loadout:{rods:[{...rod}]},rods:[{phase:'bite'}]};
render(renderLiveBait(game,rod,0));assert.equal(root.querySelector('[data-change-bait]').dataset.changeBait,'0');assert(!root.querySelector('[data-change-bait]').disabled);assert.equal(root.querySelector('.live-bait-current strong').textContent,'Maggots');assert(root.querySelector('[data-live-bait-open]'));
game.state.session.rods[0].phase='broken';render(renderLiveBait(game,rod,0));assert(root.querySelector('[data-change-bait]').disabled);
checks.push('Each live rod exposes its own bait and edit action; bites still allow preparation, while broken rods cannot open a new cast');

let quote={valid:true,affordable:true,changed:true,total:1.25,missing:{corn:15,feed:25},code:null};
let quoteCall;game.sessionBaitQuote=(index,patch)=>{quoteCall={index,patch};return quote;};
const draft={bait:'corn',combo:'none',liquid:'liquid_krill',baitSize:'normal'};
render(renderLiveBaitEditor(game,0,{...draft,index:0,sessionId:77}));
assert.deepEqual(quoteCall,{index:0,patch:draft});assert.equal(root.querySelector('[data-live-bait-field="bait"]').value,'bait:corn');
assert.equal(root.querySelectorAll('[data-live-bait-field]').length,3);assert(root.querySelector('#live-bait-quote'));
assert(root.querySelector('.live-bait-price strong').textContent.includes('1.25'));assert(root.querySelector('[data-action="apply-live-bait"]').textContent.includes('Buy'));assert(!root.querySelector('[data-action="apply-live-bait"]').disabled);
assert.equal(root.querySelectorAll('.live-bait-supplies li').length,2);
const input=root.querySelector('[data-live-bait-field="bait"]');input.focus();root.querySelector('#live-bait-quote').innerHTML=renderLiveBaitQuote(game,0,draft);assert.equal(dom.window.document.activeElement,input);assert.equal(input.value,'bait:corn');
assert.equal(root.querySelectorAll('.trip-bait-warning').length,0);
root.querySelector('#live-bait-quote').innerHTML=renderLiveBaitQuote(game,0,{...draft,baitSize:'large'});
assert.equal(root.querySelectorAll('.trip-bait-warning').length,1);assert(root.querySelector('#live-bait-quote .trip-bait-warning').textContent.includes('casting stress'));
root.querySelector('#live-bait-quote').innerHTML=renderLiveBaitQuote(game,0,draft);assert.equal(root.querySelectorAll('.trip-bait-warning').length,0);
checks.push('The live editor previews shared-stock purchases and can refresh its price without replacing the focused bait selector');

for(const [newQuote,expected] of [
 [{valid:false,affordable:false,changed:true,total:0,missing:{},code:'BITE_ACTIVE'},'bite is in progress'],
 [{valid:false,affordable:false,changed:true,total:0,missing:{},code:'BROKEN_ROD'},'rod is broken'],
 [{valid:false,affordable:false,changed:true,total:0,missing:{},code:'NO_SESSION'},'session has ended'],
 [{valid:true,affordable:false,changed:true,total:10000,missing:{}},'enough money'],
 [{valid:true,affordable:true,changed:false,total:0,missing:{}},'Choose different bait']
]){quote=newQuote;render(renderLiveBaitQuote(game,0,draft));assert(root.querySelector('[data-action="apply-live-bait"]').disabled);assert(root.querySelector('.live-bait-feedback').textContent.includes(expected));}
quote={valid:true,affordable:true,changed:true,total:0,missing:{}};render(renderLiveBaitQuote(game,0,draft));assert(!root.querySelector('[data-action="apply-live-bait"]').disabled);assert(root.textContent.includes('shared stock covers'));assert(!root.querySelector('.live-bait-supplies'));
game.state.session=null;render(renderLiveBaitEditor(game,0,draft));assert(!root.querySelector('select,button'));assert(root.textContent.includes('session has ended'));
checks.push('Recasting is guarded for current bites, broken rods, ended sessions, funds and unchanged choices; existing stock produces no purchase list');

const clean=new IdleGame({storage:null,now:()=>1800000000000});
for(const preset of clean.state.rodPresets){
 render(assemblyWorkshop(clean,assemblyDraftFrom(preset)));
 assert.deepEqual([...root.querySelectorAll('[data-assembly-field]')].map(el=>el.dataset.assemblyField),['rod','reel','line','indicator','terminal','hook','crafted']);
 assert(!root.querySelector('[data-component="bait"],[data-visual-part="bait"],[data-assembly-field="combo"]'));
 assert(root.querySelector('.assembly-leader'));assert(root.querySelector('.assembly-rig-diagram [data-visual-part="hook"]'));
 for(const control of root.querySelectorAll('[aria-controls]'))assert(root.querySelector('#'+control.getAttribute('aria-controls')));
}
checks.push('Every starter workshop contains hardware and crafted rigs only; clean leader/hook drawings and hardware callouts remain linked to real controls');

const css=await readFile(new URL('../dist/trip-bait.css',import.meta.url),'utf8');
await transform(css,{loader:'css',minify:true});
assert(css.includes('@media(max-width:480px)'));assert(css.includes('grid-template-columns:minmax(0,1fr)'));assert(css.includes('min-width:0'));assert(css.includes('min-height:44px'));assert(css.includes('overflow-wrap:anywhere'));
checks.push('Styles parse and include narrow-screen stacking, touch targets and long-name wrapping');
dom.window.close();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
