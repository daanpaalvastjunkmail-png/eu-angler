import {SUPPLIES,RECIPES} from './data.js';

const supplies=Object.fromEntries(SUPPLIES.map(item=>[item.id,item]));
const number=(value,digits=0)=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value||0);
const money=value=>'€ '+number(value,2);
const amount=(id,value)=>id==='feed'&&value>=1000?number(value/1000,1)+' kg':number(value,value<10?1:0)+' '+(supplies[id]?.unit||'st');
const cents=value=>Math.round((value+Number.EPSILON)*100)/100;
const category=id=>id==='feed'?'feed':id.startsWith('liquid_')?'liquids':'bait';
const groups=[['feed','Lokvoer'],['bait','Haakaas'],['liquids','Liquids & toevoegingen']];

// Purchase subtotals use exactly the rounded line costs charged by the engine.
// Packed value includes owned supplies and reserve; it is not a second charge.
export function packingList(game,quote){
 const sections=groups.map(([group,title])=>{
  const ids=Object.keys(quote.required).filter(id=>category(id)===group);
  if(!ids.length)return '';
  const subtotal=cents(ids.reduce((sum,id)=>sum+quote.costs[id],0));
  return `<section class="packing-group" data-packing-group="${group}"><div class="packing-group-heading"><h3>${title}</h3><span>Bij te kopen <b data-packing-subtotal="${group}">${money(subtotal)}</b></span></div>${ids.map(id=>{
   const item=supplies[id],missing=quote.missing[id];
   return `<div class="need-row packing-item" data-packing-item="${id}"><div class="need-name"><i class="supply-dot" style="background:${item.color}"></i><span>${item.name}<small data-stock="${id}">${amount(id,game.state.stock[id]||0)} op voorraad</small></span></div><div class="packing-quantity"><strong data-need="${id}" class="${missing?'low':''}">${amount(id,quote.required[id])}</strong><small>Waarde <span data-packing-value="${id}">${money(cents(quote.required[id]*item.price))}</span></small></div><div class="packing-buy"><span>Bij te kopen <span data-packing-missing="${id}">${amount(id,missing)}</span></span><b data-packing-buy="${id}">${money(quote.costs[id])}</b></div></div>`;
  }).join('')}</section>`;
 }).join('');
 const rigs=Object.entries(quote.rigNeeds||{});
 const rigSection=rigs.length?`<section class="packing-group" data-packing-group="rigs"><div class="packing-group-heading"><h3>Zelfgemaakte rigs</h3><span>Uit je voorraad</span></div>${rigs.map(([id,needed])=>{
  const have=game.state.crafted[id]||0,missing=Math.max(0,needed-have),recipe=RECIPES.find(item=>item.id===id);
  return `<div class="need-row" data-packing-rig="${id}"><span class="need-name">${recipe.name}</span><strong class="${missing?'low':''}">${needed} st</strong><small>${have} st op voorraad · ${missing?'Nog te maken: '+missing:'Klaar voor je sessie'}</small></div>`;
 }).join('')}</section>`:'';
 return sections+rigSection+'<p class="packing-note">Waarde is inclusief je reserve. Alleen ontbrekende voorraad wordt gekocht; de kopjes tellen die kosten bij elkaar op.</p>';
}

export function packingSignature(game,quote){
 return JSON.stringify([quote.required,quote.missing,quote.costs,quote.rigNeeds,Object.keys(quote.required).map(id=>game.state.stock[id]||0),Object.keys(quote.rigNeeds||{}).map(id=>game.state.crafted[id]||0)]);
}
