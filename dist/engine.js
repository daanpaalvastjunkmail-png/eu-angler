import {SaveStore,SAVE_KEY,BACKUP_KEY,LEGACY_KEY} from './save-store.js';
import {trainingQuote,rodRisk,rodRating} from './training.js';
import {SCHEMA_VERSION,PARTS,migrateTackle,addTackle,assemblyItems,assemblyError,refreshSelectionReferences,repairQuote,ownerOf,sameSetup} from './tackle.js';
import {encounterPool,encounterStory,isCrayfish,canStockSpecies,releaseBonus} from './catch-model.js';
import {packSave,unpackSave} from './save-codec.js';
import {SESSION_CAP,OFFLINE_HOURS,permitCost,charterCost,fishSaleValue} from './economy.js';
import {MAX_ROD_PRESETS,rodSnapshot,seedRodPresets,cleanRodPresets,slotRods,cleanLoadoutRods} from './rig-presets.js';
import {recordCatch,markDisposition,closeJournal,resolveJournal,sessionRows,chooseCatches,settleSession,cleanJournals,cleanHistory,encodeCatch} from './journal.js';
import {VERSION,STYLES,SLOT_LEVELS,SLOT_COSTS,GEAR,HOOKS,SUPPLIES,BAITS,COMBOS,SPECIES,WATERS,RECIPES,TOURNAMENTS,UPGRADES,BOATS,ESTATE_PRICE,ESTATE_UPGRADE_BASE} from './data.js';
import {forecastRod,forecastLoadout} from './forecast.js';
const map=a=>Object.fromEntries(a.map(x=>[x.id,x]));
const gear=map(GEAR),supplies=map(SUPPLIES),species=map(SPECIES),waters=map(WATERS),recipes=map(RECIPES),boats=map(BOATS);
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const cents=x=>Math.round((x+Number.EPSILON)*100)/100;
const numeric=(x,fallback=0)=>Number.isFinite(Number(x))?Number(x):fallback;
function normalizePlan(plan={},fallback={duration:900,reserve:.1}){
 const requested=clamp(numeric(plan?.duration,fallback.duration),60,SESSION_CAP),day=24*3600;
 // Plans use whole days after 24h; migrate old half-day steps without changing
 // a running session or its already paid permit. Exact ties round down.
 const duration=requested>day?Math.ceil(requested/day-.5)*day:requested;
 return {duration,license:duration,reserve:[0,.1,.25].includes(Number(plan.reserve))?Number(plan.reserve):fallback.reserve};
}
export const xpAt=level=>level<=1?0:Math.round(90*Math.pow(level-1,1.8)*Math.pow(1.018,level-1));
export function levelAt(xp){let lo=1,hi=300;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(xpAt(m)<=xp)lo=m;else hi=m-1;}return lo;}
export const craftLevelAt=xp=>Math.min(99,1+Math.floor(Math.sqrt(Math.max(0,xp)/45)));
export const starterRod=style=>({style,rod:`${style}_rod_field`,reel:`${style}_reel_field`,line:'line_field',hook:style==='dobber'?'hook_16':'hook_12',terminal:`${style}_terminal_field`,bait:style==='karper'?'corn':style==='zee'?'squid':'maggots',combo:'none',liquid:null,crafted:null,indicator:null,baitSize:'normal'});
function initial(now){return {
 version:VERSION,lastAt:now,seed:((now^0x5ea19e)>>>0)||127,serial:1,money:150,xp:0,highestLevel:1,rodSlots:1,
 gear:Object.fromEntries(GEAR.filter(g=>g.starter).map(g=>[g.id,1])),stock:{feed:1200,maggots:120,corn:100,worms:40,boilies:60},
 selectedRods:[{...starterRod('feeder'),slot:0,sourcePresetId:'rig_feeder'}],selectedWater:'rietplas',plan:{duration:900,license:900,reserve:.1},permits:{},session:null,
 rodPresets:seedRodPresets(starterRod),net:[],sessions:[],catchChoices:{},records:{},recent:[],upgrades:{net:0,offline:0,autosell:0,workbench:0,focus:0,polaroid:0,rodrest:0,landingnet:0,autostrike:0,stealth:0},settings:{autosell:false,keepTrophies:true,reducedMotion:false,audio:false,fishingMode:'idle',language:'en',waterPanels:{catches:false,planner:false,activity:false}},
 focus:6,focusClock:0,clickAt:0,craftXp:0,crafted:{},craftJob:null,tournament:null,contestResults:[],
 estate:{owned:false,name:'Mijn Oever',level:1,fish:[],bank:0,visitors:0,breedProgress:0,born:0},fleet:[],fleetBank:0,
 legacy:{count:0,points:0,earned:0,wisdom:0,instinct:0,market:0},
 stats:{bites:0,autoCaught:0,manualCaught:0,autoMisses:0,missedBites:0,earlyStrikes:0,rescuedBites:0,perfectStrikes:0,reactionSeconds:0,caught:0,sold:0,released:0,earned:0,playSeconds:0,clicks:0,contests:0,wins:0,crafted:0,bestWeight:0,permits:0,prestiges:0},
 }};
export class IdleGame{
 constructor({storage,now=()=>Date.now()}={}){
  this.now=now;this.listeners=new Set();this.dirty=false;this.simNow=now();
  try{this.storage=storage===null?null:storage||globalThis.localStorage;}catch{this.storage=null;}
  this.state=migrateTackle(initial(this.simNow),{});this.lastSave=this.simNow;this.welcome=null;this.store=new SaveStore(this.storage);
  try{const loaded=this.store.load(raw=>this.validate(raw));if(loaded)this.state=loaded;}catch{this.storage=null;this.store=new SaveStore(null);}
  const gap=Math.max(0,(this.simNow-this.state.lastAt)/1000);
  if(gap>1&&!this.store.blocked){const before=this.snapshot();this.advanceTo(this.simNow);if(gap>=60)this.welcome=this.difference(before,gap);}
  this.save();
 }
 get level(){return levelAt(this.state.xp);}
 get craftLevel(){return craftLevelAt(this.state.craftXp);}
 get water(){return waters[this.state.selectedWater]||WATERS[0];}
 // Transient view used by simulation and forecasts; there are no saved full sets.
 get loadout(){return {name:'Gekozen hengels',rods:this.state.selectedRods};}
 get selectionCapacity(){return Math.min(6,this.state.rodSlots,this.availableSlots);}
 get awaitingSettlement(){return !this.state.session&&this.state.net.length>0;}
 get capacity(){return 200*Math.pow(2,this.state.upgrades.net);}
 get offlineCap(){return OFFLINE_HOURS[this.state.upgrades.offline]*3600;}
 get sessionCap(){return SESSION_CAP;}
 get maxFocus(){return 6+2*this.state.upgrades.focus;}
 get maxBatch(){return 5+10*this.state.upgrades.workbench;}
 get levelProgress(){return this.level>=300?1:clamp((this.state.xp-xpAt(this.level))/(xpAt(this.level+1)-xpAt(this.level)),0,1);}
 get availableSlots(){return SLOT_LEVELS.filter(l=>l<=this.level).length;}
 get activeWater(){return this.state.session?waters[this.state.session.water]:this.water;}
 get estateCapacity(){return this.state.estate.level*100;}
 get estatePopulation(){return this.state.estate.fish.reduce((n,f)=>n+f.count,0);}
 get estateIncome(){const e=this.state.estate;if(!e.owned||!this.estatePopulation)return 0;const diversity=e.fish.length,weight=e.fish.reduce((n,f)=>n+f.best,0);return Math.round([0,12,35,95,230,600][e.level]*(1+diversity*.16+Math.min(this.estatePopulation,500)*.025)*(1+Math.min(weight,300)/200));}
 onChange(cb){this.listeners.add(cb);return()=>this.listeners.delete(cb);}
 emit(type,message='',extra={}){for(const cb of this.listeners)cb({type,message,...extra});}
 changed(type,message='',extra={}){this.dirty=true;this.save();this.emit(type,message,extra);return {ok:true,message,...extra};}
 fail(message){return {ok:false,message};}
 snapshot(){return {caught:this.state.stats.caught,xp:this.state.xp,money:this.state.money,missed:this.state.stats.missedBites,craft:this.state.stats.crafted,estate:this.state.estate.bank,fleet:this.state.fleetBank};}
 difference(before,seconds){return {seconds,processed:Math.min(seconds,this.offlineCap),catches:this.state.stats.caught-before.caught,missed:this.state.stats.missedBites-(before.missed||0),xp:this.state.xp-before.xp,money:cents(this.state.money-before.money),crafted:this.state.stats.crafted-before.craft,estate:cents(this.state.estate.bank-before.estate),fleet:cents(this.state.fleetBank-before.fleet)};}
 save(){try{if(!this.storage||!this.store.write(JSON.stringify(packSave(this.state)))){this.storageError=true;return false;}this.storageError=false;this.dirty=false;this.lastSave=this.now();return true;}catch{this.storageError=true;return false;}}
 sync(){this.advanceTo(this.now());}
 roll(){let x=this.state.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.state.seed=x>>>0;return (x>>>0)/4294967296;}
 addXp(amount){const old=this.level;this.state.xp+=Math.round(Math.max(0,amount)*(1+this.state.legacy.wisdom*.05));this.state.highestLevel=Math.max(this.state.highestLevel,this.level);if(this.level>old)this.pendingLevel=this.level;}
 earn(amount){amount=cents(amount);this.state.money=cents(this.state.money+amount);this.state.stats.earned=cents(this.state.stats.earned+amount);}
 log(message){this.state.recent.unshift({id:this.state.serial++,message,at:this.simNow});this.state.recent=this.state.recent.slice(0,30);}
 canWater(w){return !!w&&this.level>=w.level&&this.state.legacy.count>=(w.prestige||0);}
 rodPower(r){return ((gear[r.rod]?.power||1)*2+(gear[r.reel]?.power||1)*1.5+(gear[r.line]?.power||1)+(gear[r.terminal]?.power||1))/5.5;}
 rodInterval(r){const st=STYLES.find(s=>s.id===r.style);return st.interval/(1+Math.log2(this.rodPower(r))*.18+(this.state.upgrades.rodrest||0)*.035);}
 rodChance(r){const liquid=supplies[r.liquid]?.bonus||0,combo=COMBOS.find(c=>c.id===r.combo)?.bonus||0,rig=recipes[r.crafted]?.bonus||0;return clamp(.57+Math.log2(this.rodPower(r))*.045+liquid+combo+rig+this.state.legacy.instinct*.03+(this.state.upgrades.stealth||0)*.02,.15,.97);}
 recipeBonus(r){return recipes[r.crafted]?.bonus||0;}
 autoChance(r){return clamp(.68+(gear[r.indicator]?.auto||0)+(this.state.upgrades.autostrike||0)*.05+Math.log2(gear[r.reel]?.power||1)*.015,.1,.95);}
 manualChance(){return Math.min(.995,.97+(this.state.upgrades.landingnet||0)*.008);}
 manualXpMultiplier(perfect=false){return 1.15+(this.state.upgrades.landingnet||0)*.04+(perfect?.05:0);}
 biteWindow(r){return 6+(gear[r.indicator]?.window||0)+(this.state.upgrades.polaroid||0)*.8;}
 expectedRod(r,w){return forecastRod(this,r,w).auto;}
 forecast(l=this.loadout,w=this.water){return forecastLoadout(this,l,w);}
 setFishingMode(mode){this.sync();if(!['idle','active'].includes(mode))return this.fail('Deze vismodus bestaat niet.');this.state.settings.fishingMode=mode;if(this.state.session)this.state.session.mode=mode;return this.changed('angling','',{});}
 validRod(r){
  if(!r||!STYLES.some(s=>s.id===r.style)||gear[r.rod]?.style!==r.style)return 'Deze visstijl bestaat niet.';
  if((STYLES.find(s=>s.id===r.style).level||1)>this.level)return 'Zeevissen opent op level 120.';
  for(const slot of ['rod','reel','line','hook','terminal']){const i=gear[r[slot]];if(!i||i.category!==slot||(i.style!=='all'&&i.style!==r.style)||!(this.state.gear[i.id]>0)||i.level>this.level)return `Je bezit geen passende ${slot}.`;}
  if(r.indicator){const signal=gear[r.indicator];if(!signal||signal.category!=='indicator'||signal.style!==r.style||!this.state.gear[signal.id]||signal.level>this.level)return 'Je bezit geen passende, vrijgespeelde beetmelder.';}
  const bait=supplies[r.bait];if(!bait?.attracts||bait.level>this.level)return 'Dit aas is nog niet beschikbaar.';
  const c=COMBOS.find(c=>c.id===r.combo);if(!c||c.level>this.level)return 'Deze aascombinatie is nog niet vrijgespeeld.';
  if(c.requires&&!c.requires.includes(r.bait))return 'Kies voor deze cocktail een van de bijbehorende aassoorten.';
  if(r.liquid&&(!supplies[r.liquid]?.bonus||supplies[r.liquid].level>this.level))return 'Deze liquid is nog niet vrijgespeeld.';
  if(r.crafted&&(!recipes[r.crafted]||recipes[r.crafted].level>this.level))return 'Deze zelfgemaakte rig is nog niet beschikbaar.';
  return null;
 }
 validateRodSelection(l){
  if(!Array.isArray(l?.rods)||!l.rods.length||l.rods.length>this.selectionCapacity)return 'Kies opgeslagen hengels voor je gekochte hengelplaatsen.';
  const occupied=new Set(),used=new Set(),styles={};
  for(const [index,r]of l.rods.entries()){
   const slot=r?.slot??index;if(!Number.isInteger(slot)||slot<0||slot>=this.selectionCapacity||occupied.has(slot))return 'Kies voor elke hengel een unieke, gekochte hengelplaats.';occupied.add(slot);
   const p=r.sourcePresetId?this.state.rodPresets.find(p=>p.id===r.sourcePresetId):this.state.rodPresets.find(p=>p.assembled&&sameSetup(p.rod,r)&&!used.has(p.id));
   if(!p||!sameSetup(p.rod,r))return 'Bouw en bewaar deze hengel eerst voordat je hem voor een sessie kiest.';
   if(used.has(p.id))return 'Dezelfde fysieke hengel kan niet op twee plaatsen tegelijk staan.';used.add(p.id);
   const error=this.validRod(p.rod)||assemblyError(this.state,p);if(error)return error;
   styles[r.style]=(styles[r.style]||0)+1;if(styles[r.style]>STYLES.find(s=>s.id===r.style).cap)return `Maximaal ${STYLES.find(s=>s.id===r.style).cap} hengels voor ${r.style}.`;
  }
  const t=trainingQuote(this.level,l.rods);if(!t.allowed)return `Deze combinatie vraagt ${t.used} scholingspunten; je hebt ${t.capacity}. Beschikbaar vanaf level ${t.requiredLevel}.`;
  return null;
 }
 training(rods=this.loadout.rods){return trainingQuote(this.level,rods);}
 assemblyBusy(id){return !!this.state.session?.loadout.rods.some(r=>r.sourcePresetId===id);}
 rodItem(rod){const p=this.state.rodPresets.find(p=>p.id===rod.sourcePresetId);return this.state.tackleItems.find(i=>i.id===p?.items?.rod);}
 repairRod(itemId){this.sync();const q=repairQuote(this.state,itemId);if(!q||q.missing<=0)return this.fail('Deze hengel heeft geen reparatie nodig.');const owner=ownerOf(this.state,itemId);if(owner&&this.assemblyBusy(owner.id))return this.fail('Beëindig de sessie voordat je deze hengel repareert.');if(this.state.money<q.cost)return this.fail('Onvoldoende geld voor de reparatie.');this.state.money=cents(this.state.money-q.cost);q.item.condition=100;return this.changed('repair','Hengel gerepareerd.');}
 damageRod(index,amount){const s=this.state.session;if(!s)return false;const r=s.loadout.rods[index],rt=s.rods[index],item=this.rodItem(r);if(!item)return false;item.condition=Math.max(0,item.condition-amount);this.pendingEquipment=true;
  if(item.condition>0){this.log(`Hengel ${index+1}: beschadigd door overbelasting (${Math.round(item.condition)}%).`);return false;}
  rt.phase='broken';rt.candidate=null;rt.next=1e9;rt.lastOutcome='Hengel gebroken door overbelasting. Repareer hem na je sessie.';this.log(rt.lastOutcome);
  s.rates=this.supplyRates({rods:s.loadout.rods.filter((r,i)=>s.rods[i].phase!=='broken')});if(s.rods.every(r=>r.phase==='broken'))this.stopSession('Alle hengels zijn gebroken. Je vangsten blijven aan het water.');return true;
 }

 selectWater(id){this.sync();if(this.awaitingSettlement)return this.fail('Handel eerst alle vangsten van je sessie af voordat je het water verlaat.');if(!this.canWater(waters[id]))return this.fail('Dit water vraagt een hoger level of prestige.');this.state.selectedWater=id;return this.changed('plan');}
 setSessionRods(rods){
  this.sync();if(this.state.session)return this.fail('Je sessie loopt. Kies je volgende hengels zodra deze is afgelopen.');
  if(!Array.isArray(rods))return this.fail('Kies je hengels voor deze sessie.');
  const selection={rods:slotRods(clone(rods))},error=selection.rods.length?this.validateRodSelection(selection):null;
  if(error)return this.fail(error);
  const used=new Set();for(const r of selection.rods){const p=r.sourcePresetId?this.state.rodPresets.find(p=>p.id===r.sourcePresetId):this.state.rodPresets.find(p=>p.assembled&&sameSetup(p.rod,r)&&!used.has(p.id));r.sourcePresetId=p.id;used.add(p.id);}
  this.state.selectedRods=selection.rods;refreshSelectionReferences(this.state);return this.changed('plan');
 }
 sessionRodAvailability(slot,presetId){
  if(!Number.isInteger(slot)||slot<0||slot>=this.selectionCapacity)return this.fail('Deze hengelplaats is nog niet vrijgespeeld of gekocht.');
  const resolved=this.resolveRodPreset(presetId);if(!resolved.ok)return resolved;
  const rods=this.state.selectedRods.filter(r=>r.slot!==slot);rods.push({...resolved.rod,slot});
  const error=this.validateRodSelection({rods});return error?this.fail(error):{ok:true,rods:slotRods(rods)};
 }
 chooseSessionRod(slot,presetId){
  if(!Number.isInteger(slot)||slot<0||slot>=this.selectionCapacity)return this.fail('Deze hengelplaats is nog niet vrijgespeeld of gekocht.');
  if(!presetId){this.sync();if(this.state.session)return this.fail('Je sessie loopt. Kies je volgende hengels zodra deze is afgelopen.');this.state.selectedRods=this.state.selectedRods.filter(r=>r.slot!==slot);return this.changed('plan');}
  const choice=this.sessionRodAvailability(slot,presetId);return choice.ok?this.setSessionRods(choice.rods):choice;
 }
 setPlan(plan){this.sync();this.state.plan=normalizePlan(plan,this.state.plan);return this.changed('plan');}
 saveRodPreset(id,name,rod,requestedItems=null){this.sync();if(this.assemblyBusy(id))return this.fail('Deze hengel is in gebruik. Beëindig eerst je sessie.');const r=rodSnapshot(rod),error=this.validRod(r);if(error)return this.fail(error);const index=this.state.rodPresets.findIndex(p=>p.id===id);if(id&&index<0)return this.fail('Deze hengelsetup bestaat niet.');if(index<0&&this.state.rodPresets.length>=MAX_ROD_PRESETS)return this.fail('Je kunt maximaal 120 hengelsetups bewaren.');const allocation=assemblyItems(this.state,r,id,requestedItems);if(allocation.error)return this.fail(allocation.error);let presetId=id;if(!presetId)do{presetId=`rig_${this.state.serial++}`;}while(this.state.rodPresets.some(p=>p.id===presetId));const preset={id:presetId,name:String(name||'Mijn hengel').trim().slice(0,45)||'Mijn hengel',rod:r,items:allocation.items,assembled:true};if(index<0)this.state.rodPresets.push(preset);else this.state.rodPresets[index]=preset;refreshSelectionReferences(this.state);const cap=STYLES.find(st=>st.id===preset.rod.style).cap,overLimit=this.state.selectedRods.filter(r=>r.style===preset.rod.style).length>cap;
  if(overLimit)this.state.selectedRods=this.state.selectedRods.filter(r=>r.sourcePresetId!==preset.id);
  return this.changed('rigpreset',overLimit?'Hengel opgeslagen. Hij is uit je sessiekeuze gehaald omdat de stijlgrens is bereikt.':'Hengel gebouwd. De onderdelen zijn nu bezet.',{preset:clone(preset)});}
 deleteRodPreset(id){this.sync();if(this.assemblyBusy(id))return this.fail('Deze hengel is in gebruik. Beëindig eerst je sessie.');const index=this.state.rodPresets.findIndex(p=>p.id===id);if(index<0)return this.fail('Deze hengelsetup bestaat niet.');this.state.rodPresets.splice(index,1);this.state.selectedRods=this.state.selectedRods.filter(r=>r.sourcePresetId!==id);return this.changed('rigpreset','Hengel uit elkaar gehaald. Onderdelen zijn vrij en de hengel is uit je sessiekeuze verwijderd.');}
 resolveRodPreset(id){const preset=this.state.rodPresets.find(p=>p.id===id);if(!preset)return this.fail('Deze hengelsetup bestaat niet.');const error=this.validRod(preset.rod)||assemblyError(this.state,preset);return error?this.fail(error):{ok:true,rod:{...clone(preset.rod),sourcePresetId:id},preset:clone(preset)};}

 setWaterPanel(id,collapsed){if(!['catches','planner','activity'].includes(id))return this.fail('Deze instelling bestaat niet.');this.state.settings.waterPanels??={};this.state.settings.waterPanels[id]=collapsed===true;return this.changed('water-panel');}
 setLanguage(code){this.sync();if(!['en','nl'].includes(code))return this.fail('Deze taal bestaat niet.');this.state.settings.language=code;return this.changed('language');}
 buySlot(){this.sync();const n=this.state.rodSlots;if(n>=6)return this.fail('Alle zes hengelplaatsen zijn vrij.');if(this.level<SLOT_LEVELS[n])return this.fail(`De volgende hengelplaats vraagt level ${SLOT_LEVELS[n]}.`);if(this.state.money<SLOT_COSTS[n])return this.fail('Je hebt onvoldoende euro voor deze hengelplaats.');this.state.money-=SLOT_COSTS[n];this.state.rodSlots++;return this.changed('upgrade',`Hengelplaats ${n+1} gekocht! Kies je hengels in de sessieplanner.`);}
 buyGear(id,quantity=1){this.sync();const i=gear[id];quantity=clamp(Math.floor(numeric(quantity,1)),1,6);if(!i||i.level>this.level)return this.fail('Dit materiaal is nog niet vrijgespeeld.');const cost=i.price*quantity;if(cost>this.state.money)return this.fail('Je hebt onvoldoende euro.');this.state.money=cents(this.state.money-cost);addTackle(this.state,id,quantity,false);return this.changed('purchase',`${quantity}× ${i.name} gekocht.`);}

 buySupply(id,quantity){this.sync();const i=supplies[id];quantity=clamp(Math.ceil(numeric(quantity,0)),1,10000000);if(!i||i.level>this.level)return this.fail('Deze voorraad is nog niet beschikbaar.');const cost=cents(i.price*quantity);if(cost>this.state.money)return this.fail('Je hebt onvoldoende euro voor deze voorraad.');this.state.money=cents(this.state.money-cost);this.state.stock[id]=(this.state.stock[id]||0)+quantity;return this.changed('purchase',`${quantity} ${i.unit} ${i.name} gekocht.`);}
 supplyRates(l=this.loadout){const rates={};const add=(id,rate)=>rates[id]=(rates[id]||0)+rate;for(const r of l.rods){const st=STYLES.find(s=>s.id===r.style);add('feed',st.feed);add(r.bait,st.bait);const combo=COMBOS.find(c=>c.id===r.combo);if(combo?.requires){const other=combo.requires.find(id=>id!==r.bait);if(other)add(other,st.bait*.6);}if(r.liquid)add(r.liquid,.5);}return rates;}
 quote({waterId=this.state.selectedWater,loadout=this.loadout,plan=this.state.plan}={}){
  plan=normalizePlan(plan,this.state.plan);const w=waters[waterId],now=this.now(),error=this.validateRodSelection(loadout);if(!w)return {valid:false,error:'Kies een water.'};
  const rates=this.supplyRates(loadout),required={},missing={},costs={};for(const[id,rate]of Object.entries(rates)){required[id]=Math.ceil(rate*plan.duration/60*(1+plan.reserve)-1e-9);missing[id]=Math.max(0,Math.ceil(required[id]-(this.state.stock[id]||0)-1e-9));costs[id]=cents(missing[id]*supplies[id].price);}
  const rigNeeds={}; // Crafted leaders are now reserved parts of the assembled rod.
  const rigError=Object.entries(rigNeeds).find(([id,n])=>(this.state.crafted[id]||0)<n);
  const end=now+plan.duration*1000,expiry=this.state.permits[waterId]||0,hasLicense=expiry>=end;
  const licenseCost=hasLicense?0:permitCost(w,plan.duration);
  const newExpiry=hasLicense?expiry:Math.max(now,expiry)+plan.duration*1000;
  const ownBoat=this.state.fleet.find(b=>b.mode==='port');
  const charter=w.sea&&!ownBoat?charterCost(w,plan.duration):0;
  const suppliesCost=cents(Object.values(costs).reduce((a,b)=>a+b,0)),total=cents(licenseCost+suppliesCost+charter);
  const badStyle=loadout.rods.some(r=>w.sea?r.style!=='zee':r.style==='zee');
  const forecasts=loadout.rods.map(r=>this.expectedRod(r,w));
  const catchesHour=forecasts.reduce((n,f)=>n+f.catches,0),xpHour=forecasts.reduce((n,f)=>n+f.xp,0);
  const expectedGross=cents(forecasts.reduce((n,f)=>n+f.value,0)*plan.duration/3600),consumablesCost=cents(Object.entries(rates).reduce((n,[id,rate])=>n+rate*plan.duration/60*supplies[id].price,0)),expectedNet=cents(expectedGross-consumablesCost-licenseCost-charter);
  const netSpace=this.capacity-this.state.net.length;
  let reason=this.store.blocked?'Je opslag is beschermd. Laad je geldige voortgang voordat je verder speelt.':this.awaitingSettlement?'Kies eerst voor al je vangsten: verkopen, terugzetten voor XP of naar je eigen viswater.':error||(!this.canWater(w)?`Dit water vraagt level ${w.level}${w.prestige?' en prestige '+w.prestige:''}.`:badStyle?'Kies zeehengels voor zee en zoetwaterhengels voor binnenwater.':catchesHour<.1?'Je haken of lijnen passen niet bij de vissen in dit water. Kies je hengels in de sessieplanner.':rigError?`Maak of koop voldoende ${recipes[rigError[0]].name}.`:netSpace<1&&!this.state.settings.autosell?'Je leefnet is vol. Verkoop of zet vangsten uit.':null);
  return {valid:!reason,error:reason,duration:plan.duration,licenseDuration:plan.duration,sessionCap:SESSION_CAP,offlineSeconds:Math.min(plan.duration,this.offlineCap),offlineLimited:plan.duration>this.offlineCap,expectedGross,consumablesCost,expectedNet,expectedNetHour:cents(expectedNet/plan.duration*3600),rates,required,missing,costs,rigNeeds,hasLicense,licenseCost,licenseExpiry:newExpiry,charter,ownBoat:ownBoat?.id,suppliesCost,total,affordable:total<=this.state.money,catchesHour:Math.round(catchesHour),xpHour:Math.round(xpHour),netSpace};
 }
 buyLicense(){this.sync();const w=this.water,p=normalizePlan(this.state.plan);if(!this.canWater(w))return this.fail('Dit water is nog niet beschikbaar.');const cost=permitCost(w,p.duration);if(cost>this.state.money)return this.fail('Onvoldoende euro voor de vispas.');this.state.money-=cost;this.state.permits[w.id]=Math.max(this.now(),this.state.permits[w.id]||0)+p.duration*1000;this.state.stats.permits++;return this.changed('license',`Vispas voor ${w.name} verlengd.`);}
 buyMissing(){this.sync();const q=this.quote();if(q.suppliesCost>this.state.money)return this.fail('Onvoldoende euro voor de ontbrekende voorraad.');this.state.money=cents(this.state.money-q.suppliesCost);for(const[id,n]of Object.entries(q.missing))this.state.stock[id]=(this.state.stock[id]||0)+n;return this.changed('purchase','De berekende voorraad is aangevuld.');}
 startSession(){
  this.sync();if(this.awaitingSettlement)return this.fail('Handel eerst alle vangsten af. Je kunt geen vissen meenemen naar een nieuwe sessie.');if(this.state.session)return this.fail('Stop eerst je huidige sessie.');const q=this.quote();if(!q.valid)return this.fail(q.error);if(!q.affordable)return this.fail('Onvoldoende euro voor voorraad, vispas en eventuele charter.');
  this.state.money=cents(this.state.money-q.total);for(const[id,n]of Object.entries(q.missing))this.state.stock[id]=(this.state.stock[id]||0)+n;for(const[id,n]of Object.entries(q.rigNeeds))this.state.crafted[id]-=n;
  if(!q.hasLicense){this.state.permits[this.water.id]=q.licenseExpiry;this.state.stats.permits++;}
  this.state.session={id:this.state.serial++,fish:[],water:this.water.id,loadout:clone(this.loadout),duration:q.duration,remaining:q.duration,startedAt:this.now(),rates:q.rates,rods:this.loadout.rods.map(r=>({phase:'waiting',next:this.rodInterval(r)*(.6+this.roll()*.6),total:this.rodInterval(r)*1.2,rolls:0,caught:0,signalId:0,candidate:null})),mode:this.state.settings.fishingMode,bites:0,manualCaught:0,autoCaught:0,missedBites:0,rescuedBites:0,autoMisses:0,earlyStrikes:0,caught:0,weight:0,xp:0,value:0,cost:q.total,boat:q.ownBoat||null,charter:q.charter,reason:null};
  this.log(`Sessie gestart bij ${this.water.name}.`);return this.changed('session','Je lijnen liggen in het water. Je kunt de game sluiten; de sessie loopt door.');
 }
 stopSession(reason='Je hebt de sessie beëindigd.'){
  const s=this.state.session;if(!s)return this.fail('Er loopt geen sessie.');closeJournal(this,s,reason);this.state.lastSession={water:s.water,caught:s.caught,weight:s.weight,xp:s.xp,value:s.value,seconds:s.duration-s.remaining,reason,at:this.simNow,manualCaught:s.manualCaught||0,autoCaught:s.autoCaught||0,missedBites:s.missedBites||0,rescuedBites:s.rescuedBites||0};this.state.session=null;this.log(reason);this.dirty=true;return {ok:true,message:reason};
 }
 stop(){this.sync();const r=this.stopSession();if(!r.ok)return r;return this.changed('session',r.message);}
 interact(){this.sync();const s=this.state.session;if(this.now()-this.state.clickAt<600)return this.fail('Geef de stek heel even rust.');if(this.state.focus<1)return this.fail('Je aandacht herstelt vanzelf, één punt per 10 seconden.');this.state.focus-=1;this.state.clickAt=this.now();this.state.stats.clicks++;if(!s){this.earn(.1);return this.changed('click','Je ruimt de stek op voor de visclub. +€ 0,10.');}const waiting=s.rods.filter(r=>(r.phase||'waiting')==='waiting');if(!waiting.length){this.state.focus=Math.min(this.maxFocus,this.state.focus+1);return this.fail('Er is al activiteit op alle lijnen. Kijk naar de beet en sla aan!');}const next=waiting.reduce((a,b)=>a.next<b.next?a:b);next.next=Math.max(.05,next.next-2.5);return this.changed('click','Je verzorgt de stek. De volgende worp komt dichterbij.');}
 scheduleRod(index,factor=1){const s=this.state.session;if(!s)return;const rt=s.rods[index],r=s.loadout.rods[index];rt.phase='waiting';rt.candidate=null;rt.biteStartedAt=0;rt.deadline=0;rt.next=this.rodInterval(r)*(.75+this.roll()*.5)*factor;rt.total=rt.next;rt.nextFactor=1;}
 signalPhase(rt,phase,seconds){rt.phase=phase;rt.next=Math.max(.001,seconds);rt.total=rt.next;}
 missRod(index,reason,kind='missed'){
  const s=this.state.session;if(!s)return;const rt=s.rods[index];
  if(rt.candidate){this.state.stats.missedBites++;s.missedBites=(s.missedBites||0)+1;rt.missed=(rt.missed||0)+1;}
  this.state.lastMiss=reason;rt.lastOutcome=reason;rt.candidate=null;this.signalPhase(rt,kind,1.4);rt.nextFactor=1;
 }
 catchAttempt(index){
  const s=this.state.session;if(!s)return;const r=s.loadout.rods[index],rt=s.rods[index],w=waters[s.water],phase=rt.phase||'waiting';
  if(['landed','missed','recovering'].includes(phase)){this.scheduleRod(index,rt.nextFactor||1);return;}
  if(phase==='nibble'){
   if(!rt.candidate){rt.lastOutcome='Een kort tikje, geen doorzettende beet.';this.scheduleRod(index);return;}
   if(rt.candidate.weight>rodRating(r)&&gear[r.line].strength>=rodRating(r)&&this.roll()<Math.min(.7,.2+rt.candidate.weight/rodRating(r)*.08)){if(this.damageRod(index,30+Math.floor(this.roll()*31)))return;}
   rt.biteStartedAt=this.simNow;rt.deadline=this.simNow+this.biteWindow(r)*1000;this.signalPhase(rt,'bite',3.2);this.state.stats.bites++;s.bites=(s.bites||0)+1;return;
  }
  if(phase==='bite'){
   if(!rt.candidate?.eligible){this.missRod(index,rt.candidate?.reason||'De vis liet los.');return;}
   if(rt.candidate.autoRoll<this.autoChance(r)){this.landCandidate(index,false);return;}
   this.state.stats.autoMisses++;s.autoMisses=(s.autoMisses||0)+1;rt.lastOutcome='De assistent mist de aanslag. Je kunt deze beet nog redden!';this.signalPhase(rt,'rescue',(rt.deadline-this.simNow)/1000);return;
  }
  if(phase==='rescue'){this.missRod(index,'Te laat: de vis liet het aas los.');return;}
  if(phase==='broken'){rt.next=1e9;return;}
  const risk=rodRisk(r);if(risk.chance>0&&this.roll()<risk.chance){if(this.damageRod(index,20+Math.floor(this.roll()*21)))return;}
  rt.rolls++;rt.lastOutcome='';rt.signalId=this.state.serial++;
  if(this.roll()>this.rodChance(r)){
   if(this.roll()<.22){rt.candidate=null;this.signalPhase(rt,'nibble',1.1);}else this.scheduleRod(index);return;
  }
  const pool=encounterPool(r,w).filter(entry=>entry.weight>0);if(!pool.length){this.scheduleRod(index);return;}
  let pick=this.roll()*pool.reduce((n,entry)=>n+entry.weight,0),entry=pool[0];for(const current of pool){pick-=current.weight;if(pick<=0){entry=current;break;}}
  const f=entry.fish,size=Math.pow(this.roll(),1.6),weight=Math.round((f.min+(entry.waterMax-f.min)*size)*100)/100;
  const reason=weight<entry.hookMin?'De haak was te groot voor deze vis.':weight>entry.hookMax?'De vis was te groot voor deze haak.':weight>entry.strength?'De lijn en hengel waren niet sterk genoeg voor deze vis.':null;
  rt.candidate={id:`fish_${this.state.serial++}`,species:f.id,name:f.name,weight,value:fishSaleValue(weight,f.value,this.state.legacy.market),xp:isCrayfish(f)?2:Math.round((f.xp+weight*2)*w.xp),water:w.id,trophy:!isCrayfish(f)&&weight>=f.min+(f.max-f.min)*.85,eligible:!reason,reason,encounter:entry.kind,story:encounterStory(entry),autoRoll:this.roll(),manualRoll:this.roll()};
  this.signalPhase(rt,'nibble',1.1);
 }
 strike(index){
  this.sync();const s=this.state.session;index=Number(index);if(!s||!Number.isInteger(index)||!s.rods[index])return this.fail('Kies een hengel in je lopende sessie.');
  if(this.now()-(this.lastStrikeAt||0)<250)return this.fail('Laat de hengel even tot rust komen.');this.lastStrikeAt=this.now();
  const rt=s.rods[index];
  if(!['bite','rescue'].includes(rt.phase)){
   if(['waiting','nibble'].includes(rt.phase)){this.state.stats.earlyStrikes++;s.earlyStrikes=(s.earlyStrikes||0)+1;this.missRod(index,'Te vroeg aangeslagen. Wacht op doorbuigen, een run of een duikende dobber.','recovering');return this.changed('angling',rt.lastOutcome,{index,early:true});}
   return this.fail('Deze hengel heeft nu geen beet om aan te slaan.');
  }
  const rescued=rt.phase==='rescue',reaction=Math.max(0,(this.now()-rt.biteStartedAt)/1000);
  if(!rt.candidate?.eligible){this.missRod(index,rt.candidate?.reason||'De vis liet los.');return this.changed('angling',rt.lastOutcome,{index});}
  if(rt.candidate.manualRoll>=this.manualChance()){this.missRod(index,'Goed gereageerd, maar de vis schoot los bij het landen.');return this.changed('angling',rt.lastOutcome,{index});}
  const landed=this.landCandidate(index,true,reaction,rescued);if(landed){this.lastCatchEvent=null;this.emit('catch','',{fish:landed});}
  return this.changed('angling',landed?`${rescued?'Beet gered! ':reaction<=1.2?'Perfect aangeslagen! ':'Vis gehaakt! '}${landed.name}, ${landed.weight.toFixed(2).replace('.',',')} kg.`:rt.lastOutcome,{index,fish:landed});
 }
 landCandidate(index,manual,reaction=0,rescued=false){
  const s=this.state.session;if(!s)return null;const rt=s.rods[index],r=s.loadout.rods[index],candidate=rt.candidate;if(!candidate)return null;
  if(this.state.net.length>=this.capacity&&!this.state.settings.autosell){this.stopSession('Leefnet vol: sessie gestopt.');return null;}
  const record=this.state.records[candidate.species]||{count:0,best:0},perfect=manual&&reaction<=1.2;
  const f={id:candidate.id,species:candidate.species,name:candidate.name,weight:candidate.weight,value:candidate.value,xp:Math.round(candidate.xp*(manual?this.manualXpMultiplier(perfect):1)),water:candidate.water,trophy:candidate.trophy,best:candidate.weight>record.best,at:this.simNow,method:manual?'manual':'auto',reaction:manual?reaction:null,rescued};
  record.count++;record.best=Math.max(record.best,f.weight);this.state.records[f.species]=record;this.state.stats.caught++;this.state.stats.bestWeight=Math.max(this.state.stats.bestWeight,f.weight);const beforeXp=this.state.xp;this.addXp(f.xp);rt.caught++;s.caught++;s.weight+=f.weight;s.xp+=this.state.xp-beforeXp;s.value=cents(s.value+f.value);
  if(manual){this.state.stats.manualCaught++;s.manualCaught=(s.manualCaught||0)+1;this.state.stats.reactionSeconds+=reaction;if(rescued){this.state.stats.rescuedBites++;s.rescuedBites=(s.rescuedBites||0)+1;}if(perfect)this.state.stats.perfectStrikes++;}else{this.state.stats.autoCaught++;s.autoCaught=(s.autoCaught||0)+1;}
  let disposition=0;if(this.state.settings.autosell&&(!f.trophy||!this.state.settings.keepTrophies)){this.earn(f.value);this.state.stats.sold++;disposition=5;}else if(this.state.net.length<this.capacity)this.state.net.push(f);else{disposition=4;this.state.stats.released++;}
  recordCatch(this,s,f,disposition);if(disposition===4)this.stopSession('Vangstopslag vol met beschermde trofeeën: laatste vis teruggezet, sessie gestopt.');
  this.state.lastCatch=f;const contest=this.state.tournament;if(contest&&contest.water===f.water&&!isCrayfish(species[f.species])){contest.score+=f.weight;contest.catches++;}
  if(f.best)this.log(`${f.name}: nieuw record van ${f.weight.toFixed(2).replace('.',',')} kg.`);
  rt.lastOutcome=manual?(rescued?'Beet gered — handmatig geland.':perfect?'Perfect aangeslagen — bonus-XP!':'Zelf aangeslagen — bonus-XP!'):'Automatisch aangeslagen en geland.';
  if(candidate.story)rt.lastOutcome+=' '+candidate.story;
  rt.candidate=null;this.signalPhase(rt,'landed',1.4);rt.nextFactor=manual?(this.state.settings.fishingMode==='active'?.65:.82):1;
  this.lastCatchEvent=f;this.dirty=true;return f;
 }
 sellFish(id){this.sync();const selected=id?this.state.net.filter(f=>f.id===id):this.state.net.filter(f=>!f.trophy||!this.state.settings.keepTrophies);if(!selected.length)return this.fail('Geen verkoopbare vissen. Beschermde trofeeën blijven in je leefnet.');const ids=new Set(selected.map(f=>f.id));const value=selected.reduce((n,f)=>n+f.value,0);for(const f of selected)markDisposition(this,f.id,1);this.state.net=this.state.net.filter(f=>!ids.has(f.id));this.earn(value);this.state.stats.sold+=selected.length;return this.changed('sale',`${selected.length} vangsten verkocht voor € ${value.toLocaleString('nl-NL')}.`);}
 releaseFish(id){this.sync();const f=this.state.net.find(f=>f.id===id);if(!f)return this.fail('Deze vis zit niet in je leefnet.');markDisposition(this,id,4);this.state.net=this.state.net.filter(x=>x.id!==id);this.state.stats.released++;this.addXp(releaseBonus(f));return this.changed('release',isCrayfish(species[f.species])?'Rivierkreeft teruggezet. Je ontvangt 1 basis-XP.':'Vis teruggezet. Je ontvangt 20% bonus-XP.');}
 buyUpgrade(id){this.sync();const u=UPGRADES.find(x=>x.id===id),n=this.state.upgrades[id]||0;if(!u||this.level<u.level||n>=u.max)return this.fail('Deze upgrade is nog niet beschikbaar of al maximaal.');const cost=Math.round(u.base*Math.pow(4,n));if(cost>this.state.money)return this.fail('Onvoldoende euro voor deze upgrade.');this.state.money-=cost;this.state.upgrades[id]=n+1;if(id==='autosell')this.state.settings.autosell=true;return this.changed('upgrade',`${u.name} verbeterd.`);}
 setSetting(id,value){this.sync();if(!['autosell','keepTrophies','reducedMotion','audio'].includes(id))return this.fail('Deze instelling bestaat niet.');if(id==='autosell'&&!this.state.upgrades.autosell)return this.fail('Koop eerst de automatische vismarkt.');this.state.settings[id]=!!value;return this.changed('settings');}
 craftQuote(id,quantity){const r=recipes[id];quantity=clamp(Math.floor(numeric(quantity,1)),1,this.maxBatch);if(!r)return null;const missing={},cost=Object.entries(r.cost).reduce((total,[id,n])=>{missing[id]=Math.max(0,Math.ceil(n*quantity-(this.state.stock[id]||0)));return total+cents(missing[id]*supplies[id].price);},0);return {recipe:r,quantity,missing,cost:cents(cost),seconds:r.seconds*quantity/(1+this.craftLevel*.008),sell:r.value*quantity};}
 startCraft(id,quantity){this.sync();if(this.state.craftJob)return this.fail('De werkbank is nog bezig.');const q=this.craftQuote(id,quantity);if(!q||this.level<q.recipe.level||this.craftLevel<q.recipe.skill)return this.fail('Je vislevel of rigbouwvaardigheid is nog te laag.');if(q.cost>this.state.money)return this.fail('Onvoldoende euro voor de ontbrekende materialen.');this.state.money-=q.cost;for(const [id,n]of Object.entries(q.missing))this.state.stock[id]=(this.state.stock[id]||0)+n;for(const[id,n]of Object.entries(q.recipe.cost))this.state.stock[id]-=n*q.quantity;this.state.craftJob={recipe:id,quantity:q.quantity,remaining:q.seconds,duration:q.seconds};return this.changed('craft','De werkbank is gestart. Je kunt ondertussen vissen.');}
 finishCraft(){const j=this.state.craftJob,r=recipes[j.recipe];this.state.crafted[r.id]=(this.state.crafted[r.id]||0)+j.quantity;this.state.craftXp+=r.xp*j.quantity;this.state.stats.crafted+=j.quantity;this.state.craftJob=null;this.log(`${j.quantity}× ${r.name} voltooid.`);this.dirty=true;}
 sellRigs(id,quantity){this.sync();const r=recipes[id],reserved=this.state.rodPresets.filter(p=>p.assembled&&p.rod.crafted===id).length,n=Math.min(Math.max(0,(this.state.crafted[id]||0)-reserved),Math.max(1,Math.floor(numeric(quantity,1))));if(!r||!n)return this.fail('Er liggen geen rigs klaar om te verkopen.');this.state.crafted[id]-=n;this.earn(n*r.value);return this.changed('sale',`${n} rigs verkocht voor € ${n*r.value}.`);}
 enterContest(id){this.sync();if(this.awaitingSettlement)return this.fail('Handel eerst al je vangsten af voordat je naar een wedstrijd gaat.');if(this.state.tournament)return this.fail('Je doet al mee aan een wedstrijd.');const t=TOURNAMENTS.find(x=>x.id===id);if(!t||this.level<t.level)return this.fail('Deze wedstrijd is nog niet vrijgespeeld.');if(this.state.money<t.fee)return this.fail('Onvoldoende euro voor het inschrijfgeld.');this.state.money-=t.fee;this.state.tournament={...clone(t),remaining:t.seconds,score:0,catches:0,startedAt:this.now(),opponents:['Mila van Dijk','Jules Laurent','Finn Weber','Luca de Vries','Noor Visser'].map((name,i)=>({name,goal:t.target*(.55+i*.2)*(.85+this.roll()*.3)}))};this.state.selectedWater=t.water;return this.changed('contest',`Ingeschreven. Start een sessie bij ${waters[t.water].name} om gewicht te scoren.`);}
 contestBoard(){const t=this.state.tournament;if(!t)return [];const progress=1-t.remaining/t.seconds;return [...t.opponents.map(p=>({name:p.name,score:p.goal*progress})),{name:'Jij',score:t.score,you:true}].sort((a,b)=>b.score-a.score);}
 finishContest(){const t=this.state.tournament,rank=1+t.opponents.filter(p=>p.goal>t.score).length,prize=t.catches>0?(t.prizes[rank-1]||0):0;this.state.contestResults.unshift({id:this.state.serial++,name:t.name,rank,score:t.score,prize,claimed:false,at:this.simNow});this.state.contestResults=this.state.contestResults.slice(0,20);this.state.stats.contests++;if(rank===1&&t.catches>0)this.state.stats.wins++;this.state.tournament=null;this.log(`${t.name} afgelopen: plaats ${rank}.`);this.dirty=true;}
 claimContest(id){this.sync();const r=this.state.contestResults.find(r=>String(r.id)===String(id));if(!r||r.claimed)return this.fail('Deze uitslag is al verwerkt.');r.claimed=true;this.earn(r.prize);return this.changed('prize',r.prize?`Wedstrijdprijs ontvangen: € ${r.prize.toLocaleString('nl-NL')}.`:'Uitslag opgeslagen. Volgende keer een nieuwe kans.');}
 buyEstate(){this.sync();if(this.level<80)return this.fail('Een eigen viswater opent op level 80.');if(this.state.estate.owned)return this.fail('Je bezit al een viswater.');if(this.state.money<ESTATE_PRICE)return this.fail('Je hebt € 25.000 nodig voor je eigen viswater.');this.state.money-=ESTATE_PRICE;this.state.estate.owned=true;return this.changed('estate','Je eigen viswater is geopend. Zet zoetwatervissen uit om bezoekers aan te trekken.');}
 renameEstate(name){this.state.estate.name=String(name||'Mijn Oever').trim().slice(0,35);return this.changed('estate');}
 stockFish(id){this.sync();const e=this.state.estate,f=this.state.net.find(f=>f.id===id);if(!e.owned)return this.fail('Koop eerst je eigen viswater.');if(!f)return this.fail('Deze vis zit niet in je leefnet.');if(!canStockSpecies(species[f.species]))return this.fail('Alleen zoetwatervissen kunnen naar je vijver; rivierkreeften en zeevis niet.');if(this.estatePopulation>=this.estateCapacity)return this.fail('Je viswater zit vol. Breid het eerst uit.');let pop=e.fish.find(p=>p.species===f.species);if(!pop){pop={species:f.species,count:0,best:0};e.fish.push(pop);}pop.count++;pop.best=Math.max(pop.best,f.weight);markDisposition(this,id,3);this.state.net=this.state.net.filter(x=>x.id!==id);return this.changed('estate',`${f.name} uitgezet. Vanaf twee vissen van dezelfde soort groeit die populatie elke zes uur.`);}
 upgradeEstate(){this.sync();const e=this.state.estate;if(!e.owned||e.level>=5)return this.fail('Je viswater is nog niet gekocht of al maximaal.');if(e.level>=3&&(!this.state.legacy.count||this.level<180))return this.fail('De laatste uitbreidingen vragen prestige 1 en level 180.');const cost=Math.round(ESTATE_UPGRADE_BASE*Math.pow(3.2,e.level-1));if(this.state.money<cost)return this.fail('Onvoldoende euro voor de uitbreiding.');this.state.money-=cost;e.level++;return this.changed('estate','Je viswater is uitgebreid. Meer ruimte en hogere netto bezoekersinkomsten.');}
 collectEstate(){this.sync();const e=this.state.estate;if(e.bank<.01)return this.fail('Er is nog geen bezoekersinkomen om te innen.');const value=e.bank;e.bank=0;this.earn(value);return this.changed('income',`€ ${value.toFixed(2)} bezoekersinkomen ontvangen.`);}
 buyBoat(id){this.sync();const b=boats[id];if(!b||this.level<b.level||this.state.legacy.count<(b.prestige||0))return this.fail('Deze boot is nog niet vrijgespeeld.');if(this.state.fleet.length>=10)return this.fail('Je vloot kan maximaal tien boten bevatten.');if(this.state.money<b.price)return this.fail('Onvoldoende euro voor deze boot.');this.state.money-=b.price;this.state.fleet.push({id:`boat_${this.state.serial++}`,type:id,mode:'port',remaining:0,duration:0});return this.changed('fleet',`${b.name} toegevoegd aan je vloot.`);}
 assignBoat(id,mode){this.sync();const b=this.state.fleet.find(b=>b.id===id);if(!b||!['port','rental','fishing'].includes(mode))return this.fail('Deze boot of opdracht bestaat niet.');if(this.state.session?.boat===id)return this.fail('Deze boot wordt gebruikt voor je lopende vissessie.');if(b.mode==='fishing'&&b.remaining>0)return this.fail('De boot is onderweg en keert na de visreis terug.');if(mode==='fishing'){const t=boats[b.type];if(this.state.money<t.fuel)return this.fail('Onvoldoende euro voor brandstof en bemanning.');this.state.money-=t.fuel;b.remaining=t.trip;b.duration=t.trip;}b.mode=mode;return this.changed('fleet',mode==='rental'?'De boot verdient nu netto charterinkomsten.':mode==='fishing'?'De bemanning is op visreis. De opbrengst komt in je vlootkas.':'De boot ligt weer in de haven.');}
 collectFleet(){this.sync();const n=this.state.fleetBank;if(n<.01)return this.fail('Er ligt nog geen opbrengst in de vlootkas.');this.state.fleetBank=0;this.earn(n);return this.changed('income',`€ ${n.toLocaleString('nl-NL')} uit de vlootkas ontvangen.`);}
 prestigeQuote(){return {allowed:this.level>=100&&!this.awaitingSettlement&&!this.state.session&&!this.state.craftJob&&!this.state.tournament&&!this.state.fleet.some(b=>b.mode==='fishing'),points:Math.floor(this.level/50)};}
 prestige(){this.sync();if(this.awaitingSettlement)return this.fail('Handel eerst alle vangsten af voordat je een nieuw seizoen begint.');const q=this.prestigeQuote();if(!q.allowed)return this.fail('Prestige vraagt level 100. Rond actieve sessies, wedstrijden, werkopdrachten en visreizen eerst af.');const old=this.state,fresh=migrateTackle(initial(this.now()),{});for(const k of ['records','stats','estate','fleet','fleetBank','legacy','craftXp','highestLevel','sessions','net','catchChoices'])fresh[k]=clone(old[k]);for(const k of ['language','audio','reducedMotion','fishingMode','keepTrophies','waterPanels'])fresh.settings[k]=old.settings[k];fresh.legacy.count++;fresh.legacy.points+=q.points;fresh.legacy.earned+=q.points;fresh.stats.prestiges++;fresh.estate.bank=cents(fresh.estate.bank);fresh.seed=old.seed;fresh.serial=Math.max(fresh.serial,old.serial);for(const p of old.rodPresets){if(fresh.rodPresets.some(n=>n.id===p.id&&sameSetup(n.rod,p.rod)))continue;const id=fresh.rodPresets.some(n=>n.id===p.id)?'rig_'+fresh.serial++:p.id;fresh.rodPresets.push({...clone(p),id,assembled:false,items:{}});}fresh.rodPresets=fresh.rodPresets.slice(0,MAX_ROD_PRESETS);this.state=fresh;this.log(`Een nieuw seizoen. ${q.points} prestigepunten verdiend.`);return this.changed('prestige','Een nieuw seizoen begint. Je eigendommen, soortenboek en rigbouwkennis blijven behouden.');}
 spendPrestige(id){this.sync();if(!['wisdom','instinct','market'].includes(id)||this.state.legacy.points<1)return this.fail('Je hebt geen beschikbaar prestigepunt.');this.state.legacy.points--;this.state.legacy[id]++;return this.changed('prestige','Blijvende kennis verbeterd.');}
 processPassive(dt){
  const s=this.state;s.stats.playSeconds+=dt;s.focusClock+=dt;const earned=Math.floor(s.focusClock/10);if(earned){s.focus=Math.min(this.maxFocus,s.focus+earned);s.focusClock%=10;}
  const e=s.estate;if(e.owned){e.bank+=this.estateIncome*dt/3600;if(this.estatePopulation)e.visitors+=dt/3600*(3+e.level*2+e.fish.length);e.breedProgress+=dt;
   if(e.breedProgress>=21600){const cycles=Math.floor(e.breedProgress/21600);e.breedProgress%=21600;for(let n=0;n<cycles;n++)for(const p of e.fish)if(p.count>=2&&this.estatePopulation<this.estateCapacity){p.count++;e.born++;}}}
  for(const b of s.fleet){const t=boats[b.type];if(b.mode==='rental')s.fleetBank+=t.income*dt/3600;if(b.mode==='fishing'){b.remaining-=dt;if(b.remaining<=.0001){const value=Math.round(t.fishValue*(.85+this.roll()*.3));s.fleetBank+=value;this.addXp(t.xp);b.mode='port';b.remaining=0;this.log(`${t.name} terug: € ${value.toLocaleString('nl-NL')} vangstopbrengst.`);}}}
 }
 advanceTo(now){
  if(this.store?.blocked)return;
  if(!Number.isFinite(now)||now<=this.state.lastAt)return;
  const start=this.state.lastAt,diff=(now-start)/1000,seconds=Math.min(diff,this.offlineCap);let left=seconds;this.simNow=start;const beforeCaught=this.state.stats.caught;let loops=0;
  // Six fast rods over a full week require well over the former 200,000 events.
  const maxLoops=Math.max(200000,Math.ceil(seconds)*Math.max(1,this.state.session?.rods.length||0)*4+1000);
  while(left>.00001&&loops++<maxLoops){
   let step=Math.min(left,3600);const s=this.state.session;
   if(s){step=Math.min(step,s.remaining,Math.max(0,((this.state.permits[s.water]||0)-this.simNow)/1000),...s.rods.map(r=>r.next));for(const[id,rate]of Object.entries(s.rates))if(rate>0)step=Math.min(step,Math.max(0,this.state.stock[id]||0)/rate*60);}
   if(this.state.craftJob)step=Math.min(step,this.state.craftJob.remaining);
   if(this.state.tournament)step=Math.min(step,this.state.tournament.remaining);
   for(const b of this.state.fleet)if(b.mode==='fishing')step=Math.min(step,b.remaining);
   if(step<=.000001){
    if(s){if(s.remaining<=.0001)this.stopSession('Je geplande sessie is afgelopen.');else if((this.state.permits[s.water]||0)<=this.simNow+.1)this.stopSession('Je vispas is verlopen.');else if(Object.entries(s.rates).some(([id,rate])=>rate>0&&(this.state.stock[id]||0)<.00001))this.stopSession('Je aas of voer is op. De sessie is gestopt.');else for(let i=0;i<s.rods.length;i++)if(s.rods[i].next<=.0001&&this.state.session){this.catchAttempt(i);}}
    if(this.state.craftJob?.remaining<=.0001)this.finishCraft();if(this.state.tournament?.remaining<=.0001)this.finishContest();
    for(const b of this.state.fleet)if(b.mode==='fishing'&&b.remaining<=.0001)this.processPassive(.00001);
    continue;
   }
   this.processPassive(step);if(s&&this.state.session){s.remaining-=step;for(const[id,rate]of Object.entries(s.rates))this.state.stock[id]=Math.max(0,(this.state.stock[id]||0)-rate*step/60);for(const r of s.rods)r.next-=step;}
   if(this.state.craftJob)this.state.craftJob.remaining-=step;if(this.state.tournament)this.state.tournament.remaining-=step;
   this.simNow+=step*1000;left-=step;
  }
  // Process events landing exactly on the boundary once, without granting extra time.
  const s=this.state.session;if(s){for(let i=0;i<s.rods.length;i++)if(s.rods[i].next<=.0001&&this.state.session){this.catchAttempt(i);}if(this.state.session&&s.remaining<=.0001)this.stopSession('Je geplande sessie is afgelopen.');}
  if(this.state.craftJob?.remaining<=.0001)this.finishCraft();if(this.state.tournament?.remaining<=.0001)this.finishContest();
  if(diff>seconds+.01){if(this.state.session)this.stopSession('Offline limiet bereikt. Ongebruikte voorraad blijft bewaard.');if(this.state.tournament&&now>=this.state.tournament.startedAt+this.state.tournament.seconds*1000)this.finishContest();}
  if(this.state.session&&(this.state.permits[this.state.session.water]||0)<=now)this.stopSession('Je vispas is verlopen.');
  this.state.lastAt=now;this.simNow=now;this.dirty=true;
  if(this.pendingEquipment){this.pendingEquipment=false;this.emit('equipment');}
  if(this.pendingLevel){const n=this.pendingLevel;this.pendingLevel=null;this.emit('level',`Level ${n} bereikt! Kijk bij je voortgang wat er nieuw is.`,{level:n});}
  if(this.lastCatchEvent&&this.state.stats.caught!==beforeCaught){const fish=this.lastCatchEvent;this.lastCatchEvent=null;this.emit('catch','',{fish});}
  this.emit('tick');if(now-this.lastSave>=5000)this.save();
 }
 exportSave(){if(this.store.blocked){const original=this.storage?.getItem(SAVE_KEY)||this.storage?.getItem(BACKUP_KEY)||this.storage?.getItem(LEGACY_KEY);if(original)return original;}this.sync();this.save();return JSON.stringify({game:'Europa Angler Idle',exportedAt:new Date(this.now()).toISOString(),save:this.state},null,2);}
 importSave(text){let value;try{const x=JSON.parse(text);value=this.validate(x.save||x);}catch{return this.fail('Dit bestand bevat geen geldige Europa Angler Idle-opslag.');}const previous=this.state,storeState={last:this.store.last,blocked:this.store.blocked,recovered:this.store.recovered,error:this.store.error};this.store.allowImport();this.state=value;if(this.storage&&!this.save()){this.state=previous;Object.assign(this.store,storeState);return this.fail('Importeren lukt niet: onvoldoende opslagruimte. Je vorige spel is behouden.');}const gap=Math.max(0,(this.now()-value.lastAt)/1000),before=this.snapshot();this.advanceTo(this.now());this.welcome=gap>=60?this.difference(before,gap):null;return this.changed('import','Je opgeslagen imperium is geladen.');}
 journal(id='latest'){return resolveJournal(this,id);}
 sessionRows(id='latest'){return sessionRows(this,id);}
 chooseCatches(ids,action){return chooseCatches(this,ids,action);}
 settleSession(id='latest'){return settleSession(this,id);}
 validate(raw){
  if(Number(raw?.schemaVersion)>SCHEMA_VERSION)throw Error('NEWER_SAVE');
  raw=unpackSave(raw);
  if(!raw||raw.version!==VERSION||(raw.schemaVersion>=4?!Array.isArray(raw.selectedRods):!Array.isArray(raw.loadouts)||!raw.loadouts.length))throw Error('Invalid save');const s=initial(this.now());
  for(const k of ['money','xp','craftXp','fleetBank']){if(!Number.isFinite(raw[k])||raw[k]<0)throw Error('Invalid balances');s[k]=raw[k];}
  s.lastAt=clamp(numeric(raw.lastAt,this.now()),0,this.now());s.seed=(numeric(raw.seed,s.seed)>>>0)||127;s.serial=Math.max(1,Math.floor(numeric(raw.serial,1)));s.highestLevel=clamp(numeric(raw.highestLevel,levelAt(s.xp)),1,300);s.rodSlots=clamp(Math.floor(numeric(raw.rodSlots,1)),1,6);
  for(const id of Object.keys(gear))s.gear[id]=clamp(Math.floor(numeric(raw.gear?.[id],s.gear[id]||0)),0,100);
  for(const id of Object.keys(supplies))s.stock[id]=clamp(numeric(raw.stock?.[id],s.stock[id]||0),0,1e10);
  for(const id of Object.keys(waters))if(Number.isFinite(raw.permits?.[id]))s.permits[id]=Math.max(0,raw.permits[id]);
  const legacyLoadouts=(Array.isArray(raw.loadouts)?raw.loadouts:[]).slice(0,12).map((l,i)=>({id:String(l.id||`loadout_${i}`).slice(0,60),name:String(l.name||'Mijn hengels').slice(0,45),rods:cleanLoadoutRods(l.rods,s.rodSlots)}));
  const previous=legacyLoadouts.find(l=>l.id===raw.activeLoadout)||legacyLoadouts[0];
  s.selectedRods=cleanLoadoutRods(raw.schemaVersion>=4?raw.selectedRods:previous?.rods,s.rodSlots);
  s.rodPresets=cleanRodPresets(raw.rodPresets,starterRod);
  s.selectedWater=waters[raw.selectedWater]?raw.selectedWater:'rietplas';
  s.plan=normalizePlan(raw.plan);
  for(const u of UPGRADES)s.upgrades[u.id]=clamp(Math.floor(numeric(raw.upgrades?.[u.id],0)),0,u.max);
  s.plan=normalizePlan(s.plan,s.plan);
  for(const k of ['autosell','keepTrophies','reducedMotion','audio'])s.settings[k]=raw.settings?.[k]===undefined?s.settings[k]:!!raw.settings[k];s.settings.fishingMode=raw.settings?.fishingMode==='active'?'active':'idle';s.settings.language=raw.settings?.language==='nl'?'nl':'en';if(!s.upgrades.autosell)s.settings.autosell=false;
  for(const id of ['catches','planner','activity'])s.settings.waterPanels[id]=raw.settings?.waterPanels?.[id]===true;
  for(const r of RECIPES)s.crafted[r.id]=clamp(Math.floor(numeric(raw.crafted?.[r.id],0)),0,10000000);
  s.focus=clamp(numeric(raw.focus,6),0,14);s.focusClock=clamp(numeric(raw.focusClock,0),0,10);s.clickAt=Math.min(this.now(),numeric(raw.clickAt,0));
  for(const k of Object.keys(s.stats))s.stats[k]=Math.max(0,numeric(raw.stats?.[k],0));
  for(const f of SPECIES)if(raw.records?.[f.id])s.records[f.id]={count:Math.max(0,Math.floor(numeric(raw.records[f.id].count,0))),best:clamp(numeric(raw.records[f.id].best,0),0,f.max)};
  s.net=(Array.isArray(raw.net)?raw.net:[]).filter(f=>f&&typeof f.id==='string'&&species[f.species]&&Number.isFinite(f.weight)&&f.weight>0&&Number.isFinite(f.value)&&f.value>=0&&Number.isFinite(f.xp)).slice(0,6400).map(f=>({...f,name:species[f.species].name}));
  if(raw.lastSession&&waters[raw.lastSession.water]){s.lastSession={water:raw.lastSession.water,reason:String(raw.lastSession.reason||'Sessie afgelopen.').slice(0,160),at:numeric(raw.lastSession.at),...Object.fromEntries(['caught','weight','xp','value','seconds','manualCaught','autoCaught','missedBites','rescuedBites'].map(k=>[k,Math.max(0,numeric(raw.lastSession[k]))]))};}
  const last=raw.lastCatch;if(last&&species[last.species]&&Number.isFinite(last.weight)&&Number.isFinite(last.value)&&Number.isFinite(last.xp))s.lastCatch={...last,name:species[last.species].name};
  s.sessions=cleanJournals(raw.sessions);for(const f of s.net)if(['sell','release','stock','pending'].includes(raw.catchChoices?.[f.id]))s.catchChoices[f.id]=raw.catchChoices[f.id];
  s.recent=(Array.isArray(raw.recent)?raw.recent:[]).slice(0,30).map(r=>({id:numeric(r.id,0),message:String(r.message).slice(0,160),at:numeric(r.at,0)}));
  for(const k of Object.keys(s.legacy))s.legacy[k]=Math.max(0,Math.floor(numeric(raw.legacy?.[k],0)));
  const e=raw.estate;if(e?.owned){s.estate={owned:true,name:String(e.name||'Mijn Oever').slice(0,35),level:clamp(Math.floor(numeric(e.level,1)),1,5),fish:(Array.isArray(e.fish)?e.fish:[]).filter(p=>canStockSpecies(species[p.species])).slice(0,20).map(p=>({species:p.species,count:clamp(Math.floor(numeric(p.count,1)),1,500),best:clamp(numeric(p.best,0),0,species[p.species].max)})),bank:Math.max(0,numeric(e.bank)),visitors:Math.max(0,numeric(e.visitors)),breedProgress:clamp(numeric(e.breedProgress),0,21600),born:Math.max(0,numeric(e.born))};}
  s.fleet=(Array.isArray(raw.fleet)?raw.fleet:[]).filter(b=>boats[b.type]&&typeof b.id==='string').slice(0,10).map(b=>({id:b.id,type:b.type,mode:['port','rental','fishing'].includes(b.mode)?b.mode:'port',remaining:clamp(numeric(b.remaining),0,86400),duration:clamp(numeric(b.duration),0,86400)}));
  if(raw.craftJob&&recipes[raw.craftJob.recipe]&&raw.craftJob.remaining>0)s.craftJob={recipe:raw.craftJob.recipe,quantity:clamp(Math.floor(numeric(raw.craftJob.quantity,1)),1,45),duration:clamp(numeric(raw.craftJob.duration,1),1,86400),remaining:clamp(raw.craftJob.remaining,0,86400)};
  if(raw.tournament&&TOURNAMENTS.some(t=>t.id===raw.tournament.id)&&raw.tournament.remaining>0){const t=TOURNAMENTS.find(t=>t.id===raw.tournament.id);if(Array.isArray(raw.tournament.opponents)&&raw.tournament.opponents.length===5)s.tournament={...clone(t),remaining:clamp(raw.tournament.remaining,0,t.seconds),startedAt:numeric(raw.tournament.startedAt,this.now()),score:Math.max(0,numeric(raw.tournament.score)),catches:Math.max(0,numeric(raw.tournament.catches)),opponents:raw.tournament.opponents.map(p=>({name:String(p.name).slice(0,40),goal:Math.max(0,numeric(p.goal))}))};}
  s.contestResults=(Array.isArray(raw.contestResults)?raw.contestResults:[]).slice(0,20).filter(r=>r&&Number.isFinite(r.prize)&&r.prize>=0).map(r=>({...r,name:String(r.name).slice(0,50),claimed:!!r.claimed}));
  const active=raw.session;if(active&&waters[active.water]&&active.remaining>0&&active.duration>0&&active.loadout?.rods?.length&&active.loadout.rods.length<=s.rodSlots){const valid=active.loadout.rods.every(r=>['rod','reel','line','hook','terminal'].every(k=>gear[r[k]])&&supplies[r.bait]?.attracts&&STYLES.some(st=>st.id===r.style)&&COMBOS.some(c=>c.id===r.combo));if(valid&&Array.isArray(active.rods)&&active.rods.length===active.loadout.rods.length){s.session=clone(active);s.session.duration=clamp(numeric(active.duration,900),60,SESSION_CAP);s.session.remaining=clamp(active.remaining,0,s.session.duration);s.session.rods=s.session.rods.map(r=>{const phases=['waiting','nibble','bite','rescue','landed','missed','recovering','broken'];let candidate=null;if(r.candidate&&species[r.candidate.species]&&Number.isFinite(r.candidate.weight)&&r.candidate.weight>0&&Number.isFinite(r.candidate.value)&&Number.isFinite(r.candidate.xp))candidate={...r.candidate,name:species[r.candidate.species].name,autoRoll:clamp(numeric(r.candidate.autoRoll,.9),0,1),manualRoll:clamp(numeric(r.candidate.manualRoll,.5),0,1)};const phase=phases.includes(r.phase)?r.phase:'waiting';return {phase:['bite','rescue'].includes(phase)&&!candidate?'waiting':phase,next:phase==='broken'?1e9:clamp(numeric(r.next,10),.001,120),total:clamp(numeric(r.total,20),.001,120),rolls:Math.max(0,numeric(r.rolls)),caught:Math.max(0,numeric(r.caught)),missed:Math.max(0,numeric(r.missed)),signalId:numeric(r.signalId),candidate,biteStartedAt:numeric(r.biteStartedAt),deadline:numeric(r.deadline),nextFactor:clamp(numeric(r.nextFactor,1),.5,1.5),lastOutcome:String(r.lastOutcome||'').slice(0,350)};});s.session.mode=s.settings.fishingMode;for(const k of ['bites','manualCaught','autoCaught','missedBites','rescuedBites','autoMisses','earlyStrikes'])s.session[k]=Math.max(0,numeric(active[k]));s.session.fish=Array.isArray(active.fish)?cleanHistory(active.fish):s.net.filter(f=>f.at>=active.startedAt&&f.water===active.water).map(f=>encodeCatch(f,active.startedAt,0));s.session.rates=this.supplyRates(active.loadout);for(const k of ['caught','weight','xp','value','cost'])s.session[k]=Math.max(0,numeric(active[k]));}}
  migrateTackle(s,raw,legacyLoadouts);
  if(s.session)s.session.rates=this.supplyRates({rods:s.session.loadout.rods.filter((r,i)=>s.session.rods[i].phase!=='broken')});
  return s;
 }
}
