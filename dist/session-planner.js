export const MAX_SESSION_SECONDS=7*24*3600;
export function sessionDurations(cap=MAX_SESSION_SECONDS){
 const hours=[...Array.from({length:8},(_,i)=>i+1),10,12,14,16,20,24,...Array.from({length:6},(_,i)=>(i+2)*24)];
 return [60,300,600,900,1800,2700,...hours.map(hours=>hours*3600)].filter(seconds=>seconds<=Math.min(cap,MAX_SESSION_SECONDS));
}
export function durationLabel(seconds){return seconds>=48*3600&&seconds%(24*3600)===0?`${seconds/(24*3600)} dagen`:seconds<3600?`${Math.round(seconds/60)} ${seconds===60?'minuut':'minuten'}`:`${Math.round(seconds/3600)} uur`;}
export function durationIndex(seconds,steps){return steps.reduce((best,n,i)=>Math.abs(n-seconds)<Math.abs(steps[best]-seconds)?i:best,0);}
export function sessionDurationControl(game){
 const steps=sessionDurations(game.sessionCap??MAX_SESSION_SECONDS),index=durationIndex(game.state.plan.duration,steps),label=durationLabel(steps[index]),cost=game.quote().licenseCost,money=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cost);
 return `<div class="session-duration-field"><div class="session-duration-heading"><span><i>03</i> SESSIE & VISPAS</span><span class="tag">DEZELFDE DUUR</span></div><div class="session-duration-value"><output id="session-duration-label" for="plan-duration">${label}</output><span>Vispas <b id="duration-license-cost">${money}</b></span></div><input class="session-duration-slider" type="range" id="plan-duration" min="0" max="${steps.length-1}" step="1" value="${index}" aria-label="Duur van je sessie en vispas" aria-valuetext="${label}" aria-describedby="duration-offline-note" style="--duration-fill:${index/(steps.length-1)*100}%"><div class="session-duration-scale" aria-hidden="true"><span>1 min</span><span>${durationLabel(steps.at(-1))}</span></div><p id="duration-offline-note" class="muted" ${game.state.plan.duration>game.offlineCap?'':'hidden'}>Bij afwezigheid wordt maximaal ${game.offlineCap/3600} uur voortgang berekend. Je sessie kan eerder stoppen door volle opslag of lege aas- en voervoorraad.</p></div>`;
}
