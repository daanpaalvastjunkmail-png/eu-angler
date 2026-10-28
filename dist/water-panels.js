// Collapse preferences belong to the save; hidden contents remain mounted so
// live catches, timers and packing estimates keep updating.
export const PANEL_BODIES={catches:'home-catches-body',planner:'session-planner-body',activity:'water-activity-body'};
export const panelCollapsed=(game,id)=>game.state.settings.waterPanels?.[id]===true;
export function panelToggle(game,id,title){
 const closed=panelCollapsed(game,id);
 return `<button type="button" class="water-panel-toggle" data-water-panel-toggle="${id}" aria-expanded="${!closed}" aria-controls="${PANEL_BODIES[id]}" title="${closed?'Uitklappen':'Inklappen'}"><span class="water-panel-title">${title}</span><span class="water-panel-chevron" aria-hidden="true"></span></button>`;
}
