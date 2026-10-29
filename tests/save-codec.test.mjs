import {assembleRods} from './tackle-fixtures.mjs';
import assert from 'node:assert/strict';
import {SAVE_KEY} from '../dist/save-store.js';
import {performance} from 'node:perf_hooks';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {GEAR,SPECIES} from '../dist/data.js';
import {SESSION_CAP} from '../dist/economy.js';
import {packHistory,unpackHistory,packSave,unpackSave} from '../dist/save-codec.js';
const checks=[],KEY=SAVE_KEY,LIMIT=4*1024*1024;
function setup(){let now=1800000000000;const data=new Map();let bytes=0;const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{if((k.length+v.length)*2>LIMIT)throw Error('QuotaExceededError');data.set(k,v);bytes=(k.length+v.length)*2;}};const g=new IdleGame({storage,now:()=>now});g.state.seed=123456;return {g,storage,data,now:()=>now,setNow:n=>{now=n;},bytes:()=>bytes};}
function weekReady(g){g.state.xp=xpAt(300);g.state.money=1e12;g.state.rodSlots=6;for(const x of GEAR)g.state.gear[x.id]=6;Object.assign(g.state.upgrades,{offline:5,autosell:1,rodrest:2,autostrike:3,stealth:3});g.state.settings.autosell=true;g.state.settings.keepTrophies=false;const rods=['feeder','feeder','karper','karper','karper','dobber'].map((style,slot)=>({...starterRod(style),slot,rod:`${style}_rod_sovereign`,reel:`${style}_reel_sovereign`,terminal:`${style}_terminal_sovereign`,line:'line_sovereign',hook:'hook_8',liquid:'liquid_scopex'}));assert(g.setSessionRods(assembleRods(g,rods)).ok);assert(g.selectWater('poldermeer').ok);g.setPlan({duration:SESSION_CAP,reserve:.1});assert(g.startSession().ok);}
{
 const rows=Array.from({length:256},(_,i)=>[1000+(i%3?i:i-2),SPECIES[i%SPECIES.length].id,(i+1)/100,i%7?i*90123:Number.MAX_SAFE_INTEGER,i*3101,i%5?i*100:Math.max(0,i*99-5),i%16,i%6,i%2?null:i*111]);const original=structuredClone(rows),packed=packHistory(rows);assert.equal(packed.codec,'europa-history-1');assert.deepEqual(unpackHistory(packed),rows);assert.deepEqual(rows,original);assert.deepEqual(unpackHistory(JSON.parse(JSON.stringify(packed))),rows);assert(packed.text.length<JSON.stringify(rows).length/2);for(const ch of packed.text){const code=ch.charCodeAt(0);assert(code>=0x100&&code<=0x80ff);}
 checks.push('Lossless codec preserves all nine catch fields, species, descending deltas, null reactions and large safe integers using JSON-safe Unicode');
}
{
 const rows=Array.from({length:40},(_,i)=>[i,'schub',1.23,10,20,i,0,5,null]);for(const modify of [r=>r[0]='custom_id',r=>r[1]='future_fish',r=>r[2]=1.2345,r=>r[3]=10.255,r=>r[8]=1.5,r=>r[6]=32]){const special=structuredClone(rows);modify(special[5]);assert.equal(packHistory(special),special);assert.deepEqual(unpackHistory(packHistory(special)),special);}assert.equal(packHistory(rows.slice(0,5)).length,5);const packed=packHistory(rows);for(const changed of [{...packed,codec:'future-codec'},{...packed,count:1000001},{...packed,count:packed.count+1},{...packed,text:packed.text+'x'},{...packed,check:packed.check^1},{...packed,species:['unknown']},{...packed,text:packed.text.slice(0,-1)}])assert.throws(()=>unpackHistory(changed),/Invalid/);
 checks.push('Legacy/special catch arrays remain unchanged; corrupted, truncated, unknown-version and oversized packed histories are rejected completely');
}
{
 // A fixed v1 payload from before cent pricing: no current encoder is used to
 // construct this compatibility fixture, including its original checksum.
 const legacy={codec:'europa-history-1',count:1,species:['voorn'],text:'\u010e\u0100\u0119\u010c\u0109\u0100\u0100\u0100',check:1435223551};
 assert.deepEqual(unpackHistory(legacy),[[7,'voorn',.25,12,9,0,0,0,null]]);
 assert.deepEqual(unpackSave({sessions:[{id:1,fish:legacy}]}).sessions[0].fish,[[7,'voorn',.25,12,9,0,0,0,null]]);
 assert.throws(()=>unpackHistory({...legacy,codec:'europa-history-2'}),/Invalid/);
 checks.push('A fixed pre-update v1 payload retains its exact whole-euro catch and checksum, while a changed version tag is rejected');
}
{
 const decimalRows=Array.from({length:128},(_,i)=>[i+1,'voorn',.2,Math.round((i*.29+.01)*100)/100,9,i,0,0,null]);const packed=packHistory(decimalRows);assert.equal(packed.codec,'europa-history-2');assert.deepEqual(unpackHistory(JSON.parse(JSON.stringify(packed))),decimalRows);const oldRows=decimalRows.map(r=>[...r.slice(0,3),Math.floor(r[3]),...r.slice(4)]),oldPacked=packHistory(oldRows);assert.equal(oldPacked.codec,'europa-history-1');assert.deepEqual(unpackHistory(oldPacked),oldRows);assert.throws(()=>unpackHistory({...packed,codec:'europa-history-3'}),/Invalid/);for(const corrupted of [{...packed,codec:'europa-history-1'},{...packed,check:packed.check^1},{...packed,count:packed.count+1},{...packed,text:packed.text.slice(0,-1)},{...packed,species:['future_fish']}])assert.throws(()=>unpackHistory(corrupted),/Invalid/);assert.equal(packHistory(decimalRows.map((r,i)=>i===0?[...r.slice(0,3),Number.MAX_SAFE_INTEGER,...r.slice(4)]:r)).length,128);
 checks.push('Cent-priced histories compress losslessly with v2 while original whole-euro v1 histories, large values and readable exports remain compatible');
}
{
 const c=setup();weekReady(c.g);c.setNow(c.now()+600000);c.g.advanceTo(c.now());assert(c.g.state.session.fish.length>=32);const before=structuredClone(c.g.state.session),saved=JSON.parse(c.storage.getItem(KEY));assert.equal(saved.session.fish.codec,'europa-history-2');assert(Array.isArray(c.g.state.session.fish));const reload=new IdleGame({storage:c.storage,now:c.now});assert.deepEqual(reload.state.session.fish,before.fish);assert.equal(reload.state.session.remaining,before.remaining);assert(reload.state.session.remaining>48*3600);assert.deepEqual(reload.sessionRows(),c.g.sessionRows());const cash=reload.state.money,exported=JSON.parse(reload.exportSave());assert(Array.isArray(exported.save.session.fish));const bad=packSave(exported.save);bad.session.fish.check^=1;assert.equal(reload.importSave(JSON.stringify({save:bad})).ok,false);assert.equal(reload.state.money,cash);assert.deepEqual(reload.state.session.fish,before.fish);
 checks.push('A running week session reloads its full ledger and remaining time; exports remain ordinary JSON arrays and malformed imports cannot change current progress');
}
{
 const c=setup();weekReady(c.g);const begin=performance.now();c.setNow(c.now()+SESSION_CAP*1000);c.g.advanceTo(c.now());const elapsed=performance.now()-begin;assert.equal(c.g.state.session,null);assert(c.g.state.stats.caught>100000);assert.equal(c.g.storageError,false);assert(c.bytes()<LIMIT);const plain=JSON.stringify(c.g.state);assert(plain.length*2>LIMIT);assert.throws(()=>c.storage.setItem('uncompressed',plain),/Quota/);const stored=JSON.parse(c.storage.getItem(KEY));assert.equal(stored.sessions[0].fish.codec,'europa-history-2');assert.deepEqual(unpackSave(stored).sessions[0].fish,c.g.state.sessions[0].fish);const reload=new IdleGame({storage:c.storage,now:c.now});assert.equal(reload.state.stats.caught,c.g.state.stats.caught);assert.equal(reload.state.money,c.g.state.money);assert.deepEqual(reload.state.sessions[0].fish,c.g.state.sessions[0].fish);assert.deepEqual(reload.sessionRows(),c.g.sessionRows());const exportText=reload.exportSave(),exportUtf8Bytes=new TextEncoder().encode(exportText).length;assert(exportUtf8Bytes<64*1024*1024,'The complete human-readable week export must fit the 64-MiB import allowance');const exported=JSON.parse(exportText);assert(Array.isArray(exported.save.sessions[0].fish));const imported=new IdleGame({storage:null,now:c.now});assert(imported.importSave(JSON.stringify(exported)).ok);assert.deepEqual(imported.state.sessions[0].fish,c.g.state.sessions[0].fish);const legacyStorage={getItem:k=>k===KEY?plain:null,setItem:()=>{}};const legacy=new IdleGame({storage:legacyStorage,now:c.now});assert.deepEqual(legacy.state.sessions[0].fish,c.g.state.sessions[0].fish);
 console.log(JSON.stringify({weekPersistence:{catches:c.g.state.stats.caught,plainUtf16Bytes:plain.length*2,packedUtf16Bytes:c.bytes(),exportUtf8Bytes,quotaUtf16Bytes:LIMIT,elapsedMs:Math.round(elapsed)}},null,2));
 checks.push('All catches from an upgraded six-rod week save under a four-MiB quota, reload identically and remain compatible with readable exports and old plain saves');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
