import {STYLES,GEAR,SUPPLIES,COMBOS,RECIPES} from './data.js';

export const ROD_FIELDS=['style','rod','reel','line','hook','terminal','bait','combo','liquid','crafted','indicator','baitSize'];
export const MAX_ROD_PRESETS=120;
const gear=Object.fromEntries(GEAR.map(x=>[x.id,x]));
const supplies=Object.fromEntries(SUPPLIES.map(x=>[x.id,x]));

// Templates contain component identifiers only. They never grant items or carry a slot.
export function rodSnapshot(rod){
 const method=gear[rod?.rod]?.style;
 if(!rod||!STYLES.some(x=>x.id===method))return null;
 rod={...rod,style:method};
 const r=Object.fromEntries(ROD_FIELDS.map(k=>[k,rod[k]??(['liquid','crafted','indicator'].includes(k)?null:k==='combo'?'none':undefined)]));
 r.baitSize=['small','normal','large'].includes(rod.baitSize)?rod.baitSize:'normal';
 for(const k of ['rod','reel','line','hook','terminal']){const item=gear[r[k]];if(!item||item.category!==k||(item.style!=='all'&&item.style!==r.style))return null;}
 if(!supplies[r.bait]?.attracts||!COMBOS.some(x=>x.id===r.combo))return null;
 if(r.liquid&&!supplies[r.liquid]?.bonus)return null;
 if(r.crafted&&!RECIPES.some(x=>x.id===r.crafted))return null;
 if(r.indicator&&(!gear[r.indicator]||gear[r.indicator].category!=='indicator'||gear[r.indicator].style!==r.style))return null;
 return r;
}

export function seedRodPresets(starter){
 return ['feeder','karper','dobber'].map(style=>({id:`rig_${style}`,name:{feeder:'Mijn feeder',karper:'Mijn karperhengel',dobber:'Mijn dobberhengel'}[style],rod:rodSnapshot(starter(style))}));
}

export function cleanRodPresets(raw,starter){
 if(!Array.isArray(raw))return seedRodPresets(starter);
 const ids=new Set(),out=[];
 for(const value of raw.slice(0,MAX_ROD_PRESETS)){
  if(!value||typeof value.id!=='string')continue;
  const id=value.id.slice(0,60),rod=rodSnapshot(value.rod);if(!id||ids.has(id)||!rod)continue;
  ids.add(id);out.push({id,name:String(value.name||'Mijn hengel').trim().slice(0,45)||'Mijn hengel',rod});
 }
 return out;
}

// Slot positions are separate from array order and allow, for example, only slots 1 and 3.
export function slotRods(rods){
 if(!Array.isArray(rods))return [];
 return rods.map((r,i)=>({...r,slot:r?.slot===undefined?i:r.slot})).sort((a,b)=>a.slot-b.slot);
}

export function cleanLoadoutRods(raw,slots){
 if(!Array.isArray(raw))return [];
 const occupied=new Set(),rods=[];
 for(const [index,value] of raw.slice(0,6).entries()){
  const slot=value?.slot===undefined?index:value.slot,rod=rodSnapshot(value);
  if(!rod||!Number.isInteger(slot)||slot<0||slot>=slots||occupied.has(slot))continue;
  occupied.add(slot);rods.push({...rod,slot,...(typeof value.sourcePresetId==='string'&&value.sourcePresetId?{sourcePresetId:value.sourcePresetId.slice(0,60)}:{})});
 }
 return rods.sort((a,b)=>a.slot-b.slot);
}
