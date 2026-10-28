// Physical inventory fixture builder: grant distinct units only for simulations,
// then exercise the production assembly validation and loadout references.
import assert from 'node:assert/strict';
import {PARTS,addTackle,availableItems,sameSetup} from '../dist/tackle.js';
export function assembleRods(game,rods){const used=new Set();return rods.map((rod,index)=>{let p=game.state.rodPresets.find(p=>p.assembled&&sameSetup(p.rod,rod)&&!used.has(p.id));if(!p){for(const part of PARTS)if(rod[part]&&!availableItems(game.state,rod[part]).length)addTackle(game.state,rod[part]);const result=game.saveRodPreset(null,'Test assembly '+(index+1),rod);assert(result.ok,result.message);p=result.preset;}used.add(p.id);return {...p.rod,sourcePresetId:p.id,slot:rod.slot??index};});}
export const memoryStorage=()=>{const data=new Map();return{data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
