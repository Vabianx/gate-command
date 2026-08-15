import{TEAM}from"./characters.js";
export function freshGame(){return{energy:100,research:0,personnel:4,completed:0,archive:[],baseStatus:"Keine Expedition aktiv.",worldFlags:{signalDetected:false,guardiansAwakened:false,hiddenTeamZero:false,watchersObserved:false,tyrekRecognized:false},team:JSON.parse(JSON.stringify(TEAM))}}
export function addWorldFlag(game,key,value=true){game.worldFlags[key]=value}
