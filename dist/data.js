export const VERSION=2;
export const STYLES=[
{id:'feeder',name:'Feeder',label:'Bodem & voerkorf',color:'#c6d592',feed:12,bait:1.2,interval:18,cap:4},
{id:'karper',name:'Karper',label:'Boilies & geduld',color:'#dbb97a',feed:8,bait:.65,interval:30,cap:4},
{id:'dobber',name:'Dobber',label:'Licht & precies',color:'#8cc9b3',feed:3,bait:1.8,interval:12,cap:2},
{id:'zee',name:'Zee',label:'Diep water & grote vis',color:'#8bb8d7',feed:4,bait:.8,interval:40,cap:3,level:120},
];
export const SLOT_LEVELS=[1,10,40,90,170,300];
export const SLOT_COSTS=[0,90,900,7500,50000,250000];
// Game prices stay modest for starter tackle; XP and unlocks carry long-term progression.
export const ESTATE_PRICE=25000,ESTATE_UPGRADE_BASE=15000;
const tiers=[['field','Field',1,1,25],['scout','Scout',8,1.3,65],['river','River Pro',20,1.8,140],['specialist','Specialist',45,2.7,320],['heritage','Heritage',90,4,750],['apex','Apex',160,6.5,1800],['sovereign','Sovereign',250,10,4800]];
const gear=[];
for(const st of STYLES)for(const [tier,label,lv,power,price]of tiers){
 const level=Math.max(lv,st.level||1),premium=st.id==='zee'?3:1;
 for(const category of ['rod','reel','terminal']){
 const suffix=category==='rod'?({feeder:'Feeder 3.60',karper:'Carp 12 ft',dobber:'Match 3.90',zee:'Offshore 80 lb'}[st.id]):category==='reel'?({feeder:'4000',karper:'Baitrunner 6000',dobber:'Match 2500',zee:'Ocean 12000'}[st.id]):({feeder:'voerkorf',karper:'hair-rig',dobber:'waggler',zee:'zee-montage'}[st.id]);
 gear.push({id:`${st.id}_${category}_${tier}`,name:`${label} ${suffix}`,category,style:st.id,tier,level,power,price:Math.round((price||80)*(category==='rod'?1:category==='reel'?.78:.2)*premium),starter:tier==='field'&&st.id!=='zee',description:category==='rod'?'Meer draagkracht en efficiënter vissen.':category==='reel'?'Betere controle en een hogere landingskans.':'Een verfijnde montage voor deze visstijl.'});
 }}
for(const [n,[tier,label,lv,power,price]]of tiers.entries())gear.push({id:`line_${tier}`,name:['Mono 0,20 mm','Mono 0,25 mm','Mono 0,30 mm','Fluoro 0,38 mm','Braid X8 0,35','Ocean Braid 0,60','Titan Leader 1,00'][n],category:'line',style:'all',tier,level:lv,power,price:Math.round((price||80)*.28),strength:[3,6,10,18,35,85,200][n],starter:n===0,description:'Trekkracht begrenst de vis die je veilig kunt landen.'});
export const HOOKS=[
{id:'hook_16',name:'Fijne haak #16',size:16,min:0,max:1.5,level:1,price:2},
{id:'hook_12',name:'Wide Gape #12',size:12,min:.1,max:4,level:1,price:3},
{id:'hook_8',name:'Specimen #8',size:8,min:.6,max:12,level:8,price:5},
{id:'hook_6',name:'Forged #6',size:6,min:1.8,max:25,level:20,price:8},
{id:'hook_4',name:'Carp Strong #4',size:4,min:4,max:45,level:40,price:12},
{id:'hook_2',name:'Predator #2',size:2,min:8,max:90,level:80,price:18},
{id:'hook_10',name:'Offshore #1/0',size:0,min:10,max:160,level:120,price:30},
{id:'hook_50',name:'Big Game #5/0',size:-5,min:40,max:400,level:200,price:65},
];
for(const h of HOOKS)gear.push({...h,category:'hook',style:'all',tier:h.level>80?'elite':'start',power:1+h.level/55,starter:['hook_16','hook_12'].includes(h.id),description:`Doelgewicht ${h.min}–${h.max} kg. Grote haken selecteren grotere vis.`});
export const INDICATORS=[
{id:'feeder_bell',name:'Dubbel topbelletje',category:'indicator',style:'feeder',tier:'scout',level:4,price:8,power:1,auto:.06,window:.8,sound:'bell',description:'Rinkelend belletje bij een echte feederbeet. +6 procentpunt assistentreactie en 0,8s extra aanslagtijd.'},
{id:'feeder_smartclip',name:'LED quiverclip & bel',category:'indicator',style:'feeder',tier:'specialist',level:24,price:28,power:2,auto:.13,window:1.3,sound:'bell',description:'Een lichtclip met dubbel belletje. +13 procentpunt assistentreactie en 1,3s extra aanslagtijd.'},
{id:'carp_alarm',name:'Digitale beetpieper',category:'indicator',style:'karper',tier:'scout',level:8,price:22,power:1,auto:.08,window:1.2,sound:'alarm',description:'Een pieper en LED bij een run. +8 procentpunt assistentreactie en 1,2s extra aanslagtijd.'},
{id:'carp_receiver',name:'Draadloze pieperset',category:'indicator',style:'karper',tier:'specialist',level:35,price:85,power:2,auto:.16,window:2,sound:'alarm',description:'Een gevoeligere pieper met ontvanger. +16 procentpunt assistentreactie en 2s extra aanslagtijd.'},
{id:'float_neon',name:'Neon antenne',category:'indicator',style:'dobber',tier:'scout',level:3,price:3,power:1,auto:.04,window:.7,sound:'none',description:'Een goed zichtbaar neon topje. +4 procentpunt assistentreactie en 0,7s extra aanslagtijd.'},
{id:'float_glow',name:'Glow-in-the-dark topje',category:'indicator',style:'dobber',tier:'specialist',level:12,price:9,power:2,auto:.08,window:1.4,sound:'none',description:'Een oplichtende antenne met halo. +8 procentpunt assistentreactie en 1,4s extra aanslagtijd.'},
{id:'sea_ratchet',name:'Offshore lijnalarm',category:'indicator',style:'zee',tier:'heritage',level:120,price:120,power:2,auto:.12,window:1.5,sound:'ratchet',description:'Een krachtige ratel bij een zeebeet. +12 procentpunt assistentreactie en 1,5s extra aanslagtijd.'},
];
gear.push(...INDICATORS);
export const GEAR=gear;
export const SUPPLIES=[
{id:'feed',name:'Allround lokvoer',unit:'g',pack:1000,price:0.003,level:1,color:'#bba578',description:'Grondvoer voor je stek.'},
{id:'maggots',name:'Maden',unit:'st',pack:100,price:0.02,level:1,color:'#d8ceb4',attracts:['voorn','ruisvoorn','brasem','winde',"giebel","riviergrondel","witvinriviergrondel","marmergrondel","kolblei","alver","pos","serpeling","sneep","blauwneus","beekforel","regenboogforel","vlagzalm"]},
{id:'corn',name:'Zoete maïs',unit:'st',pack:100,price:0.015,level:1,color:'#dcc477',attracts:['zeelt','kroes','schub','spiegel','brasem','voorn',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel","giebel","kolblei","kopvoorn","regenboogforel"]},
{id:'worms',name:'Wormen',unit:'st',pack:50,price:0.1,level:3,color:'#b98775',attracts:['zeelt','barbeel','baars','meerval',"giebel","riviergrondel","witvinriviergrondel","zwartbekgrondel","marmergrondel","pos","kopvoorn","paling","kwabaal","beekforel","regenboogforel","vlagzalm","bot","schol","schar","wijting","schelvis"]},
{id:'bacon',name:'Spekblokjes',unit:'st',pack:50,price:0.08,level:8,color:'#d49e88',attracts:['meerval','barbeel','schub',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel","kopvoorn","paling"]},
{id:'boilies',name:'Krill boilies',unit:'st',pack:100,price:0.12,level:5,color:'#bd9274',attracts:['schub','spiegel','graskarper','brasem',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel"]},
{id:'pellets',name:'Halibut pellets',unit:'st',pack:100,price:0.04,level:15,color:'#8c7f61',attracts:['barbeel','brasem','meerval','heilbot','steur',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel","giebel","blauwneus","kopvoorn","regenboogforel","zeewolf"]},
{id:'fishbait',name:'Aasvis',unit:'st',pack:25,price:0.8,level:55,color:'#a8b6b3',attracts:['meerval','snoek','kabeljauw','heilbot',"snoekbaars","paling","kwabaal","roofblei","koolvis","leng","zeewolf","goudmakreel","wahoo"]},
{id:'squid',name:'Inktvis',unit:'st',pack:50,price:0.65,level:120,color:'#c4bac6',attracts:['kabeljauw','zeebaars','tonijn','blauwvintonijn',"bot","schol","schar","wijting","schelvis","koolvis","makreel","leng","zeewolf","goudmakreel","wahoo"]},
{id:'krill',name:'Verse krill',unit:'st',pack:100,price:0.2,level:170,color:'#c59185',attracts:['tonijn','blauwvintonijn','zwaardvis',"makreel","goudmakreel","wahoo"]},
{id:'liquid_krill',name:'Krill liquid',unit:'ml',pack:250,price:0.025,level:20,color:'#b77c5f',bonus:.14,description:'+14% beetkans. Verbruik 0,5 ml per hengel/min.'},
{id:'liquid_scopex',name:'Scopex liquid',unit:'ml',pack:250,price:0.045,level:60,color:'#d0b263',bonus:.22,description:'+22% beetkans. Verbruik 0,5 ml per hengel/min.'},
{id:'line_parts',name:'Onderlijnmateriaal',unit:'st',pack:20,price:0.35,level:5,color:'#afbca7',description:'Materiaal voor zelfgemaakte rigs.'},
{id:'hook_parts',name:'Haken & wartels',unit:'st',pack:20,price:0.5,level:5,color:'#b7b6a0',description:'Onderdelen voor de werkbank.'},
];
export const BAITS=SUPPLIES.filter(s=>s.attracts);
export const COMBOS=[
{id:'none',name:'Enkel aas',level:1,bonus:0},
{id:'corn_maggots',name:'Maïs + made',level:25,requires:['corn','maggots'],bonus:.15},
{id:'worms_maggots',name:'Worm + made',level:35,requires:['worms','maggots'],bonus:.18},
{id:'boilies_corn',name:'Boilie + maïs',level:55,requires:['boilies','corn'],bonus:.22},
{id:'bacon_worms',name:'Spek + worm',level:85,requires:['bacon','worms'],bonus:.25},
{id:'squid_krill',name:'Inktvis + krill',level:180,requires:['squid','krill'],bonus:.32},
];
export const SPECIES=[
{id:'voorn',name:'Blankvoorn',min:.08,max:1.2,value:2,xp:9,color:'#aebcae',styles:['dobber','feeder']},
{id:'ruisvoorn',name:'Ruisvoorn',min:.1,max:1.8,value:3,xp:12,color:'#c2b178',styles:['dobber','feeder']},
{id:'brasem',name:'Brasem',min:.4,max:7,value:2.5,xp:16,color:'#9ba991',styles:['feeder','dobber']},
{id:'zeelt',name:'Zeelt',min:.5,max:7.5,value:4,xp:23,color:'#9ba568',styles:['dobber','karper','feeder']},
{id:'kroes',name:'Kroeskarper',min:.25,max:4,value:4.5,xp:20,color:'#b7a16c',styles:['dobber','karper']},
{id:'schub',name:'Schubkarper',min:1.2,max:34,value:5,xp:35,color:'#ba9c62',styles:['karper','feeder']},
{id:'spiegel',name:'Spiegelkarper',min:2,max:42,value:6,xp:48,color:'#b08e5c',styles:['karper','feeder']},
{id:'winde',name:'Winde',min:.4,max:6,value:4,xp:30,color:'#c0c4ad',styles:['feeder','dobber']},
{id:'barbeel',name:'Barbeel',min:1,max:14,value:6,xp:60,color:'#b8a981',styles:['feeder']},
{id:'baars',name:'Baars',min:.1,max:4,value:7,xp:25,color:'#93aa76',styles:['dobber','feeder']},
{id:'snoek',name:'Snoek',min:2,max:24,value:8,xp:150,color:'#819c79',styles:['karper','feeder']},
{id:'graskarper',name:'Graskarper',min:4,max:48,value:6,xp:180,color:'#aaa677',styles:['karper']},
{id:'meerval',name:'Europese meerval',min:5,max:110,value:7.5,xp:300,color:'#859c8c',styles:['karper','feeder']},
{id:'steur',name:'Siberische steur',min:4,max:65,value:14,xp:420,color:'#9baba6',styles:['karper','feeder']},
{id:'zeebaars',name:'Zeebaars',min:1,max:13,value:12,xp:900,color:'#b9c4c1',styles:['zee']},
{id:'kabeljauw',name:'Kabeljauw',min:2,max:38,value:7,xp:1500,color:'#a4aa8a',styles:['zee']},
{id:'heilbot',name:'Atlantische heilbot',min:10,max:180,value:18,xp:3000,color:'#9f9f85',styles:['zee']},
{id:'tonijn',name:'Geelvintonijn',min:18,max:160,value:24,xp:6000,color:'#9daebb',styles:['zee']},
{id:'blauwvintonijn',name:'Blauwvintonijn',min:45,max:340,value:45,xp:13000,color:'#93a6b8',styles:['zee']},
{id:'zwaardvis',name:'Zwaardvis',min:25,max:260,value:28,xp:18000,color:'#92aabd',styles:['zee']},
{id:'rivierkreeft',name:'Rivierkreeft',kind:'crayfish',min:.02,max:.16,value:.35,xp:2,color:'#b88062',styles:['feeder','karper','dobber']},
// Atelier additions retain every original catch ID. Encounter weights limit dilution of familiar fish.
{id:"linear_spiegel",name:"Lineaire spiegelkarper",min:2,max:38,value:6,xp:46,color:"#bd995b",styles:["karper", "feeder"],encounterWeight:0.22},
{id:"rijenkarper",name:"Rijenkarper",min:1.8,max:36,value:5.8,xp:44,color:"#c5a36c",styles:["karper", "feeder"],encounterWeight:0.19},
{id:"lederkarper",name:"Lederkarper",min:2,max:40,value:6,xp:48,color:"#ad855a",styles:["karper", "feeder"],encounterWeight:0.16},
{id:"volschub_spiegel",name:"Volschubspiegel",min:2,max:39,value:6,xp:47,color:"#cfac65",styles:["karper", "feeder"],encounterWeight:0.17},
{id:"giebel",name:"Giebel",min:0.12,max:3.5,value:3.4,xp:18,color:"#b9b9a5",styles:["dobber", "feeder", "karper"],encounterWeight:0.42},
{id:"riviergrondel",name:"Riviergrondel",min:0.01,max:0.18,value:1.8,xp:7,color:"#b8aa82",styles:["dobber", "feeder"],encounterWeight:0.28},
{id:"witvinriviergrondel",name:"Witvinriviergrondel",min:0.01,max:0.14,value:1.8,xp:9,color:"#c3c7b6",styles:["dobber", "feeder"],encounterWeight:0.22},
{id:"zwartbekgrondel",name:"Zwartbekgrondel",min:0.01,max:0.25,value:1.5,xp:6,color:"#788270",styles:["dobber", "feeder"],encounterWeight:0.3},
{id:"marmergrondel",name:"Marmergrondel",min:0.01,max:0.06,value:1.5,xp:6,color:"#9f8b68",styles:["dobber", "feeder"],encounterWeight:0.2},
{id:"kolblei",name:"Kolblei",min:0.04,max:1.3,value:2.3,xp:12,color:"#c0c0af",styles:["dobber", "feeder"],encounterWeight:0.4},
{id:"alver",name:"Alver",min:0.01,max:0.12,value:1.8,xp:8,color:"#c2d2d5",styles:["dobber", "feeder"],encounterWeight:0.24},
{id:"pos",name:"Pos",min:0.02,max:0.3,value:2.4,xp:10,color:"#a59e72",styles:["dobber", "feeder"],encounterWeight:0.24},
{id:"kopvoorn",name:"Kopvoorn",min:0.3,max:6,value:5,xp:35,color:"#a7aa7d",styles:["feeder", "dobber"],encounterWeight:0.4},
{id:"serpeling",name:"Serpeling",min:0.03,max:0.7,value:3,xp:13,color:"#c5c7b5",styles:["feeder", "dobber"],encounterWeight:0.28},
{id:"sneep",name:"Sneep",min:0.2,max:3.5,value:3.8,xp:26,color:"#b7bfaf",styles:["feeder", "dobber"],encounterWeight:0.3},
{id:"blauwneus",name:"Blauwneus",min:0.15,max:3,value:4,xp:30,color:"#b6c1c1",styles:["feeder", "dobber"],encounterWeight:0.25},
{id:"snoekbaars",name:"Snoekbaars",min:0.5,max:15,value:8,xp:110,color:"#a5ad82",styles:["feeder", "karper"],encounterWeight:0.36},
{id:"paling",name:"Paling",min:0.15,max:4,value:9,xp:40,color:"#8d986c",styles:["feeder", "dobber"],encounterWeight:0.2},
{id:"kwabaal",name:"Kwabaal",min:0.3,max:8,value:7,xp:85,color:"#948e69",styles:["feeder"],encounterWeight:0.17},
{id:"beekforel",name:"Beekforel",min:0.15,max:5,value:7,xp:45,color:"#b7a270",styles:["dobber", "feeder"],encounterWeight:0.23},
{id:"regenboogforel",name:"Regenboogforel",min:0.25,max:8,value:6.5,xp:45,color:"#c0b2b6",styles:["dobber", "feeder"],encounterWeight:0.36},
{id:"vlagzalm",name:"Vlagzalm",min:0.1,max:2.5,value:6.5,xp:45,color:"#b1b8bb",styles:["dobber", "feeder"],encounterWeight:0.16},
{id:"roofblei",name:"Roofblei",min:0.7,max:10,value:7,xp:75,color:"#acb8bd",styles:["feeder", "karper"],encounterWeight:0.24},
{id:"bot",name:"Bot",min:0.1,max:3,value:5,xp:350,color:"#929b80",styles:["zee"],encounterWeight:0.23},
{id:"schol",name:"Schol",min:0.15,max:5,value:6,xp:400,color:"#a49271",styles:["zee"],encounterWeight:0.25},
{id:"schar",name:"Schar",min:0.08,max:1.5,value:4,xp:260,color:"#bdab83",styles:["zee"],encounterWeight:0.21},
{id:"wijting",name:"Wijting",min:0.15,max:3,value:4.5,xp:420,color:"#c0c8b4",styles:["zee"],encounterWeight:0.28},
{id:"schelvis",name:"Schelvis",min:0.5,max:10,value:6,xp:900,color:"#abb5b8",styles:["zee"],encounterWeight:0.28},
{id:"koolvis",name:"Koolvis",min:1,max:25,value:6,xp:1100,color:"#748e93",styles:["zee"],encounterWeight:0.36},
{id:"makreel",name:"Makreel",min:0.15,max:1.5,value:6,xp:350,color:"#4f9ca1",styles:["zee"],encounterWeight:0.24},
{id:"leng",name:"Leng",min:2,max:38,value:8,xp:1400,color:"#a9b29a",styles:["zee"],encounterWeight:0.28},
{id:"zeewolf",name:"Zeewolf",min:1.5,max:20,value:10,xp:1400,color:"#8b98a4",styles:["zee"],encounterWeight:0.2},
{id:"goudmakreel",name:"Goudmakreel",min:3,max:35,value:18,xp:3200,color:"#bed455",styles:["zee"],encounterWeight:0.32},
{id:"wahoo",name:"Wahoo",min:5,max:70,value:20,xp:4200,color:"#659aac",styles:["zee"],encounterWeight:0.25},
];
export const WATERS=[
{id:'rietplas',name:'De Rietplas',country:'Nederland',region:'Tussen riet en polder',level:1,rate:36,factor:.22,xp:1,color:'#709586',fish:['voorn','ruisvoorn','brasem','zeelt','kroes','rivierkreeft',"giebel","riviergrondel","marmergrondel","kolblei","alver","pos"],crayfishPressure:0.45,tag:'EERSTE STEK',description:'Luw water, lichte montages en de rust van een vroege ochtend.'},
{id:'poldermeer',name:'Het Poldermeer',country:'Nederland',region:'Ruimte voor je eerste karper',level:5,rate:90,factor:.35,xp:1.3,color:'#668f88',fish:['brasem','zeelt','schub','spiegel','winde','voorn','rivierkreeft',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel","giebel","kolblei","snoekbaars","paling","zwartbekgrondel"],crayfishPressure:1.1,tag:'KARPERWATER',description:'Mosselbanken en diepe geulen. Een grotere haak opent nieuwe kansen.'},
{id:'aulnes',name:'Lac des Aulnes',country:'België',region:'Het groene hart van de Ardennen',level:15,rate:220,factor:.5,xp:2,color:'#5f8676',fish:['zeelt','brasem','schub','spiegel','baars','voorn','rivierkreeft',"linear_spiegel","lederkarper","volschub_spiegel","riviergrondel","beekforel","regenboogforel","vlagzalm","pos","kopvoorn"],crayfishPressure:0.6,tag:'BOSMEER',description:'Zoek de overgang tussen de lelies en de donkere bodem.'},
{id:'rhein',name:'Rheinaue',country:'Duitsland',region:'Een oude arm van de Rijn',level:30,rate:600,factor:.62,xp:3.5,color:'#738e81',fish:['winde','barbeel','brasem','schub','meerval','voorn','rivierkreeft',"rijenkarper","witvinriviergrondel","zwartbekgrondel","marmergrondel","kopvoorn","serpeling","sneep","blauwneus","snoekbaars","kwabaal","roofblei"],crayfishPressure:0.8,tag:'STROMEND WATER',description:'Zware voerkorven, sterke lijnen en de eerste echte krachtpatsers.'},
{id:'lumiere',name:'Étang de Lumière',country:'Frankrijk',region:'Oude karpers in de Bourgogne',level:55,rate:1800,factor:.8,xp:6,color:'#8f9b74',fish:['schub','spiegel','graskarper','meerval','voorn','brasem','rivierkreeft',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel","giebel","paling","snoekbaars"],crayfishPressure:1.4,tag:'SPECIMENWATER',description:'Grote karpers belonen een slimme combinatie van aas en rig.'},
{id:'donau',name:'Donau Delta',country:'Roemenië',region:'Een labyrint van stil water',level:85,rate:5000,factor:1,xp:12,color:'#83967b',fish:['schub','spiegel','meerval','steur','snoek','voorn','brasem','rivierkreeft',"linear_spiegel","rijenkarper","lederkarper","volschub_spiegel","giebel","witvinriviergrondel","snoekbaars","roofblei","blauwneus","paling"],crayfishPressure:0.75,tag:'TROFEEWATER',description:'Hier wordt je materiaal getest door de grootste zoetwatervissen.'},
{id:'noordzee',name:'De Noordzee',country:'Nederland',region:'Zout op je gezicht',level:120,rate:18000,factor:.5,xp:2,color:'#6e939d',sea:true,fish:['zeebaars','kabeljauw','heilbot',"bot","schol","schar","wijting","schelvis","koolvis","makreel"],tag:'ZEEVISSEN',description:'Gebruik zeehengels. Een eigen boot of ingehuurde charter is nodig.'},
{id:'lofoten',name:'Lofoten',country:'Noorwegen',region:'Koud water. Grote verwachtingen.',level:170,rate:65000,factor:.8,xp:4,color:'#7b9eae',sea:true,fish:['kabeljauw','heilbot','tonijn',"schelvis","koolvis","makreel","leng","zeewolf"],tag:'DIEPZEE',description:'Diepe fjorden en zware heilbot. Een sterke voorslag is onmisbaar.'},
{id:'azoren',name:'De Azoren',country:'Portugal',region:'De blauwe horizon',level:220,rate:190000,factor:1,xp:6,color:'#557e9b',sea:true,fish:['tonijn','blauwvintonijn','zwaardvis',"goudmakreel","wahoo"],tag:'BIG GAME',description:'Je vloot en beste hengels krijgen toegang tot de Atlantische rijkdom.'},
{id:'pelagic',name:'Pelagic Reserve',country:'Atlantische Oceaan',region:'Voor de beste vissers van Europa',level:260,prestige:1,rate:450000,factor:1,xp:10,color:'#567b91',sea:true,fish:['blauwvintonijn','zwaardvis',"goudmakreel","wahoo"],tag:'LEGENDEWATER',description:'Een prestigebestemming voor een nieuwe generatie vislegendes.'},
];
export const RECIPES=[
{id:'rig_basic',name:'Nette onderlijn',level:5,skill:1,seconds:25,cost:{line_parts:1,hook_parts:1},value:1.4,xp:16,bonus:.06,description:'Je eerste verkoopbare onderlijn. +6% beetkans voor een sessie.'},
{id:'rig_precision',name:'Precision feeder-rig',level:25,skill:15,seconds:40,cost:{line_parts:2,hook_parts:2},value:3.2,xp:42,bonus:.12,description:'Preciezer geknoopt. +12% beetkans voor een sessie.'},
{id:'rig_hair',name:'Specimen hair-rig',level:55,skill:35,seconds:60,cost:{line_parts:4,hook_parts:4},value:7.5,xp:90,bonus:.2,description:'Voorzichtig afgewerkt. +20% beetkans voor een sessie.'},
{id:'rig_marine',name:'Offshore leader',level:150,skill:60,seconds:90,cost:{line_parts:12,hook_parts:12},value:24,xp:220,bonus:.28,description:'Een sterke zee-onderlijn. +28% beetkans voor een sessie.'},
{id:'rig_signature',name:'Signature montage',level:220,skill:85,seconds:120,cost:{line_parts:30,hook_parts:30},value:65,xp:480,bonus:.4,description:'Jouw handtekening aan de haak. +40% beetkans voor een sessie.'},
];
export const TOURNAMENTS=[
{id:'club',name:'De ochtendbeker',level:8,water:'rietplas',seconds:600,fee:8,prizes:[65,35,16],target:17,tag:'CLUBWEDSTRIJD'},
{id:'polder',name:'Polder Masters',level:30,water:'poldermeer',seconds:1800,fee:45,prizes:[350,180,80],target:150,tag:'REGIONAAL'},
{id:'specimen',name:'Specimen Cup',level:60,water:'lumiere',seconds:7200,fee:200,prizes:[1800,850,350],target:900,tag:'SPECIMEN'},
{id:'offshore',name:'North Sea Classic',level:120,water:'noordzee',seconds:7200,fee:1500,prizes:[14000,6500,2200],target:2200,tag:'OFFSHORE'},
{id:'ocean',name:'Atlantic Legends',level:220,water:'azoren',seconds:21600,fee:8000,prizes:[90000,40000,15000],target:14000,tag:'LEGENDE'},
];
export const UPGRADES=[
{id:'polaroid',name:'Polaroid vissersbril',level:6,base:25,max:1,description:'Meer contrast in de beetweergave en 0,8 seconde extra tijd om aan te slaan.'},
{id:'rodrest',name:'Stabiele verstelbare banksticks',level:7,base:35,max:2,description:'Efficiënter opnieuw inleggen: +3,5% worpsnelheid per upgrade.'},
{id:'landingnet',name:'Ruim schepnet & onthaakmat',level:12,base:90,max:3,description:'Per niveau +0,8 procentpunt handmatig landen (max. 99,5%) en +4% handmatige vangst-XP.'},
{id:'autostrike',name:'Training voor je visassistent',level:18,base:180,max:3,description:'De assistent mist minder echte beten: +5 procentpunt reactiekans per niveau.'},
{id:'stealth',name:'Stille stek & camouflage',level:22,base:150,max:3,description:'Minder verstoring bij je lijnen. +2 procentpunt echte beetkans per upgrade.'},

{id:'net',name:'Grotere vangstopslag',level:3,base:90,max:5,description:'Verdubbel je opslag per upgrade. Begin met 200 vangsten.'},
{id:'offline',name:'Langere offline voortgang',level:20,base:450,max:5,description:'Verhoog offline voortgang van 8 naar 16, 24, 48, 96 en uiteindelijk 168 uur.'},
{id:'autosell',name:'Automatische vismarkt',level:15,base:275,max:1,description:'Verkoop vangsten meteen. Trofeeën kun je uitzonderen.'},
{id:'workbench',name:'Grotere werkbank',level:25,base:300,max:4,description:'10 extra rigs per werkopdracht. Je begint met batches van 5.'},
{id:'focus',name:'Oeverroutine',level:10,base:65,max:4,description:'Twee extra actieve tikken opslaan, vanaf 6 energie.'},
];
export const BOATS=[
{id:'cutter',name:'Polder Kotter',level:150,price:45000,income:160,trip:4*3600,fuel:450,fishValue:2200,xp:30000,description:'Je eerste zakelijke schip. Verhuur of stuur de bemanning op vangst.'},
{id:'trawler',name:'Northstar Trawler',level:190,price:280000,income:950,trip:6*3600,fuel:3000,fishValue:14000,xp:400000,description:'Grotere vangsten en een betrouwbaar charterinkomen.'},
{id:'pelagic',name:'Pelagic Horizon',level:240,prestige:1,price:1850000,income:6200,trip:8*3600,fuel:22000,fishValue:95000,xp:6000000,description:'Een investering voor een internationale visonderneming.'},
];
export const MILESTONES=[
[1,'Het eerste verhaal','Een hengel, drie visstijlen en de Rietplas.'],[5,'De werkbank','Maak onderlijnen, verdien vakmanschap en verkoop rigs.'],[8,'De ochtendbeker','Doe mee aan wedstrijden tegen computervissers.'],[10,'Twee lijnen in het water','Koop je tweede hengelplaats.'],[15,'Meer dan een hobby','Nieuwe wateren en automatisch verkopen.'],[25,'De perfecte cocktail','Combineer aas en bouw een grotere werkbank.'],[40,'Drie hengels','Combineer drie van je hengelpresets.'],[80,'Een eigen stukje water','Koop je viswater, zet vis uit en ontvang bezoekers.'],[90,'Vier hengels','Meer lijnen, grotere ambities.'],[100,'Een nieuw seizoen','Prestige: begin opnieuw met blijvende kennis.'],[120,'Voorbij de kust','Ontdek zeevissen en huur een charter.'],[150,'Jouw eerste schip','Koop boten, verhuur ze of stuur ze op visreis.'],[170,'Vijf hengels','Een uitrusting voor de gevorderde ondernemer.'],[220,'Atlantische rijkdom','Tonijn, zwaardvis en grote investeringen.'],[300,'Zes hengels. Eén imperium.','De moeilijkste hengelplaats en de titel Oeverlegende.'],
];
export const BY_ID=Object.fromEntries([...GEAR,...SUPPLIES,...SPECIES,...WATERS,...RECIPES,...BOATS].map(x=>[x.id,x]));
