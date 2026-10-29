import {SPECIES,WATERS,STYLES} from './data.js';
import {SPECIES_INFO} from './species-info.js';
import {catchArt} from './art.js';
import {ATELIER_ASSETS} from './atelier-assets.js';
import {translateText} from './i18n.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const language=game=>game.state.settings.language;
const caughtRecord=(game,id)=>Number(game.state.records[id]?.count)>0?game.state.records[id]:null;
const text=(game,nl,en)=>language(game)==='nl'?nl:en;
const translated=(game,value)=>translateText(value||'',language(game));
const groupOf=f=>SPECIES_INFO[f.id]?.group||(f.kind==='crayfish'?'crayfish':f.styles.includes('zee')?'sea':/karper|schub|spiegel|kroes|giebel/.test(f.id)?'carp':'coarse');

export function atelierBanner(page,game){
 const themes={
  waters:['forest','Van polder tot fjord','From polder to fjord','Tien wateren. Elk een nieuw verhaal.','Ten waters. A different story on every shore.'],
  contests:['wetlands','Vang het moment.','Make this your moment.','Jouw stek. Jouw tactiek. Jouw volgende beker.','Your swim. Your tactics. Your next trophy.'],
  fleet:['atlantic','Verder dan de horizon.','Beyond the horizon.','Van de eerste charter tot je eigen vloot.','From your first charter to a fleet of your own.'],
  species:['forest','Het veldboek van de visser.','An angler’s field guide.','Leer de verschillen kennen. Vind je volgende droomvangst.','Learn their differences. Find your next dream catch.'],
 };
 const t=themes[page];if(!t)return '';
 return `<section class="atelier-page-art" aria-label="${esc(text(game,t[1],t[2]))}"><img src="${ATELIER_ASSETS[t[0]]}" alt="" decoding="async"><div><span>EUROPA ANGLER · ATELIER</span><strong>${text(game,t[1],t[2])}</strong><p>${text(game,t[3],t[4])}</p></div><span class="atelier-art-stamp">FIELD JOURNAL / 01</span></section>`;
}

export function fieldGuide(game,{query='',group='all',water='all',caught='all'}={}){
 const options=[['all','Alle vissen','All fish'],['carp','Karpers & varianten','Carp & variants'],['coarse','Witvis & zalmachtigen','Coarse fish & salmonids'],['predator','Roofvissen','Predators'],['bottom','Grondels & bodemvissen','Gobies & bottom dwellers'],['sea','Zeevissen','Sea fish'],['crayfish','Kreeftachtigen','Crustaceans']];
 const count=SPECIES.filter(f=>caughtRecord(game,f.id)).length;
 return `<section class="field-guide"><div class="field-guide-summary"><div><span class="eyebrow">${text(game,'JOUW VERZAMELING','YOUR COLLECTION')}</span><h2>${text(game,'Elke vis een eigen verhaal.','Every fish has a story.')}</h2></div><strong>${count}<small> / ${SPECIES.length} ${text(game,'ontdekt','discovered')}</small></strong></div><div class="field-guide-toolbar"><label class="field"><span>${text(game,'ZOEK EEN VIS','FIND A FISH')}</span><input type="search" id="species-search" value="${esc(query)}" placeholder="${text(game,'Naam, patroon of leefgebied…','Name, pattern or habitat…')}" aria-label="${text(game,'Zoeken in soortenboek','Search the field guide')}"></label><label class="field"><span>${text(game,'GROEP','GROUP')}</span><select id="species-group">${options.map(([id,nl,en])=>`<option value="${id}" ${group===id?'selected':''}>${text(game,nl,en)}</option>`).join('')}</select></label><label class="field"><span>${text(game,'VISWATER','FISHING WATER')}</span><select id="species-water"><option value="all">${text(game,'Alle wateren','All waters')}</option>${WATERS.map(w=>`<option value="${w.id}" ${water===w.id?'selected':''}>${esc(w.name)}</option>`).join('')}</select></label><label class="field"><span>${text(game,'ONTDEKKING','DISCOVERY')}</span><select id="species-caught"><option value="all">${text(game,'Alle ontdekkingen','All discoveries')}</option><option value="caught" ${caught==='caught'?'selected':''}>${text(game,'Al gevangen','Already caught')}</option><option value="new" ${caught==='new'?'selected':''}>${text(game,'Nog te vangen','Still to discover')}</option></select></label></div><p class="field-guide-hint">${text(game,'Karperschubben zijn varianten binnen dezelfde soort. Gewichten en zeldzaamheid volgen de spelbalans.','Carp scale patterns are variants of the same species. Weights and rarity follow the game balance.')}</p><div id="species-results" aria-live="polite">${fieldGuideResults(game,{query,group,water,caught})}</div></section>`;
}

export function fieldGuideResults(game,{query='',group='all',water='all',caught='all'}={}){
 const needle=query.trim().toLocaleLowerCase();
 const list=SPECIES.filter(f=>{
  const info=SPECIES_INFO[f.id]||{},record=caughtRecord(game,f.id),waters=WATERS.filter(w=>w.fish.includes(f.id));
  const search=[f.name,translated(game,f.name),info.family,info.description,info.habitat,info.pattern,translated(game,info.description),translated(game,info.habitat),translated(game,info.family),...waters.map(w=>w.name)].join(' ').toLocaleLowerCase();
  return(!needle||search.includes(needle))&&(group==='all'||groupOf(f)===group)&&(water==='all'||waters.some(w=>w.id===water))&&(caught==='all'||caught==='caught'&&record||caught==='new'&&!record);
 });
 return `<p class="field-guide-count">${list.length} ${text(game,'vissen & varianten','fish & variants')}</p><div class="field-guide-grid">${list.map(f=>{
  const info=SPECIES_INFO[f.id]||{},record=caughtRecord(game,f.id),waters=WATERS.filter(w=>w.fish.includes(f.id));
  return `<article class="field-guide-card ${record?'discovered':''}" data-species-card="${f.id}"><div class="field-guide-art">${catchArt(f)}<span class="field-guide-number">${String(SPECIES.indexOf(f)+1).padStart(2,'0')}</span><span class="field-guide-found">${record?'✓ '+text(game,'ONTDEKT','DISCOVERED'):text(game,'TE ONTDEKKEN','TO DISCOVER')}</span></div><div class="field-guide-body"><span class="field-guide-category">${esc(translated(game,info.family|| (f.styles.includes('zee')?'Zeevis':'Zoetwatervis')))}${info.variantOf?' · '+text(game,'VARIANT','VARIANT'):''}</span><h3>${esc(translated(game,f.name))}</h3><p>${esc(translated(game,info.description||info.habitat))}</p><div class="field-guide-details"><span>${f.min<.1?Math.round(f.min*1000)+' g':f.min+' kg'} — ${f.max} kg</span><span>${f.styles.map(id=>esc(translated(game,STYLES.find(s=>s.id===id)?.name))).join(' · ')}</span></div><div class="field-guide-water"><span>${text(game,'TE VINDEN IN','FOUND IN')}</span>${waters.map(w=>`<button type="button" data-guide-water="${w.id}">${esc(w.name)}</button>`).join('')}</div><div class="field-guide-record">${record?`${record.count} ${text(game,'gevangen','caught')} · ${text(game,'record','record')} ${Number(record.best).toFixed(2)} kg`:text(game,'Jouw eerste vangst wacht nog.','Your first catch is waiting.')}</div></div></article>`;
 }).join('')||`<p class="field-guide-empty">${text(game,'Geen vissen met deze combinatie. Pas je filters aan.','No fish match these filters. Try a different combination.')}</p>`}</div>`;
}

export function discoveryStrip(game){
 const ids=['linear_spiegel','giebel','riviergrondel'].filter(id=>SPECIES.some(f=>f.id===id));
 return `<section class="discovery-strip"><div class="discovery-heading"><span class="eyebrow">${text(game,'MEER TE ONTDEKKEN','MORE TO DISCOVER')}</span><h2>${text(game,'Wat zit er onder het oppervlak?','What lies beneath?')}</h2><button class="text-button" data-page="species">${text(game,'Open je soortenboek','Open your field guide')} ↗</button></div>${ids.map(id=>{const f=SPECIES.find(f=>f.id===id);return `<button class="discovery-fish" data-guide-species="${id}">${catchArt(f)}<span>${esc(translated(game,f.name))}</span></button>`}).join('')}</section>`;
}

export function supplyArt(item){
 const id=item.id,color=item.color||'#d8ad70';let contents='';
 if(id==='corn')contents=Array.from({length:15},(_,n)=>`<ellipse cx="${86+n%5*20}" cy="${80+Math.floor(n/5)*17}" rx="9" ry="12" transform="rotate(${n%2?22:-18} ${86+n%5*20} ${80+Math.floor(n/5)*17})" fill="${n%3?'#eec055':'#f5d580'}" stroke="#b88436"/>`).join('');
 else if(/worm|bacon/.test(id))contents=Array.from({length:6},(_,n)=>`<path d="M${85+n*15} 80c-20-25-25 24-4 18s29 26 0 20" fill="none" stroke="${n%2?'#be7c70':'#d79a81'}" stroke-width="6" stroke-linecap="round"/>`).join('');
 else if(/maggot|krill/.test(id))contents=Array.from({length:22},(_,n)=>`<path d="M${79+n%7*17} ${79+Math.floor(n/7)*16}q12-7 13 5" fill="none" stroke="${id==='krill'?'#d48773':'#f0dcc0'}" stroke-width="7" stroke-linecap="round"/>`).join('');
 else if(/liquid/.test(id))return `<svg class="atelier-supply-art" viewBox="0 0 280 160" role="img" aria-label="${esc(item.name)}"><ellipse cx="140" cy="139" rx="57" ry="9" fill="#223245" opacity=".12"/><path d="M124 27h32v26l16 18v61q-31 12-64 0V71l16-18Z" fill="${color}" stroke="#e9e1cf" stroke-width="2"/><rect x="122" y="19" width="36" height="17" rx="4" fill="#243749"/><path d="M118 76h44v37h-44Z" fill="#f2e5c9"/><path d="M129 97q11-17 22 0-11 17-22 0Z" fill="#629a93"/><path d="M116 73v46" stroke="#fff" opacity=".3" stroke-width="4"/></svg>`;
 else if(/squid|fishbait/.test(id))contents=`<path d="M83 93q22-38 60 0l19-15v32l-19-14q-33 34-60-3Z" fill="#9cbbb8" stroke="#5e8288"/><circle cx="95" cy="90" r="3" fill="#1a3446"/><path d="M143 115q22-39 42-2l19-11v24l-19-12q-22 28-42 1Z" fill="#d9c2a9" stroke="#9c8472"/>`;
 else contents=Array.from({length:18},(_,n)=>`<circle cx="${82+n%6*21}" cy="${83+Math.floor(n/6)*19}" r="${id==='feed'?5:9}" fill="${n%3===0?'#c28b59':color}" stroke="#694c3930"/><circle cx="${79+n%6*21}" cy="${80+Math.floor(n/6)*19}" r="2" fill="#fff" opacity=".28"/>`).join('');
 return `<svg class="atelier-supply-art" viewBox="0 0 280 160" role="img" aria-label="${esc(item.name)}"><ellipse cx="143" cy="139" rx="78" ry="9" fill="#223245" opacity=".1"/><path d="M67 65q75-19 151 0l-9 61q-65 22-133 0Z" fill="#e9dfc8" stroke="#b8aa8b"/><path d="M67 65q75-19 151 0l-9 14q-68-15-135 0Z" fill="#f7efdc" stroke="#cbbd9d"/>${contents}<path d="M81 52v-23h94l15 20-10 13" fill="#315b66" stroke="#668e8d"/><path d="M92 36h65m-65 8h42" stroke="#c3d8c5" stroke-width="2" opacity=".8"/><path d="M79 121q66 21 129 0" fill="none" stroke="#a3987d"/></svg>`;
}
