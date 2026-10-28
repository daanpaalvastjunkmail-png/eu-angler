import {GEAR,STYLES,WATERS} from './data.js';
import {lakeScene} from './visuals.js';
import {fishingForeground} from './fishing-scene.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(items,id)=>items.find(item=>item.id===id);
const num=(n,d=0)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:d}).format(n||0);
const rodNumber=(rod,index)=>Number.isInteger(rod?.slot)?rod.slot+1:index+1;
export function indicatorName(r){return get(GEAR,r.indicator)?.name||(r.style==='karper'?'Vrijloopspoel':r.style==='dobber'?'Klassieke dobber':r.style==='feeder'?'Quivertop':'Molenratel');}

function rodControl(game,rod,index){
 const session=game.state.session,number=rodNumber(rod,index),phase=session?.rods[index]?.phase||'waiting';
 return `<article class="scene-rod-control" data-live-rod="${index}" data-rod-slot="${number-1}" data-phase="${phase}"><div class="scene-line-label"><span>${String(number).padStart(2,'0')}</span><div><strong data-scene-equipment>${esc(get(GEAR,rod.rod)?.name)}</strong><small data-scene-indicator>${esc(get(STYLES,rod.style)?.name)} · ${esc(indicatorName(rod))}</small></div><kbd>${number}</kbd></div><div class="scene-bite-status"><i></i><strong data-signal-text="${index}">WACHT OP EEN BEET</strong><span data-signal-time="${index}"></span></div><div class="scene-bite-meter"><i data-bite-progress="${index}"></i></div><button class="scene-strike-button" data-strike="${index}" disabled aria-label="Aanslaan op hengel ${number}"><span data-strike-label="${index}">${session?'Wachten op een beet':'Start eerst je sessie'}</span><span aria-hidden="true">↗</span></button><p data-outcome="${index}">${session?'Je assistent vist mee. Jij houdt de beet in de gaten.':'Plan rechts een sessie om je hengel in te leggen.'}</p></article>`;
}

export function fishingView(game,activeLine=0){
 const s=game.state,session=s.session,w=session?get(WATERS,session.water):game.water,loadout=session?.loadout||game.loadout,summary=session||s.lastSession;
 const background=lakeScene(w,0,!!session).replace('viewBox="0 0 900 390"','x="0" y="0" width="1200" height="600" viewBox="0 45 900 345" preserveAspectRatio="none"').replace('class="lake-illustration','class="lake-illustration game-background');
 return `<section class="panel game-view" id="fishing-game" aria-label="Interactieve visstek"><div class="scene game-scene" data-phase="waiting"><svg class="fishing-foreground-svg game-illustration" id="scene-foreground" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Al je hengels tegelijk aan de waterkant">${background}${fishingForeground(loadout.rods)}</svg><div class="scene-vignette" aria-hidden="true"></div>
 <div class="game-scene-title"><span class="eyebrow">${esc(w.country.toUpperCase())} <span>·</span> ${esc(w.tag)}</span><h2>${esc(w.name)}</h2><p>${esc(w.region)}</p></div>
 <div class="scene-top-tools"><button class="scene-sound" data-action="toggle-audio"><span class="sound-status">Geluid inschakelen</span></button><span class="scene-weather">18° <i>·</i> <span data-live="sceneTime">07:24</span></span></div>
 <div class="scene-session-badge"><i class="dot"></i>${game.awaitingSettlement?'SESSIE AFGELOPEN · ROND JE VANGSTEN AF':session?loadout.rods.length+' LIJN'+(loadout.rods.length>1?'EN':'')+' IN HET WATER':'KLAAR VOOR EEN NIEUWE SESSIE'}</div>
 <button class="scene-tend" data-action="tend"><span>${session?'Stek verzorgen':'Stek opruimen'}</span><b data-live="focus">${Math.floor(s.focus)}</b><small>${session?'Volgende worp eerder':'+ € 0,10 voor de visclub'}</small></button>
 <div class="scene-bite-announcement sr-only" id="scene-bite-announcement" role="status" aria-live="polite"></div></div>
 <div class="scene-control-toolbar"><p>Iedere hengel heeft zijn eigen aanslagknop. Klik op de hengel, de knop eronder of gebruik de cijfertoets.</p><div class="angling-modes scene-modes" aria-label="Visstand"><button data-fishing-mode="idle" class="${s.settings.fishingMode==='idle'?'active':''}" title="De assistent vist mee. Je kunt altijd zelf aanslaan.">Ontspannen</button><button data-fishing-mode="active" class="${s.settings.fishingMode==='active'?'active':''}" title="Na je eigen vangst leg je 35% eerder opnieuw in.">Actief</button></div></div>
 <div class="scene-rod-controls" data-rod-count="${loadout.rods.length}" style="--rod-count:${loadout.rods.length}" aria-label="Beetmeldingen en aanslagknoppen per hengel">${loadout.rods.map((rod,index)=>rodControl(game,rod,index)).join('')}</div>
 <div class="game-session-summary"><div><b data-live="sessionCatches">${num(summary?.caught)}</b><span>VANGSTEN</span></div><div><b data-live="sessionWeight">${num(summary?.weight,2)} kg</b><span>TOTAAL GEWICHT</span></div><div><b data-angling-stat="manualCaught">${num(summary?.manualCaught)}</b><span>ZELF GELAND</span></div><div><b data-angling-stat="rescuedBites">${num(summary?.rescuedBites)}</b><span>BETEN GERED</span></div></div></section>`;
}
