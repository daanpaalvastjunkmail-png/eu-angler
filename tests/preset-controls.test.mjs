import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {IdleGame,xpAt} from '../dist/engine.js';
import {loadoutPresetControl,rodPresetPicker} from '../dist/loadout-ui.js';

const checks=[];
const game=new IdleGame({storage:null,now:()=>1800000000000});
game.state.xp=xpAt(10);game.state.rodSlots=2;
const draft=structuredClone(game.loadout),feeder=game.state.rodPresets.find(preset=>preset.rod.style==='feeder'),carp=game.state.rodPresets.find(preset=>preset.rod.style==='karper');
const before=JSON.stringify(game.state),render=html=>new JSDOM(html);

{
 const dom=render(loadoutPresetControl(game,draft)),document=dom.window.document,select=document.querySelector('#loadout-preset-select');
 assert(select);assert.equal(select.value,draft.id);assert.equal(select.options.length,game.state.loadouts.length);
 assert(document.querySelector('[data-action="new-loadout"]'));
 assert.equal(document.querySelectorAll('.loadout-choice').length,0,'Complete presets must use one compact dropdown rather than the old sidebar list');
 dom.window.close();
 const unsaved=render(loadoutPresetControl(game,{...draft,id:null,name:'New <draft>'}));
 assert.equal(unsaved.window.document.querySelector('#loadout-preset-select').value,'');
 assert(unsaved.window.document.querySelector('#loadout-preset-select option').textContent.includes('nog niet opgeslagen'));
 unsaved.window.close();
 checks.push('Whole-loadout presets use one compact current-selection dropdown and a new-loadout action, including a clear unsaved-draft option');
}

{
 const dom=render(rodPresetPicker(game,draft,1,null,{showSave:false})),document=dom.window.document,selector=document.querySelector('#rod-preset-select'),target=document.querySelector('#rod-preset-slot');
 assert.equal(selector.value,carp.id,'The default must skip the feeder already in use and choose a preset applicable to the empty second position');
 assert.equal(document.querySelectorAll('[data-rod-preset-card]').length,1,'Only the chosen preset may have a preview card');
 assert.equal(document.querySelector('[data-rod-preset-card]').dataset.rodPresetCard,carp.id);
 assert.equal(target.value,'1');assert.equal(target.options.length,6);
 assert.deepEqual([...target.options].map(option=>option.disabled),[false,false,true,true,true,true]);
 assert(target.options[5].textContent.includes('300'),'Future positions must show their required level');
 assert(!document.querySelector('[data-apply-rod-preset]').disabled);
 assert.equal(document.querySelector('[data-apply-rod-preset]').dataset.applyRodPreset,carp.id);
 assert.equal(document.querySelectorAll('#rod-preset-name,[data-action="save-rod-preset"]').length,0,'Top selection must not duplicate the save form below the editor');
 dom.window.close();
 checks.push('The compact rod selector displays one applicable preset, all six target positions with locked levels, and one matching Apply action without duplicating the save form');
}

{
 const dom=render(rodPresetPicker(game,draft,1,feeder.id,{showSave:false})),document=dom.window.document;
 assert.equal(document.querySelector('#rod-preset-select').value,feeder.id);
 assert(document.querySelector('[data-apply-rod-preset]').disabled,'An explicitly selected unavailable preset must not bypass inventory checks');
 assert(document.querySelector('.rod-preset-unavailable').textContent.length>0);
 assert(![...document.querySelector('#rod-preset-select').options].find(option=>option.value===feeder.id).disabled,'Unavailable presets remain inspectable so their reason is visible');
 assert.equal(document.querySelector('[data-delete-rod-preset]').dataset.deleteRodPreset,feeder.id);
 dom.window.close();
 const locked=render(rodPresetPicker(game,draft,5,carp.id,{showSave:false}));
 assert(locked.window.document.querySelector('[data-apply-rod-preset]').disabled);
 assert(locked.window.document.querySelector('#rod-preset-slot option[value="5"]').disabled);
 locked.window.close();
 checks.push('Unavailable inventory or locked physical positions disable applying the chosen preset while retaining an inspectable preview, reason and matching delete action');
}

{
 const dom=render(rodPresetPicker(game,draft,0,null,{saveOnly:true})),document=dom.window.document;
 assert(document.querySelector('#rod-preset-name'));assert(!document.querySelector('#rod-preset-name').disabled);
 assert.equal(document.querySelectorAll('#rod-preset-select,#rod-preset-slot,[data-rod-preset-card]').length,0,'The editor save form must not repeat preset assignment controls');
 assert(!document.querySelector('[data-action="update-rod-preset"]'),'A fallback preview must not implicitly overwrite a saved preset');
 assert(!document.querySelector('[data-action="save-rod-preset"]').disabled);
 dom.window.close();
 const selected=render(rodPresetPicker(game,draft,0,feeder.id,{saveOnly:true}));
 assert(selected.window.document.querySelector('[data-action="update-rod-preset"]'));
 assert.equal(selected.window.document.querySelector('#rod-preset-name').value,feeder.name);
 selected.window.close();
 const empty=render(rodPresetPicker(game,draft,1,null,{saveOnly:true}));
 assert(empty.window.document.querySelector('#rod-preset-name').disabled);assert(empty.window.document.querySelector('[data-action="save-rod-preset"]').disabled);
 empty.window.close();
 checks.push('Separate editor save forms preserve new/save/update behavior, require an occupied valid position and avoid implicitly overwriting a merely previewed fallback preset');
}

assert.equal(JSON.stringify(game.state),before,'Rendering preset controls must not mutate game state');
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,limit:'Component DOM structure and availability checks; no browser rasterisation'},null,2));
