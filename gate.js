export const ADDRESS_SEQUENCE=["1","2","3","4","5","6","7"];
export function initSlots(container){container.innerHTML=ADDRESS_SEQUENCE.map((_,i)=>`<div class="slot" data-slot="${i}">—</div>`).join("")}
