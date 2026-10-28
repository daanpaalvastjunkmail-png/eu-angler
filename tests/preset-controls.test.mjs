import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {IdleGame,starterRod,xpAt} from '../dist/engine.js';
import {rodSnapshot} from '../dist/rig-presets.js';
import {SAVE_KEY} from '../dist/save-store.js';
import {assembleRods,memoryStorage} from './tackle-fixtures.mjs';
const checks=[],now=()=>1800000000000;
const make=level=>{const g=new IdleGame({storage:null,now});g.state.xp=xpAt(level);g.state.money=1e7;g.state.rodSlots=6;return g;};
for(const [method,cap,companion] of [['feeder',4,'dobber'],['karper',4,'dobber'],['dobber',2,'feeder']]){
 const g=make(300),rods=assembleRods(g,[...Array(cap).fill(starterRod(method)),...Array(6-cap).fill(starterRod(companion))]);
 assert(g.setSessionRods(rods).ok,method);assert(g.quote().valid);assert(g.startSession().ok);assert.equal(g.state.session.loadout.rods.length,6);
 assert(!g.chooseSessionRod(0,'rig_karper').ok,'Active sessions cannot silently change rods');assert(!g.setSessionRods([]).ok);g.stop();
 const extra=assembleRods(g,Array(cap+1).fill(starterRod(method))),before=structuredClone(g.state.selectedRods),cash=g.state.money;
 const result=g.setSessionRods(extra);assert(!result.ok);assert(result.message.includes('Maximaal '+cap),result.message);assert.deepEqual(g.state.selectedRods,before);assert.equal(g.state.money,cash);
 checks.push(`Six mixed rods work, but ${cap+1} ${method} rods are rejected without changing selection or spending money`);
}
{
 const g=make(300),rods=assembleRods(g,['feeder','feeder','feeder','karper','karper','dobber'].map(starterRod));assert(g.setSessionRods(rods).ok);
 const extra=assembleRods(g,['feeder','feeder','feeder','karper','karper','dobber','dobber'].map(starterRod));assert(!g.setSessionRods(extra).ok);
 assert(!g.setSessionRods([{...rods[0],slot:0},{...rods[0],slot:1}]).ok);assert(!g.chooseSessionRod(6,'rig_karper').ok);
 assert(g.chooseSessionRod(0,'').ok);assert(!g.state.selectedRods.some(r=>r.slot===0));assert(g.chooseSessionRod(0,rods[0].sourcePresetId).ok);
 assert(!('loadouts' in g.state));assert(!('activeLoadout' in g.state));assert(!JSON.parse(g.exportSave()).save.loadouts);
 checks.push('The total cap, unique physical rods and unique slots are enforced; clearing works without saving a full loadout');
}
{
 const g=make(9);g.state.rodSlots=1;assert(!g.chooseSessionRod(1,'rig_karper').ok);assert(!g.buySlot().ok);g.state.xp=xpAt(10);assert(g.buySlot().ok);assert(g.chooseSessionRod(1,'rig_karper').ok);
 const p=g.state.rodPresets.find(p=>p.id==='rig_feeder');assert(g.buyGear('feeder_rod_scout').ok);const item=g.state.tackleItems.find(i=>i.gearId==='feeder_rod_scout');assert(g.saveRodPreset(p.id,p.name,{...p.rod,rod:item.gearId},{...p.items,rod:item.id}).ok);
 assert(!g.quote().valid);assert(g.quote().error.includes('15'));g.state.xp=xpAt(15);assert(g.quote().valid);
 g.state.xp=xpAt(10);assert(g.chooseSessionRod(1,'').ok,'Clearing remains possible if selection is too heavy');assert(g.chooseSessionRod(0,'').ok);assert.equal(g.loadout.rods.length,0);assert(!g.quote().valid);
 checks.push('Purchased positions and level scaling remain; tier increases require training and invalid selections can still be cleared');
}
{
 const rod=rodSnapshot({...starterRod('feeder'),style:'karper'});assert.equal(rod.style,'feeder');
 const g=make(300);
 assert.equal(g.validRod({...starterRod('feeder'),style:'karper'}),'Deze visstijl bestaat niet.');
 assert(g.chooseSessionRod(0,'rig_dobber').ok);assert.equal(g.loadout.rods[0].style,'dobber');
 const item=g.rodItem(g.loadout.rods[0]);item.condition=0;assert(!g.quote().valid);assert(!g.startSession().ok);
 checks.push('Rod type determines the method; forged method metadata and broken rods cannot bypass selection validation');
}
{
 const g=make(300),rods=assembleRods(g,['feeder','dobber','dobber'].map(starterRod));assert(g.setSessionRods(rods).ok);
 const p=g.state.rodPresets.find(p=>p.id===rods[0].sourcePresetId),items={...p.items};
 for(const part of ['rod','reel','terminal']){const id='dobber_'+part+'_field';assert(g.buyGear(id).ok);items[part]=g.state.tackleItems.filter(i=>i.gearId===id).at(-1).id;}
 const result=g.saveRodPreset(p.id,p.name,{...p.rod,rod:'dobber_rod_field',reel:'dobber_reel_field',terminal:'dobber_terminal_field'},items);assert(result.ok);assert(result.message.includes('stijlgrens'));
 assert.equal(g.state.rodPresets.find(q=>q.id===p.id).rod.style,'dobber');assert.equal(g.state.selectedRods.length,2);assert(!g.state.selectedRods.some(r=>r.sourcePresetId===p.id));assert(g.quote().valid);
 checks.push('Changing a preset to float when two floats are already selected saves the preset but removes that rod from the selection, so editing cannot exceed the cap');
}
{
 const original=JSON.parse(await fs.readFile(new URL('./fixtures/save-3.0.0.json',import.meta.url),'utf8'));
 const storage=memoryStorage();storage.setItem(SAVE_KEY,JSON.stringify(original));
 const g=new IdleGame({storage,now:()=>original.lastAt});assert(!g.store.blocked);assert.equal(g.state.schemaVersion,4);
 for(const key of ['money','xp','tackleItems','rodPresets','permits','net','records','stats'])assert.deepEqual(g.state[key],original[key],key);
 for(const key of ['stock','gear'])for(const [id,n]of Object.entries(original[key]))assert.equal(g.state[key][id],n,key+':'+id);
 assert.deepEqual(g.state.selectedRods,original.loadouts.find(l=>l.id===original.activeLoadout).rods);
 for(const [key,value]of Object.entries(original.session))if(key!=='rods')assert.deepEqual(g.state.session[key],value,'session:'+key);
 for(const [index,runtime]of original.session.rods.entries())for(const [key,value]of Object.entries(runtime))assert.deepEqual(g.state.session.rods[index][key],value,'runtime:'+index+':'+key);assert(!('loadouts' in g.state));assert(!('activeLoadout' in g.state));
 const exported=JSON.parse(g.exportSave()).save;assert(!('loadouts' in exported));assert.deepEqual(exported.rodPresets,original.rodPresets);
 const reloaded=new IdleGame({storage,now:()=>original.lastAt});assert.deepEqual(reloaded.state.selectedRods,g.state.selectedRods);assert.deepEqual(reloaded.state.session,g.state.session);
 checks.push('A real 3.0.0 save migrates to individual rods without touching components, progress, selection or the paid running session, and reloads without full loadouts');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
