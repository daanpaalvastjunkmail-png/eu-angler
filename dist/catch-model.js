import {safeStrength} from './training.js';
import {GEAR,SUPPLIES,COMBOS,SPECIES} from './data.js';

const gear=Object.fromEntries(GEAR.map(item=>[item.id,item]));
const supplies=Object.fromEntries(SUPPLIES.map(item=>[item.id,item]));
const species=Object.fromEntries(SPECIES.map(item=>[item.id,item]));
const carpVisitors={brasem:1.4,voorn:.75,ruisvoorn:.55,winde:.45,baars:.2};
const smallFishBaits={maggots:1.4,corn:1,worms:1.1,pellets:.45,boilies:.1,bacon:.3,fishbait:.06,squid:.06,krill:.1};
const breamBaits={maggots:1.3,corn:1.2,worms:1.2,pellets:1.4,boilies:1,bacon:.5,fishbait:.2,squid:.2,krill:.35};
const crayfishBaits={maggots:.85,corn:.7,worms:1.4,pellets:1.25,boilies:1,bacon:1.5,fishbait:1.5,squid:1.4,krill:1.3};
const baitStrength=(ids,weights)=>Math.max(...ids.map(id=>weights[id]??.5));

export const isCrayfish=fish=>fish?.kind==='crayfish';
export const canStockSpecies=fish=>!!fish&&!isCrayfish(fish)&&!fish.styles.includes('zee');
export function releaseBonus(fish){return isCrayfish(species[fish.species])?1:Math.max(3,Math.round((fish.xp||0)*.2));}

// Both simulation and Statistics use these same encounter weights and limits.
// Style expresses what the angler targets; edible bait still attracts visitors.
export function encounterPool(rod,water){
 const combo=COMBOS.find(item=>item.id===rod.combo);
 const baitIds=[...new Set([rod.bait,...(combo?.requires||[])])];
 const attracts=new Set(baitIds.flatMap(id=>supplies[id]?.attracts||[]));
 return water.fish.map(id=>{
  const fish=species[id],nuisance=isCrayfish(fish),bycatch=!nuisance&&rod.style==='karper'&&Object.hasOwn(carpVisitors,id);
  const styleFits=fish.styles.includes(rod.style)||bycatch;
  const favoured=attracts.has(id);
  let weight=styleFits?(favoured?3.5:1):0;
  if(bycatch)weight*=carpVisitors[id]*baitStrength(baitIds,id==='brasem'?breamBaits:smallFishBaits);
  if(!nuisance&&rod.baitSize==='large')weight*=fish.max<2?.3:fish.max>5?1.2:1;
  if(!nuisance&&rod.baitSize==='small')weight*=fish.max<2?1.2:fish.max>5?.85:1;
  if(nuisance)weight=styleFits&&!water.sea?(water.crayfishPressure??.6)*(rod.style==='dobber'?.3:1)*baitStrength(baitIds,crayfishBaits):0;
  const hook=gear[rod.hook],strength=safeStrength(rod);
  // A crayfish may cling to bait, even when a large hook would exclude tiny fish.
  const hookMin=nuisance?0:hook.min,hookMax=nuisance?Infinity:hook.max;
  const waterMax=fish.min+(fish.max-fish.min)*(nuisance?1:water.factor);
  const kind=nuisance?'nuisance':bycatch?'bycatch':'target';
  return {fish,weight,styleFits,favoured,kind,hookMin,hookMax,strength,waterMax,baitIds};
 });
}

export function encounterStory(entry){
 if(entry.kind==='nuisance')return 'Een rivierkreeft klampt zich vast aan je aas. Veel gedoe, vrijwel geen verkoopwaarde.';
 if(entry.kind==='bycatch'&&entry.fish.id==='brasem')return 'Bijvangst: een brasem heeft je karperaas gevonden. Ook maïs, pellets en boilies trekken witvis aan.';
 if(entry.kind==='bycatch')return 'Bijvangst: witvis aan je karperhengel. Klein aas en een lichte haak laten ook kleine vissen toe.';
 return '';
}
