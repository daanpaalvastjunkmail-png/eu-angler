import {BAITS,COMBOS,SUPPLIES,GEAR} from './data.js';
import {rodRisk} from './training.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const language=game=>game.state.settings.language==='nl'?'nl':'en';
const copy={
 en:{title:'Choose your bait',intro:'Prepare each rod for this trip. Mixes are included in the bait menu.',rod:'Rod',bait:'Bait',size:'Bait size',liquid:'Liquid',small:'Small',normal:'Standard',large:'Large / bunch',none:'No liquid',empty:'Choose a rod above to prepare its bait.',locked:'Your rods are fishing. Change bait on each rod beneath the water view.',settle:'Finish handling your catches before preparing the next trip.',protected:'Resolve the save warning before changing your bait.',stock:'in stock',choose:'Change bait',active:'ON THIS ROD',editor:'Prepare the next cast',editorIntro:'Only this rod changes. Your other rods keep fishing.',current:'Currently fishing with',preview:'For the rest of this session',purchase:'Additional supplies',covered:'Your shared stock covers the remaining session.',costNote:'Only missing supplies are purchased. Unused bait stays in your stock.',supplies:'To top up',apply:'Apply bait & recast',pay:'Buy & recast',unchanged:'Choose different bait, a size or a liquid to recast.',insufficient:'You do not have enough money for these supplies.',bite:'A bite is in progress. Land or release the bite before changing this rod.',broken:'This rod is broken. Repair it after the session.',ended:'This session has ended.',invalidRod:'This rod is no longer fishing.',invalid:'This bait setup is unavailable. Choose an unlocked option.',warning:'This bait size adds casting stress to this rod.',noSession:'Start a session to change bait at the water.',spent:'Extra cost',money:'Available',feeder:'Feeder',karper:'Carp',dobber:'Float',zee:'Sea',pieces:'pcs'},
 nl:{title:'Kies je aas',intro:'Maak elke hengel klaar voor deze sessie. Combinaties staan gewoon in het aasmenu.',rod:'Hengel',bait:'Aas',size:'Aasgrootte',liquid:'Liquid',small:'Klein',normal:'Normaal',large:'Groot / tros',none:'Geen liquid',empty:'Kies hierboven een hengel om het aas klaar te maken.',locked:'Je hengels vissen. Wissel per hengel van aas onder het waterbeeld.',settle:'Handel je vangsten af voordat je de volgende sessie voorbereidt.',protected:'Los eerst de opslagwaarschuwing op voordat je aas verandert.',stock:'op voorraad',choose:'Aas wisselen',active:'AAN DEZE HENGEL',editor:'Klaar voor de volgende worp',editorIntro:'Alleen deze hengel verandert. Je andere hengels vissen door.',current:'Vist nu met',preview:'Voor de rest van deze sessie',purchase:'Extra voorraad',covered:'Je gedeelde voorraad is genoeg voor de resterende sessie.',costNote:'Je koopt alleen ontbrekende voorraad. Ongebruikt aas blijft in je voorraad.',supplies:'Aanvullen',apply:'Aas toepassen & inwerpen',pay:'Kopen & inwerpen',unchanged:'Kies ander aas, een andere grootte of liquid om opnieuw in te werpen.',insufficient:'Je hebt niet genoeg geld voor deze voorraad.',bite:'Je hebt een beet. Handel de beet af voordat je deze hengel opnieuw beaast.',broken:'Deze hengel is gebroken. Repareer hem na de sessie.',ended:'Deze sessie is afgelopen.',invalidRod:'Deze hengel vist niet meer.',invalid:'Deze aaskeuze is niet beschikbaar. Kies een vrijgespeelde optie.',warning:'Deze aasgrootte geeft extra worpspanning op deze hengel.',noSession:'Start een sessie om aan het water van aas te wisselen.',spent:'Extra kosten',money:'Beschikbaar',feeder:'Feeder',karper:'Karper',dobber:'Dobber',zee:'Zee',pieces:'st'}
};
const english={maggots:'Maggots',corn:'Sweetcorn',worms:'Worms',bacon:'Bacon cubes',boilies:'Krill boilies',pellets:'Halibut pellets',fishbait:'Baitfish',squid:'Squid',krill:'Fresh krill',feed:'All-round groundbait',liquid_krill:'Krill liquid',liquid_scopex:'Scopex liquid',corn_maggots:'Corn + maggot',worms_maggots:'Worm + maggot',boilies_corn:'Boilie + corn',bacon_worms:'Bacon + worm',squid_krill:'Squid + krill'};
const itemName=(item,lang)=>lang==='en'?english[item?.id]||item?.name||'':item?.name||'';
const number=(value,lang,digits=0)=>new Intl.NumberFormat(lang==='nl'?'nl-NL':'en-GB',{maximumFractionDigits:digits}).format(Math.max(0,Number(value)||0));
const money=(value,lang)=>new Intl.NumberFormat(lang==='nl'?'nl-NL':'en-GB',{style:'currency',currency:'EUR'}).format(Number(value)||0);
const rodNumber=(rod,index)=>Number.isInteger(rod?.slot)?rod.slot+1:index+1;
const tFor=game=>copy[language(game)];
const presetName=(game,rod,index)=>game.state.rodPresets.find(p=>p.id===rod?.sourcePresetId)?.name||`${tFor(game).rod} ${rodNumber(rod,index)}`;
const mixFor=rod=>COMBOS.find(c=>c.id===rod?.combo&&c.requires);
const colorFor=rod=>SUPPLIES.find(b=>b.id===rod?.bait)?.color||'#e6bc68';
const baitIcon=rod=>`<span class="trip-bait-mark" style="--bait-tone:${colorFor(rod)}" aria-hidden="true"><i></i><i></i>${mixFor(rod)?'<i class="bait-mix-piece"></i>':''}</span>`;

/** One menu contains individual baits and ready-made combinations. */
export const baitChoiceValue=rod=>mixFor(rod)?`combo:${rod.combo}`:`bait:${rod?.bait||''}`;
export function decodeBaitChoice(value,currentRod={}){
 if(typeof value!=='string')return null;
 const [type,id,...rest]=value.split(':');if(rest.length)return null;
 if(type==='bait'&&BAITS.some(b=>b.id===id))return {bait:id,combo:'none'};
 if(type==='combo'){const combo=COMBOS.find(c=>c.id===id&&c.requires);if(combo)return {bait:combo.requires.includes(currentRod.bait)?currentRod.bait:combo.requires[0],combo:id};}
 return null;
}
export function baitSummary(game,rod){const lang=language(game),combo=mixFor(rod);return itemName(combo||BAITS.find(b=>b.id===rod?.bait),lang);}
function baitOptions(game,rod){
 const lang=language(game),selected=baitChoiceValue(rod),choices=[...BAITS.filter(b=>b.level<=game.level).map(b=>({id:`bait:${b.id}`,name:itemName(b,lang)})),...COMBOS.filter(c=>c.requires&&c.level<=game.level&&c.requires.every(id=>BAITS.find(b=>b.id===id)?.level<=game.level)).map(c=>({id:`combo:${c.id}`,name:itemName(c,lang)}))];
 return choices.map(o=>`<option value="${esc(o.id)}" ${o.id===selected?'selected':''}>${esc(o.name)}</option>`).join('');
}
function controls(game,rod,slot,live=false){
 const t=tFor(game),lang=language(game),prefix=live?'live':'trip',attrs=field=>live?`data-live-bait-field="${field}"`:`data-trip-bait-slot="${slot}" data-trip-bait-field="${field}"`,select=(field,label,options)=>`<label class="trip-bait-field ${field==='bait'?'trip-bait-primary':''}" for="${prefix}-bait-${slot}-${field}"><span>${label}</span><select id="${prefix}-bait-${slot}-${field}" ${attrs(field)}>${options}</select></label>`;
 const bait=select('bait',t.bait,baitOptions(game,rod));
 const size=select('baitSize',t.size,['small','normal','large'].map(id=>`<option value="${id}" ${(rod.baitSize||'normal')===id?'selected':''}>${t[id]}</option>`).join(''));
 const liquid=select('liquid',t.liquid,`<option value="" ${!rod.liquid?'selected':''}>${t.none}</option>`+SUPPLIES.filter(b=>b.bonus&&b.level<=game.level).map(b=>`<option value="${esc(b.id)}" ${rod.liquid===b.id?'selected':''}>${esc(itemName(b,lang))}</option>`).join(''));
 return `<div class="trip-bait-fields">${bait}${size}${liquid}</div>`;
}
function stockNote(game,rod){
 const lang=language(game),t=tFor(game),ids=mixFor(rod)?.requires||[rod.bait],all=[...ids,...(rod.liquid?[rod.liquid]:[])];
 return `<p class="trip-bait-stock">${all.map(id=>{const supply=SUPPLIES.find(b=>b.id===id),unit=supply?.unit==='st'?t.pieces:supply?.unit||'';return `${esc(itemName(supply,lang))} <strong>${number(game.state.stock[id],lang,1)} ${esc(unit)}</strong>`;}).join('<span aria-hidden="true"> · </span>')} <span>${t.stock}</span></p>`;
}
function riskNote(game,rod){try{return rodRisk(rod).baitStress?`<p class="trip-bait-warning">${tFor(game).warning}</p>`:'';}catch{return '';}}

export function renderTripBait(game){
 const t=tFor(game),rods=game.state.selectedRods,locked=!!(game.state.session||game.awaitingSettlement||game.store?.blocked),reason=game.store?.blocked?t.protected:game.state.session?t.locked:t.settle;
 return `<section class="trip-bait-section" data-no-translate aria-labelledby="trip-bait-heading"><div class="trip-bait-heading"><span aria-hidden="true">◎</span><div><h3 id="trip-bait-heading">${t.title}</h3><p>${t.intro}</p></div></div>${locked?`<p class="trip-bait-lock" role="status">${reason}</p>`:''}<fieldset class="trip-bait-rods" ${locked?'disabled':''}><legend class="sr-only">${t.title}</legend>${rods.map((rod,index)=>{const slot=Number.isInteger(rod.slot)?rod.slot:index;return `<article class="trip-bait-rod" data-bait-rod-slot="${slot}"><header><span class="trip-bait-rod-number">${String(slot+1).padStart(2,'0')}</span><div><strong data-user-text>${esc(presetName(game,rod,index))}</strong><small>${t[rod.style]||esc(rod.style)} · ${esc(GEAR.find(g=>g.id===rod.rod)?.name||'')}</small></div>${baitIcon(rod)}</header>${controls(game,rod,slot)}${stockNote(game,rod)}${riskNote(game,rod)}</article>`;}).join('')||`<p class="trip-bait-empty">${t.empty}</p>`}</fieldset></section>`;
}

/** The opener remains available during a bite; the editor guards the actual cast. */
export function renderLiveBait(game,rod,index){
 const t=tFor(game),lang=language(game),broken=game.state.session?.rods[index]?.phase==='broken',liquid=SUPPLIES.find(b=>b.id===rod.liquid);
 return `<div class="live-bait-control" data-no-translate><div class="live-bait-current">${baitIcon(rod)}<div><span>${t.active}</span><strong>${esc(baitSummary(game,rod))}</strong><small>${t[rod.baitSize||'normal']}${liquid?' · '+esc(itemName(liquid,lang)):''}</small></div></div><button type="button" class="button live-bait-open" data-change-bait="${index}" data-live-bait-open="${index}" aria-label="${t.choose} · ${t.rod} ${rodNumber(rod,index)}" ${broken?'disabled':''}>${t.choose}<span aria-hidden="true">↗</span></button></div>`;
}
const quoteError=(quote,t)=>({NO_SESSION:t.ended,INVALID_ROD:t.invalidRod,BITE_ACTIVE:t.bite,BROKEN_ROD:t.broken,INVALID_BAIT:t.invalid,PROTECTED_SAVE:t.protected}[quote.code]||quote.error||t.invalid);

/** Re-render only this fragment on a tick, preserving the editor's form fields. */
export function renderLiveBaitQuote(game,index,draft){
 const t=tFor(game),lang=language(game),patch=Object.fromEntries(['bait','baitSize','combo','liquid'].filter(key=>Object.hasOwn(draft||{},key)).map(key=>[key,draft[key]])),quote=game.sessionBaitQuote(index,patch),allowed=quote.valid&&quote.affordable&&quote.changed;
 const items=Object.entries(quote.missing||{}).filter(([,amount])=>amount>0),issue=!quote.valid?quoteError(quote,t):!quote.affordable?t.insufficient:!quote.changed?t.unchanged:'';
 return `${riskNote(game,{...game.state.session?.loadout.rods[index],...patch})}<div class="live-bait-price" aria-live="polite"><div><span>${t.spent}</span><strong>${money(quote.total,lang)}</strong></div><div><span>${t.money}</span><b>${money(game.state.money,lang)}</b></div></div>${quote.valid?`<p class="live-bait-quote-note">${items.length?t.costNote:t.covered}</p>${items.length?`<details class="live-bait-supplies"><summary>${t.supplies} · ${items.length}</summary><ul>${items.map(([id,amount])=>{const item=SUPPLIES.find(s=>s.id===id),unit=item?.unit==='st'?t.pieces:item?.unit||'';return `<li><span>${esc(itemName(item,lang)||id)}</span><strong>${number(amount,lang,1)} ${esc(unit)}</strong></li>`;}).join('')}</ul></details>`:''}`:''}${issue?`<p class="live-bait-feedback" role="status">${esc(issue)}</p>`:''}<button type="button" class="primary live-bait-apply" data-action="apply-live-bait" ${allowed?'':'disabled'}>${quote.total>0?t.pay:t.apply}</button>`;
}

export function renderLiveBaitEditor(game,index,draft){
 const t=tFor(game),rod=game.state.session?.loadout.rods[index];
 if(!rod)return `<div class="live-bait-editor" data-no-translate><p role="status">${t.ended}</p></div>`;
 const next={...rod,...draft};
 return `<div class="live-bait-editor" data-no-translate><header><span class="trip-bait-rod-number">${String(rodNumber(rod,index)).padStart(2,'0')}</span><div><h3 data-user-text>${esc(presetName(game,rod,index))}</h3><p>${t.editorIntro}</p></div></header><p class="live-bait-before">${t.current} <strong>${esc(baitSummary(game,rod))}</strong></p>${controls(game,next,index,true)}${stockNote(game,next)}<h4 class="live-bait-quote-title">${t.preview}</h4><div id="live-bait-quote">${renderLiveBaitQuote(game,index,draft)}</div></div>`;
}
