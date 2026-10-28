import {GEAR,STYLES,SLOT_LEVELS,SLOT_COSTS} from './data.js';
import {rodPoints,rodTier} from './training.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>'€ '+new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(value);

/** Only usable positions appear; the next unlock is explained above the list. */
export function sessionRodPicker(game){
 const s=game.state,rods=s.selectedRods,training=game.training(),capacity=game.selectionCapacity;
 const counts=Object.fromEntries(STYLES.map(style=>[style.id,rods.filter(r=>r.style===style.id).length]));
 const next=s.rodSlots,nextLevel=SLOT_LEVELS[next],canBuy=next<6&&game.level>=nextLevel;
 const progress=next>=6?'<p class="session-slot-progress">Alle zes hengelplaatsen zijn vrijgespeeld.</p>':canBuy?`<div class="session-slot-unlock"><div><span>Extra hengelplaats beschikbaar</span><strong>Hengelplaats ${next+1} · ${money(SLOT_COSTS[next])}</strong></div><button type="button" class="button small" data-action="buy-slot" ${s.money<SLOT_COSTS[next]||s.session||game.awaitingSettlement?'disabled':''}>Hengelplaats kopen</button></div>`:`<div class="session-slot-progress"><span>Volgende hengelplaats</span><strong>Level ${nextLevel}</strong></div>`;
 const slots=Array.from({length:capacity},(_,slot)=>{
  const current=rods.find(r=>r.slot===slot);
  const options=s.rodPresets.map(preset=>{
   const ready=game.sessionRodAvailability(slot,preset.id),selected=preset.id===current?.sourcePresetId;
   return `<option value="${esc(preset.id)}" ${selected?'selected':''} ${ready.ok?'':'disabled'}>${esc(preset.name)}${ready.ok?'':' · '+esc(ready.message)}</option>`;
  }).join('');
  const method=STYLES.find(style=>style.id===current?.style),name=GEAR.find(g=>g.id===current?.rod)?.name;
  return `<label class="session-rod-position ${current?'filled':'empty'}"><span class="session-rod-number">${String(slot+1).padStart(2,'0')}</span><div class="session-rod-choice"><span>Hengel ${slot+1}</span><select data-session-rod-slot="${slot}" aria-label="Hengel kiezen voor plaats ${slot+1}"><option value="" ${current?'':'selected'}>Geen hengel</option>${options}</select><small>${current?`${esc(method?.name||'')} · ${esc(name||'')} · T${rodTier(current)+1} · ${rodPoints(current)} pt`:'Kies een opgeslagen hengelpreset'}</small></div></label>`;
 }).join('');
 return `<section class="session-rod-picker" aria-label="Kies je hengels"><div class="session-rod-heading"><span class="field-step"><i>01</i>KIES JE HENGELS</span><strong>${rods.length} / ${capacity}</strong></div><p>De gekozen hengel bepaalt je vismethode. Elke fysieke hengel kan één keer mee.</p>${progress}<fieldset class="session-rod-positions" ${s.session||game.awaitingSettlement?'disabled':''}><legend class="sr-only">Hengels voor deze sessie kiezen</legend>${slots}</fieldset><div class="selection-style-counts">${STYLES.filter(style=>!style.level||game.level>=style.level).map(style=>`<span>${style.name}<b>${counts[style.id]} / ${style.cap}</b></span>`).join('')}</div><div class="selection-training ${training.allowed?'':'overloaded'}" role="status"><span>Scholingspunten</span><strong>${training.used} / ${training.capacity}</strong></div>${!training.allowed?`<p class="assembly-warning">Deze combinatie vraagt level ${training.requiredLevel}. Kies lichtere hengels of minder lijnen.</p>`:''}<button type="button" class="text-button" data-page="loadouts">Hengelpresets bouwen & aanpassen →</button></section>`;
}
