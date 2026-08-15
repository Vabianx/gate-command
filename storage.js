export const STORAGE_KEY = "gate-command-save-v03";
export function loadGame(freshGame){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?{...freshGame(),...JSON.parse(raw)}:freshGame()}catch{return freshGame()}}
export function saveGame(game){localStorage.setItem(STORAGE_KEY,JSON.stringify(game))}
export function resetSavedGame(){localStorage.removeItem(STORAGE_KEY)}
