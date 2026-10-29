import {sceneRods} from './angling-visuals.js';
import {landscapeFor} from './atelier-assets.js';
let sceneSequence=0;

export function lakeScene(water,rods=1,active=false){
 const rigs=Array.isArray(rods)?rods:Array.from({length:rods},()=>({style:'feeder'}));
 const sea=water.sea,id=`lake-scene-${++sceneSequence}`,landscape=landscapeFor(water),lake=water.color||'#709586';
 const alignment=water.id==='lumiere'?'xMaxYMid':water.id==='rhein'?'xMinYMid':'xMidYMid';
 return `<svg class="lake-illustration ${active?'is-fishing':''}" viewBox="0 0 900 390" xmlns="http://www.w3.org/2000/svg" aria-label="${sea?'Zonlicht over het open zeewater':'Een Europees viswater in het zachte ochtendlicht'}" role="img"><defs>
 <linearGradient id="${id}-fallback" x2="0" y2="1"><stop stop-color="#c4d6dc"/><stop offset=".5" stop-color="${lake}"/><stop offset="1" stop-color="#264e62"/></linearGradient>
 <linearGradient id="${id}-depth" x2="0" y2="1"><stop stop-color="#20384d" stop-opacity="0"/><stop offset=".6" stop-color="#20384d" stop-opacity="0"/><stop offset="1" stop-color="#142e3e" stop-opacity=".48"/></linearGradient>
 <linearGradient id="${id}-mist" x2="0" y2="1"><stop stop-color="#e6e1c8" stop-opacity=".10"/><stop offset="1" stop-color="#e6e1c8" stop-opacity="0"/></linearGradient>
 <linearGradient id="${id}-timber" x2="1" y2="1"><stop stop-color="#b28e67"/><stop offset="1" stop-color="#5b5149"/></linearGradient></defs>
 <rect width="900" height="390" fill="url(#${id}-fallback)"/><image class="lake-landscape" href="${landscape.src}" x="0" y="0" width="900" height="390" preserveAspectRatio="${alignment} slice"/>
 <rect width="900" height="390" fill="url(#${id}-depth)"/><rect y="170" width="900" height="90" fill="url(#${id}-mist)"/>
 <g stroke="#e2e5ce" stroke-linecap="round" fill="none" opacity=".22">${Array.from({length:29},(_,i)=>{const x=(i*173)%930,y=222+((i*53)%160);return `<path class="water-glint" style="animation-delay:${i*.23}s" d="M${x} ${y}h${9+i%6*8}" stroke-width="${i%3===0?1:.6}"/>`;}).join('')}</g>
 ${rigs.length?(sea?`<g transform="translate(320 270)"><ellipse cx="120" cy="70" rx="150" ry="17" fill="#143747" opacity=".5"/><path d="M-15 12h280l-44 72H24Z" fill="#e1d9c2" stroke="#b6c7c7"/><path d="M24 84h197l10-15H17Z" fill="#af6b4d"/><path d="M80-53h83v63H80Z" fill="#e4ddcb"/><path d="M89-43h27v31H89Zm35 0h27v31h-27Z" fill="#3b667b"/><path d="M68-56h108l-10-9H76Z" fill="#334957"/><path d="M134-66v-46m0 7h39" stroke="#d1d5c9" stroke-width="3"/></g>`:`<g class="lake-pier"><path d="M353 390l37-125h111l46 125Z" fill="#3e4b4b"/><path d="M360 390l34-121h103l43 121Z" fill="url(#${id}-timber)"/>${Array.from({length:10},(_,i)=>`<path d="M${392-i*3.6} ${272+i*13}h${105+i*7.4}" stroke="#455052" stroke-width="2"/><path d="M${394-i*3.6} ${275+i*13}h${100+i*7.4}" stroke="#c8ad87" stroke-width=".5" opacity=".5"/>`).join('')}<path d="M392 269l-34 121m139-121 43 121" stroke="#c2a581" stroke-width="2.2"/><path d="M370 353v-44m153 44v-44" stroke="#645e53" stroke-width="9"/><path d="M370 311l5 4m148-4-5 4" stroke="#dfc49b" stroke-width="7"/></g>`):''}
 ${sceneRods(rigs)}<g fill="none" stroke="#344d5a" stroke-width="1.2" opacity=".6"><path d="M360 78q5-7 10 0q5-7 10 0M402 62q4-5 8 0q4-5 8 0M337 98q3-5 6 0q3-5 6 0"/></g></svg>`;
}

export function boatArt(type='cutter'){
 const id=`boat-${++sceneSequence}`,large=type==='pelagic',trawler=type==='trawler',hull=large?'#385970':trawler?'#487e86':'#a46149';
 return `<svg viewBox="0 0 400 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${large?'Groot pelagisch visserschip':trawler?'Noordzee trawler':'Klassieke viskotter'}" fill="none"><defs><linearGradient id="${id}-hull" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${hull}"/><stop offset="1" stop-color="#253e50"/></linearGradient><linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#93c0c8"/><stop offset="1" stop-color="#34566b"/></linearGradient></defs>
 <ellipse cx="200" cy="145" rx="145" ry="6" fill="#17394d" opacity=".15"/><path d="M34 100Q180 107 362 96L324 137Q225 152 83 137Z" fill="url(#${id}-hull)" stroke="#1e3b50" stroke-width="1"/><path d="M42 104Q191 112 354 101" stroke="#efe4cb" stroke-width="4"/><path d="M81 133Q202 147 327 133" stroke="#c59a69" stroke-width="2"/>
 <path d="M121 53H225L234 101H118Z" fill="#e0ddcd" stroke="#8ba1a6" stroke-width="1"/><path d="M117 51H229V57H117Z" fill="#344d60"/><path d="M137 63H164V83H135ZM173 63H204L207 83H173Z" fill="url(#${id}-glass)" stroke="#365363"/><path d="M139 66L159 67M177 66L199 67" stroke="#e9efd9" stroke-width="1" opacity=".65"/>
 <path d="M183 50V18M183 23H247M234 24V97M180 18H188" stroke="#7797a5" stroke-width="2.5"/><path d="M235 27L290 94M180 22L100 98" stroke="#97a9ab" stroke-width=".8"/><path d="M186 29L207 33 186 39Z" fill="#c68b5b"/><rect x="213" y="42" width="8" height="10" rx="1" fill="#c97b57"/>
 ${large?'<path d="M241 62H316V99H241Z" fill="#d9ded3" stroke="#7896a2"/><path d="M249 68H308V81H249Z" fill="#436c80"/><path d="M259 62V35H294V62M251 35H304" stroke="#87a1aa" stroke-width="2"/><path d="M90 91H112V63H90Z" fill="#dadbca"/>':trawler?'<path d="M257 95V54H319V97M266 54L275 90M309 54L298 90" stroke="#7e9ca5" stroke-width="3"/><path d="M274 90Q286 65 299 90V99H274Z" fill="#708f84" stroke="#b3bbae"/>':'<rect x="268" y="82" width="48" height="19" rx="3" fill="#7b8d70" stroke="#bcc3a7"/><path d="M278 83V100M293 82V100M308 83V100" stroke="#566d63"/>'}
 <path d="M64 98V85M80 99V85M95 100V85M61 85H111M241 96V83M255 95V83M324 95V82M340 93V80M239 83L344 80" stroke="#a9bfc2" stroke-width="1"/>
 <circle cx="110" cy="114" r="7" fill="#203c4c" stroke="#a9b6b1" stroke-width="1.3"/><circle cx="110" cy="114" r="3.2" fill="#9da9a3"/><circle cx="303" cy="114" r="7" fill="#203c4c" stroke="#a9b6b1" stroke-width="1.3"/><circle cx="303" cy="114" r="3.2" fill="#9da9a3"/>
 <path d="M31 153q30-7 60 0t60 0t60 0t60 0t60 0t60 0M70 160q22-4 45 0m120-1q24-4 48 0" stroke="#75aab3" stroke-width=".8" opacity=".55"/></svg>`;
}
