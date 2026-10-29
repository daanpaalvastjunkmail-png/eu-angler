export const ATELIER_ASSETS={
 wetlands:'./assets/wetlands.png',
 forest:'./assets/forest-lake.png',
 fjord:'./assets/alpine-fjord.png',
 atlantic:'./assets/atlantic.png',
};
export function landscapeFor(id){
 const key=typeof id==='object'?id?.id:id;
 const name=['aulnes','lumiere','rhein'].includes(key)?'forest':key==='lofoten'?'fjord':['noordzee','azoren','pelagic'].includes(key)?'atlantic':'wetlands';
 return {src:ATELIER_ASSETS[name],position:key==='lumiere'?'70% center':key==='rhein'?'35% center':'center'};
}
