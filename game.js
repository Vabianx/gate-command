import{TEAM}from"./characters.js";
import{WORLDS}from"./worlds.js";
export function freshGame(){return{
energy:100,research:0,personnel:4,completed:0,archive:[],baseStatus:"Keine Expedition aktiv.",
worldFlags:{signalDetected:false,guardiansAwakened:false,hiddenTeamZero:false,watchersObserved:false,taekhanRecognized:false},
unlockedWorldIds:["p4x761"],team:JSON.parse(JSON.stringify(TEAM)),worlds:JSON.parse(JSON.stringify(WORLDS))
}}
export function addWorldFlag(game,key,value=true){game.worldFlags[key]=value}
export function unlockWorld(game,id){if(!game.unlockedWorldIds.includes(id))game.unlockedWorldIds.push(id)}
