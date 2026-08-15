export function createMission({number,probeUsed,probeOutcome}){return{number,planet:"P4X-761",probeUsed,probeOutcome,flags:{alarmTriggered:false,artifactFound:false,teamInjury:false,unknownContact:false,signalBroadcast:false},decisions:[],result:null}}
export function getOpening(mission){
 const probeIntro=mission.probeUsed?"Die Sondendaten haben eine schwache Energiesignatur und uneindeutige Lebenszeichen gemeldet.":"Das Team betritt den Planeten ohne vorherige Aufklärung. Schon nach wenigen Metern wird klar, dass die Umgebung schwer einzuschätzen ist.";
 const extra=mission.probeOutcome==="detected"?" Während des Anmarschs fällt Voss auf, dass mehrere Sensoranzeigen plötzlich verstummen. Irgendetwas könnte die Sonde bemerkt haben.":"";
 return{title:"Die versiegelte Anlage",phase:"Phase: Erkundung",risk:mission.probeUsed?"Risiko: mittel":"Risiko: unbekannt",narration:`${probeIntro} Dichter Nebel liegt über einer verlassenen Tempelanlage. Eine massive Steintür blockiert den einzigen sichtbaren Zugang.${extra}`,dialogue:[
 ["Colonel Arden","Wir verschwenden hier unsere Zeit. Sprengen wir das Ding auf und gut ist."],
 ["Dr. Elias Kern","Diese Tür ist möglicherweise älter als die gesamte Anlage. Eine Sprengung würde jeden Hinweis auf ihre Erbauer vernichten."],
 ["Dr. Mara Voss","Die Symbole reagieren auf schwache Energieimpulse. Ich könnte versuchen, die Sequenz zu rekonstruieren."],
 ["Tyrek","Ich habe diese Zeichen schon gesehen. Damals öffneten sie keine Tür. Sie warnten vor dem, was dahinter lag."]]}
}
