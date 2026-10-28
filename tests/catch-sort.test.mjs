import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {sortCatches,catchSortControl} from '../dist/catch-sort.js';
import {inlineCatches} from '../dist/inline-catches.js';
import {sessionPage} from '../dist/session-ui.js';
import {IdleGame} from '../dist/engine.js';

const checks=[];
const ids=rows=>rows.map(row=>row.id);
const parse=html=>new JSDOM(html).window.document;
const rowIds=doc=>[...doc.querySelectorAll('[data-journal-row]')].map(row=>row.dataset.journalRow);

{
 const rows=[{id:'late',at:300},{id:'missing'},{id:'early',at:100},{id:'tied-z',at:200},{id:'tied-a',at:200}];
 assert.deepEqual(ids(sortCatches(rows)),['late','tied-z','tied-a','early','missing']);
 assert.deepEqual(ids(sortCatches(rows,'time','asc')),['missing','early','tied-z','tied-a','late']);
 assert.deepEqual(ids(sortCatches(rows,'unknown','invalid')),ids(sortCatches(rows)));
 assert.deepEqual(sortCatches(),[]);
 checks.push('Time sorting uses actual timestamps, supports missing timestamps, keeps ties stable and falls back safely for an unknown preference');
}

{
 const rows=[{id:'one',weight:1.2,value:90},{id:'two',weight:'8.5',value:'2.5'},{id:'three',weight:3,value:23},{id:'missing',weight:NaN,value:Infinity}];
 assert.deepEqual(ids(sortCatches(rows,'weight')),['two','three','one','missing']);
 assert.deepEqual(ids(sortCatches(rows,'weight','asc')),['missing','one','three','two']);
 assert.deepEqual(ids(sortCatches(rows,'value')),['one','three','two','missing']);
 assert.deepEqual(ids(sortCatches(rows,'value','asc')),['missing','two','three','one']);
 checks.push('Weight and price sorting compare numeric values in either direction, including numeric strings and absent or invalid older values');
}

{
 const rows=Object.freeze([Object.freeze({id:'z',weight:2,value:8,at:20,choice:'release'}),Object.freeze({id:'a',weight:9,value:3,at:10,choice:'stock'})]);
 const before=JSON.stringify(rows),sorted=sortCatches(rows,'weight');
 assert.notEqual(sorted,rows);assert.equal(sorted[0],rows[1]);assert.equal(sorted[1],rows[0]);
 assert.equal(JSON.stringify(rows),before);assert.deepEqual(ids(rows),['z','a']);
 checks.push('Sorting allocates only a presentation array, preserving immutable catch objects, original history order and each fish destination');
}

{
 const doc=parse(catchSortControl('time','asc'));
 assert.equal(doc.querySelector('[data-catch-sort]').value,'time');
 assert.equal(doc.querySelector('[data-catch-sort-direction]').value,'asc');
 assert.deepEqual([...doc.querySelectorAll('[data-catch-sort] option')].map(option=>option.value),['time','weight','value']);
 assert.equal(doc.querySelector('[data-catch-sort-direction] option[value="desc"]').textContent,'Nieuwste eerst');
 assert.equal(doc.querySelector('[data-catch-sort-direction] option[value="asc"]').textContent,'Oudste eerst');
 const weight=parse(catchSortControl('weight','desc',{id:'another-sort'}));
 assert.equal(weight.querySelector('[data-catch-sort]').id,'another-sort');
 assert.equal(weight.querySelector('[data-catch-sort-direction]').id,'another-sort-direction');
 assert.equal(weight.querySelector('[data-catch-sort-direction] option[value="desc"]').textContent,'Hoogste eerst');
 assert.equal(weight.querySelector('[data-catch-sort-direction] option[value="asc"]').textContent,'Laagste eerst');
 checks.push('Accessible shared controls retain the selected field and direction and describe newest/oldest or highest/lowest appropriately');
}

const rows=Array.from({length:20},(_,index)=>({
 id:'fish-'+index,species:'voorn',name:'Blankvoorn',weight:index===0?12:index+0.1,value:index===1?300:index+2,
 at:1800000000000+index*1000,xp:8,available:index!==2,disposition:index===2?5:2,
 choice:index===3?'release':index===4?'stock':index===5?'pending':'sell',method:'auto'
}));
const journal={id:'session-one',water:'rietplas',startedAt:1800000000000,loadout:{name:'Test setup'}};
const game={
 awaitingSettlement:false,
 state:{session:journal,sessions:[],net:rows.filter(row=>row.available),estate:{owned:true},legacy:{},settings:{autosell:false}},
 estateCapacity:100,estatePopulation:0,capacity:200,
 sessionRows:()=>rows,journal:()=>journal
};

{
 const before=JSON.stringify(rows),doc=parse(inlineCatches(game,{limit:4,sort:'value',direction:'desc'}));
 assert.deepEqual(rowIds(doc),['fish-1','fish-19','fish-18','fish-17']);
 assert.equal(doc.querySelector('[data-catch-sort]').value,'value');
 assert.equal(doc.querySelector('[data-journal-row="fish-1"]').dataset.catchValue,'300');
 assert.equal(doc.querySelector('#home-catch-count').textContent,'20');
 assert(doc.querySelector('.inline-catch-more').textContent.includes('4 van 20'));
 assert.equal(JSON.stringify(rows),before);
 const ascending=parse(inlineCatches(game,{limit:4,sort:'time',direction:'asc'}));
 assert.deepEqual(rowIds(ascending),['fish-0','fish-1','fish-2','fish-3']);
 assert.equal(ascending.querySelector('[data-journal-row="fish-2"] .catch-disposition').textContent,'Automatisch verkocht');
 assert.equal(ascending.querySelector('[data-catch-choice="fish-3"]').value,'release');
 assert.equal(ascending.querySelector('[data-journal-row="fish-0"]').dataset.catchWeight,'12');
 checks.push('Current catches sort every fish before the visible limit, retain total counts and historical automatic sales, and leave destination choices intact');
}

{
 const doc=parse(sessionPage(game,{limit:6,sort:'value',direction:'asc'}));
 assert.deepEqual(rowIds(doc),['fish-0','fish-2','fish-3','fish-4','fish-5','fish-6']);
 assert.equal(doc.querySelector('[data-catch-sort]').value,'value');
 assert.equal(doc.querySelector('[data-catch-sort-direction]').value,'asc');
 assert.equal(doc.querySelector('[data-catch-choice="fish-3"]').value,'release');
 assert.equal(doc.querySelector('[data-catch-choice="fish-4"]').value,'stock');
 assert.equal(doc.querySelector('[data-catch-choice="fish-5"]').value,'');
 assert.equal(doc.querySelector('[data-journal-row="fish-2"] .catch-disposition').textContent,'Automatisch verkocht');
 assert.equal(doc.querySelector('[data-journal-row="fish-6"]').dataset.catchAt,String(rows[6].at));
 checks.push('Session history uses the same sorting preferences and preserves release, pond, deselected and already sold fish while paginating');
}

{
 let now=1800000000000;
 const live=new IdleGame({storage:null,now:()=>now});
 live.state.seed=123456;assert(live.startSession().ok);now+=300000;live.advanceTo(now);
 const available=live.sessionRows('latest').filter(row=>row.available);assert(available.length>=3);
 assert(live.chooseCatches([available[1].id],'release').ok);
 const before=JSON.stringify(live.state),beforeRows=live.sessionRows('latest');
 for(const sort of ['time','weight','value'])for(const direction of ['asc','desc']){
  inlineCatches(live,{limit:1,sort,direction});sessionPage(live,{limit:1,sort,direction});
 }
 assert.equal(JSON.stringify(live.state),before,'Rendering a sort must never mutate economy, XP or decisions');
 const cash=live.state.money,xp=live.state.xp,result=live.settleSession();
 assert(result.ok);assert.equal(result.sold,beforeRows.length-1);assert.equal(result.released,1);
 assert.equal(live.state.money,cash+beforeRows.filter(row=>row.id!==available[1].id).reduce((sum,row)=>sum+row.value,0));
 assert.equal(live.state.xp,xp+Math.max(3,Math.round(available[1].xp*.2)));
 checks.push('Repeatedly sorting a real live session changes no economy state; settlement still processes all original fish exactly once rather than only visible rows');
}

console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
