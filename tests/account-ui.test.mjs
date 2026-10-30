import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {renderAccount,renderLeaderboard,bindAccountUI} from '../dist/account-ui.js';
const checks=[];
const dom=new JSDOM('<!doctype html><body><main></main></body>',{url:'https://game.example/'});
const {document,Event,MouseEvent}=dom.window,root=document.querySelector('main');
const render=html=>{root.innerHTML=html;return root;};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const click=selector=>root.querySelector(selector).dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
const submit=form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
const input=(form,name,value)=>{const field=form.elements.namedItem(name);field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));};
const local={level:12,xp:14500,catches:127,bestWeight:6.72,updatedAt:Date.UTC(2026,9,30,12,30)};
const cloud={level:21,xp:94000,catches:291,bestWeight:11.31,updatedAt:Date.UTC(2026,9,30,13,45)};
const user={id:'private-user-id',username:'WillowAngler',createdAt:Date.UTC(2026,9,28)};

render(renderAccount({status:'guest',local},'nl'));
assert.equal(root.querySelectorAll('[data-account-form]').length,3);
assert(root.querySelector('[data-no-translate]'));
assert.equal(root.querySelector('[name=username]').getAttribute('pattern'),'[A-Za-z0-9_-]{3,24}');
assert.equal(root.querySelector('[name=password]').getAttribute('autocomplete'),'current-password');
assert.equal(root.querySelector('[data-account-form=register] [name=password]').minLength,12);
assert.equal(root.querySelector('[data-account-form=register] [name=password]').maxLength,128);
assert.equal(root.querySelector('[data-account-form=register] [name=username]').maxLength,24);
assert(root.textContent.includes('Wachtwoord vergeten?'));
render(renderAccount({status:'guest',available:false,local},'en'));
assert.equal(root.querySelector('[data-account-form]'),null);
assert.equal(root.querySelector('.account-hosted-only a').href,'https://europa-angler.daanpaalvastjunkmail.workers.dev/');
assert(root.querySelector('[data-account-action=backup]'));
checks.push('Guest forms provide accessible credential fields; standalone mode offers the hosted address and a local backup without active account forms');

const hostile='\"><img src=x onerror="window.pwned=true"><script>attack()</script>&';
render(renderAccount({status:'synced',user:{...user,username:hostile},local,recoveryCode:hostile,error:{code:hostile,message:'secret bearer token'}},'nl'));
assert.equal(root.querySelector('script,img,[onerror]'),null);
assert.equal(root.querySelector('.account-pass-identity h2').textContent,hostile);
assert.equal(root.querySelector('.account-recovery-value textarea').value,hostile);
assert(root.querySelector('.account-pass-identity h2').hasAttribute('data-user-text'));
assert(!root.innerHTML.includes('secret bearer token'));
assert(!root.innerHTML.includes('private-user-id'));
assert.equal(root.querySelector('.account-recovery-value textarea').readOnly,true);
checks.push('Usernames and one-time recovery codes remain escaped text; internal account IDs and raw server errors are not rendered');

let calls=[];
let dispose=bindAccountUI(root,{register:async args=>{calls.push(['register',args]);},login:async args=>{calls.push(['login',args]);},recover:async args=>{calls.push(['recover',args]);}});
render(renderAccount({status:'guest'},'en'));
const registration=root.querySelector('[data-account-form=register]');
input(registration,'username','River_Angler');input(registration,'password','Long secret pass!');input(registration,'repeatPassword','Not the same secret');
submit(registration);await tick();assert.equal(calls.length,0);
assert(registration.querySelector('.account-form-feedback').textContent.includes('do not match'));
assert.equal(document.activeElement,registration.elements.namedItem('repeatPassword'));
input(registration,'repeatPassword','Long secret pass!');submit(registration);await tick();
assert.deepEqual(calls.shift(),['register',{username:'River_Angler',password:'Long secret pass!'}]);
assert.equal(registration.elements.namedItem('password').value,'');assert.equal(registration.elements.namedItem('repeatPassword').value,'');
const login=root.querySelector('[data-account-form=login]');input(login,'username','a');input(login,'password','Long secret pass!');submit(login);await tick();assert.equal(calls.length,0);
input(login,'username','River_Angler');submit(login);await tick();assert.deepEqual(calls.shift(),['login',{username:'River_Angler',password:'Long secret pass!'}]);
const recovery=root.querySelector('[data-account-form=recover]');input(recovery,'username','River_Angler');input(recovery,'recoveryCode','saved-recovery-code');input(recovery,'newPassword','A new long password');input(recovery,'repeatPassword','A new long password');submit(recovery);await tick();
assert.deepEqual(calls.shift(),['recover',{username:'River_Angler',recoveryCode:'saved-recovery-code',newPassword:'A new long password'}]);
assert.equal(recovery.elements.namedItem('recoveryCode').value,'');assert.equal(recovery.elements.namedItem('newPassword').value,'');
dispose();
checks.push('Delegated forms enforce validation and matching passwords, call only the intended controller method, and clear submitted secrets after success');

let finish;calls=[];
render(renderAccount({status:'choice',user,local,cloud,conflict:{local,cloud}},'nl'));
assert.equal(root.querySelectorAll('.account-save-card').length,3);
const choices=[...root.querySelectorAll('.account-save-options .account-save-card')];
assert(choices[0].textContent.includes('14.500'));assert(choices[1].textContent.includes('94.000'));assert(choices[1].textContent.includes('11,31'));
assert.equal(choices[0].querySelector('time').textContent.includes('2026'),true);
dispose=bindAccountUI(root,{downloadLocalBackup:()=>{calls.push('backup');return new Promise(resolve=>{finish=resolve;});},resolveConflict:async choice=>{calls.push(choice);}});
click('[data-account-action=choose-cloud]');click('[data-account-action=choose-cloud]');
assert.deepEqual(calls,['backup']);assert.equal(root.querySelector('[data-account-action=choose-cloud]').disabled,true);
finish(true);await tick();assert.deepEqual(calls,['backup','cloud']);assert.equal(root.querySelector('[data-account-action=choose-cloud]').disabled,false);
dispose();
checks.push('Conflict summaries show both actual saves and dates; cloud choice waits for a successful local backup and ignores duplicate clicks while pending');

calls=[];dispose=bindAccountUI(root,{downloadLocalBackup:async()=>false,resolveConflict:async choice=>calls.push(choice)});
click('[data-account-action=choose-cloud]');await tick();assert.deepEqual(calls,[]);assert(root.querySelector('.account-conflict .account-form-feedback').textContent.includes('niet vervangen'));dispose();
dispose=bindAccountUI(root,{downloadLocalBackup:async()=>{throw new Error('secret storage internals');},resolveConflict:async choice=>calls.push(choice)});
click('[data-account-action=choose-cloud]');await tick();assert.deepEqual(calls,[]);assert(!root.textContent.includes('secret storage internals'));dispose();
dispose=bindAccountUI(root,{resolveConflict:async choice=>calls.push(choice)});
click('[data-account-action=choose-local]');await tick();assert.deepEqual(calls,['local']);dispose();click('[data-account-action=choose-local]');await tick();assert.deepEqual(calls,['local']);
checks.push('Failed or thrown backup downloads prevent replacement; local choice is explicit and disposing the binder removes its handlers');

calls=[];render(renderAccount({status:'synced',user,local,recoveryCode:'EU-1234-5678-ABCD',hasRecoveryBackup:true},'en'));
dispose=bindAccountUI(root,{downloadRecoveryCode:async()=>calls.push('code-download'),acknowledgeRecoveryCode:async()=>calls.push('ack'),downloadRecoveryBackup:async()=>calls.push('recovery-copy'),syncNow:async()=>calls.push('sync'),logout:async()=>calls.push('logout')});
for(const action of ['download-recovery','acknowledge-recovery','recovery-backup','sync','logout']){click(`[data-account-action=${action}]`);await tick();}
assert.deepEqual(calls,['code-download','ack','recovery-copy','sync','logout']);dispose();
for(const status of ['guest','connecting','synced','saving','offline','conflict','choice','error','blocked']){render(renderAccount({status,user,local},'en'));assert(root.querySelector(`[data-sync-state="${status}"]`));assert(!root.textContent.includes('undefined'));}
render(renderAccount({status:'blocked',user,local},'en'));assert.equal(root.querySelector('[data-account-action=sync]').disabled,true);
checks.push('Recovery code download, acknowledgment, permanent recovery copy, manual sync and logout are distinct actions; all sync states have readable feedback and protected saves cannot sync');

const rows=[{rank:1,username:'ReedWalker',xp:99000,catches:800,bestWeight:31.48},{rank:12,username:'WillowAngler',xp:14500,catches:127,bestWeight:6.72},{rank:13,username:hostile,xp:14000,catches:120,bestWeight:6.7}];
render(renderLeaderboard({user,leaderboard:{metric:'biggest',rows,ownRank:{rank:12,bestWeight:6.72},total:18}},'nl'));
assert.equal(root.querySelector('script,img,[onerror]'),null);
assert.equal(root.querySelectorAll('tbody tr').length,3);
assert.equal(root.querySelectorAll('tbody tr.is-current-player').length,1);
assert.equal(root.querySelectorAll('tbody .account-player-name')[2].textContent,hostile);
assert(root.querySelector('.account-own-rank').textContent.includes('#12'));assert(root.querySelector('tbody td.account-board-score').textContent.includes('31,48 kg'));
assert.equal(root.querySelector('[data-account-metric=biggest]').getAttribute('aria-pressed'),'true');
assert(!root.innerHTML.includes('private-user-id'));
calls=[];dispose=bindAccountUI(root,{loadLeaderboard:async metric=>calls.push(metric),refreshLeaderboard:async()=>calls.push('refresh')});
click('[data-account-metric=xp]');await tick();click('[data-account-metric=catches]');await tick();click('[data-account-metric=biggest]');await tick();click('[data-account-action=refresh-leaderboard]');await tick();
assert.deepEqual(calls,['xp','catches','biggest','refresh']);dispose();
checks.push('Leaderboard renders supplied scores, safely displays usernames and own rank, and uses the backend metric IDs xp/catches/biggest');
const staleBoard={metric:'xp',rows:rows.map(row=>({...row,isCurrentUser:row.username===user.username})),ownEntry:{username:user.username,rank:103,xp:14500},ownRank:103,total:120};
for(const currentUser of [null,{username:'AnotherAngler'}]){render(renderLeaderboard({user:currentUser,leaderboard:staleBoard},'en'));assert.equal(root.querySelectorAll('tr.is-current-player').length,0);assert(!root.querySelector('.account-own-rank').textContent.includes('#103'));}
render(renderLeaderboard({user,leaderboard:staleBoard},'en'));assert(root.querySelector('.account-own-rank').textContent.includes('#103'));


for(const [board,state]of [[{loading:true,rows},'loading'],[{errorCode:'SERVER_ERROR',rows},'error'],[{rows:[]},'empty']]){
 render(renderLeaderboard({leaderboard:board},'en'));assert.equal(root.querySelector('tbody tr'),null);assert(root.querySelector('.account-board-state'));
 if(state==='loading')assert(root.textContent.includes('Loading the community'));
 if(state==='error')assert(root.querySelector('[data-account-action=refresh-leaderboard]'));
 if(state==='empty')assert(root.textContent.includes('No scores have been published'));
 assert(!root.textContent.includes('ReedWalker'));
}
checks.push('Loading, failure and empty leaderboards are genuine states with no invented or stale score rows');

const css=await readFile(new URL('../dist/account.css',import.meta.url),'utf8');
const parsed=await transform(css,{loader:'css',logLevel:'silent'});assert.equal(parsed.warnings.length,0);
checks.push('Account stylesheet parses without warnings; interactive forms use native controls and responsive phone layouts');
dom.window.close();
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
