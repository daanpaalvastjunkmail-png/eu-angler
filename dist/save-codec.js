import {SPECIES} from './data.js';
const CODEC='europa-history-1',CENTS_CODEC='europa-history-2',BASE=0x4000,OFFSET=0x100,MAX_ROWS=1000000;
const speciesIds=SPECIES.map(f=>f.id),speciesIndex=new Map(speciesIds.map((id,i)=>[id,i]));
const natural=n=>Number.isSafeInteger(n)&&n>=0;
const signed=n=>n<0?-n*2-1:n*2;
const unsigned=n=>n%2?-(n+1)/2:n/2;
const invalid=()=>{throw Error('Invalid packed catch history');};
// Keep the v1 checksum unchanged. Domain-separate v2 so a damaged version tag
// cannot silently multiply or divide every catch value by one hundred.
const checksumSeed=cashScale=>cashScale===100?2166136263:2166136261;
// A UTF-16 storage character holds fourteen data bits. The safe BMP range never
// contains JSON quotes, escapes, control characters or unmatched surrogates.
function writer(seed){let block=[],chunks=[],check=seed;return {write(value){do{const part=value%BASE;value=Math.floor(value/BASE);const code=OFFSET+part+(value?BASE:0);block.push(code);check=Math.imul(check^code,16777619)>>>0;if(block.length===8192){chunks.push(String.fromCharCode(...block));block=[];}}while(value);},finish(){if(block.length)chunks.push(String.fromCharCode(...block));return {text:chunks.join(''),check};}};}
function reader(text,expected,seed){let check=seed;for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);if(code<OFFSET||code>=OFFSET+BASE*2)invalid();check=Math.imul(check^code,16777619)>>>0;}if(check!==expected)invalid();let at=0;return {read(){let value=0,multiplier=1,groups=0;while(at<text.length){const code=text.charCodeAt(at++)-OFFSET,digit=code%BASE;value+=digit*multiplier;if(!natural(value))invalid();if(code<BASE){if(groups&&digit===0)invalid();return value;}multiplier*=BASE;if(++groups>3)invalid();}invalid();},finished(){return at===text.length;}};}
function canonical(row,previousId,previousTime,cashScale=1){
 if(!Array.isArray(row)||row.length!==9||!natural(row[0])||!speciesIndex.has(row[1])||!Number.isFinite(row[2])||row[2]<=0||Math.round(row[2]*100)/100!==row[2]||!natural(Math.round(row[2]*100))||!natural(Math.round(row[3]*cashScale))||Math.round(row[3]*cashScale)/cashScale!==row[3]||!natural(row[4])||!natural(row[5])||!Number.isInteger(row[6])||row[6]<0||row[6]>15||!Number.isInteger(row[7])||row[7]<0||row[7]>5||!(row[8]===null||natural(row[8])&&row[8]<Number.MAX_SAFE_INTEGER))return false;
 return natural(signed(row[0]-previousId))&&natural(signed(row[5]-previousTime));
}
export function packHistory(rows){
 if(!Array.isArray(rows)||rows.length<32||rows.length>MAX_ROWS)return rows;
 // Existing whole-euro histories retain their original format and large-integer range.
 const cashScale=rows.some(row=>Array.isArray(row)&&!Number.isSafeInteger(row[3]))?100:1;
 let previousId=0,previousTime=0;for(const row of rows){if(!canonical(row,previousId,previousTime,cashScale))return rows;previousId=row[0];previousTime=row[5];}
 const out=writer(checksumSeed(cashScale));previousId=0;previousTime=0;
 for(const row of rows){for(const n of [signed(row[0]-previousId),speciesIndex.get(row[1]),Math.round(row[2]*100),Math.round(row[3]*cashScale),row[4],signed(row[5]-previousTime),row[6]+row[7]*16,row[8]===null?0:row[8]+1])out.write(n);previousId=row[0];previousTime=row[5];}
 const {text,check}=out.finish();return {codec:cashScale===100?CENTS_CODEC:CODEC,count:rows.length,species:speciesIds,text,check};
}
export function unpackHistory(value){
 if(!value||Array.isArray(value)||typeof value!=='object'||!Object.hasOwn(value,'codec'))return value;
 if(![CODEC,CENTS_CODEC].includes(value.codec)||!natural(value.count)||value.count>MAX_ROWS||typeof value.text!=='string'||value.text.length>MAX_ROWS*32||!natural(value.check)||value.check>0xffffffff||!Array.isArray(value.species)||value.species.length>SPECIES.length||new Set(value.species).size!==value.species.length||value.species.some(id=>!speciesIndex.has(id)))invalid();
 const cashScale=value.codec===CENTS_CODEC?100:1,input=reader(value.text,value.check,checksumSeed(cashScale)),rows=[];let previousId=0,previousTime=0;
 for(let i=0;i<value.count;i++){
  const id=previousId+unsigned(input.read()),species=value.species[input.read()],weight=input.read()/100,cash=input.read()/cashScale,xp=input.read(),time=previousTime+unsigned(input.read()),flags=input.read(),reaction=input.read();
  const row=[id,species,weight,cash,xp,time,flags%16,Math.floor(flags/16),reaction?reaction-1:null];
  if(!canonical(row,previousId,previousTime,cashScale))invalid();rows.push(row);previousId=id;previousTime=time;
 }
 if(!input.finished())invalid();return rows;
}
// Only the internal persistence representation is compressed. Simulation state
// and exported JSON retain the complete, ordinary nine-column catch arrays.
export function packSave(state){return {...state,session:state.session?{...state.session,fish:packHistory(state.session.fish)}:state.session,sessions:Array.isArray(state.sessions)?state.sessions.map(j=>({...j,fish:packHistory(j.fish)})):state.sessions};}
export function unpackSave(raw){if(!raw||typeof raw!=='object')return raw;return {...raw,session:raw.session&&typeof raw.session==='object'?{...raw.session,fish:unpackHistory(raw.session.fish)}:raw.session,sessions:Array.isArray(raw.sessions)?raw.sessions.map(j=>j&&typeof j==='object'?{...j,fish:unpackHistory(j.fish)}:j):raw.sessions};}
