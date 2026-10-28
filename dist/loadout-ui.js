import {rodPoints,rodTier} from './training.js';
import {GEAR,STYLES,SLOT_LEVELS,SLOT_COSTS,SUPPLIES,COMBOS,RECIPES} from './data.js';
import {gearArt} from './art.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const gear=id=>GEAR.find(item=>item.id===id);
const style=id=>STYLES.find(item=>item.id===id);
const money=value=>'€ '+new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(value||0);
const slotNumber=(rod,index)=>Number.isInteger(rod?.slot)?rod.slot:index;

/** Return the occupied rig and its array index for a physical rod position. */
export function slotRod(draft,slot){
 const index=(draft?.rods||[]).findIndex((rod,index)=>slotNumber(rod,index)===Number(slot));
 return index<0?null:{rod:draft.rods[index],index};
}

/** The same six positions stay visible while the selected rig is edited below. */
export function loadoutSlots(game,draft,selectedSlot=0){
 const ownedCount=game.state.rodSlots;
 return `<section class="rod-slots-section" aria-label="Hengelplaatsen in je loadout"><div class="section-heading rod-slots-heading"><div><span class="eyebrow">STEL JE LIJNEN SAMEN</span><h2>Kies een hengelplaats</h2></div><span>${draft?.rods?.length||0} / ${ownedCount} bezet · 6 plaatsen in totaal</span></div><div class="rod-slot-strip">${SLOT_LEVELS.map((level,index)=>{
  const owned=index<ownedCount,found=slotRod(draft,index),rod=found?.rod,item=gear(rod?.rod),next=index===ownedCount,levelReady=game.level>=level,purchasable=next&&levelReady,affordable=game.state.money>=SLOT_COSTS[index],active=owned&&index===Number(selectedSlot);
  if(!owned)return `<div class="rod-slot-container locked"><button type="button" class="rod-slot-tile locked ${purchasable?'available':''}" ${purchasable&&affordable?'':'disabled'} data-action="buy-slot" aria-label="Hengelplaats ${index+1} kopen${levelReady?'':', level '+level+' nodig'}"><span class="rod-slot-number">0${index+1}</span><div class="rod-slot-lock" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><rect x="8" y="14" width="16" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M11 14V9a5 5 0 0 1 10 0v5M16 19v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div><strong>Hengelplaats ${index+1}</strong><small>${purchasable?'VRIJSPELEN · '+money(SLOT_COSTS[index]):'LEVEL '+level}</small>${purchasable&&!affordable?'<span class="rod-slot-footnote">Onvoldoende geld</span>':''}</button><span class="rod-slot-preset-locked">Vrij vanaf level ${level}</span></div>`;
  const presets=game.state.rodPresets||[],readiness=new Map(presets.map(preset=>[preset.id,presetReadiness(game,draft,index,preset)]));
  const matches=preset=>readiness.get(preset.id)?.ok&&sameRod(rod,preset.rod);
  const matching=presets.find(preset=>preset.id===rod?.sourcePresetId)||presets.find(matches);
  return `<div class="rod-slot-container ${active?'selected':''}"><button type="button" class="rod-slot-tile owned ${rod?'filled':'empty'} ${active?'selected':''}" data-select-rod-slot="${index}" aria-pressed="${active}" aria-label="Hengelplaats ${index+1}${rod?', '+(style(rod.style)?.name||rod.style):', leeg'}"><span class="rod-slot-number">0${index+1}</span><div class="rod-slot-art" aria-hidden="true">${rod?gearArt('rod',item?.tier,rod.style):'<span>+</span>'}</div><strong>${rod?esc(matching?.name||style(rod.style)?.name||rod.style):'Lege plaats'}</strong><small>${rod?'T'+(rodTier(rod)+1)+' · '+rodPoints(rod)+' pt':'KIES EEN SETUP'}</small><span class="rod-slot-footnote">${active?'Geselecteerd':rod?'Setup aanpassen':'Hengel toevoegen'}</span></button><label class="rod-slot-preset field"><span>OPGESLAGEN HENGEL</span><select data-slot-rod-preset="${index}" aria-label="Opgeslagen hengel kiezen voor plaats ${index+1}" ${presets.length?'':'disabled'}><option value="" ${matching?'':'selected'}>${presets.length?'Kies een hengelsetup':'Nog geen opgeslagen hengels'}</option>${presets.map(preset=>{const ready=readiness.get(preset.id);return `<option value="${esc(preset.id)}" ${matching?.id===preset.id?'selected':''} ${ready.ok?'':'disabled'} ${ready.ok?'':`title="${esc(ready.message)}"`}>${esc(preset.name)}${ready.ok?'':' · '+esc(ready.message)}</option>`;}).join('')}</select></label></div>`;
 }).join('')}</div><p class="rod-slots-note">Combineer je visstijlen: feeder en karper kunnen tegelijk in dezelfde loadout. Iedere plaats gebruikt een opgeslagen fysieke hengel. Scholingspunten begrenzen de zwaarte van je combinatie.</p></section>`;
}

const rodFields=['style','rod','reel','line','hook','terminal','bait','combo','liquid','crafted','indicator','baitSize'];
const sameRod=(a,b)=>!!a&&!!b&&rodFields.every(field=>(a[field]||'')===(b[field]||''));

function presetReadiness(game,draft,slot,preset){
 if(slot<0||slot>=game.state.rodSlots)return {ok:false,message:'Speel deze hengelplaats eerst vrij.'};
 const resolved=game.resolveRodPreset(preset.id);
 if(!resolved.ok)return resolved;
 const rods=(draft?.rods||[]).map((rod,index)=>({...rod,slot:slotNumber(rod,index)}));
 const current=rods.findIndex(rod=>rod.slot===slot),replacement={...resolved.rod,slot};
 if(current<0)rods.push(replacement);else rods[current]=replacement;
 const error=game.validateLoadout({...draft,rods});
 return error?{ok:false,message:error}:{ok:true,rod:replacement};
}

/** Choose a complete saved loadout before assigning individual rod setups. */
export function loadoutPresetControl(game,draft){
 const loadouts=game.state.loadouts||[],saved=loadouts.some(loadout=>loadout.id===draft?.id);
 return `<section class="panel loadout-preset-control" aria-label="Loadoutpreset kiezen"><div class="loadout-preset-row"><label class="field"><span>LOADOUTPRESET</span><select id="loadout-preset-select" aria-label="Opgeslagen loadout kiezen">${!saved?'<option value="" selected>Nieuwe loadout (nog niet opgeslagen)</option>':''}${loadouts.map(loadout=>`<option value="${esc(loadout.id)}" ${draft?.id===loadout.id?'selected':''}>${esc(loadout.name)}</option>`).join('')}</select></label><button type="button" class="button" data-action="new-loadout" ${loadouts.length>=12?'disabled':''}>Nieuwe loadout</button></div></section>`;
}

function presetSaveForm(game,draft,slot,selected){
 const presets=game.state.rodPresets||[],current=slotRod(draft,slot),owned=slot>=0&&slot<game.state.rodSlots;
 const currentError=current&&game.validRod?game.validRod(current.rod):null,canSave=owned&&!!current&&!currentError;
 const suggestedName=selected?.name||(current?`${style(current.rod.style)?.name||'Hengel'} · ${gear(current.rod.rod)?.name||'mijn setup'}`:'');
 return `<div class="rod-preset-save"><div><h3>${selected?'Deze hengelsetup bewaren':'Bewaar de geselecteerde hengelsetup'}</h3><p>De preset bewaart alleen plaats ${slot+1}. De knop “Loadout opslaan” bewaart alle hengelplaatsen samen.</p></div><label class="field"><span>NAAM HENGELPRESET</span><input type="text" id="rod-preset-name" maxlength="45" value="${esc(suggestedName)}" placeholder="Bijvoorbeeld: lichte feeder" data-user-text ${canSave?'':'disabled'} aria-label="Naam hengelpreset"></label><div class="row-actions">${selected?`<button type="button" class="button" data-action="update-rod-preset" data-preset-id="${esc(selected.id)}" ${canSave?'':'disabled'}>Preset bijwerken</button>`:''}<button type="button" class="button" data-action="save-rod-preset" ${canSave&&presets.length<30?'':'disabled'}>Als nieuwe preset opslaan</button></div>${!canSave?`<small class="rod-preset-save-note">${currentError?esc(currentError):'Kies eerst een hengelsetup voor deze plaats.'}</small>`:''}</div>`;
}

const tierNames={field:'Field',scout:'Scout',river:'River Pro',specialist:'Specialist',heritage:'Heritage',apex:'Apex',sovereign:'Sovereign'};
function previewDetails(rod){
 const row=(field,label,item,fallback)=>{const tier=tierNames[item?.tier];return `<div class="rod-preset-detail" data-preview-component="${field}"><dt>${label}</dt><dd><strong>${esc(item?.name||fallback||'Geen')}</strong>${item?.level?`<small>${tier?esc(tier)+' · ':''}Level ${item.level}</small>`:''}</dd></div>`;};
 const st=style(rod.style);
 return `<dl class="rod-preset-details">${row('style','Visstijl',st)}${row('rod','Hengel',gear(rod.rod))}${row('reel','Molen',gear(rod.reel))}${row('line','Lijn',gear(rod.line))}${row('hook','Haak',gear(rod.hook))}${row('terminal','Montage',gear(rod.terminal))}${row('bait','Aas',SUPPLIES.find(item=>item.id===rod.bait))}${row('combo','Aascombinatie',COMBOS.find(item=>item.id===rod.combo))}${row('liquid','Liquid',SUPPLIES.find(item=>item.id===rod.liquid),'Geen liquid')}${row('crafted','Zelfgemaakte rig',RECIPES.find(item=>item.id===rod.crafted),'Geen zelfgemaakte rig')}${row('indicator','Beetmelder',gear(rod.indicator),'Standaardsignaal')}</dl>`;
}

/** Preview a saved setup independently from the rig currently being edited. */
export function rodPresetWorkbench(game,draft,selectedSlot=0,previewPresetId=null,appliedPresetId=null){
 const slot=Math.max(0,Math.min(5,Math.floor(Number(selectedSlot)||0))),presets=game.state.rodPresets||[];
 const applied=presets.find(preset=>preset.id===appliedPresetId),preview=presets.find(preset=>preset.id===previewPresetId)||applied||presets[0],ready=preview?presetReadiness(game,draft,slot,preview):null;
 const card=preview?`<article class="rod-workbench-preview ${ready.ok?'':'unavailable'}" data-rod-preset-card="${esc(preview.id)}"><div class="rod-workbench-preview-heading"><div><span class="eyebrow">OPGESLAGEN SETUP</span><h3 data-user-text>${esc(preview.name)}</h3></div><span class="tag">${esc(style(preview.rod.style)?.name||'Hengelsetup')}</span></div>${previewDetails(preview.rod)}${!ready.ok?`<p class="rod-preset-unavailable" role="status">${esc(ready.message)}</p>`:''}<div class="rod-preset-card-actions"><button type="button" class="primary small" data-apply-rod-preset="${esc(preview.id)}" ${ready.ok?'':'disabled'}>Op plaats ${slot+1} zetten</button><button type="button" class="button small" data-delete-rod-preset="${esc(preview.id)}" aria-label="Hengelpreset verwijderen">Verwijderen</button></div></article>`:'<p class="rod-preset-empty">Nog geen opgeslagen hengels. Stel een hengel samen en bewaar je eerste setup.</p>';
 return `<aside class="rod-preset-workbench" aria-label="Hengelsetup bekijken en bewaren"><div class="section-heading"><h3>Hengelsetup</h3><span>${presets.length} / 30</span></div><label class="field"><span>OPGESLAGEN HENGEL KIEZEN</span><select id="rod-preset-select" aria-label="Opgeslagen hengelsetup kiezen" ${presets.length?'':'disabled'}>${presets.length?presets.map(preset=>`<option value="${esc(preset.id)}" ${preset.id===preview?.id?'selected':''}>${esc(preset.name)}</option>`).join(''):'<option value="">Nog geen hengelpresets</option>'}</select></label>${card}${presetSaveForm(game,draft,slot,applied)}</aside>`;
}

/** Compact single-rod selection; its save form can also live below the editor. */
export function rodPresetPicker(game,draft,selectedSlot=0,selectedPresetId=null,options={}){
 const {saveOnly=false,showSave=true}=options||{},presets=game.state.rodPresets||[];
 const slot=Math.max(0,Math.min(5,Math.floor(Number(selectedSlot)||0))),selected=presets.find(preset=>preset.id===selectedPresetId);
 if(saveOnly)return `<section class="panel rod-preset-save-panel">${presetSaveForm(game,draft,slot,selected)}</section>`;
 const availability=new Map(presets.map(preset=>[preset.id,presetReadiness(game,draft,slot,preset)]));
 const preview=selected||presets.find(preset=>availability.get(preset.id)?.ok)||presets[0],ready=preview?availability.get(preview.id):null;
 const r=preview?.rod||{},item=gear(r.rod);
 const controls=`<div class="rod-preset-controls"><label class="field"><span>HENGELPRESET</span><select id="rod-preset-select" aria-label="Opgeslagen hengelsetup kiezen" ${presets.length?'':'disabled'}>${presets.length?presets.map(preset=>`<option value="${esc(preset.id)}" ${preset.id===preview?.id?'selected':''}>${esc(preset.name)}</option>`).join(''):'<option value="">Nog geen hengelpresets</option>'}</select></label><label class="field"><span>HENGELPLAATS</span><select id="rod-preset-slot" aria-label="Doelplaats voor hengelpreset">${SLOT_LEVELS.map((level,index)=>{
  const owned=index<game.state.rodSlots,current=slotRod(draft,index),label=owned?(current?style(current.rod.style)?.name||'Hengelsetup':'Lege plaats'):'LEVEL '+level;
  return `<option value="${index}" ${index===slot?'selected':''} ${owned?'':'disabled'}>Hengelplaats ${index+1} · ${esc(label)}</option>`;
 }).join('')}</select></label></div>`;
 const card=preview?`<article class="rod-preset-card rod-preset-preview selected ${ready.ok?'':'unavailable'}" data-rod-preset-card="${esc(preview.id)}"><div class="rod-preset-art" aria-hidden="true">${gearArt('rod',item?.tier,r.style)}</div><div class="rod-preset-card-body"><span class="eyebrow">${esc(style(r.style)?.name||'Hengelsetup')}</span><h3 data-user-text>${esc(preview.name)}</h3><p>${esc(item?.name||'Hengel')} · ${esc(gear(r.reel)?.name||'Molen')}</p><small>${esc(gear(r.hook)?.name||'Haak')} · ${esc(gear(r.line)?.name||'Lijn')}</small>${!ready.ok?`<p class="rod-preset-unavailable" role="status">${esc(ready.message)}</p>`:''}</div><div class="rod-preset-card-actions"><button type="button" class="button small" data-delete-rod-preset="${esc(preview.id)}" aria-label="Hengelpreset verwijderen">Verwijderen</button><button type="button" class="primary small" data-apply-rod-preset="${esc(preview.id)}" ${ready.ok?'':'disabled'}>Op plaats ${slot+1} zetten</button></div></article>`:'<div class="rod-preset-empty"><div><h3>Je eerste hengelpreset</h3><p>Stel hieronder een hengel samen en sla de setup op. Daarna kun je deze met één klik in een andere loadout gebruiken.</p></div></div>';
 return `<section class="panel rod-preset-library rod-preset-compact"><div class="panel-head"><h2>Hengelpresets</h2><span class="tag">${presets.length} / 30 PRESETS</span></div>${controls}${card}${showSave?presetSaveForm(game,draft,slot,selected):''}</section>`;
}
