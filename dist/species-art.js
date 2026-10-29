import {SPECIES_INFO} from './species-info.js';

// Field-guide plates: shared anatomy, with a distinct silhouette, fin set and skin
// pattern for each family. Carp scale morphs are deliberately different drawings.
let plateSequence = 0;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stroke = (d, color, width = .8, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const PALETTES = {
  carp: ['#3c493b','#ab8951','#d5b679','#f0dfb2','#9c6844'],
  silver: ['#425b60','#a7bec0','#d8dfd2','#f6efdc','#b37b59'],
  gold: ['#4d5434','#b69b4d','#e2c77f','#f3e3b4','#b17442'],
  olive: ['#344c41','#81965b','#b7bd80','#e2d9b2','#816648'],
  perch: ['#315b4e','#98b47a','#c5d59c','#eee5ba','#d8794d'],
  trout: ['#405d5a','#91aaa0','#cbd3b9','#eee4cd','#ab7967'],
  ocean: ['#1c455b','#4b899d','#b2ced1','#f1eee2','#497f91'],
  brown: ['#3e4c44','#8b9273','#c0bc95','#e5ddbc','#927b55'],
  bronze: ['#4c503f','#ad9362','#d0b990','#f0e2bc','#947759']
};
const OVERRIDES = {
  schub:{form:'carp',pattern:'full-scales',palette:'carp'},spiegel:{form:'carp',pattern:'mirror',palette:'carp'},
  linear_spiegel:{form:'carp',pattern:'linear',palette:'carp'},rijenkarper:{form:'carp',pattern:'rows',palette:'carp'},
  lederkarper:{form:'carp',pattern:'leather',palette:'bronze'},volschub_spiegel:{form:'carp',pattern:'full-mirror',palette:'gold'},
  giebel:{form:'deep',pattern:'full-scales',palette:'silver'},kroes:{form:'deep',pattern:'full-scales',palette:'gold'},
  voorn:{form:'slim',pattern:'full-scales',palette:'silver',redFins:true},ruisvoorn:{form:'deep',pattern:'full-scales',palette:'gold',redFins:true},
  brasem:{form:'deep',pattern:'full-scales',palette:'bronze',bream:true},kolblei:{form:'deep',pattern:'full-scales',palette:'silver',bream:true},
  zeelt:{form:'carp',pattern:'leather',palette:'olive',rounded:true},winde:{form:'slim',pattern:'full-scales',palette:'silver',redFins:true},
  graskarper:{form:'slim',pattern:'full-scales',palette:'olive'},barbeel:{form:'slim',pattern:'full-scales',palette:'bronze',barbels:true},
  riviergrondel:{form:'slim',pattern:'spotted',palette:'brown',barbels:true,narrow:true},witvinriviergrondel:{form:'slim',pattern:'spotted',palette:'silver',barbels:true,narrow:true},
  zwartbekgrondel:{form:'goby',pattern:'mottled',palette:'brown',dorsalSpot:true},marmergrondel:{form:'goby',pattern:'mottled',palette:'bronze'},
  alver:{form:'slim',pattern:'silver',palette:'silver',narrow:true},kopvoorn:{form:'slim',pattern:'full-scales',palette:'olive',redFins:true},
  serpeling:{form:'slim',pattern:'full-scales',palette:'silver',narrow:true},sneep:{form:'slim',pattern:'full-scales',palette:'silver',redFins:true},
  blauwneus:{form:'slim',pattern:'full-scales',palette:'silver',narrow:true},
  baars:{form:'perch',pattern:'barred',palette:'perch',redFins:true},pos:{form:'perch',pattern:'spotted',palette:'brown'},
  snoek:{form:'pike',pattern:'spotted',palette:'olive'},snoekbaars:{form:'perch',pattern:'barred',palette:'silver',long:true},
  meerval:{form:'catfish',pattern:'mottled',palette:'brown',barbels:true},paling:{form:'eel',pattern:'leather',palette:'olive'},
  kwabaal:{form:'cod',pattern:'mottled',palette:'brown',barbels:true},
  beekforel:{form:'salmonid',pattern:'spotted',palette:'gold',redSpots:true},regenboogforel:{form:'salmonid',pattern:'spotted',palette:'trout',rainbow:true},
  vlagzalm:{form:'salmonid',pattern:'spotted',palette:'silver',sailFin:true},roofblei:{form:'slim',pattern:'silver',palette:'silver',long:true},
  steur:{form:'sturgeon',pattern:'scutes',palette:'silver'},
  zeebaars:{form:'perch',pattern:'silver',palette:'ocean',long:true},kabeljauw:{form:'cod',pattern:'spotted',palette:'brown',barbels:true},
  wijting:{form:'cod',pattern:'silver',palette:'silver'},schelvis:{form:'cod',pattern:'silver',palette:'silver',shoulderSpot:true},
  koolvis:{form:'cod',pattern:'silver',palette:'ocean'},leng:{form:'cod',pattern:'mottled',palette:'brown',long:true,barbels:true},
  zeewolf:{form:'catfish',pattern:'barred',palette:'ocean'},
  heilbot:{form:'flat',pattern:'mottled',palette:'brown'},bot:{form:'flat',pattern:'spotted',palette:'olive'},
  schol:{form:'flat',pattern:'orange-spots',palette:'brown'},schar:{form:'flat',pattern:'spotted',palette:'gold'},
  makreel:{form:'tuna',pattern:'wavy',palette:'ocean',small:true},tonijn:{form:'tuna',pattern:'silver',palette:'ocean',yellowFins:true},
  blauwvintonijn:{form:'tuna',pattern:'silver',palette:'ocean'},zwaardvis:{form:'billfish',pattern:'silver',palette:'ocean'},
  goudmakreel:{form:'tuna',pattern:'spotted',palette:'gold',mahi:true,yellowFins:true},wahoo:{form:'pike',pattern:'barred',palette:'ocean'}
};
const ANATOMY = {
  carp:{body:'M64 79 C88 41 135 35 174 43 C203 47 233 62 258 82 C243 92 235 102 216 112 C165 137 96 120 64 91 Z',tail:'M68 78 L26 54 Q36 83 27 119 L68 93 Z',dorsal:'M87 56 Q109 23 140 31 Q167 33 199 56 Z',anal:'M107 112 Q118 145 141 140 L158 118 Z',pelvic:'M179 116 L195 137 207 115 Z',gill:'M213 58 Q190 83 211 113',fin:'M200 91 Q180 92 151 118 Q178 128 205 99',eye:[234,76],mouth:'M246 83 L259 82 M246 91 Q255 96 260 89'},
  deep:{body:'M65 80 C88 39 125 24 159 32 Q206 37 249 80 C232 104 204 123 169 129 Q104 134 65 92 Z',tail:'M68 80 L29 55 L39 88 29 122 68 93 Z',dorsal:'M115 41 L148 12 165 34 181 40 Z',anal:'M92 104 Q124 145 173 139 L188 124 Z',pelvic:'M175 125 L190 143 204 117 Z',gill:'M210 53 Q190 86 213 115',fin:'M202 89 Q174 97 159 120 Q183 123 209 96',eye:[229,75],mouth:'M242 82 L250 81 M241 86 L250 87'},
  slim:{body:'M60 79 Q101 50 155 53 C198 53 233 65 267 82 Q241 100 214 107 C154 121 98 111 60 90 Z',tail:'M66 77 L24 53 37 85 25 115 67 93 Z',dorsal:'M118 57 L148 28 170 52 190 58 Z',anal:'M108 104 L134 132 153 113 Z',pelvic:'M183 111 L204 132 217 105 Z',gill:'M223 64 Q207 84 224 107',fin:'M213 88 L177 118 Q204 119 224 95',eye:[244,77],mouth:'M255 83 L268 83 M254 90 L262 88'},
  goby:{body:'M61 85 Q107 62 160 68 C184 64 205 49 227 57 Q255 62 266 84 Q257 111 224 114 C198 116 179 105 158 104 Q102 106 61 96 Z',tail:'M67 85 Q39 61 27 68 Q17 87 27 109 Q44 115 68 96 Z',dorsal:'M91 75 Q101 48 124 51 L144 68 M145 67 Q171 35 193 44 L207 64 Z',anal:'M95 101 L115 123 166 107 Z',pelvic:'M183 108 Q195 138 221 128 L229 113 Z',gill:'M226 60 Q211 84 231 113',fin:'M217 87 Q189 83 177 105 Q196 129 226 102',eye:[247,73],mouth:'M255 86 L267 86 M254 92 Q261 96 266 89'},
  perch:{body:'M62 79 C102 48 152 43 196 52 Q231 56 262 83 Q240 108 203 115 C150 128 105 112 62 92 Z',tail:'M67 77 L24 53 36 85 25 119 67 95 Z',dorsal:'M87 61 L99 33 107 46 119 22 127 40 140 20 148 40 161 28 173 47 183 35 193 55 M194 54 L204 36 220 58 Z',anal:'M103 109 L128 140 150 118 Z',pelvic:'M181 119 L205 141 215 111 Z',gill:'M218 59 Q199 85 219 112',fin:'M213 88 Q190 88 168 116 Q195 126 225 96',eye:[239,77],mouth:'M248 86 L262 83 M247 94 L260 87'},
  pike:{body:'M63 82 Q103 61 163 65 Q208 62 238 73 L275 79 285 87 273 93 237 96 Q151 115 63 94 Z',tail:'M68 80 L21 54 34 88 23 116 68 96 Z',dorsal:'M81 75 Q94 44 118 48 L144 65 Z',anal:'M78 98 Q92 132 120 120 L139 108 Z',pelvic:'M170 110 L192 131 208 104 Z',gill:'M224 70 Q209 88 229 100',fin:'M221 91 L190 116 224 104 Z',eye:[248,80],mouth:'M240 89 L284 87 M251 94 L275 94'},
  salmonid:{body:'M64 78 Q105 45 164 51 Q213 51 261 81 Q244 104 210 111 Q126 130 64 92 Z',tail:'M68 76 L25 53 37 85 26 117 69 95 Z',dorsal:'M115 54 L138 25 161 33 179 53 Z M80 68 Q84 57 91 62 L98 64',anal:'M102 109 L124 132 145 116 Z',pelvic:'M176 116 L199 138 212 109 Z',gill:'M219 60 Q201 84 222 110',fin:'M211 89 Q185 95 174 117 Q199 123 224 96',eye:[240,75],mouth:'M245 86 L262 81 M241 91 L260 87'},
  cod:{body:'M60 82 Q101 60 147 59 Q196 45 230 62 L269 83 Q254 106 225 112 Q146 124 60 94 Z',tail:'M67 81 Q35 62 27 65 L28 112 Q44 112 68 96 Z',dorsal:'M78 74 L93 53 113 64 M116 64 Q139 32 159 57 M163 56 Q188 23 204 54 Z',anal:'M81 101 L103 119 126 114 M130 114 L147 131 183 118 Z',pelvic:'M195 116 L218 140 222 111 Z',gill:'M226 62 Q207 85 229 111',fin:'M217 88 Q189 90 174 116 L227 99 Z',eye:[246,76],mouth:'M250 86 L270 83 M250 95 L264 89'},
  tuna:{body:'M69 78 C113 42 165 35 203 53 Q239 64 269 84 Q241 107 202 117 C159 132 108 113 69 92 Z',tail:'M74 78 Q49 46 21 32 L45 84 23 136 Q52 121 75 94 Z',dorsal:'M120 51 L158 12 171 49 M94 63 L107 48 116 57 Z',anal:'M109 110 L142 147 154 123 Z',pelvic:'M183 120 L204 139 209 113 Z',gill:'M226 64 Q210 85 228 109',fin:'M218 87 Q172 88 150 120 Q183 108 225 94',eye:[247,78],mouth:'M254 85 L270 84 M253 92 L264 87'},
  billfish:{body:'M68 80 Q108 58 158 59 Q201 53 232 72 L298 73 241 86 Q213 104 174 108 Q108 112 68 93 Z',tail:'M73 79 L34 28 43 84 26 131 Q58 113 75 96 Z',dorsal:'M111 63 Q147 13 162 28 L174 59 Z',anal:'M108 105 Q123 130 148 139 L145 109 Z',pelvic:'M187 105 L203 126 208 99 Z',gill:'M220 66 Q207 83 223 99',fin:'M214 84 L170 115 218 92 Z',eye:[235,78],mouth:'M237 85 L265 81'},
  sturgeon:{body:'M62 83 Q112 58 172 62 Q214 57 253 80 L287 90 256 98 Q153 119 62 95 Z',tail:'M68 82 L28 38 37 83 18 113 68 96 Z',dorsal:'M79 75 L107 41 129 66 Z',anal:'M85 102 L110 128 135 110 Z',pelvic:'M183 113 L207 137 222 106 Z',gill:'M228 65 Q211 86 233 103',fin:'M218 92 Q192 99 183 123 L232 102 Z',eye:[247,81],mouth:'M256 101 Q259 108 265 101'},
  catfish:{body:'M45 84 Q101 64 154 68 Q181 48 218 55 Q254 62 275 88 Q260 115 220 118 Q186 122 154 106 Q101 105 45 98 Z',tail:'M50 84 Q17 72 22 92 Q18 108 51 99 Z',dorsal:'M153 68 Q166 44 175 61 L181 64 Z',anal:'M48 97 Q90 124 166 118 L190 115 Q170 108 151 105 Z',pelvic:'M190 114 L212 137 226 118 Z',gill:'M229 61 Q210 86 232 118',fin:'M220 89 Q185 87 175 115 Q196 134 232 103',eye:[247,77],mouth:'M251 91 Q261 100 275 88 M255 100 L271 95'},
  flat:{body:'M66 86 Q100 32 159 24 Q215 28 254 77 Q269 89 249 102 Q204 143 154 143 Q103 136 66 96 Z',tail:'M72 83 Q40 68 28 74 L29 112 Q47 116 72 98 Z',dorsal:'M71 82 Q94 21 158 15 Q220 17 256 71 L245 78 Q216 36 159 31 Q107 38 80 86 Z',anal:'M74 101 Q101 154 158 152 Q215 150 253 108 L244 104 Q206 139 157 138 Q107 132 83 97 Z',pelvic:'',gill:'M230 63 Q211 86 234 111',fin:'M215 87 Q181 75 174 102 Q190 117 218 95',eye:[243,78],mouth:'M246 94 L260 91 M246 100 L254 98'},
  eel:{body:'M21 108 Q58 128 105 98 C133 79 147 54 181 52 Q222 45 266 77 L280 86 Q271 102 248 101 Q207 74 183 79 C154 79 141 112 111 122 Q53 145 21 116 Z',tail:'',dorsal:'M24 108 Q62 115 104 91 Q135 58 164 45 Q191 31 225 47 L245 62 Q204 42 179 56 Q149 57 110 101 Q66 134 23 114 Z',anal:'M23 116 Q64 145 112 125 Q143 114 163 92 L176 82 Q149 118 119 132 Q58 155 23 120 Z',pelvic:'',gill:'M235 65 Q226 76 238 94',fin:'M236 87 Q218 78 210 95 L238 94 Z',eye:[262,79],mouth:'M266 88 L280 86 M264 93 L274 92'}
};

function skinPattern(pattern, id, palette, opts) {
  const dark=palette[0], light=palette[3];
  let seed=2166136261;for(const char of String(opts.identity||pattern))seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  if(['full-scales','golden'].includes(pattern)) return Array.from({length:7},(_,r)=>Array.from({length:17},(_,c)=>{
    const x=57+c*10+(r%2)*5,y=42+r*11;
    return `<path d="M${x} ${y}q-7 5 0 11" fill="none" stroke="${dark}" stroke-opacity=".32" stroke-width=".75"/><path d="M${x+1} ${y+1}q-4 3-1 7" fill="none" stroke="${light}" stroke-opacity=".4" stroke-width=".5"/>`;
  }).join('')).join('');
  if(['mirror','linear','rows','full-mirror'].includes(pattern)) {
    let positions=[];
    if(pattern==='linear')positions=Array.from({length:13},(_,n)=>[79+n*10,82+Math.sin(n/3)*2,6,9]);
    if(pattern==='rows')positions=[...Array.from({length:12},(_,n)=>[80+n*11,56-Math.sin(n/4)*9,7,9]),...Array.from({length:11},(_,n)=>[88+n*11,109+Math.sin(n/4)*8,7,9])];
    if(pattern==='mirror')positions=[[82,70,8,12],[93,57,9,11],[108,51,10,10],[125,48,11,9],[146,48,10,8],[164,51,7,9],[91,103,10,12],[106,112,8,10],[129,119,12,9],[188,115,9,11],[207,105,8,12],[203,70,7,10],[75,89,8,10]];
    if(pattern==='full-mirror')positions=Array.from({length:6},(_,r)=>Array.from({length:11},(_,c)=>[75+c*13+(r%2)*6,44+r*15+(c%3-1)*2,8+(r+c)%4,10+(c%3)])).flat();
    return positions.map(([x,y,rx,ry],n)=>`<path d="M${x-rx*.5} ${y-ry}Q${x+rx} ${y-ry} ${x+rx*.7} ${y}Q${x+rx} ${y+ry} ${x-rx*.4} ${y+ry}Q${x-rx} ${y} ${x-rx*.5} ${y-ry}Z" fill="${n%3===0?palette[2]:palette[1]}" fill-opacity=".55" stroke="${dark}" stroke-opacity=".65" stroke-width=".8"/>${stroke(`M${x-rx*.25} ${y-ry*.7}Q${x+rx*.7} ${y-ry*.6} ${x+rx*.3} ${y+ry*.6}`,light,.6,'opacity=".6"')}`).join('');
  }
  if(pattern==='barred') return Array.from({length:7},(_,n)=>`<path d="M${80+n*21} 42q-9 30 3 65l8 19 2-29-4-42Z" fill="${dark}" opacity="${opts.form==='pike'?'.45':'.68'}"/>`).join('');
  if(pattern==='wavy')return Array.from({length:16},(_,n)=>stroke(`M${72+n*9} 37q-13 14 0 21t0 19`,dark,2.3,'opacity=".8"')).join('');
  if(pattern==='scutes')return [56,86,109].map((y,r)=>Array.from({length:14},(_,n)=>`<path d="M${69+n*12} ${y+Math.sin(n*.4)*3}l6-5 5 5-5 5Z" fill="${r===1?palette[3]:palette[2]}" stroke="${dark}" stroke-width=".5"/>`).join('')).join('');
  if(['spotted','mottled','orange-spots'].includes(pattern))return Array.from({length:74},(_,n)=>{
    const x=62+random()*165, y=35+random()*97,r=pattern==='mottled'?2+random()*3.5:opts.form==='pike'?1.5+random():.8+random()*1.3;
    const color=pattern==='orange-spots'?'#eb9c53':opts.form==='pike'?palette[3]:dark;
    return `<ellipse cx="${x}" cy="${y}" rx="${r*(opts.form==='pike'?2:1.3)}" ry="${r}" fill="${color}" opacity="${pattern==='mottled'?'.38':'.7'}"/>${opts.redSpots&&n%5===0?`<circle cx="${x+4}" cy="${y+4}" r="2.5" fill="#b44e3c" stroke="#f0d6a4" stroke-width="1"/>`:''}`;
  }).join('');
  return '';
}

export function speciesArt(species) {
  const info=SPECIES_INFO[species?.id]||{}, override=OVERRIDES[species?.id]||{};
  const opts={form:info.form||'slim',pattern:info.pattern||'full-scales',palette:'silver',identity:species?.id,...override};
  const a={...(ANATOMY[opts.form]||ANATOMY.slim)}, p=PALETTES[opts.palette], uid=`plate-${++plateSequence}`;
  if(opts.sailFin)a.dorsal='M105 57L111 18Q142 9 179 24L187 54Z M81 66Q84 57 91 62L99 64';
  if(opts.mahi){a.body='M66 80Q106 61 171 58L215 36Q242 41 261 83Q242 111 208 116Q139 126 66 94Z';a.dorsal='M70 78Q113 43 173 42L217 26 220 39Q191 55 169 61Z';a.eye=[243,72];}
  const finColor=opts.redFins?'#c76443':opts.yellowFins?'#e1bd51':p[4],finStroke=p[2];
  const fin = d => d?`<path d="${d}" fill="url(#${uid}-fin)" stroke="${finStroke}" stroke-width=".85"/>`:'';
  const rays=Array.from({length:22},(_,n)=>stroke(`M${75+n*7} 81L${62+n*8} ${n%2?20:24}`,p[3],.55,'opacity=".48"')).join('');
  const lowerRays=Array.from({length:22},(_,n)=>stroke(`M${71+n*7} 90L${60+n*8} 149`,p[3],.55,'opacity=".35"')).join('');
  const silhouetteTransform=opts.narrow?'translate(0 17) scale(1 .8)':opts.long?'translate(0 9) scale(1 .9)':'';
  const finPaths=[a.tail,a.dorsal,a.anal,a.pelvic,a.fin].filter(Boolean).join(' ');
  const eye=a.eye;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" role="img" aria-label="${esc(species?.name||'Europese vis')}" class="species-illustration species-form-${esc(opts.form)}" data-species="${esc(species?.id||'fish')}" data-pattern="${esc(opts.pattern)}" fill="none"><defs>
    <linearGradient id="${uid}-body" x1="0" y1="0" x2=".16" y2="1"><stop stop-color="${p[0]}"/><stop offset=".36" stop-color="${p[1]}"/><stop offset=".65" stop-color="${p[2]}"/><stop offset=".95" stop-color="${p[3]}"/></linearGradient>
    <linearGradient id="${uid}-fin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p[0]}"/><stop offset=".6" stop-color="${finColor}"/><stop offset="1" stop-color="${p[2]}" stop-opacity=".72"/></linearGradient>
    <linearGradient id="${uid}-sheen" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7f3df" stop-opacity="0"/><stop offset=".43" stop-color="#f7f3df" stop-opacity=".2"/><stop offset=".6" stop-color="#f7f3df" stop-opacity="0"/></linearGradient>
    <clipPath id="${uid}-body-clip"><path d="${a.body}"/></clipPath><clipPath id="${uid}-fin-clip"><path d="${finPaths}"/></clipPath><clipPath id="${uid}-pectoral-clip"><path d="${a.fin}"/></clipPath></defs>
    <ellipse cx="159" cy="147" rx="113" ry="4" fill="#102a37" opacity=".12"/>
    <g transform="translate(7 -2) ${silhouetteTransform}">${fin(a.tail)}${fin(a.dorsal)}${fin(a.anal)}${fin(a.pelvic)}<g clip-path="url(#${uid}-fin-clip)">${rays}${lowerRays}</g>
    <path d="${a.body}" fill="url(#${uid}-body)" stroke="${p[0]}" stroke-width="1.1"/>
    <g clip-path="url(#${uid}-body-clip)">${skinPattern(opts.pattern,uid,p,opts)}${opts.rainbow?'<path d="M63 86Q149 74 235 84" stroke="#b76b86" stroke-width="12" opacity=".48"/>':''}<path d="${a.body}" fill="url(#${uid}-sheen)"/>
    ${stroke('M62 86Q140 73 218 85',p[0],.7,'opacity=".32"')}${stroke('M82 99Q150 121 209 104',p[3],1.1,'opacity=".33"')}</g>
    ${stroke(a.gill,p[0],1.6,'opacity=".7"')}${stroke(a.gill,p[3],.55,'transform="translate(3 0)" opacity=".6"')}${fin(a.fin)}
    <g clip-path="url(#${uid}-pectoral-clip)">${Array.from({length:6},(_,n)=>stroke(`M219 ${91+n}Q${195+n} ${96+n*2} ${177+n*3} ${113-n}`,p[3],.55,'opacity=".43"')).join('')}</g>
    ${opts.form==='tuna'?Array.from({length:5},(_,n)=>`<path d="M${77+n*8} ${73-n*3}l3-7 4 4M${77+n*8} ${99+n*3}l3 7 4-4" fill="${opts.yellowFins?'#edc94f':p[2]}"/>`).join(''):''}
    ${opts.dorsalSpot?'<circle cx="165" cy="53" r="7" fill="#24332e"/>':''}${opts.shoulderSpot?'<ellipse cx="220" cy="91" rx="4" ry="7" fill="#263e43"/>':''}
    <circle cx="${eye[0]}" cy="${eye[1]}" r="5.1" fill="${opts.redFins?'#ca8b54':p[2]}" stroke="${p[0]}" stroke-width=".75"/><circle cx="${eye[0]+.7}" cy="${eye[1]}" r="2.9" fill="#10252a"/><circle cx="${eye[0]+1.6}" cy="${eye[1]-1.3}" r=".95" fill="#fff9e6"/>
    ${opts.form==='flat'?`<circle cx="${eye[0]-7}" cy="${eye[1]-9}" r="3.8" fill="${p[2]}" stroke="${p[0]}"/><circle cx="${eye[0]-6.5}" cy="${eye[1]-9}" r="2.1" fill="#10252a"/>`:''}
    ${stroke(a.mouth,p[0],1.1)}
    ${opts.form==='carp'&&!opts.rounded?stroke('M253 89Q265 97 259 103 M249 93Q254 107 248 110',p[1],1.1):''}
    ${opts.barbels?stroke(opts.form==='catfish'?'M263 92Q288 91 298 105 M257 97Q283 119 282 130 M254 102Q267 120 257 132':'M259 98Q267 111 260 114 M253 100Q257 108 250 112',p[1],1.2):''}
    ${opts.form==='sturgeon'?stroke('M251 98l-3 13 M257 99l-1 14 M264 100l1 10',p[1],1):''}
    </g></svg>`;
}
