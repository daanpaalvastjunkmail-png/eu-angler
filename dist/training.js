import {GEAR,SLOT_LEVELS} from './data.js';
const gear=Object.fromEntries(GEAR.map(i=>[i.id,i]));
export const TIER_IDS=['field','scout','river','specialist','heritage','apex','sovereign'];
export const TIER_POINTS=[2,3,5,8,12,18,26];
export const TRAINING=[
 [1,2,'Basisopleiding'],[8,3,'Steviger materiaal'],[10,4,'Twee lichte hengels'],[15,5,'Gemengde uitrusting'],[18,6,'Twee T2-hengels'],[20,7,'Riviertraining'],[30,10,'Dubbele riviermontage'],[40,15,'Drie lijnen beheren'],[45,18,'Specimentraining'],[55,22,'Gevorderde controle'],[70,26,'Zware montages'],[90,34,'Vier lijnen beheren'],[120,46,'Zeeopleiding'],[160,60,'Offshorecontrole'],[170,70,'Vijf lijnen beheren'],[200,90,'Expeditietraining'],[220,108,'Big-gameopleiding'],[250,130,'Meesteropleiding'],[280,145,'Legendarische controle'],[300,156,'Zes meesterhengels'],
].map(([level,points,name])=>({level,points,name}));
export const tierOf=id=>Math.max(0,TIER_IDS.indexOf(gear[id]?.tier));
export const rodTier=rod=>Math.max(tierOf(rod.rod),tierOf(rod.reel));
export const rodPoints=rod=>TIER_POINTS[rodTier(rod)];
export const trainingCapacity=level=>TRAINING.filter(t=>t.level<=level).at(-1)?.points||2;
export function trainingQuote(level,rods=[]){const used=rods.reduce((n,r)=>n+rodPoints(r),0),capacity=trainingCapacity(level),slotLevel=SLOT_LEVELS[Math.max(0,rods.length-1)]||300;return {used,capacity,allowed:used<=capacity,requiredLevel:Math.max(slotLevel,TRAINING.find(t=>t.points>=used)?.level||300),next:TRAINING.find(t=>t.level>level)||null};}
export const rodRating=rod=>[4.5,9,16,28,48,100,240][tierOf(rod.rod)]*(rod.style==='zee'?4:1);
export const safeStrength=rod=>Math.min(gear[rod.line].strength*Math.sqrt(gear[rod.rod].power)*1.5,rodRating(rod));
export function rodRisk(rod){
 const rating=rodRating(rod),hook=gear[rod.hook],largeBait=rod.baitSize==='large'||(!rod.baitSize&&['fishbait','squid'].includes(rod.bait));
 const hookStress=hook.max>rating*2&&hook.min>rating*.1?Math.min(5,hook.max/rating-2):0;
 const baitStress=largeBait?Math.max(0,2-tierOf(rod.rod)):0;
 return {rating,hookStress,baitStress,chance:Math.min(.04,(hookStress+baitStress)*.003),safe:safeStrength(rod)};
}
