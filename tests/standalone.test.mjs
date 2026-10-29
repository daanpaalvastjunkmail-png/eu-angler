import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {WATERS} from '../dist/data.js';
import {landscapeFor} from '../dist/atelier-assets.js';
import jsdom from 'jsdom';
const html=await fs.readFile(new URL('../build/Europa-Angler.html',import.meta.url),'utf8');
const trace=phase=>{if(process.env.ANGLER_MEMORY_TRACE)console.error(JSON.stringify({phase,heapMiB:process.memoryUsage().heapUsed/1048576,rssMiB:process.memoryUsage().rss/1048576}));};
trace('read release');
const errors=[],virtualConsole=new jsdom.VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(String(e)));
let clock=1800000000000,callbacks=[];
// The real inline bundle includes the landscape bytes. Avoid constructing a
// multi-megabyte script text node in jsdom; evaluate that exact bundle in the
// same file-origin window after parsing the rest of the actual release HTML.
const embedded=html.match(/<script>([\s\S]*?)<\/script>/);
assert(embedded,'The standalone release must contain its executable bundle');
// Verify actual image bytes before shortening only jsdom's image attributes.
// parse5 otherwise expands ten multi-megabyte data URLs character by character
// on the Waters page; jsdom does not rasterize those images in this test.
const imageAssets=new Map(),imageNames=new Map(),usedImages=new Set();
for(const name of ['wetlands','forest-lake','alpine-fjord','atlantic']){
 const bytes=await fs.readFile(new URL('../dist/assets/'+name+'.png',import.meta.url));
 const uri='data:image/png;base64,'+bytes.toString('base64');
 assert(embedded[1].includes(uri),name+' must be embedded byte-for-byte in the real bundle');
 assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),name+' is a PNG');
 const hash=createHash('sha256').update(bytes).digest('hex'),asset={name,hash};
 assert.equal(createHash('sha256').update(Buffer.from(uri.split(',')[1],'base64')).digest('hex'),hash);
 imageAssets.set(uri,asset);imageNames.set(name,asset);
}
const actualImages=[...embedded[1].matchAll(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)].map(match=>match[0]);
assert.equal(new Set(actualImages).size,4);
assert(actualImages.every(uri=>imageAssets.has(uri)),'Every embedded landscape must match a checked source PNG');
const tinyPng='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
function boundedImageMarkup(value){
 return String(value).replace(/(\b(?:src|href)\s*=\s*)(["'])(data:image\/png;base64,[A-Za-z0-9+/=]+)\2/g,(_all,prefix,quote,uri)=>{
  const asset=imageAssets.get(uri);assert(asset,'Runtime image must use one of the exact verified embedded PNGs');usedImages.add(asset.name);
  return prefix+quote+tinyPng+quote+' data-test-image-name="'+asset.name+'" data-test-image-sha256="'+asset.hash+'"';
 });
}
function boundedImageParsing(w){
 for(const property of ['innerHTML','outerHTML']){const descriptor=Object.getOwnPropertyDescriptor(w.Element.prototype,property);Object.defineProperty(w.Element.prototype,property,{...descriptor,set(value){descriptor.set.call(this,boundedImageMarkup(value));}});}
 const insert=w.Element.prototype.insertAdjacentHTML;w.Element.prototype.insertAdjacentHTML=function(position,value){return insert.call(this,position,boundedImageMarkup(value));};
}
function assertArtwork(element,name){assert(element);assert.equal(element.dataset.testImageName,name);assert.equal(element.dataset.testImageSha256,imageNames.get(name).hash);}

trace('images verified');
const dom=new jsdom.JSDOM(html.replace(embedded[0],'<script></script>'),{url:'file:///games/Europa-Angler.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole,beforeParse(w){boundedImageParsing(w);w.Date.now=()=>clock;w.setInterval=fn=>{callbacks.push(fn);return callbacks.length;};w.setTimeout=()=>1;w.scrollTo=()=>{};}});
trace('document parsed');
dom.window.eval(embedded[1]);
trace('game initialized');
// Let jsdom release detached UI trees between user gestures, as a browser does.
const settleDOM=async()=>{await new Promise(setImmediate);trace('UI settled');};
await settleDOM();
const doc=dom.window.document;
const number=text=>Number(String(text).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.')),cents=value=>Math.round((value+Number.EPSILON)*100)/100;
const wallet=()=>number(doc.querySelector('[data-live="money"]').textContent);
assert.equal(wallet(),150);
assert.equal(errors.length,0,errors.join('\n'));assert.equal(doc.documentElement.lang,'en');assert(doc.querySelector('#main').textContent.includes('The bank is calling.'));assert.equal(doc.querySelector('.topbar [data-language-select]').value,'en');assert.equal(doc.querySelectorAll('.scene-rod-control').length,1);assert.equal(doc.querySelectorAll('.scene-strike-button').length,1);assert(!doc.querySelector('[data-focus-line]'));
const snapshot=()=>['money','level','caught'].map(key=>doc.querySelector(`[data-live="${key}"]`).textContent).join('|');const initial=snapshot();const setLanguage=language=>{const control=doc.querySelector('.topbar [data-language-select]');control.value=language;control.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(doc.documentElement.lang,language);assert.equal(snapshot(),initial);assert.equal(errors.length,0,errors.join('\n'));};
setLanguage('nl');await settleDOM();assert(doc.querySelector('#main').textContent.includes('De oever roept.'));setLanguage('en');await settleDOM();assert(doc.querySelector('#main').textContent.includes('The bank is calling.'));setLanguage('nl');await settleDOM();assert(doc.querySelector('#main').textContent.includes('De oever roept.'));
doc.querySelector('.nav-item[data-page="loadouts"]').click();await settleDOM();assert.equal(doc.querySelectorAll('[data-assembly-card]').length,3);assert.equal(doc.querySelectorAll('[data-assembly-field]').length,11);assert(doc.querySelector('.assembly-illustration svg'));assert(!doc.querySelector('#loadout-preset-select,#loadout-name,#assembly-style,[data-action="save-loadout"]'));assert.equal(doc.querySelector('[data-assembly-method]').textContent,'Feeder');doc.querySelector('[data-edit-assembly="rig_karper"]').click();await settleDOM();assert.equal(doc.querySelector('[data-assembly-method]').textContent,'Karper');doc.querySelector('.nav-item[data-page="home"]').click();await settleDOM();assert.equal(doc.querySelectorAll('.session-rod-position').length,1);const choosePreset=value=>{const control=doc.querySelector('[data-session-rod-slot="0"]');control.value=value;control.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(errors.length,0,errors.join('\n'));};choosePreset('rig_karper');await settleDOM();assert.equal(doc.querySelector('[data-session-rod-slot="0"]').value,'rig_karper');choosePreset('rig_feeder');await settleDOM();
assert.equal(doc.querySelector('#quote-total').textContent,'€ 2,00');assert.equal(doc.querySelector('#plan-duration').type,'range');assert(!doc.querySelector('#plan-license'));assert(doc.querySelector('[data-action="tend"]'));assert(!doc.querySelector('[data-action="tend"]').disabled);
const slider=doc.querySelector('#plan-duration');for(const [index,label,fee]of [[0,'1 minuut','€ 1,00'],[6,'1 uur','€ 3,00'],[3,'15 minuten','€ 2,00']]){slider.value=String(index);slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(doc.querySelector('#plan-duration'),slider);assert.equal(doc.querySelector('#session-duration-label').textContent,label);assert.equal(doc.querySelector('#quote-total').textContent,fee);}assert.equal(errors.length,0,errors.join('\n'));
assert.equal(Number(slider.max),25);
for(let day=2;day<=7;day++){
 slider.value=String(18+day);
 slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.equal(doc.querySelector('#session-duration-label').textContent,`${day} dagen`);
 assert.equal(slider.getAttribute('aria-valuetext'),`${day} dagen`);
}
slider.value='3';slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
assert.equal(doc.querySelector('#session-duration-label').textContent,'15 minuten');
assert.equal(doc.querySelector('#quote-total').textContent,'€ 2,00');
const beforeCleanup=wallet();doc.querySelector('[data-action="tend"]').click();await settleDOM();assert.equal(wallet(),cents(beforeCleanup+.1));const paidTotal=number(doc.querySelector('#quote-total').textContent),cashBeforeSession=wallet();
doc.querySelector('#start-session').click();await settleDOM();assert(doc.querySelector('.activity-pill.active'));clock+=900000;for(const fn of callbacks)fn();assert(!doc.querySelector('.activity-pill.active'));assert(doc.querySelector('#home-catch-list').textContent.includes('XP'));assert(doc.querySelector('#fishing-game').nextElementSibling.id==='session-catches');assert(!doc.querySelector('[data-action="settle-session"]').disabled);assert([...doc.querySelectorAll('[data-catch-choice]')].every(el=>el.value==='sell'));assert.equal(wallet(),cents(cashBeforeSession-paidTotal));const waterScene=doc.querySelector('#scene-foreground'),cashBeforeSort=doc.querySelector('[data-live="money"]').textContent;
const sortControl=doc.querySelector('[data-catch-sort]');sortControl.value='weight';sortControl.dispatchEvent(new dom.window.Event('change',{bubbles:true}));let weights=[...doc.querySelectorAll('[data-journal-row]')].map(row=>Number(row.dataset.catchWeight));assert.deepEqual(weights,[...weights].sort((a,b)=>b-a));const sortDirection=doc.querySelector('[data-catch-sort-direction]');sortDirection.value='asc';sortDirection.dispatchEvent(new dom.window.Event('change',{bubbles:true}));weights=[...doc.querySelectorAll('[data-journal-row]')].map(row=>Number(row.dataset.catchWeight));assert.deepEqual(weights,[...weights].sort((a,b)=>a-b));assert.equal(doc.querySelector('#scene-foreground'),waterScene);assert.equal(doc.querySelector('[data-live="money"]').textContent,cashBeforeSort);assert([...doc.querySelectorAll('[data-catch-choice]')].every(el=>el.value==='sell'));
const catchCount=doc.querySelectorAll('[data-catch-choice]').length;doc.querySelector('[data-journal-bulk="pending"]').click();await settleDOM();assert([...doc.querySelectorAll('[data-catch-choice]')].every(el=>el.value===''));assert.equal(doc.querySelectorAll('[data-catch-choice]').length,catchCount);assert(doc.querySelector('[data-action="settle-session"]').disabled);assert.equal(wallet(),cents(cashBeforeSession-paidTotal));doc.querySelector('[data-journal-bulk="release"]').click();await settleDOM();assert([...doc.querySelectorAll('[data-catch-choice]')].every(el=>el.value==='release'));assert(!doc.querySelector('[data-action="settle-session"]').disabled);doc.querySelector('[data-action="settle-session"]').click();await settleDOM();assert(!doc.querySelector('[data-catch-choice]'));assert.equal(errors.length,0,errors.join('\n'));
for(const id of ['loadouts','waters','sessions','contests','shop','craft','estate','fleet','species','statistics','progress','settings']){doc.querySelector(`.nav-item[data-page="${id}"]`).click();await settleDOM();assert(doc.querySelector('#main').innerHTML.length>300);if(id==='waters'){const cards=[...doc.querySelectorAll('.water-card')];assert.equal(cards.length,WATERS.length);for(const [index,card]of cards.entries())assertArtwork(card.querySelector('.water-art .water-landscape'),landscapeFor(WATERS[index].id).src.split('/').pop().replace('.png',''));}}
assert.equal(errors.length,0,errors.join('\n'));
doc.querySelector('.nav-item[data-page="sessions"]').click();await settleDOM();assert(!doc.querySelector('.nav-item[data-page="net"]'));assert(doc.querySelectorAll('[data-journal-row]').length>0);assert(doc.querySelector('[data-journal-row]').textContent.includes('Teruggezet'));assert.equal(errors.length,0,errors.join('\n'));
doc.querySelector('.nav-item[data-page="species"]').click();await settleDOM();
assert.equal(doc.querySelectorAll('[data-species-card]').length,55);
const guideSearch=doc.querySelector('#species-search');guideSearch.value='grondel';guideSearch.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
assert.equal(doc.querySelector('#species-search'),guideSearch);assert.equal(doc.querySelectorAll('[data-species-card]').length,4);
guideSearch.value='';guideSearch.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
const guideGroup=doc.querySelector('#species-group');guideGroup.value='carp';guideGroup.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert(doc.querySelector('[data-species-card="linear_spiegel"]'));assert(doc.querySelector('[data-species-card="giebel"]'));assert(!doc.querySelector('[data-species-card="riviergrondel"]'));
const waterButton=doc.querySelector('[data-guide-water]'),water=waterButton.dataset.guideWater;waterButton.click();await settleDOM();assert.equal(doc.querySelector('#species-water').value,water);assert.equal(doc.querySelector('#species-group').value,'all');
assertArtwork(doc.querySelector('.atelier-page-art img'),'forest-lake');
doc.querySelector('.nav-item[data-page="home"]').click();await settleDOM();assertArtwork(doc.querySelector('.atelier-scene-background'),'wetlands');
doc.querySelector('[data-guide-species="giebel"]').click();await settleDOM();assert.equal(doc.querySelectorAll('[data-species-card]').length,1);assert(doc.querySelector('[data-species-card="giebel"]'));assert.equal(errors.length,0,errors.join('\n'));
assert.deepEqual([...usedImages].sort(),[...imageNames.keys()].sort(),'All four verified landscapes are exercised by the real game');
assert(!html.includes('./assets/'),'All four landscape images must be embedded for offline use');
assert(!/<script[^>]+src=|<link[^>]+stylesheet|<script type="module"/.test(html));
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));assert([...css.matchAll(/url\(([^)]+)\)/g)].every(m=>m[1].startsWith('data:')));
const summary={status:'PASS',scope:'Exact unmodified inline game bundle evaluated from file: origin; all four original PNG byte sequences and SHA-256 digests verified, then only jsdom image attributes shortened to bound parser memory (no image rasterization)',checks:['Inline JS and fonts remain embedded; all four landscape PNGs match source bytes and SHA-256 hashes, and every water card selects its intended artwork', 'The new field guide lists 55 entries; live search, group filters, water links and discovery cards work without DOM errors','English is the default; topbar switches Dutch/English/Dutch without changing money, level or catches','Individual rods are chosen in the planner, physical presets are edited in the workshop and full-loadout/method selectors are absent','Each equipped rod has its own live strike control; focus tabs are absent','Dashboard initializes with storage unavailable on file: in jsdom','One duration slider updates labels, licence cost and supplies without replacing the control, with daily steps from two to seven days','New games start with €150 and a cleanup click earns exactly ten cents','A complete session catches fish and ends','All twelve additional pages navigate without errors','Direct catch ledger defaults to sales without automatic payout; deselect all clears choices and blocks checkout without losing fish or paying money','Weight sorting works in both directions in the release without replacing the fishing scene or changing choices and money','Bulk release and mandatory processing preserve catch history'],domErrors:errors.length,verifiedArtwork:[...imageNames.values()]};await fs.writeFile(new URL('./standalone-results.json',import.meta.url),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));dom.window.close();
