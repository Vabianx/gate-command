import{loadGame,saveGame,resetSavedGame}from"./storage.js";
import{freshGame,addWorldFlag}from"./game.js";
import{ADDRESS_SEQUENCE,initSlots}from"./gate.js";
import{createMission,getOpening}from"./missions.js";

let game=loadGame(freshGame),selected=[],mission=null,probeUsedThisPrep=false,probeOutcome=null;
const $=id=>document.getElementById(id),views=document.querySelectorAll(".view"),glyphs=document.querySelectorAll(".glyph");

function show(id){views.forEach(v=>v.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)}

function update(){
 $("energy").textContent=game.energy;$("research").textContent=game.research;$("personnel").textContent=game.personnel;$("baseStatus").textContent=game.baseStatus;$("labValue").textContent=game.research;
 const pct=Math.min(100,game.research*10);$("barFill").style.width=pct+"%";$("labText").textContent=pct>=100?"Analyse abgeschlossen: Energiematrix entschlüsselt.":`Analyse der Energiematrix: ${pct} %.`;
 $("teamCards").innerHTML=game.team.map(x=>`<article><small>${x.role}</small><h3>${x.name}</h3><p>${x.traits}</p><p class="${x.health==="einsatzbereit"?"ok":"warning"}">Status: ${x.health}</p></article>`).join("");
 renderArchive();renderWorldFlags();saveGame(game)
}

function renderWorldFlags(){
 const labels=[];
 if(game.worldFlags.signalDetected)labels.push("Unbekanntes Signal registriert");
 if(game.worldFlags.guardiansAwakened)labels.push("Wächtersystem aktiviert");
 if(game.worldFlags.hiddenTeamZero)labels.push("Hinweis auf Einsatzteam 0");
 if(game.worldFlags.watchersObserved)labels.push("Fremde Beobachter bestätigt");
 if(game.worldFlags.tyrekRecognized)labels.push("Tyrek von Fremdsystem erkannt");
 $("worldFlags").innerHTML=labels.length?`<div class="taglist">${labels.map(x=>`<span class="tag">${x}</span>`).join("")}</div>`:"Noch keine besonderen Ereignisse protokolliert."
}

function renderArchive(){
 $("archiveList").innerHTML=game.archive.length?game.archive.slice().reverse().map(r=>`<article class="report"><small>EINSATZAKTE ${r.no}</small><h3>${r.title}</h3><p class="report-meta">${r.planet} · ${r.outcome}</p><p>${r.summary}</p><div class="taglist">${r.flags.map(f=>`<span class="tag">${f}</span>`).join("")}</div><p class="warning">Unvollständige Informationen: ${r.info}</p><details><summary>Bericht öffnen</summary>${r.log.map(x=>`<p>${x}</p>`).join("")}</details></article>`).join(""):"<article><p>Noch keine Expedition abgeschlossen.</p></article>"
}

function resetGate(){
 selected=[];probeUsedThisPrep=false;probeOutcome=null;
 glyphs.forEach(g=>{g.classList.remove("selected");g.disabled=false});
 $("gate").classList.remove("open");$("gateText").textContent="Adresse auswählen";$("probeData").innerHTML="<p>Noch keine Sondendaten vorhanden.</p>";$("probe").disabled=false;$("probe").textContent="Sonde senden – 5 Energie";$("start").disabled=true;initSlots($("slots"))
}

function lock(btn){
 const n=btn.dataset.glyph;if(selected.includes(n))return;
 if(n!==ADDRESS_SEQUENCE[selected.length]){$("gateText").textContent="Symbolfolge ungültig";setTimeout(()=>$("gateText").textContent=`Chevron ${selected.length+1} erwartet`,450);return}
 selected.push(n);btn.classList.add("selected");btn.disabled=true;
 const slot=document.querySelector(`[data-slot="${selected.length-1}"]`);slot.textContent=btn.textContent;slot.classList.add("locked");$("gateText").textContent=`Chevron ${selected.length} verriegelt`;
 if(selected.length===7)setTimeout(()=>{$("gate").classList.add("open");$("gateText").textContent="Verbindung hergestellt";$("start").disabled=false},500)
}

const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function autoDial(){resetGate();$("autoDial").disabled=true;for(const n of ADDRESS_SEQUENCE){lock(document.querySelector(`[data-glyph="${n}"]`));await wait(380)}$("autoDial").disabled=false}

function runProbe(){
 if(game.energy<5||probeUsedThisPrep)return;
 game.energy-=5;probeUsedThisPrep=true;const roll=Math.random();
 if(roll<.2){probeOutcome="detected";$("probeData").innerHTML='<p><b>Atmosphäre:</b> atembar</p><p><b>Lebenszeichen:</b> uneindeutig</p><p><b>Strukturen:</b> Tempelanlage</p><p><b>Energiesignatur:</b> schwach</p><p class="dangerText"><b>Warnung:</b> Sonde wurde möglicherweise erfasst.</p>'}
 else if(roll<.4){probeOutcome="partial";$("probeData").innerHTML='<p><b>Atmosphäre:</b> atembar</p><p><b>Datenverlust:</b> 46 %</p><p><b>Strukturen:</b> künstlich</p><p class="warning"><b>Warnung:</b> Telemetrie unvollständig.</p>'}
 else{probeOutcome="clean";$("probeData").innerHTML='<p><b>Atmosphäre:</b> atembar</p><p><b>Temperatur:</b> 11 °C</p><p><b>Lebenszeichen:</b> uneindeutig</p><p><b>Strukturen:</b> Tempelanlage</p><p><b>Energiesignatur:</b> schwach, aber stabil</p><p class="ok"><b>Status:</b> Sonde unentdeckt.</p>'}
 $("probe").disabled=true;$("probe").textContent="Sondendaten empfangen";update()
}

function narration(t){$("story").insertAdjacentHTML("beforeend",`<div class="narration">${t}</div>`)}
function dialogue(n,t){$("story").insertAdjacentHTML("beforeend",`<div class="dialogue"><b>${n}</b><p>${t}</p></div>`)}
function choices(list){$("choices").innerHTML="";list.forEach(c=>{const b=document.createElement("button");b.className="choice";b.innerHTML=`<strong>${c.title}</strong><span>${c.effect}</span>`;b.onclick=c.action;$("choices").appendChild(b)})}

function startMission(){
 if(game.energy<10)return;game.energy-=10;
 mission=createMission({number:game.completed+1,probeUsed:probeUsedThisPrep,probeOutcome});
 $("missionNo").textContent=String(mission.number).padStart(3,"0");show("mission");update();opening()
}

function opening(){
 const o=getOpening(mission);$("phase").textContent=o.phase;$("risk").textContent=o.risk;$("sceneTitle").textContent=o.title;$("story").innerHTML="";$("return").classList.add("hidden");
 narration(o.narration);o.dialogue.forEach(x=>dialogue(x[0],x[1]));
 choices([
 {title:"Die Tür sprengen",effect:"Schneller Zugang · hohes Risiko · mögliche Schäden",action:breach},
 {title:"Das Kontrollsystem entschlüsseln",effect:"Forschungsgewinn · unbekannte Reaktion",action:decode},
 {title:"Den Bereich absichern und nach einem zweiten Zugang suchen",effect:"Zusätzliche Informationen · Zeitverlust",action:secure},
 {title:"Mission vorerst abbrechen",effect:"Keine weiteren Risiken · Erkenntnisse bleiben unvollständig",action:earlyReturn}])
}

function scene(title,phase,risk,intro,lines,opts){$("sceneTitle").textContent=title;$("phase").textContent=phase;$("risk").textContent=risk;$("story").innerHTML="";narration(intro);lines.forEach(x=>dialogue(x[0],x[1]));choices(opts)}

function breach(){
 mission.decisions.push("Tür gesprengt");mission.flags.alarmTriggered=true;addWorldFlag(game,"guardiansAwakened");
 scene("Gewaltsamer Zugang","Phase: Eskalation","Risiko: hoch","Die Detonation reißt die Tür aus ihrer Verankerung und aktiviert ein verborgenes Verteidigungssystem.",
 [["Colonel Arden","Die Tür ist offen. Das mit den roten Lichtern war allerdings nicht Teil des Plans."],["Dr. Mara Voss","Energiespitze im gesamten Komplex. Wir haben höchstens neunzig Sekunden."],["Tyrek","Die Wächter werden erwachen."]],
 [
 {title:"Das Relikt bergen",effect:"Forschung +5 · Verletzungsrisiko",action:()=>finish({title:"Relikt unter Beschuss geborgen",outcome:"Erfolg mit Verletzung",summary:"Das Team sicherte ein beschädigtes Relikt und entkam den erwachenden Wächtern.",info:"Wer erschuf die Wächter und warum reagierten sie auf Tyrek?",research:5,energy:0,healthChange:"kern",flags:["Wächtersystem aktiviert","Relikt geborgen","Dr. Kern verletzt"],text:"Unter schwerem Feuer erreicht das Team das Gate. Hinter ihnen brechen metallische Wächter durch den Nebel.",lines:[["Dr. Elias Kern","Nur damit das festgehalten wird: Ich war gegen die Sprengung."],["Colonel Arden","Und trotzdem haben Sie das Relikt nicht losgelassen. Das nenne ich Teamgeist."]]})},
 {title:"Sofort zum Gate zurückziehen",effect:"Keine Verletzten · kaum Erkenntnisse",action:()=>finish({title:"Taktischer Rückzug",outcome:"Abbruch",summary:"Das Team kehrte ohne Fund zurück. Die Anlage blieb aktiv.",info:"Was befindet sich hinter der zerstörten Tür?",research:1,energy:2,flags:["Wächtersystem aktiviert"],text:"Als das Gate sich schließt, erscheinen große Silhouetten im Eingang der Anlage.",lines:[["Tyrek","Sie haben uns gesehen."],["Colonel Arden","Dann wissen sie wenigstens, an wen sie die Beschwerde richten müssen."]]})}
 ])
}

function decode(){
 mission.decisions.push("Kontrollsystem entschlüsselt");
 scene("Die vergessene Sequenz","Phase: Analyse","Risiko: mittel","Voss verbindet eine mobile Energiequelle mit der Tür. Kern erkennt, dass die Symbolfolge eine Warnung beschreibt.",
 [["Dr. Elias Kern","Wörtlich übersetzt: Wissen bewahren. Träger vernichten."],["Colonel Arden","Erstaunlich unfreundlich für eine Tür."],["Dr. Mara Voss","Das System verlangt eine biologische Signatur."],["Tyrek","Meine Signatur könnte akzeptiert werden. Sie könnte jedoch auch erkannt werden."]],
 [
 {title:"Tyreks Signatur verwenden",effect:"Forschung +7 · starke Langzeitfolge",action:()=>finish({title:"Archivkammer geöffnet",outcome:"Erfolg mit unbekannter Folge",summary:"Tyreks Signatur öffnete eine versiegelte Kammer mit historischen Aufzeichnungen.",info:"Warum erkannte die Anlage Tyrek als autorisierten Träger?",research:7,energy:0,flags:["Tyrek erkannt","Signal ausgesendet","Archivdaten gesichert"],world:()=>{addWorldFlag(game,"tyrekRecognized");addWorldFlag(game,"signalDetected")},text:"Im Inneren schwebt ein intaktes Datenarchiv. Gleichzeitig sendet die Anlage einen Impuls in den Orbit.",lines:[["Dr. Mara Voss","Wir haben das Archiv. Aber jemand weiß jetzt, dass wir hier sind."],["Tyrek","Nicht irgendjemand."]]})},
 {title:"Die Verriegelung technisch überbrücken",effect:"Forschung +4 · Energie -2 · keine Ortung",action:()=>finish({title:"Sicherheitssystem umgangen",outcome:"Erfolg",summary:"Voss öffnete die Tür und sicherte einen Teil des Archivs.",info:"Welche Daten wurden beim Überbrücken gelöscht?",research:4,energy:-2,flags:["Teilarchiv gesichert"],text:"Die Tür öffnet sich, doch mehrere Datenspeicher verglühen. Ein Kernbestand bleibt erhalten.",lines:[["Colonel Arden","Sie haben eine jahrtausendealte Tür gehackt."],["Dr. Mara Voss","Ich habe sie überzeugt, ihre Standards zu senken."]]})}
 ])
}

function secure(){
 mission.decisions.push("Umgebung abgesichert");
 scene("Spuren im Nebel","Phase: Aufklärung","Risiko: unbekannt","Hinter dem Nordflügel entdeckt Tyrek frische Spuren. Kurz darauf empfängt Voss ein schwaches menschliches Notsignal.",
 [["Colonel Arden","Das war vor der Sonde noch nicht da."],["Dr. Mara Voss","Das Signal verwendet eine alte Kennung unseres Kommandos."],["Dr. Elias Kern","Dann war schon einmal jemand von uns hier."],["Tyrek","Oder jemand möchte, dass wir das glauben."]],
 [
 {title:"Dem Notsignal folgen",effect:"Verschollenes Einsatzprotokoll · möglicher Hinterhalt",action:()=>finish({title:"Geheime Einsatzakte geborgen",outcome:"Erfolg",summary:"Das Team fand das Protokoll einer unbekannten früheren Expedition.",info:"Wer gehörte zu Einsatzteam 0 und warum existiert es nicht im Archiv?",research:3,energy:1,flags:["Hinweis auf Einsatzteam 0"],world:()=>addWorldFlag(game,"hiddenTeamZero"),text:"In einem Schutzraum liegt ein beschädigtes Aufnahmegerät. Die letzte Nachricht lautet: Öffnet die Tür nicht.",lines:[["Dr. Elias Kern","Diese Kennung ist älter als unser Gate-Programm."],["Colonel Arden","Dann hat jemand sehr gründlich etwas vergessen."]]})},
 {title:"Die Spuren verfolgen",effect:"Unbekannte Beobachter entdecken",action:()=>finish({title:"Fremde Beobachter entdeckt",outcome:"Kontakt vermieden",summary:"Das Team identifizierte getarnte Beobachter und vermied direkten Kontakt.",info:"Warum überwachten die Fremden das Team und die Anlage?",research:2,energy:3,flags:["Fremde Beobachter bestätigt"],world:()=>addWorldFlag(game,"watchersObserved"),text:"Für einen Moment bricht die Tarnung mehrerer humanoider Gestalten zusammen. Sie greifen nicht an.",lines:[["Tyrek","Sie wollten nicht gefunden werden."],["Colonel Arden","Dann sind wir quitt."]]})},
 {title:"Zur Anlage zurückkehren",effect:"Zur Ausgangssituation zurück",action:opening}
 ])
}

function earlyReturn(){
 mission.decisions.push("Früher Abbruch");
 finish({title:"Aufklärung abgebrochen",outcome:"Freiwilliger Rückzug",summary:"Das Team kehrte zurück, bevor die versiegelte Anlage untersucht wurde.",info:"Was befindet sich hinter der versiegelten Tür?",research:0,energy:2,flags:["Anlage unerforscht"],text:"Das Team zieht sich geordnet zum Gate zurück. Die Tempelanlage verschwindet wieder im Nebel.",lines:[["Dr. Elias Kern","Wir werden zurückkommen müssen."],["Colonel Arden","Dann bringen wir beim nächsten Mal vielleicht eine Tür mit, die kooperativer ist."]]})
}

function finish(r){
 if(r.world)r.world();game.research+=r.research;game.energy=Math.max(0,game.energy+r.energy);
 if(r.healthChange){const member=game.team.find(x=>x.id===r.healthChange);if(member)member.health="leicht verletzt"}
 game.baseStatus=`Expedition ${String(mission.number).padStart(3,"0")} abgeschlossen: ${r.outcome}.`;mission.result=r;
 $("phase").textContent="Phase: Abschluss";$("risk").textContent="Status: Rückkehr möglich";$("sceneTitle").textContent=r.title;$("story").innerHTML="";narration(r.text);r.lines.forEach(x=>dialogue(x[0],x[1]));$("choices").innerHTML="";$("return").classList.remove("hidden");update()
}

function returnBase(){
 const r=mission.result;
 game.archive.push({no:String(mission.number).padStart(3,"0"),planet:mission.planet,title:r.title,outcome:r.outcome,summary:r.summary,info:r.info,flags:r.flags,decisions:mission.decisions,probeUsed:mission.probeUsed,probeOutcome:mission.probeOutcome,log:[...$("story").children].map(x=>x.textContent.trim())});
 game.completed++;mission=null;resetGate();update();show("base")
}

document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));
glyphs.forEach(b=>b.onclick=()=>lock(b));
$("prepare").onclick=()=>{resetGate();show("gateView")};
$("autoDial").onclick=autoDial;$("probe").onclick=runProbe;$("start").onclick=startMission;$("return").onclick=returnBase;
$("reset").onclick=()=>{if(confirm("Den gesamten Spielstand einschließlich Einsatzarchiv löschen?")){resetSavedGame();game=freshGame();mission=null;resetGate();update();show("base")}};
initSlots($("slots"));update();
