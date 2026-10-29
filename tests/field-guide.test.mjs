import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {IdleGame} from '../dist/engine.js';
import {SPECIES,WATERS} from '../dist/data.js';
import {SPECIES_INFO} from '../dist/species-info.js';
import {fieldGuide,fieldGuideResults,discoveryStrip} from '../dist/atelier-ui.js';
import {translateText} from '../dist/i18n.js';
const checks=[],game=new IdleGame({storage:null});game.state.settings.language='nl';
// Reuse a document and flush queued DOM cleanup between filters.
// Otherwise dozens of illustrated trees stay live during one synchronous turn.
const guideDom=new JSDOM('<!doctype html><body></body>');
const parse=async html=>{guideDom.window.document.body.replaceChildren();await new Promise(resolve=>setImmediate(resolve));guideDom.window.document.body.innerHTML=html;return guideDom.window.document;};
const ids=doc=>[...doc.querySelectorAll('[data-species-card]')].map(el=>el.dataset.speciesCard);
let doc=(await parse(fieldGuide(game)));
assert.equal(ids(doc).length,SPECIES.length);
assert.equal(doc.querySelectorAll('.field-guide-card svg').length,SPECIES.length);
assert.equal(doc.querySelectorAll('.field-guide-card.discovered').length,0);
assert(doc.querySelector('.field-guide-summary').textContent.includes('0 / '+SPECIES.length));
for(const card of doc.querySelectorAll('[data-species-card]')){
 assert(card.querySelector('h3').textContent.trim());
 assert(card.querySelector('.field-guide-body p').textContent.trim());
 assert(card.querySelectorAll('[data-guide-water]').length>0);
}
checks.push('Every playable entry has an illustrated card, readable description and habitat links; a new player begins with no discoveries');
for(const group of ['carp','coarse','predator','bottom','sea','crayfish']){
 const actual=ids((await parse(fieldGuideResults(game,{group})))),expected=SPECIES.filter(f=>SPECIES_INFO[f.id].group===group).map(f=>f.id);
 assert.deepEqual(actual,expected);assert(actual.length>0);
}
assert(ids((await parse(fieldGuideResults(game,{group:'carp'})))).includes('linear_spiegel'));
assert(ids((await parse(fieldGuideResults(game,{group:'carp'})))).includes('giebel'));
assert(ids((await parse(fieldGuideResults(game,{group:'bottom'})))).includes('witvinriviergrondel'));
for(const water of WATERS){
 const result=(await parse(fieldGuideResults(game,{water:water.id})));
 assert.deepEqual(new Set(ids(result)),new Set(water.fish));
 for(const card of result.querySelectorAll('[data-species-card]'))assert(card.querySelector(`[data-guide-water="${water.id}"]`));
}
checks.push('All six groups and ten water filters show exactly the species available there, including carp variants and small bottom dwellers');
game.state.records={voorn:{count:2,best:.21},linear_spiegel:{count:1,best:7.4},rivierkreeft:{count:1,best:.03},giebel:{count:0,best:0}};
doc=(await parse(fieldGuide(game)));
assert(doc.querySelector('.field-guide-summary').textContent.includes('3 / '+SPECIES.length));
assert.deepEqual(ids((await parse(fieldGuideResults(game,{caught:'caught'})))),['voorn','rivierkreeft','linear_spiegel']);
assert(ids((await parse(fieldGuideResults(game,{caught:'new'})))).includes('giebel'));
assert(!ids((await parse(fieldGuideResults(game,{caught:'new'})))).includes('linear_spiegel'));
assert.deepEqual(ids((await parse(fieldGuideResults(game,{group:'carp',water:'poldermeer',caught:'caught'})))),['linear_spiegel']);
assert((await parse(fieldGuideResults(game,{query:'lineaire'}))).querySelector('.field-guide-record').textContent.includes('7.40 kg'));
assert((await parse(fieldGuideResults(game,{group:'sea',water:'rietplas'}))).querySelector('.field-guide-empty'));
checks.push('Discovery, water and group filters combine correctly; zero-catch imported records stay undiscovered and actual personal records are displayed');
for(const info of Object.values(SPECIES_INFO)){
 assert.notEqual(translateText(info.description,'en'),info.description);
 assert.notEqual(translateText(info.habitat,'en'),info.habitat);
}
game.state.settings.language='en';
assert.deepEqual(ids((await parse(fieldGuideResults(game,{query:'White-finned gudgeon'})))),['witvinriviergrondel']);
assert(ids((await parse(fieldGuideResults(game,{query:'sandy beds'})))).includes('witvinriviergrondel'));
assert(ids((await parse(fieldGuideResults(game,{query:'Cod relatives'})))).includes('kwabaal'));
assert.deepEqual(ids((await parse(fieldGuideResults(game,{query:'giebel'})))),['giebel']);
assert((await parse(fieldGuideResults(game,{query:'Prussian carp'}))).querySelector('h3').textContent==='Prussian carp');
checks.push('English and Dutch names remain searchable; translated habitats and families are indexed, and all field-guide notes have English translations');
const hostile='\"><img src=x onerror="globalThis.injection=true"><script>bad()</script>';
doc=(await parse(fieldGuide(game,{query:hostile})));
assert.equal(doc.querySelector('#species-search').value,hostile);
assert.equal(doc.querySelector('script,[onerror]'),null);
assert.equal(ids(doc).length,0);
assert(doc.querySelector('.field-guide-empty'));
const strip=(await parse(discoveryStrip(game)));
assert.deepEqual([...strip.querySelectorAll('[data-guide-species]')].map(el=>el.dataset.guideSpecies),['linear_spiegel','giebel','riviergrondel']);
assert(strip.querySelector('[data-page="species"]'));
checks.push('Search input stays escaped text, empty results remain navigable, and featured fish link to the expanded field guide');
guideDom.window.close();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
