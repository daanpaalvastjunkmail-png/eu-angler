import {canStockSpecies,releaseBonus} from './catch-model.js';
import {SPECIES,WATERS} from './data.js';
export const DISPOSITIONS={pending:0,sold:1,kept:2,stocked:3,released:4,autosold:5};
const sid=id=>typeof id==='number'?`fish_${id}`:String(id);
export function encodeCatch(f,startedAt,status=0){const match=/^fish_(\d+)$/.exec(f.id),flags=(f.method==='manual'?1:0)|(f.rescued?2:0)|(f.trophy?4:0)|(f.best?8:0);return [match?Number(match[1]):f.id,f.species,f.weight,f.value,f.xp,Math.max(0,Math.round((f.at-startedAt)/1000)),flags,status,f.reaction===null||f.reaction===undefined?null:Math.round(f.reaction*100)];}
export function decodeCatch(row,j){const species=SPECIES.find(f=>f.id===row[1]),flags=row[6]||0;return {id:sid(row[0]),species:row[1],name:species?.name||row[1],weight:row[2],value:row[3],xp:row[4],at:j.startedAt+row[5]*1000,water:j.water,method:flags&1?'manual':'auto',rescued:!!(flags&2),trophy:!!(flags&4),best:!!(flags&8),disposition:row[7]||0,reaction:row[8]===null||row[8]===undefined?null:row[8]/100};}
export function cleanHistory(raw){return (Array.isArray(raw)?raw:[]).filter(r=>Array.isArray(r)&&(typeof r[0]==='number'||typeof r[0]==='string')&&SPECIES.some(f=>f.id===r[1])&&Number.isFinite(r[2])&&r[2]>0&&Number.isFinite(r[3])&&r[3]>=0&&Number.isFinite(r[4])&&r[4]>=0&&Number.isFinite(r[5])&&r[5]>=0).map(r=>[r[0],r[1],r[2],r[3],r[4],r[5],Number(r[6])|0,[0,1,2,3,4,5].includes(r[7])?r[7]:0,Number.isFinite(r[8])?Math.max(0,r[8]):null]);}
export function recordCatch(game,session,f,status){session.fish??=[];session.fish.push(encodeCatch(f,session.startedAt,status));while(game.state.sessions.length&&session.fish.length+game.state.sessions.reduce((n,j)=>n+j.fish.length,0)>40000)game.state.sessions.pop();}
export function markDisposition(game,id,status){for(const j of [game.state.session,...game.state.sessions].filter(Boolean))for(const row of j.fish||[])if(sid(row[0])===id){row[7]=status;break;}delete game.state.catchChoices[id];}
export function closeJournal(game,s,reason){
 const j={id:s.id,water:s.water,loadoutName:s.loadout.name,startedAt:s.startedAt,endedAt:game.simNow,seconds:s.duration-s.remaining,caught:s.caught,weight:s.weight,xp:s.xp,value:s.value,cost:s.cost,manualCaught:s.manualCaught||0,autoCaught:s.autoCaught||0,missedBites:s.missedBites||0,rescuedBites:s.rescuedBites||0,reason,fish:s.fish||[]};
 game.state.sessions=game.state.sessions.filter(x=>x.id!==j.id);game.state.sessions.unshift(j);
 while(game.state.sessions.length>1&&(game.state.sessions.length>8||game.state.sessions.reduce((n,j)=>n+j.fish.length,0)>40000))game.state.sessions.pop();
}
export function resolveJournal(game,id='latest'){
 if(id==='checkout'||id==='kept')return {id:'checkout',water:game.state.sessions[0]?.water||game.state.lastSession?.water||game.state.net[0]?.water||null,loadoutName:'Vangsten aan het water',startedAt:Math.min(game.simNow,...game.state.net.map(f=>Number.isFinite(f.at)?f.at:game.simNow)),fish:[],caught:game.state.net.length,weight:game.state.net.reduce((n,f)=>n+f.weight,0),value:game.state.net.reduce((n,f)=>n+f.value,0)};
 if(id==='latest')return game.state.session||game.state.sessions[0]||null;
 return [game.state.session,...game.state.sessions].find(j=>j&&String(j.id)===String(id))||null;
}
export function sessionRows(game,id='latest'){
 const j=resolveJournal(game,id);if(!j)return [];const owned=new Map(game.state.net.map(f=>[f.id,f]));
 const fish=id==='checkout'||id==='kept'?game.state.net.map(f=>({...f,disposition:0})):(j.fish||[]).map(row=>decodeCatch(row,j));
 return fish.map(f=>({...f,available:owned.has(f.id),choice:game.state.catchChoices[f.id]||(owned.has(f.id)?'sell':'pending')}));
}
export function chooseCatches(game,ids,action){
 game.sync();if(action==='keep')action='pending';
 if(!['sell','release','stock','pending'].includes(action))return game.fail('Kies verkopen, terugzetten voor XP of overzetten naar je eigen viswater.');
 if(!Array.isArray(ids)||!ids.length)return game.fail('Selecteer eerst een vangst.');
 const chosen=new Set(ids),selected=game.state.net.filter(f=>chosen.has(f.id));
 if(selected.length!==chosen.size)return game.fail('Een van deze vissen is niet meer beschikbaar. Ververs je selectie.');
 if(action==='stock'&&(!game.state.estate.owned||selected.some(f=>!canStockSpecies(SPECIES.find(s=>s.id===f.species)))))return game.fail('Je kunt alleen zoetwatervis overzetten naar je eigen, gekochte viswater.');
 for(const f of selected)game.state.catchChoices[f.id]=action;
 return game.changed('selection');
}
export function settleSession(game,id='latest'){
 game.sync();const checkout=game.awaitingSettlement,available=sessionRows(game,checkout?'checkout':id).filter(f=>f.available);
 if(!available.length)return game.fail('Er zijn geen vangsten om af te handelen.');
 const unresolved=available.filter(f=>!['sell','release','stock'].includes(f.choice));
 if(checkout&&unresolved.length)return game.fail(`Kies voor alle vissen wat je ermee doet. Nog ${unresolved.length} ${unresolved.length===1?'vis wacht':'vissen wachten'} op een keuze: verkopen, terugzetten voor XP of naar je eigen viswater.`);
 const rows=available.filter(f=>['sell','release','stock'].includes(f.choice));
 if(!rows.length)return game.fail('Kies eerst wat je met je vangsten wilt doen.');
 const stocks=rows.filter(f=>f.choice==='stock');
 if(stocks.length&&!game.state.estate.owned)return game.fail('Koop eerst een eigen viswater.');
 if(stocks.some(f=>!canStockSpecies(SPECIES.find(s=>s.id===f.species))))return game.fail('Alleen zoetwatervissen kunnen naar je vijver; rivierkreeften en zeevis niet.');
 if(stocks.length+game.estatePopulation>game.estateCapacity)return game.fail(`Je viswater heeft nog ${Math.max(0,game.estateCapacity-game.estatePopulation)} plaatsen. Kies minder vissen om over te zetten.`);
 const remove=new Set(),result={sold:0,released:0,releaseXp:0,stocked:0,value:0,pending:0};
 for(const row of rows){
  remove.add(row.id);
  if(row.choice==='sell'){result.sold++;result.value+=row.value;markDisposition(game,row.id,DISPOSITIONS.sold);}
  else if(row.choice==='stock'){let pop=game.state.estate.fish.find(p=>p.species===row.species);if(!pop){pop={species:row.species,count:0,best:0};game.state.estate.fish.push(pop);}pop.count++;pop.best=Math.max(pop.best,row.weight);result.stocked++;markDisposition(game,row.id,DISPOSITIONS.stocked);}
  else{const before=game.state.xp;game.addXp(releaseBonus(row));result.releaseXp+=game.state.xp-before;result.released++;markDisposition(game,row.id,DISPOSITIONS.released);}
 }
 game.state.net=game.state.net.filter(f=>!remove.has(f.id));game.state.stats.sold+=result.sold;game.state.stats.released+=result.released;if(result.value)game.earn(result.value);result.value=Math.round((result.value+Number.EPSILON)*100)/100;result.pending=game.state.net.length;
 game.log(`Vangsten afgehandeld: ${result.sold} verkocht, ${result.released} teruggezet, ${result.stocked} naar je eigen viswater.`);
 return game.changed('settlement',`€ ${result.value.toLocaleString('nl-NL')} ontvangen. ${result.released} teruggezet (+${result.releaseXp} XP), ${result.stocked} naar je eigen viswater.${result.pending?' '+result.pending+' vangsten wachten nog aan het water.':' Alle vangsten zijn afgehandeld.'}`,result);
}
export function cleanJournals(raw){return (Array.isArray(raw)?raw:[]).filter(j=>j&&Number.isFinite(j.id)&&WATERS.some(w=>w.id===j.water)).slice(0,8).map(j=>({...j,loadoutName:String(j.loadoutName||'Mijn loadout').slice(0,45),reason:String(j.reason||'Sessie afgelopen.').slice(0,160),startedAt:Number.isFinite(j.startedAt)?j.startedAt:0,endedAt:Number.isFinite(j.endedAt)?j.endedAt:0,fish:cleanHistory(j.fish)}));}
