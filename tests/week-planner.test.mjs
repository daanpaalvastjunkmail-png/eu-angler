import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {translateText} from '../dist/i18n.js';
import {MAX_SESSION_SECONDS,sessionDurations,durationIndex,durationLabel,sessionDurationControl} from '../dist/session-planner.js';

const checks=[];
const hour=3600;
{
 const expected=[60,300,600,900,1800,2700,...[1,2,3,4,5,6,7,8,10,12,14,16,20,24,48,72,96,120,144,168].map(n=>n*hour)];
 assert.deepEqual(sessionDurations(),expected);
 assert.equal(MAX_SESSION_SECONDS,7*24*hour);
 assert.equal(new Set(expected).size,expected.length);
 assert(expected.every((n,i)=>!i||n>expected[i-1]));
 checks.push('The session slider retains minute steps and uses exact hourly, two-hour, four-hour steps through 24 hours, then whole days two through seven');
}
{
 assert.equal(sessionDurations(8*hour).at(-1),8*hour);
 assert.equal(sessionDurations(16*hour).at(-1),16*hour);
 assert.equal(sessionDurations(24*hour).at(-1),24*hour);
 assert.equal(sessionDurations(25*hour).at(-1),24*hour);
 assert.equal(sessionDurations(200*hour).at(-1),168*hour);
 assert.deepEqual(sessionDurations(60),[60]);
 assert.deepEqual(sessionDurations(59),[]);
 const steps=sessionDurations();
 for(const boundary of [8,10,16,20,24,48,144,168])assert.equal(steps[durationIndex(boundary*hour,steps)],boundary*hour);
 assert.equal(steps[durationIndex(9*hour,steps)],8*hour);
 assert.equal(steps[durationIndex(30*hour,steps)],24*hour);
 assert.equal(steps[durationIndex(36*hour,steps)],24*hour);
 assert.equal(steps[durationIndex(60*hour,steps)],48*hour);
 assert.equal(steps[durationIndex(156*hour,steps)],144*hour);
 checks.push('Optional caps filter steps without inventing values, and boundary selections survive index conversion');
}
{
 assert.equal(durationLabel(60),'1 minuut');
 assert.equal(durationLabel(45*60),'45 minuten');
 assert.equal(durationLabel(8*hour),'8 uur');
 assert.equal(durationLabel(24*hour),'24 uur');
 assert.equal(durationLabel(36*hour),'36 uur');
 for(let days=2;days<=7;days++){
  assert.equal(durationLabel(days*24*hour),`${days} dagen`);
  assert.equal(translateText(durationLabel(days*24*hour),'en'),`${days} days`);
  assert.equal(translateText(durationLabel(days*24*hour),'nl'),`${days} dagen`);
 }
 assert.equal(durationLabel(60*hour),'60 uur','A legacy duration must not be mislabelled as a whole day');
 checks.push('Minute and hour labels remain readable, and all six day labels translate correctly without rounding legacy durations');
}
{
 const game={sessionCap:MAX_SESSION_SECONDS,offlineCap:8*hour,state:{plan:{duration:MAX_SESSION_SECONDS}},quote:()=>({licenseCost:120})};
 const document=new JSDOM(sessionDurationControl(game)).window.document;
 const slider=document.querySelector('#plan-duration'),steps=sessionDurations();
 assert.equal(Number(slider.max),steps.length-1);
 assert.equal(Number(slider.value),steps.length-1);
 assert.equal(slider.getAttribute('aria-valuetext'),'7 dagen');
 assert.equal(document.querySelector('#session-duration-label').textContent,'7 dagen');
 assert.equal(document.querySelector('.session-duration-scale').lastElementChild.textContent,'7 dagen');
 assert.equal(document.querySelector('#duration-offline-note').hidden,false);
 assert(document.querySelector('#duration-offline-note').textContent.includes('maximaal 8 uur'));
 assert(document.querySelector('#duration-offline-note').textContent.includes('volle opslag of lege aas- en voervoorraad'));
 assert(slider.getAttribute('aria-describedby').split(' ').includes('duration-offline-note'));
 checks.push('An eight-hour offline limit does not hide week-long sessions, and a visible accessible note explains offline and supply limits');
}
{
 const game={sessionCap:MAX_SESSION_SECONDS,offlineCap:16*hour,state:{plan:{duration:12*hour}},quote:()=>({licenseCost:40})};
 let document=new JSDOM(sessionDurationControl(game)).window.document;
 assert.equal(document.querySelector('#duration-offline-note').hidden,true);
 assert.equal(document.querySelector('#session-duration-label').textContent,'12 uur');
 game.offlineCap=MAX_SESSION_SECONDS;game.state.plan.duration=MAX_SESSION_SECONDS;
 document=new JSDOM(sessionDurationControl(game)).window.document;
 assert.equal(document.querySelector('#duration-offline-note').hidden,true);
 assert.equal(document.querySelector('#session-duration-label').textContent,'7 dagen');
 checks.push('The offline warning stays hidden when the selected duration is covered, including a fully upgraded week');
}
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
