export const STORAGE_KEY="gate-command-save-v054";
const LEGACY_KEYS=["gate-command-save-v053","gate-command-save-v052","gate-command-save-v051","gate-command-save-v05","gate-command-save-v04"];
export function loadGame(freshGame,normalizeGame){try{let raw=localStorage.getItem(STORAGE_KEY);if(!raw){for(const key of LEGACY_KEYS){const legacy=localStorage.getItem(key);if(legacy){raw=legacy;break}}}if(!raw)return freshGame();return normalizeGame(JSON.parse(raw))}catch{return freshGame()}}
export function saveGame(game){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(game))}catch{}}
export function resetSavedGame(){localStorage.removeItem(STORAGE_KEY);LEGACY_KEYS.forEach(k=>localStorage.removeItem(k))}
