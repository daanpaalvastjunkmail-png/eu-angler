import {GEAR} from './data.js';
import {rodSnapshot,ROD_FIELDS} from './rig-presets.js';
export const PARTS=['rod','reel','line','hook','terminal','indicator'];
export const SCHEMA_VERSION=4;
const gear=Object.fromEntries(GEAR.map(i=>[i.id,i])),clone=x=>JSON.parse(JSON.stringify(x));
export const sameSetup=(a,b)=>!!a&&!!b&&ROD_FIELDS.every(k=>(a[k]??null)===(b[k]??null));
export const ownerOf=(state,itemId,except=null)=>state.rodPresets.find(p=>p.id!==except&&p.assembled&&Object.values(p.items||{}).includes(itemId));
export function addTackle(state,gearId,quantity=1,starter=false){const out=[];for(let n=0;n<quantity;n++){let id;do{id='tackle_'+state.serial++;}while(state.tackleItems.some(i=>i.id===id));const item={id,gearId,condition:100,starter:starter&&n===0};state.tackleItems.push(item);out.push(item);}state.gear[gearId]=state.tackleItems.filter(i=>i.gearId===gearId).length;return out;}
export function availableItems(state,gearId,except=null){return state.tackleItems.filter(i=>i.gearId===gearId&&i.condition>0&&!ownerOf(state,i.id,except));}
export function assemblyItems(state,rod,id=null,requested=null){
 const items={};for(const part of PARTS){if(!rod[part])continue;if(requested&&!requested[part])return {error:`Kies een vrij onderdeel: ${gear[rod[part]]?.name||part}.`};const explicit=requested?.[part],item=explicit?state.tackleItems.find(i=>i.id===explicit):availableItems(state,rod[part],id)[0];
  if(!item||item.gearId!==rod[part]||ownerOf(state,item.id,id))return {error:`Geen vrij onderdeel: ${gear[rod[part]]?.name||part}.`};
  // A damaged rod may stay in its existing assembly, but cannot be mounted elsewhere.
  const current=state.rodPresets.find(p=>p.id===id);if(item.condition<=0&&current?.items?.rod!==item.id)return {error:'Repareer deze hengel voordat je hem monteert.'};items[part]=item.id;
 }
 if(rod.crafted){const reserved=state.rodPresets.filter(p=>p.id!==id&&p.assembled&&p.rod.crafted===rod.crafted).length;if((state.crafted[rod.crafted]||0)<=reserved)return {error:'Geen vrije zelfgemaakte onderlijn. Maak er een bij of haal een andere hengel uit elkaar.'};}
 return {items};
}
export function assemblyError(state,preset){
 if(preset?.rod.crafted&&state.rodPresets.filter(p=>p.assembled&&p.rod.crafted===preset.rod.crafted).length>(state.crafted[preset.rod.crafted]||0))return 'Geen vrije zelfgemaakte onderlijn. Maak er een bij of haal een andere hengel uit elkaar.';
 if(!preset?.assembled)return 'Deze hengel is nog niet compleet. Monteer eerst de ontbrekende onderdelen.';
 for(const part of PARTS){if(!preset.rod[part])continue;const item=state.tackleItems.find(i=>i.id===preset.items?.[part]);if(!item||item.gearId!==preset.rod[part]||ownerOf(state,item.id,preset.id))return 'Een onderdeel ontbreekt of is al bezet.';if(item.condition<=0)return 'Deze hengel is gebroken. Repareer hem of vervang de hengel.';}
 return null;
}
export function refreshSelectionReferences(state){state.selectedRods=state.selectedRods.flatMap(r=>{const p=state.rodPresets.find(p=>p.id===r.sourcePresetId);return p?[{...clone(p.rod),sourcePresetId:p.id,slot:r.slot}]:[];});}
export function migrateTackle(state,raw,legacyLoadouts=[]){
 if(Number(raw.schemaVersion)>SCHEMA_VERSION)throw Error('NEWER_SAVE');
 if(Number(raw.schemaVersion)>=3){
  if(!Array.isArray(raw.tackleItems))throw Error('Missing tackle inventory');
  const ids=new Set();state.tackleItems=raw.tackleItems.map(i=>{if(!i||typeof i.id!=='string'||!i.id||i.id.length>80||!gear[i.gearId]||ids.has(i.id)||!Number.isFinite(i.condition)||i.condition<0||i.condition>100)throw Error('Invalid tackle item');ids.add(i.id);return {id:i.id.slice(0,80),gearId:i.gearId,condition:i.condition,starter:i.starter===true};});
  state.gear=Object.fromEntries(GEAR.map(g=>[g.id,state.tackleItems.filter(i=>i.gearId===g.id).length]));
  if(!Array.isArray(raw.rodPresets)||state.rodPresets.length!==raw.rodPresets.length)throw Error('Invalid assemblies');const used=new Set();for(const p of state.rodPresets){const old=raw.rodPresets.find(x=>x.id===p.id);p.assembled=old?.assembled===true;p.items={};if(p.assembled)for(const part of PARTS){if(!p.rod[part])continue;const id=old.items?.[part],item=state.tackleItems.find(i=>i.id===id);if(!item||item.gearId!==p.rod[part]||used.has(id))throw Error('Conflicting tackle reservations');used.add(id);p.items[part]=id;}}
  for(const id of new Set(state.rodPresets.filter(p=>p.assembled&&p.rod.crafted).map(p=>p.rod.crafted)))if(state.rodPresets.filter(p=>p.assembled&&p.rod.crafted===id).length>(state.crafted[id]||0))throw Error('Missing crafted rigs');
 }else{
  state.tackleItems=[];const counts={...state.gear};state.gear={};for(const g of GEAR)if(counts[g.id])addTackle(state,g.id,counts[g.id],g.category==='rod'&&g.starter);
  // Preserve existing names/designs and link identical setups across alternate loadouts.
  const order=[state.session?.loadout,{name:'Gekozen hengels',rods:state.selectedRods},...legacyLoadouts].filter(Boolean);
  const priority=[];for(const l of order){const used=new Set();for(const [i,r]of l.rods.entries()){
   let p=state.rodPresets.find(p=>p.id===r.sourcePresetId&&sameSetup(p.rod,r)&&!used.has(p.id))||state.rodPresets.find(p=>sameSetup(p.rod,r)&&!used.has(p.id));
   if(!p){p={id:'rig_'+state.serial++,name:`${l.name} · ${i+1}`,rod:rodSnapshot(r)};state.rodPresets.push(p);}r.sourcePresetId=p.id;used.add(p.id);if(!priority.includes(p))priority.push(p);
  }}
  for(const p of [...priority,...state.rodPresets.filter(p=>!priority.includes(p))]){
   p.items={};p.assembled=false;
   if(!availableItems(state,p.rod.rod).length||!availableItems(state,p.rod.reel).length)continue;
   // Old line/hook/terminal/indicator kits were unlimited-use purchases. Convert
   // them once into dedicated parts for sets backed by actual owned rods/reels.
   for(const part of PARTS.filter(p=>!['rod','reel'].includes(p)))if(p.rod[part]&&!availableItems(state,p.rod[part]).length&&counts[p.rod[part]])addTackle(state,p.rod[part]);
   if(p.rod.crafted&&state.session?.loadout.rods.some(r=>r.sourcePresetId===p.id))state.crafted[p.rod.crafted]=Math.max(state.crafted[p.rod.crafted]||0,state.rodPresets.filter(q=>q.assembled&&q.rod.crafted===p.rod.crafted).length+1);
   const result=assemblyItems(state,p.rod,p.id);if(!result.error){p.items=result.items;p.assembled=true;}
  }
  state.migrationNote='Je oude materiaal en loadouts zijn omgezet naar individuele hengels. Gedeelde lijn- en haaksets zijn eenmalig verdeeld; ontwerpen zonder vrije hengel of molen blijven bewaard om later te bouwen.';
 }
 state.schemaVersion=SCHEMA_VERSION;refreshSelectionReferences(state);return state;
}
export function repairQuote(state,itemId){const item=state.tackleItems.find(i=>i.id===itemId),g=gear[item?.gearId];if(!item||g.category!=='rod')return null;return {item,gear:g,missing:100-item.condition,cost:item.starter?0:Math.round(Math.max(.5,g.price*.35*(100-item.condition)/100)*100)/100};}
