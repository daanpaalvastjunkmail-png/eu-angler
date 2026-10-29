import {ENGLISH} from './i18n-data.js';
import {ATELIER_ENGLISH} from './atelier-i18n.js';

export const LANGUAGES=Object.freeze([{id:'en',name:'English'},{id:'nl',name:'Nederlands'}]);
export const languageName=code=>LANGUAGES.find(language=>language.id===code)?.name||'English';
const textSources=new WeakMap(),attributeSources=new WeakMap();
const attributes=['aria-label','aria-valuetext','aria-description','title','placeholder','alt','data-label'];
const excluded='script,style,noscript,textarea,code,[contenteditable]:not([contenteditable="false"]),[data-no-translate]';
const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const isWord=value=>/[\p{L}\p{N}_]/u.test(value||'');
const phrases=new Map();
for(const [source,target]of Object.entries({...ENGLISH,...ATELIER_ENGLISH})){
 phrases.set(source,target);
 if(source!==source.toUpperCase())phrases.set(source.toUpperCase(),target.toUpperCase());
}
// One pass prevents translating an English replacement again (e.g. "carp").
const phrasePattern=new RegExp([...phrases.keys()].sort((a,b)=>b.length-a.length).map(escaped).join('|'),'gu');

function translateSegment(source){
 const trim=source.trim(),leading=source.slice(0,source.indexOf(trim)),trailing=source.slice(source.indexOf(trim)+trim.length);
 if(phrases.has(trim))return leading+phrases.get(trim)+trailing;
 source=source.replace(/Hengel kiezen voor plaats (\d+)/g,'Choose rod for slot $1').replace(/Maximaal (\d+) hengels voor (feeder|karper|dobber|zee)\./g,(_,count,method)=>`At most ${count} ${{feeder:'feeder',karper:'carp',dobber:'float',zee:'sea'}[method]} rods.`).replace(/^Deze combinatie vraagt level (\d+)\. Kies lichtere hengels of minder lijnen\./,'This combination requires level $1. Choose lighter rods or fewer lines.').replace(/Deze combinatie vraagt (\d+) scholingspunten; je hebt (\d+)\. Beschikbaar vanaf level (\d+)\./g,'This combination needs $1 training points; you have $2. Available from level $3.').replace(/^Hengel (\d+): beschadigd door overbelasting \(([\d,.]+)%\)\./,'Rod $1: damaged by overloading ($2%).').replace(/^Plaats (\d+) leegmaken$/,'Clear slot $1').replace(/^Nog (\d+) plaatsen in je vangstopslag\./,'$1 spaces left in your catch storage.').replace(/\b(\d+) lijn(en)? actief\b/g,(_,count,plural)=>`${count} active line${plural?'s':''}`)
  .replace(/\b(\d+) LIJN(EN)? IN HET WATER\b/g,(_,count,plural)=>`${count} LINE${plural?'S':''} IN THE WATER`)
  .replace(/\bOp plaats (\d+) zetten\b/g,'Apply to slot $1')
  .replace(/^Hengel (\d+), (.*?) bekijken$/,(_,count,style)=>`View rod ${count}, ${translateSegment(style)}`)
  .replace(/\bAanslaan op hengel (\d+)\b/g,'Strike rod $1')
  .replace(/\bRed de beet op hengel (\d+)\b/g,'Rescue the bite on rod $1');
 return source.replace(phrasePattern,(match,offset,input)=>{
  if(isWord(match[0])&&isWord(input[offset-1])||isWord(match.at(-1))&&isWord(input[offset+match.length]))return match;
  return phrases.get(match);
 }).replace(/\blijn(en)?\b/g,(_,plural)=>plural?'lines':'line')
  .replace(/\b(\d+)u (?=\d+m\b)/g,'$1h ')
  .replace(/\bvan ([\d,.]+\s*kg)\b/g,'weighing $1')
  .replace(/\b(\d+) van (\d+)\b/g,'$1 of $2')
  .replace(/\b([\d,.]+) hour\b/g,(_,n)=>`${n} hour${n==='1'?'':'s'}`)
  .replace(/\b([\d,.]+) min\b/g,(_,n)=>`${n} min`)
  .replace(/\b([\d,.]+) piece(s)?\b/g,(_,n)=>`${n} piece${n==='1'?'':'s'}`);
}

/** Translate source text without interpreting it as HTML. Proper place names stay unchanged.
 * userTexts protects complete player-authored names, including names embedded in options.
 */
export function translateText(value,language='en',{userTexts=[]}={}){
 const source=String(value??'');if(language==='nl'||!source.trim())return source;
 const protectedTexts=[...new Set(userTexts.filter(text=>typeof text==='string'&&text))].sort((a,b)=>b.length-a.length);
 if(!protectedTexts.length)return translateSegment(source);
 const pattern=new RegExp(protectedTexts.map(escaped).join('|'),'gu'),parts=[];let at=0;
 for(const match of source.matchAll(pattern)){parts.push(translateSegment(source.slice(at,match.index)),match[0]);at=match.index+match[0].length;}
 parts.push(translateSegment(source.slice(at)));return parts.join('');
}

function sourceFor(map,node,current){
 let record=map.get(node);
 // Rendering/live updates replace output with fresh Dutch text. Capture that as
 // a new source, but retain the original when our last output is still present.
 if(!record||record.output!==current){record={source:current,output:current};map.set(node,record);}
 return record;
}

/** Apply immediately after render/live updates. Calling repeatedly is idempotent;
 * switching to nl restores original source in-place, without touching saved data.
 * data-user-text protects visible text, while the element's accessible labels
 * and placeholder are still translated. Input values are never translated.
 */
export function applyLanguage(root,language='en',options={}){
 if(!root)return;language=language==='nl'?'nl':'en';
 const document=root.nodeType===9?root:root.ownerDocument;if(!document)return;
 const start=root.nodeType===9?document.documentElement:root;
 const walker=document.createTreeWalker(start,4);let node;
 while((node=walker.nextNode())){
  const parent=node.parentElement;
  if(!parent||parent.closest(excluded)||parent.closest('[data-user-text]'))continue;
  const record=sourceFor(textSources,node,node.nodeValue||''),output=language==='nl'?record.source:translateText(record.source,language,options);
  if(node.nodeValue!==output)node.nodeValue=output;record.output=output;
 }
 const elements=[...(start.nodeType===1?[start]:[]),...start.querySelectorAll(attributes.map(name=>`[${name}]`).join(','))];
 for(const element of elements){
  if(element.closest(excluded))continue;
  let records=attributeSources.get(element);if(!records){records=new Map();attributeSources.set(element,records);}
  for(const name of attributes){
   if(!element.hasAttribute(name))continue;
   const current=element.getAttribute(name),record=sourceFor(records,name,current),output=language==='nl'?record.source:translateText(record.source,language,options);
   if(current!==output)element.setAttribute(name,output);record.output=output;
  }
 }
 if(root.nodeType===9||start===document.documentElement)document.documentElement.lang=language;
}
