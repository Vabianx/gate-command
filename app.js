import{loadGame,saveGame,resetSavedGame}from"./storage.js";
import{freshGame,addWorldFlag,unlockWorld}from"./game.js";
import{ADDRESS_SEQUENCE,initSlots}from"./gate.js";
import{createMission,getOpening}from"./missions.js";

let game=loadGame(freshGame),selected=[],mission=null,probeUsed=false,probeOutcome=null,selectedWorldId=game.unlockedWorldIds[0]||"p4x761";
const $=id=>document.getElementById(id),views=document.querySelectorAll(".view"),glyphs=document.querySelectorAll(".glyph");
const worldById=id=>game.worlds.find(w=>w.id===id);
const selectedWorld=()=>worldById(selectedWorldId);

function show(id){views.forEach(v=>v.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)}
function update(){
$("energy").textContent=game.energy;$("research").textContent=game.research;$("personnel").textContent=game.personnel;$("baseStatus").textContent=game.baseStatus;$("labValue").textContent=game.research;
const pct=Math.min(100,game.research*10);$("barFill").style.width=pct+"%";$("labText").textContent=pct>=100?"Analyse abgeschlossen: Energiematrix entschlüsselt.":`Analyse der Energiematrix: ${pct} %.`;
$("teamCards").innerHTML=game.team.map(x=>`<article><small>${x.role}</small><h3>${x.name}</h3><p>${x.traits}</p><p class="${x.health==="einsatzbereit"?"ok":"warning"}">Status: ${x.health}</p></article>`).join("");
renderArchive();renderWorldFlags();renderKnownWorlds();saveGame(game)
}
function renderKnownWorlds(){$("knownWorlds").innerHTML=game.unlockedWorldIds.map(worldById).filter(Boolean).map(w=>`<p><b>${w.code}</b> · ${w.name}</p>`).join("")||"Keine Ziele bekannt."}
function renderWorldFlags(){
const labels=[];
if(game.worldFlags.signalDetected)labels.push("Unbekanntes Signal registriert");
if(game.worldFlags.guardiansAwakened)labels.push("Wächtersystem aktiviert");
if(game.worldFlags.hiddenTeamZero)labels.push("Hinweis auf Einsatzteam 0");
if(game.worldFlags.watchersObserved)labels.push("Fremde Beobachter bestätigt");
if(game.worldFlags.taekhanRecognized)labels.push("Tae'Khan von Fremdsystem erkannt");
$("worldFlags").innerHTML=labels.length?`<div class="taglist">${labels.map(x=>`<span class="tag">${x}</span>`).join("")}</div>`:"Noch keine besonderen Ereignisse protokolliert."
}
function renderArchive(){
$("archiveList").innerHTML=game.archive.length?game.archive.slice().reverse().map(r=>`<article class="report"><small>EINSATZAKTE ${r.no}</small><h3>${r.title}</h3><p class="report-meta">${r.planet} · ${r.outcome}</p><p>${r.summary}</p><div class="taglist">${r.flags.map(f=>`<span class="tag">${f}</span>`).join("")}</div><p class="warning">Unvollständige Informationen: ${r.info}</p><details><summary>Bericht öffnen</summary>${r.log.map(x=>`<p>${x}</p>`).join("")}</details></article>`).join(""):"<article><p>Noch keine Expedition abgeschlossen.</p></article>"
}
function renderDestinations(){
$("destinationList").innerHTML="";
game.unlockedWorldIds.map(worldById).filter(Boolean).forEach(w=>{
const b=document.createElement("button");b.className="destination-button"+(w.id===selectedWorldId?" active":"");b.innerHTML=`<strong>${w.code}</strong><span>${w.name}</span>`;
b.onclick=()=>{selectedWorldId=w.id;resetGate(false);renderDestinations();renderDestinationInfo()};$("destinationList").appendChild(b)
})}
function renderDestinationInfo(){const w=selectedWorld();$("destinationCode").textContent=w.code;$("destinationName").textContent=w.name}
function resetGate(resetWorld=true){
selected=[];probeUsed=false;probeOutcome=null;if(resetWorld&&!game.unlockedWorldIds.includes(selectedWorldId))selectedWorldId=game.unlockedWorldIds[0];
glyphs.forEach(g=>{g.classList.remove("selected");g.disabled=false});
$("gate").classList.remove("open","dialing");$("gateText").textContent="Adresse auswählen";$("probeData").innerHTML="<p>Noch keine Sondendaten vorhanden.</p>";$("probe").disabled=false;$("probe").textContent="Sonde senden – 5 Energie";$("start").disabled=true;initSlots($("slots"));renderDestinations();renderDestinationInfo()
}
function lock(btn){
const n=btn.dataset.glyph;if(selected.includes(n))return;
if(n!==ADDRESS_SEQUENCE[selected.length]){$("gateText").textContent="Symbolfolge ungültig";setTimeout(()=>$("gateText").textContent=`Chevron ${selected.length+1} erwartet`,450);return}
selected.push(n);btn.classList.add("selected");btn.disabled=true;const slot=document.querySelector(`[data-slot="${selected.length-1}"]`);slot.textContent=btn.textContent;slot.classList.add("locked");$("gateText").textContent=`Chevron ${selected.length} verriegelt`;$("gate").classList.add("dialing");
if(selected.length===7)setTimeout(()=>{$("gate").classList.remove("dialing");$("gate").classList.add("open");$("gateText").textContent="Verbindung hergestellt";$("start").disabled=false},500)
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function autoDial(){resetGate(false);$("autoDial").disabled=true;for(const n of ADDRESS_SEQUENCE){lock(document.querySelector(`[data-glyph="${n}"]`));await wait(380)}$("autoDial").disabled=false}
function runProbe(){
if(game.energy<5||probeUsed)return;game.energy-=5;probeUsed=true;const w=selectedWorld(),roll=Math.random();
if(roll<.18){probeOutcome="detected";$("probeData").innerHTML=`<p><b>Atmosphäre:</b> ${w.probe.atmosphere}</p><p><b>Lebenszeichen:</b> ${w.probe.life}</p><p><b>Strukturen:</b> ${w.probe.structures}</p><p class="dangerText"><b>Warnung:</b> Sonde wurde möglicherweise erfasst.</p>`}
else if(roll<.38){probeOutcome="partial";$("probeData").innerHTML=`<p><b>Atmosphäre:</b> ${w.probe.atmosphere}</p><p><b>Datenverlust:</b> 43 %</p><p><b>Strukturen:</b> ${w.probe.structures}</p><p class="warning"><b>Warnung:</b> Telemetrie unvollständig.</p>`}
else{probeOutcome="clean";$("probeData").innerHTML=`<p><b>Atmosphäre:</b> ${w.probe.atmosphere}</p><p><b>Temperatur:</b> ${w.probe.temperature}</p><p><b>Lebenszeichen:</b> ${w.probe.life}</p><p><b>Strukturen:</b> ${w.probe.structures}</p><p><b>Energiesignatur:</b> ${w.probe.energy}</p><p class="ok"><b>Status:</b> Sonde unentdeckt.</p>`}
$("probe").disabled=true;$("probe").textContent="Sondendaten empfangen";update()
}
function narration(t){$("story").insertAdjacentHTML("beforeend",`<div class="narration">${t}</div>`)}
function dialogue(n,t){$("story").insertAdjacentHTML("beforeend",`<div class="dialogue"><b>${n}</b><p>${t}</p></div>`)}
function choices(list){$("choices").innerHTML="";list.forEach(c=>{const b=document.createElement("button");b.className="choice";b.innerHTML=`<strong>${c.title}</strong><span>${c.effect}</span>`;b.onclick=c.action;$("choices").appendChild(b)})}
function startMission(){if(game.energy<10)return;game.energy-=10;const w=selectedWorld();mission=createMission({number:game.completed+1,world:w,probeUsed,probeOutcome});$("missionNo").textContent=String(mission.number).padStart(3,"0");$("planetName").textContent=`${w.code} · ${w.name}`;show("mission");update();opening()}
function opening(){
const o=getOpening(mission,game);$("phase").textContent=o.phase;$("risk").textContent=o.risk;$("sceneTitle").textContent=o.title;$("story").innerHTML="";$("return").classList.add("hidden");narration(o.narration);o.dialogue.forEach(x=>dialogue(x[0],x[1]));
if(mission.worldId==="p4x761")templeChoices();else if(mission.worldId==="n7c204")valleyChoices();else iceChoices()
}
function templeChoices(){choices([
{title:"Die Tür sprengen",effect:"Schneller Zugang · hohes Risiko",action:()=>finishTemple("breach")},
{title:"Das Kontrollsystem entschlüsseln",effect:"Forschung · mögliche Langzeitfolge",action:()=>finishTemple("decode")},
{title:"Den Bereich absichern",effect:"Zusätzliche Informationen",action:()=>finishTemple("secure")},
{title:"Mission vorerst abbrechen",effect:"Keine weiteren Risiken",action:()=>finishGeneric("Aufklärung abgebrochen","Freiwilliger Rückzug","GC-1 kehrte zurück, bevor die Anlage untersucht wurde.","Was befindet sich hinter der versiegelten Tür?",0,2,["Anlage unerforscht"],"GC-1 zieht sich geordnet zum Gate zurück.",[["Dr. David Jaxon","Wir werden zurückkommen müssen."],["Colonel Jack O'Dell","Dann bringen wir beim nächsten Mal vielleicht eine Tür mit, die kooperativer ist."]])}
])}
function finishTemple(kind){
if(kind==="breach"){addWorldFlag(game,"guardiansAwakened");unlockWorld(game,"n7c204");return finishGeneric("Relikt unter Beschuss geborgen","Erfolg mit Verletzung","GC-1 sicherte ein beschädigtes Relikt und entkam den erwachenden Wächtern.","Wer erschuf die Wächter?",5,0,["Wächtersystem aktiviert","Relikt geborgen","N7C-204 freigeschaltet"],"Unter schwerem Feuer erreicht GC-1 das Gate.",[["Dr. David Jaxon","Nur damit das festgehalten wird: Ich war gegen die Sprengung."],["Colonel Jack O'Dell","Und trotzdem haben Sie das Relikt nicht losgelassen. Das nenne ich Teamgeist."]],"jaxon")}
if(kind==="decode"){addWorldFlag(game,"taekhanRecognized");addWorldFlag(game,"signalDetected");unlockWorld(game,"n7c204");return finishGeneric("Archivkammer geöffnet","Erfolg mit unbekannter Folge","Tae'Khans Signatur öffnete eine versiegelte Kammer.","Warum erkannte die Anlage Tae'Khan?",7,0,["Tae'Khan erkannt","Signal ausgesendet","N7C-204 freigeschaltet"],"Ein Datenarchiv erwacht. Gleichzeitig wird ein Signal in den Orbit ausgesendet.",[["Captain Kim Calder","Wir haben das Archiv. Aber jemand weiß jetzt, dass wir hier sind."],["Tae'Khan","Nicht irgendjemand."]])}
addWorldFlag(game,"hiddenTeamZero");unlockWorld(game,"k2m118");return finishGeneric("Geheime Einsatzakte geborgen","Erfolg","GC-1 fand das Protokoll einer unbekannten früheren Expedition.","Wer gehörte zu Einsatzteam 0?",3,1,["Hinweis auf Einsatzteam 0","K2M-118 freigeschaltet"],"In einem Schutzraum liegt ein beschädigtes Aufnahmegerät. Die letzte Nachricht lautet: Öffnet die Tür nicht.",[["Dr. David Jaxon","Diese Kennung ist älter als unser Gate-Programm."],["Colonel Jack O'Dell","Dann hat jemand sehr gründlich etwas vergessen."]])
}
function valleyChoices(){choices([
{title:"Zur Siedlung gehen",effect:"Diplomatie · Informationen",action:()=>finishGeneric("Erstkontakt im Tal","Diplomatischer Erfolg","GC-1 gewann das Vertrauen eines lokalen Sprechers.","Warum sendet das beschädigte Schiff dieselbe Frequenz?",4,1,["Lokaler Kontakt hergestellt"],"Die Bewohner senken ihre Waffen, nachdem Jaxon mehrere Symbole ihrer Sprache erkennt.",[["Dr. David Jaxon","Sie glauben, wir seien wegen des Signals gekommen."],["Colonel Jack O'Dell","Sind wir doch. Schön, wenn sich Missverständnisse mal selbst erledigen."]])},
{title:"Das beschädigte Schiff untersuchen",effect:"Technologie · höheres Risiko",action:()=>{addWorldFlag(game,"watchersObserved");unlockWorld(game,"k2m118");finishGeneric("Fremdes Schiff untersucht","Riskanter Erfolg","Calder barg Navigationsdaten aus dem fremden Schiff.","Warum führte eine Route direkt nach K2M-118?",6,-1,["Fremde Technologie","K2M-118 freigeschaltet"],"Im Cockpit läuft noch ein Navigationskern. Eine Route ist besonders hervorgehoben.",[["Captain Kim Calder","Zielpunkt K2M-118. Und die Route wurde erst vor drei Tagen gesetzt."],["Colonel Jack O'Dell","Ich nehme an, drei Tage ist in diesem Fall nicht beruhigend."]])}},
{title:"Beide Seiten zunächst beobachten",effect:"Sicherer · weniger Erkenntnisse",action:()=>finishGeneric("Verdeckte Beobachtung","Teil-Erfolg","GC-1 beobachtete Siedlung und Schiff ohne Kontakt.","Wer kontrolliert das Schiff?",2,2,["Beobachtung abgeschlossen"],"GC-1 bleibt im Basalt verborgen und sammelt Bewegungsmuster.",[["Tae'Khan","Die Soldaten im Schiff fürchten die Siedlung."],["Colonel Jack O'Dell","Das ist neu. Normalerweise fürchten hier alle zuerst uns."]])}
])}
function iceChoices(){choices([
{title:"Unterirdische Anlage öffnen",effect:"Große Erkenntnis · hohes Risiko",action:()=>finishGeneric("Eisarchiv geöffnet","Großer Erfolg","GC-1 öffnete ein unterirdisches Archiv mit Daten über frühere Gate-Expeditionen.","Warum existieren Protokolle vor Gründung von Gate Command?",8,-2,["Archivkern gesichert","Kampagnen-Cliffhanger"],"Die Anlage erwacht. Auf einem Bildschirm erscheinen Dutzende Einsatzberichte mit Daten, die Jahrzehnte vor Gate Command liegen.",[["Dr. David Jaxon","Das ist unmöglich."],["Colonel Jack O'Dell","Das sagen Sie erstaunlich oft, kurz bevor es noch schlimmer wird."],["Captain Kim Calder","Sir... einer dieser Berichte trägt Ihre Dienstnummer."]])},
{title:"Nur die Oberfläche kartieren",effect:"Sicherer · Vorbereitung für später",action:()=>finishGeneric("Eisarchiv kartiert","Teil-Erfolg","GC-1 kartierte die Oberfläche und markierte mehrere Eingänge.","Was befindet sich im Zentrum der Anlage?",3,2,["Zugänge kartiert"],"Calder markiert drei sichere Bohrpunkte für eine spätere Expedition.",[["Colonel Jack O'Dell","Also kommen wir wieder."],["Tae'Khan","Das wäre weise."],["Colonel Jack O'Dell","Jetzt bin ich offiziell besorgt."]])},
{title:"Nach dem Signal von Einsatzteam 0 suchen",effect:"Story-Fortschritt · unbekannte Folge",action:()=>finishGeneric("Signal von Einsatzteam 0 lokalisiert","Cliffhanger","GC-1 fand eine aktive Bake mit der Kennung von Einsatzteam 0.","Wer hat die Bake vor wenigen Stunden aktiviert?",5,0,["Team-0-Signal aktiv"],"Unter einer dünnen Eisschicht blinkt eine moderne Notfallbake. Ihr Zeitstempel ist nur vier Stunden alt.",[["Dr. David Jaxon","Das ist keine alte Aufnahme. Die wurde heute aktiviert."],["Colonel Jack O'Dell","Gut. Dann ist unser totes Team wenigstens pünktlich."]])}
])}
function finishGeneric(title,outcome,summary,info,research,energy,flags,text,lines,healthChange){
game.research+=research;game.energy=Math.max(0,game.energy+energy);if(healthChange){const m=game.team.find(x=>x.id===healthChange);if(m)m.health="leicht verletzt"}
game.baseStatus=`Expedition ${String(mission.number).padStart(3,"0")} abgeschlossen: ${outcome}.`;mission.result={title,outcome,summary,info,flags,text,lines};
$("phase").textContent="Phase: Abschluss";$("risk").textContent="Status: Rückkehr möglich";$("sceneTitle").textContent=title;$("story").innerHTML="";narration(text);lines.forEach(x=>dialogue(x[0],x[1]));$("choices").innerHTML="";$("return").classList.remove("hidden");update()
}
function returnBase(){
const r=mission.result;game.archive.push({no:String(mission.number).padStart(3,"0"),planet:mission.planet,title:r.title,outcome:r.outcome,summary:r.summary,info:r.info,flags:r.flags,log:[...$("story").children].map(x=>x.textContent.trim())});game.completed++;mission=null;resetGate();update();show("base")
}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));
glyphs.forEach(b=>b.onclick=()=>lock(b));
$("prepare").onclick=()=>{resetGate();show("gateView")};
$("autoDial").onclick=autoDial;$("probe").onclick=runProbe;$("start").onclick=startMission;$("return").onclick=returnBase;
$("reset").onclick=()=>{if(confirm("Den gesamten Spielstand einschließlich Einsatzarchiv löschen?")){resetSavedGame();game=freshGame();selectedWorldId="p4x761";mission=null;resetGate();update();show("base")}};
initSlots($("slots"));resetGate();update();
