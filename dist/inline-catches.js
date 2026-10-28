import {panelCollapsed,panelToggle} from './water-panels.js';
import {isCrayfish} from './catch-model.js';
import {SPECIES} from './data.js';
import {fishArt,catchArt} from './art.js';
import {catchChoice,catchBulkActions,settlementSummary} from './session-ui.js';
import {sortCatches,catchSortControl} from './catch-sort.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const num=(value,digits=0)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:digits}).format(value||0);
const money=value=>'€ '+num(value,2);
const kg=value=>num(value,2)+' kg';
function catchRow(game,fish){
 const species=SPECIES.find(item=>item.id===fish.species);
 const method=fish.method==='manual'?(fish.rescued?'Beet gered':'Zelf aangeslagen'):'Assistent';
 const time=fish.at?new Date(fish.at).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'Eerdere vangst';
 return `<tr data-journal-row="${esc(fish.id)}" data-choice="${esc(fish.choice||'')}" data-catch-weight="${esc(fish.weight)}" data-catch-value="${esc(fish.value)}" data-catch-at="${esc(fish.at||0)}"><td><div class="fish-name-cell">${catchArt(species)}<div><strong>${esc(fish.name)}${fish.trophy?' <span class="gold-text" title="Trofee">✧</span>':''}</strong><small>${isCrayfish(species)?'Lastpak · ':''}${fish.best?'Persoonlijk record · ':''}${method}</small></div></div></td><td class="inline-catch-weight">${kg(fish.weight)}</td><td class="inline-catch-value gold-text">${money(fish.value)}</td><td class="inline-catch-time"><span>${time}</span><small>+${num(fish.xp)} XP</small></td><td class="inline-catch-choice">${catchChoice(game,fish)}</td></tr>`;
}

export function inlineCatches(game,{limit=12,sort='time',direction='desc'}={}){
 const awaiting=Boolean(game.awaitingSettlement),selected=awaiting?'checkout':'latest';
 const rows=game.sessionRows(selected);
 const journal=game.journal(selected);
 const live=Boolean(game.state.session&&journal===game.state.session);
 const visibleLimit=Number.isFinite(limit)?Math.max(1,Math.floor(limit)):12;
 const visible=sortCatches(rows,sort,direction).slice(0,visibleLimit);
 const total=rows.reduce((sum,fish)=>sum+fish.value,0);
 return `<section class="panel inline-catches" id="session-catches" data-water-panel="catches" data-collapsed="${panelCollapsed(game,'catches')}" aria-labelledby="home-catches-heading"><div class="panel-head"><div><span class="eyebrow">${awaiting?'VOOR JE HET WATER VERLAAT':live?'DEZE SESSIE':journal?'LAATSTE SESSIE':'AAN DE WATERKANT'}</span><h2 id="home-catches-heading">${panelToggle(game,'catches',`${awaiting?'Rond je sessie af':'Je vangsten'} <span class="inline-catch-count" id="home-catch-count">${num(rows.length)}</span>`)}</h2></div><button class="button small" data-page="sessions">Alle sessies & vangsten ↗</button></div><div id="home-catches-body" data-water-panel-body ${panelCollapsed(game,'catches')?'hidden':''}><div id="home-catch-list">${catchSortControl(sort,direction)}${catchBulkActions(game,rows)}${rows.length?`<div class="inline-catch-caption"><span>${awaiting?'Verkopen is voorgeselecteerd. Pas je keuzes aan en handel alle vissen af.':live?'Verkopen staat standaard aan. Pas je keuzes aan en verwerk ze hieronder.':'Je vangsten, gesorteerd op jouw keuze.'}</span><span>Totale vangstwaarde <b class="gold-text">${money(total)}</b></span></div><div class="table-wrap"><table class="data-table journal-table inline-catch-table"><thead><tr><th>VANGST</th><th>GEWICHT</th><th>WAARDE</th><th>TIJD / XP</th><th>JOUW KEUZE</th></tr></thead><tbody>${visible.map(fish=>catchRow(game,fish)).join('')}</tbody></table></div>${rows.length>visibleLimit?`<div class="inline-catch-more"><span>${num(visible.length)} van ${num(rows.length)} vangsten · de samenvatting telt alle openstaande vissen mee.</span><button class="button small" data-action="more-home-catches">Meer vangsten tonen</button></div>`:''}`:`<div class="inline-catches-empty">${fishArt('#a8b692')}<div><strong>Je eerste vangst verschijnt hier.</strong><p>${live?'Houd je lijnen in de gaten. Kies hier na elke vangst of je verkoopt, terugzet voor XP of overzet.':'Start een sessie en houd je lijnen in de gaten. Daarna kies je hier wat je met je vissen doet.'}</p></div></div>`}</div><div class="settlement-bar" id="settlement-summary" aria-label="Vangstkeuzes verwerken">${settlementSummary(game,selected)}</div></div></section>`;
}
