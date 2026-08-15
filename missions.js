export function createMission({number,world,probeUsed,probeOutcome}){return{
number,planet:world.code,worldId:world.id,worldName:world.name,probeUsed,probeOutcome,result:null
}}
export function getOpening(mission,game){
if(mission.worldId==="p4x761")return temple(mission,game);
if(mission.worldId==="n7c204")return valley(game);
return ice(game)
}
function temple(mission,game){
const probeIntro=mission.probeUsed?"Die Sondendaten haben eine schwache Energiesignatur und uneindeutige Lebenszeichen gemeldet.":"GC-1 betritt den Planeten ohne vorherige Aufklärung. Schon nach wenigen Metern wird klar, dass die Umgebung schwer einzuschätzen ist.";
const memory=game.worldFlags.guardiansAwakened?" O'Dell bleibt abrupt stehen. Dieselben Energiemuster wie bei den Wächtern sind wieder messbar.":"";
return{title:"Die versiegelte Anlage",phase:"Phase: Erkundung",risk:mission.probeUsed?"Risiko: mittel":"Risiko: unbekannt",narration:`${probeIntro} Dichter Nebel liegt über einer verlassenen Tempelanlage. Eine massive Steintür blockiert den einzigen sichtbaren Zugang.${memory}`,dialogue:[
["Colonel Jack O'Dell","Wir verschwenden hier unsere Zeit. Sprengen wir das Ding auf und gut ist."],
["Dr. David Jaxon","Diese Tür ist möglicherweise älter als die gesamte Anlage. Eine Sprengung würde jeden Hinweis auf ihre Erbauer vernichten."],
["Captain Kim Calder","Die Symbole reagieren auf schwache Energieimpulse. Ich könnte versuchen, die Sequenz zu rekonstruieren."],
["Tae'Khan","Ich habe diese Zeichen schon gesehen. Damals öffneten sie keine Tür. Sie warnten vor dem, was dahinter lag."]]}}
function valley(game){return{title:"Das Signal im Tal",phase:"Phase: Annäherung",risk:"Risiko: mittel",narration:`GC-1 tritt in trockene, warme Luft. Schwarzer Basalt bedeckt das Tal. ${game.worldFlags.signalDetected?"Calder erkennt sofort dieselbe Frequenz wie das Signal aus der Archivkammer.":"Mehrere schwache Funksignale überlagern sich im Tal."} In der Ferne liegt eine kleine Siedlung, darüber schwebt ein beschädigtes fremdes Fluggerät.`,dialogue:[
["Captain Kim Calder","Das Signal kommt gleichzeitig aus der Siedlung und aus dem Schiff."],
["Dr. David Jaxon","Dann ist wahrscheinlich mindestens eine Seite nicht freiwillig hier."],
["Colonel Jack O'Dell","Gut. Zwei Probleme zum Preis von einem."],
["Tae'Khan","Das Schiff gehört zu einer militärischen Kaste, die ich kenne. Sie verhandelt selten."]]}}
function ice(game){return{title:"Das Eisarchiv",phase:"Phase: Untersuchung",risk:"Risiko: hoch",narration:`Der Horizont ist weiß und nahezu strukturlos. Unter dem Gate vibriert der Boden schwach. ${game.worldFlags.hiddenTeamZero?"Auf einem gefrorenen Terminal erscheint dieselbe Kennung wie im Protokoll von Einsatzteam 0.":"Ein uraltes Notsignal pulsiert unter mehreren Metern Eis."} Calder lokalisiert eine unterirdische Anlage.`,dialogue:[
["Captain Kim Calder","Die Energiequelle liegt direkt unter uns. Und sie ist deutlich stärker als alles auf P4X-761."],
["Colonel Jack O'Dell","Unter uns. Im Eis. Natürlich."],
["Dr. David Jaxon","Wenn das wirklich mit Einsatzteam 0 zusammenhängt, müssen wir da runter."],
["Tae'Khan","Etwas dort unten ist noch aktiv."]]}}
