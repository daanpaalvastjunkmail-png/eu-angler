import {GEAR,STYLES,SLOT_LEVELS,SLOT_COSTS} from './data.js';
import {rodPoints,rodTier} from './training.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>'€ '+new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(value);

/** Step one selects physical rod presets directly, without saving a whole set. */
export function sessionRodPicker(game){
 const s=game.state,rods=s.selectedRods,training=game.training(),capacity=game.selectionCapacity;
 const counts=Object.fromEntries(STYLES.map(style=>[style.id,rods.filter(r=>r.style===style.id).length]));
 const slots=SLOT_LEVELS.map((level,slot)=>{
  const owned=slot<capacity,current=rods.find(r=>r.slot===slot),next=slot===s.rodSlots;
  if(!owned)return `<div class="session-rod-position locked"><span class="session-rod-number">${String(slot+1).padStart(2,'0')}</span><div><strong>Hengelplaats ${slot+1}</strong><small>Level ${level}${next&&game.level>=level?' · '+money(SLOT_COSTS[slot]):''}</small></div>${next&&game.level>=level?`<button type="button" class="button small" data-action="buy-slot" ${s.money<SLOT_COSTS[slot]||s.session?'disabled':''}>Vrijspelen</button>`:'<span class="session-rod-lock" aria-hidden="true">⌑</span>'}</div>`;
  const options=s.rodPresets.map(preset=>{
   const ready=game.sessionRodAvailability(slot,preset.id),selected=preset.id===current?.sourcePresetId;
   return `<option value="${esc(preset.id)}" ${selected?'selected':''} ${ready.ok?'':'disabled'}>${esc(preset.name)} · T${rodTier(preset.rod)+1} · ${rodPoints(preset.rod)} pt${ready.ok?'':' · '+esc(ready.message)}</option>`;
  }).join('');
  const method=STYLES.find(style=>style.id===current?.style),name=GEAR.find(g=>g.id===current?.rod)?.name;
  return `<label class="session-rod-position ${current?'filled':'empty'}"><span class="session-rod-number">${String(slot+1).padStart(2,'0')}</span><div class="session-rod-choice"><span>Hengel ${slot+1}</span><select data-session-rod-slot="${slot}" aria-label="Hengel kiezen voor plaats ${slot+1}"><option value="" ${current?'':'selected'}>Geen hengel</option>${options}</select><small>${current?`${esc(method?.name||'')} · ${esc(name||'')}`:'Kies een opgeslagen hengelpreset'}</small></div></label>`;
 }).join('');
 return `<section class="session-rod-picker" aria-label="Kies je hengels"><div class="session-rod-heading"><span class="field-step"><i>01</i>KIES JE HENGELS</span><strong>${rods.length} / ${capacity}</strong></div><p>De gekozen hengel bepaalt je vismethode. Elke fysieke hengel kan één keer mee.</p><fieldset class="session-rod-positions" ${s.session||game.awaitingSettlement?'disabled':''}><legend class="sr-only">Hengels voor deze sessie kiezen</legend>${slots}</fieldset><div class="selection-style-counts">${STYLES.filter(style=>!style.level||game.level>=style.level).map(style=>`<span>${style.name}<b>${counts[style.id]} / ${style.cap}</b></span>`).join('')}</div><div class="selection-training ${training.allowed?'':'overloaded'}" role="status"><span>Scholingspunten</span><strong>${training.used} / ${training.capacity}</strong></div>${!training.allowed?`<p class="assembly-warning">Deze combinatie vraagt level ${training.requiredLevel}. Kies lichtere hengels of minder lijnen.</p>`:''}<button class="text-button" data-page="loadouts">Hengelpresets bouwen & aanpassen →</button></section>`;
}
