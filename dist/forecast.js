import {safeStrength} from './training.js';
import {encounterPool,isCrayfish} from './catch-model.js';
import {fishSaleValue} from './economy.js';
import {GEAR,STYLES,SUPPLIES,COMBOS,SPECIES} from './data.js';
const get=(xs,id)=>xs.find(x=>x.id===id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cdf=(n,min,span)=>span>0?clamp((n-min)/span,0,1)**(1/1.6):0;
export const WEIGHT_BINS=[[0,.5],[.5,1],[1,2],[2,5],[5,10],[10,25],[25,50],[50,100],[100,200],[200,400]];
export function forecastRod(game,r,w){
 const bait=get(SUPPLIES,r.bait),combo=get(COMBOS,r.combo),hook=get(GEAR,r.hook),line=get(GEAR,r.line),indicator=get(GEAR,r.indicator);
 const pool=encounterPool(r,w),total=pool.reduce((n,entry)=>n+entry.weight,0);
 const strength=safeStrength(r),biteChance=game.rodChance(r),autoChance=game.autoChance(r),manualChance=game.manualChance(r),interval=game.rodInterval(r),window=game.biteWindow(r);
 const rows=pool.map(entry=>{
  const {fish:f,styleFits,favoured,kind,hookMin,hookMax,waterMax}=entry,prior=total?entry.weight/total:0,span=waterMax-f.min;
  const min=Math.max(f.min,hookMin),max=Math.min(waterMax,hookMax,strength),low=cdf(min,f.min,span),high=cdf(max,f.min,span),fit=max>=min?Math.max(0,high-low):0;
  const hookFit=Math.max(0,cdf(Math.min(waterMax,hookMax),f.min,span)-cdf(Math.max(f.min,hookMin),f.min,span));
  const mean=fit?f.min+span*(high**2.6-low**2.6)/(2.6*fit):0,baseXp=(isCrayfish(f)?2:(f.xp+mean*2)*w.xp)*(1+game.state.legacy.wisdom*.05),value=fishSaleValue(mean,f.value,game.state.legacy.market);
  const reasons=[];
  if(!styleFits)reasons.push(`Past bij ${f.styles.map(id=>get(STYLES,id).name).join(' / ')}; niet bij deze ${r.style}.`);
  else{if(kind==='nuisance'){
    reasons.push('Lastpak: rivierkreeften eten allerlei aas en kunnen eraan blijven hangen. Haakmaat houdt ze niet tegen.');
    reasons.push(r.style==='dobber'?'Bij dobbervissen is de kans lager dan bij bodemaas.':'Bodemaas is goed bereikbaar voor rivierkreeften; de overlast verschilt per water.');
    reasons.push('Vrijwel geen verkoopwaarde, weinig XP en geen wedstrijdgewicht. Niet geschikt voor je eigen vijver.');
   }else{
    if(kind==='bycatch')reasons.push(f.id==='brasem'?'Bijvangst bij karpervissen: brasem eet ook maïs, pellets en boilies.':'Bijvangst bij karpervissen: vooral klein aas en lichte haken laten witvis toe.');
    reasons.push(favoured?'Je aas/cocktail geeft deze soort 3,5× selectieweging.':'Geen aasvoorkeur: normale selectieweging.');
    if(kind==='bycatch')reasons.push('De aasgrootte en eetlust van deze soort tellen extra mee in de selectie.');
   }
   if(!fit){if(hook.max<f.min)reasons.push('De haak is te klein voor deze soort.');else if(hook.min>waterMax)reasons.push('De haak selecteert groter dan wat hier zwemt.');else reasons.push('Lijn en hengel kunnen het geselecteerde gewicht niet dragen.');}
   else{if(kind!=='nuisance')reasons.push(`Haak laat ${Math.round(hookFit*100)}% van de lokale gewichtsklasse toe.`);if(fit<hookFit-.0001)reasons.push('Lijn/hengelkracht sluit de zwaarste vissen uit.');else if(kind!=='nuisance')reasons.push('Lijn en hengel dragen alle vissen binnen je haakbereik.');}}
  const bins=WEIGHT_BINS.map(([a,b])=>{const lo=Math.max(min,a),hi=Math.min(max,b);return {min:a,max:b,mass:hi>lo?prior*Math.max(0,cdf(hi,f.min,span)-cdf(lo,f.min,span)):0};});
  return {id:f.id,name:f.name,color:f.color,styleFits,favoured,kind,prior,fit,hookFit,min:fit?min:0,max:fit?max:0,waterMin:f.min,waterMax,mean,baseXp,value,mass:prior*fit,reasons,bins};
 });
 const fitProbability=rows.reduce((n,f)=>n+f.mass,0);
 // A complete cycle includes waiting, real visual nibbles, the reaction delay and landing/recovery.
 const autoExtra=biteChance*(1.1+3.2+1.4+fitProbability*(1-autoChance)*(window-3.2))+(1-biteChance)*.22*1.1;
 const manualExtra=biteChance*(1.1+1.5+1.4)+(1-biteChance)*.22*1.1;
 const manualFactor=game.state.settings.fishingMode==='active'?.65:.82;
 const autoRolls=3600/(interval+autoExtra),manualRolls=3600/(interval*(1-(1-manualFactor)*biteChance*fitProbability*manualChance)+manualExtra);
 let autoXp=0,manualXp=0,autoValue=0,manualValue=0;
 for(const f of rows){f.autoPerCast=biteChance*f.mass*autoChance;f.manualPerCast=biteChance*f.mass*manualChance;f.autoHour=autoRolls*f.autoPerCast;f.manualHour=manualRolls*f.manualPerCast;autoXp+=f.autoHour*f.baseXp;manualXp+=f.manualHour*f.baseXp*game.manualXpMultiplier(false);autoValue+=f.autoHour*f.value;manualValue+=f.manualHour*f.value;}
 const autoCatches=rows.reduce((n,f)=>n+f.autoHour,0),manualCatches=rows.reduce((n,f)=>n+f.manualHour,0),bycatchHour=rows.filter(f=>f.kind!=='target').reduce((n,f)=>n+f.autoHour,0);
 return {rod:r,rows,strength,biteChance,autoChance,manualChance,interval,window,fitProbability,indicator,bycatchHour,
 auto:{catches:autoCatches,xp:autoXp,value:autoValue,casts:autoRolls},manual:{catches:manualCatches,xp:manualXp,value:manualValue,casts:manualRolls},
 effects:[{name:'Basisbeetkans',value:.57},{name:'Materiaal',value:Math.log2(game.rodPower(r))*.045},{name:'Liquid',value:get(SUPPLIES,r.liquid)?.bonus||0},{name:'Aascocktail',value:combo?.bonus||0},{name:'Zelfgemaakte rig',value:game.recipeBonus(r)},{name:'Camouflage',value:(game.state.upgrades.stealth||0)*.02},{name:'Prestige watergevoel',value:game.state.legacy.instinct*.03}],
 bins:WEIGHT_BINS.map(([min,max],i)=>({min,max,autoHour:autoRolls*biteChance*autoChance*rows.reduce((n,f)=>n+f.bins[i].mass,0),manualHour:manualRolls*biteChance*manualChance*rows.reduce((n,f)=>n+f.bins[i].mass,0)}))};
}
export function forecastLoadout(game,l,w){
 const rods=l.rods.map(r=>forecastRod(game,r,w)),sum=(mode,key)=>rods.reduce((n,r)=>n+r[mode][key],0);
 const rows=w.fish.map(id=>{const rs=rods.map(r=>r.rows.find(f=>f.id===id)),viable=rs.filter(f=>f.mass>0),base=rs[0]||{id,name:SPECIES.find(f=>f.id===id)?.name,waterMin:0,waterMax:0,reasons:[],bins:[]};return {...base,autoHour:rs.reduce((n,f)=>n+f.autoHour,0),manualHour:rs.reduce((n,f)=>n+f.manualHour,0),min:viable.length?Math.min(...viable.map(f=>f.min)):0,max:viable.length?Math.max(...viable.map(f=>f.max)):0,byRod:rs};});
 const result={rods,rows,bycatchHour:rods.reduce((n,r)=>n+r.bycatchHour,0),auto:{catches:sum('auto','catches'),xp:sum('auto','xp'),value:sum('auto','value'),casts:sum('auto','casts')},manual:{catches:sum('manual','catches'),xp:sum('manual','xp'),value:sum('manual','value'),casts:sum('manual','casts')},bins:WEIGHT_BINS.map(([min,max],i)=>({min,max,autoHour:rods.reduce((n,r)=>n+r.bins[i].autoHour,0),manualHour:rods.reduce((n,r)=>n+r.bins[i].manualHour,0)}))};
 for(const row of rows){row.autoShare=result.auto.catches?row.autoHour/result.auto.catches:0;row.manualShare=result.manual.catches?row.manualHour/result.manual.catches:0;}
 return result;
}
