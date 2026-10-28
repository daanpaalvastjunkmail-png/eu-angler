const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fields={time:'at',weight:'weight',value:'value'};
const number=value=>Number.isFinite(Number(value))?Number(value):0;

/** Sort a copy so changing the presentation never changes catch choices or history. */
export function sortCatches(rows,sort='time',direction='desc'){
 const field=Object.hasOwn(fields,sort)?fields[sort]:fields.time,multiplier=direction==='asc'?1:-1;
 return Array.from(rows||[],(fish,index)=>({fish,index})).sort((a,b)=>{
  const comparison=(number(a.fish[field])-number(b.fish[field]))*multiplier;
  return comparison||a.index-b.index;
 }).map(entry=>entry.fish);
}

export function catchSortControl(sort='time',direction='desc',{id='catch-sort'}={}){
 const selected=Object.hasOwn(fields,sort)?sort:'time',order=direction==='asc'?'asc':'desc';
 const labels=selected==='time'?['Nieuwste eerst','Oudste eerst']:['Hoogste eerst','Laagste eerst'];
 return `<div class="catch-sort-controls" role="group" aria-label="Vangsten sorteren"><label class="field"><span>Sorteer op</span><select id="${esc(id)}" data-catch-sort aria-label="Vangsten sorteren op"><option value="time" ${selected==='time'?'selected':''}>Wanneer gevangen</option><option value="weight" ${selected==='weight'?'selected':''}>Gewicht</option><option value="value" ${selected==='value'?'selected':''}>Prijs</option></select></label><label class="field"><span>Volgorde</span><select id="${esc(id)}-direction" data-catch-sort-direction aria-label="Sorteervolgorde"><option value="desc" ${order==='desc'?'selected':''}>${labels[0]}</option><option value="asc" ${order==='asc'?'selected':''}>${labels[1]}</option></select></label></div>`;
}
