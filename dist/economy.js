// Fixed water tariffs: adding rods never makes the same permit more expensive.
export const SESSION_CAP=7*24*3600;
export const OFFLINE_HOURS=Object.freeze([8,16,24,48,96,168]);
export const WATER_TARIFFS=Object.freeze({rietplas:1,poldermeer:1.5,aulnes:2.5,rhein:4,lumiere:6,donau:9,noordzee:12,lofoten:20,azoren:30,pelagic:45});
// Interpolate continuously before rounding: longer passes never get cheaper in total.
// At the first water: €2/15min, €3/hour, €6/8h, €9/day and €21/week.
const PASS_KNOTS=Object.freeze([[60,1],[300,1],[900,2],[3600,3],[8*3600,6],[24*3600,9],[SESSION_CAP,21]]);
const duration=seconds=>Math.max(60,Math.min(SESSION_CAP,Number.isFinite(Number(seconds))?Number(seconds):900));
export function permitTariff(water){return WATER_TARIFFS[typeof water==='string'?water:water?.id]||1;}
function passUnits(seconds){const time=duration(seconds);for(let i=1;i<PASS_KNOTS.length;i++){const [end,cost]=PASS_KNOTS[i],[start,previous]=PASS_KNOTS[i-1];if(time<=end)return previous+(cost-previous)*(time-start)/(end-start);}return PASS_KNOTS.at(-1)[1];}
export function permitCost(water,seconds){return Math.max(1,Math.ceil(passUnits(seconds)*permitTariff(water)-1e-9));}
// The charter follows the same long-session discount; owning a free boat avoids it.
export function charterCost(water,seconds){return water?.sea?Math.ceil(passUnits(seconds)*permitTariff(water)*3-1e-9):0;}

// Catches use cent precision; small fish no longer receive a flat €2 minimum.
export function fishSaleValue(weight,pricePerKg,market=0){return Math.max(.01,Math.round((weight*pricePerKg*(1+market*.05)+Number.EPSILON)*100)/100);}
