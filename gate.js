export const SYMBOLS={diamond:"◇",wave:"⌁",triangle:"△",star:"✦",cube:"⌬",sun:"☼",spire:"◈"};
export function initSlots(container,address=[]){container.innerHTML=address.map((symbol,i)=>`<div class="slot" data-slot="${i}" data-expected="${symbol}">${SYMBOLS[symbol]||"?"}</div>`).join("")}
