import {loadGame, saveGame, resetSavedGame} from "./storage.js?v=0.5.6";
import {SYMBOLS, TEAM, WORLDS, EQUIPMENT, FIND_CATEGORIES, FACTIONS} from "./data.js?v=0.5.6";

const BUILD_VERSION = "0.5.6";
const $ = id => document.getElementById(id);
const views = document.querySelectorAll(".view");
const glyphs = document.querySelectorAll(".glyph");
const clone = obj => JSON.parse(JSON.stringify(obj));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

let selected = [];
let gateOpen = false;
let probeUsed = false;
let probeOutcome = null;
let loadout = [];
let selectedWorldId = "px761";
let mission = null;

function freshGame() {
  return {
    version: BUILD_VERSION,
    energy: 100,
    research: 0,
    materials: 0,
    equipmentSlots: 1,
    completed: 0,
    baseStatus: "Keine Expedition aktiv.",
    team: clone(TEAM),
    worlds: clone(WORLDS),
    equipment: clone(EQUIPMENT),
    knownFactions: clone(FACTIONS),
    unlockedWorldIds: ["px761", "px204", "px118"],
    surveyedWorldIds: [],
    visitedWorldIds: [],
    archive: [],
    finds: [],
    inventory: { fragment_threshold: 0, threshold_eye: 0 },
    worldFlags: { px118Blocked: false, watchersObserved: false, nonBreathableLogged: false },
    projects: {
      threshold_eye: {
        id: "threshold_eye",
        name: "Schwellenrelikt rekonstruieren",
        status: "locked",
        visible: false,
        requires: { fragment_threshold: 3, research: 6, materials: 2 },
        duration: 2,
        remaining: 0,
        resultItem: "threshold_eye"
      },
      expanded_loadout: {
        id: "expanded_loadout",
        name: "Erweiterter Expeditionsrahmen",
        status: "locked",
        visible: false,
        requires: { completed: 50, research: 40, materials: 20 },
        duration: 3,
        remaining: 0,
        result: "equipment_slot"
      }
    }
  };
}

function normalizeGame(saved) {
  const base = freshGame();
  const g = { ...base, ...saved };
  g.version = BUILD_VERSION;
  g.team = Array.isArray(saved?.team) ? saved.team : base.team;
  g.worlds = clone(base.worlds);
  g.equipment = clone(base.equipment);
  if (Array.isArray(saved?.equipment)) {
    for (const item of g.equipment) {
      const old = saved.equipment.find(x => x.id === item.id);
      if (old) item.unlocked = !!old.unlocked;
    }
  }
  g.knownFactions = { ...base.knownFactions, ...(saved?.knownFactions || {}) };
  g.inventory = { ...base.inventory, ...(saved?.inventory || {}) };
  g.worldFlags = { ...base.worldFlags, ...(saved?.worldFlags || {}) };
  g.projects = { ...base.projects, ...(saved?.projects || {}) };
  g.unlockedWorldIds = Array.isArray(saved?.unlockedWorldIds) && saved.unlockedWorldIds.length ? saved.unlockedWorldIds.map(id => ({ p4x761: "px761", n7c204: "px204", k2m118: "px118" }[id] || id)) : base.unlockedWorldIds;
  g.surveyedWorldIds = Array.isArray(saved?.surveyedWorldIds) ? saved.surveyedWorldIds : [];
  g.visitedWorldIds = Array.isArray(saved?.visitedWorldIds) ? saved.visitedWorldIds : [];
  g.archive = Array.isArray(saved?.archive) ? saved.archive : [];
  g.finds = Array.isArray(saved?.finds) ? saved.finds : [];
  g.energy = Number.isFinite(saved?.energy) ? saved.energy : 100;
  g.research = Number.isFinite(saved?.research) ? saved.research : 0;
  g.materials = Number.isFinite(saved?.materials) ? saved.materials : 0;
  g.equipmentSlots = Number.isFinite(saved?.equipmentSlots) ? saved.equipmentSlots : 1;
  g.completed = Number.isFinite(saved?.completed) ? saved.completed : 0;
  return g;
}

let game = loadGame(freshGame, normalizeGame);
selectedWorldId = game.unlockedWorldIds[0] || "px761";

const worldById = id => game.worlds.find(w => w.id === id);
const selectedWorld = () => worldById(selectedWorldId);
const visited = id => game.visitedWorldIds.includes(id);
const surveyed = id => game.surveyedWorldIds.includes(id);
const hasLoadout = id => loadout.includes(id);
const hasInventory = id => id === "threshold_eye" && (game.inventory.threshold_eye || 0) > 0;

function show(id) {
  views.forEach(v => v.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo(0, 0);
}

function setGateStatus(text, state = "idle") {
  $("gateStatus").textContent = text;
  $("gateIndicator").className = "status-dot";
  if (state !== "idle") $("gateIndicator").classList.add(state);
}

function initSlots(address) {
  $("addressSlots").innerHTML = address.map((s, i) => `<div class="slot" data-slot="${i}">${SYMBOLS[s] || "?"}</div>`).join("");
}

function hiddenSummaryForWorld(w) {
  if (visited(w.id)) return `${w.code} · ${w.revealedName}`;
  return `${w.code} · Unbekannte Zielwelt`;
}

function updateProjectVisibility() {
  const p1 = game.projects.threshold_eye;
  if ((game.inventory.fragment_threshold || 0) > 0 || p1.status !== "locked") p1.visible = true;
  if (p1.status === "locked" && (game.inventory.fragment_threshold || 0) >= 3 && game.research >= 6 && game.materials >= 2) p1.status = "ready";

  const p2 = game.projects.expanded_loadout;
  if (game.completed >= 50 || p2.status !== "locked") p2.visible = true;
  if (p2.visible && p2.status === "locked" && game.completed >= 50 && game.research >= 40 && game.materials >= 20) p2.status = "ready";
}

function getVisibleProjects() {
  updateProjectVisibility();
  return Object.values(game.projects).filter(p => p.visible || p.status !== "locked");
}

function renderBaseSummary() {
  $("energy").textContent = game.energy;
  $("research").textContent = game.research;
  $("materials").textContent = game.materials;
  $("slotsStat").textContent = game.equipmentSlots;
  $("baseStatus").textContent = game.baseStatus;
  $("summaryAddresses").textContent = game.unlockedWorldIds.length;
  $("summaryVisited").textContent = game.visitedWorldIds.length;
  $("summaryFinds").textContent = game.finds.length;
  $("summaryProjects").textContent = getVisibleProjects().length;
}

function renderProjectHTML(project) {
  const req = project.requires || {};
  const bits = [];
  if (req.fragment_threshold) bits.push(`Fragmente ${game.inventory.fragment_threshold || 0}/${req.fragment_threshold}`);
  if (req.research) bits.push(`Forschung ${game.research}/${req.research}`);
  if (req.materials) bits.push(`Material ${game.materials}/${req.materials}`);
  if (req.completed) bits.push(`Expeditionen ${game.completed}/${req.completed}`);
  let statusText = project.status;
  if (project.status === "locked") statusText = "gesperrt";
  if (project.status === "ready") statusText = "bereit";
  if (project.status === "active") statusText = `Analyse läuft, noch ${project.remaining} Expedition${project.remaining === 1 ? "" : "en"}`;
  if (project.status === "done") statusText = "abgeschlossen";
  const button = project.status === "ready" ? `<button data-project="${project.id}">Projekt starten</button>` : "";
  return `<article><small>LABORPROJEKT</small><h3>${project.name}</h3><p>${bits.join(" · ") || "Keine Anforderungen"}</p><p class="muted">Status: ${statusText}</p>${button}</article>`;
}

function renderProjects() {
  const visible = getVisibleProjects();
  const html = visible.length ? visible.map(renderProjectHTML).join("") : "<p>Keine verwertbaren Baupläne.</p>";
  $("projectPreview").innerHTML = html;
  $("labProjects").innerHTML = html;
  document.querySelectorAll("[data-project]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.project;
      const p = game.projects[id];
      if (!p || p.status !== "ready") return;
      const req = p.requires || {};
      if (req.fragment_threshold) game.inventory.fragment_threshold -= req.fragment_threshold;
      if (req.research) game.research -= req.research;
      if (req.materials) game.materials -= req.materials;
      p.status = "active";
      p.remaining = p.duration;
      game.baseStatus = `Laborprojekt gestartet: ${p.name}.`;
      saveGame(game);
      updateAll();
    };
  });
}

function renderEquipmentArchive() {
  $("equipmentCapacityText").textContent = `Aktuelle Einsatzkapazität: ${game.equipmentSlots} Modul${game.equipmentSlots === 1 ? "" : "e"}.`;
  $("equipmentArchive").innerHTML = game.equipment.map(item => `<article class="${item.unlocked ? "" : "locked"}"><small>${item.category}</small><h3>${item.name}</h3><p>${item.description}</p><div class="taglist">${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div><p class="${item.unlocked ? "ok" : "muted"}">${item.unlocked ? "verfügbar" : "noch nicht verfügbar"}</p></article>`).join("");
}

function renderFinds() {
  if (!game.finds.length) {
    $("findArchive").innerHTML = "<article><p>Noch keine Funde dokumentiert.</p></article>";
    $("findPreview").textContent = "Noch keine Funde dokumentiert.";
    return;
  }
  const recent = game.finds.slice().reverse();
  $("findArchive").innerHTML = recent.map(f => `<article><small>${FIND_CATEGORIES[f.category] || f.category}</small><h3>${f.name}</h3><p>${f.description}</p><p class="muted mini">Quelle: ${f.source}</p></article>`).join("");
  $("findPreview").innerHTML = recent.slice(0, 3).map(f => `<p><b>${f.name}</b><br><span class="muted mini">${f.source}</span></p>`).join("");
}

function renderFactions() {
  const knownEntries = Object.values(game.knownFactions).filter(f => (f.known || 0) > 0);
  if (!knownEntries.length) {
    $("factionArchive").innerHTML = `<article><p>Noch keine bestätigten Kontakte.</p><p class="muted">Fraktionsdaten werden erst nach realen Begegnungen, Sondensignaturen oder Einsatzberichten angelegt.</p></article>`;
    return;
  }
  $("factionArchive").innerHTML = knownEntries.map(f => `<article><small>${f.category}</small><h3>${f.name}</h3><p>${f.description}</p><p class="muted mini">Wissensstand: ${f.known}</p></article>`).join("");
}

function renderTeam() {
  $("teamCards").innerHTML = game.team.map(member => `<article><small>${member.role}</small><h3>${member.name}</h3><p>${member.traits}</p><p class="ok">${member.health}</p></article>`).join("");
}

function renderArchive() {
  if (!game.archive.length) {
    $("archiveList").innerHTML = "<article><p>Noch keine Einsatzakten vorhanden.</p></article>";
    return;
  }
  $("archiveList").innerHTML = game.archive.slice().reverse().map(r => `<article class="report"><small>EINSATZAKTE ${r.no}</small><h3>${r.title}</h3><p class="report-meta">${r.planet} · ${r.outcome}</p><p>${r.summary}</p><div class="taglist">${(r.flags || []).map(f => `<span class="tag">${f}</span>`).join("")}</div><p class="warning"><b>Unvollständige Informationen:</b> ${r.info}</p><details><summary>Einsatzprotokoll öffnen</summary>${(r.log || []).map(x => `<p>${x}</p>`).join("")}</details></article>`).join("");
}

function renderGateRegister() {
  const select = $("destinationSelect");
  select.innerHTML = game.unlockedWorldIds.map(id => {
    const w = worldById(id);
    return `<option value="${w.id}" ${w.id === selectedWorldId ? "selected" : ""}>${hiddenSummaryForWorld(w)}</option>`;
  }).join("");
  renderDestinationMeta();
  initSlots(selectedWorld().address);
  $("destinationCode").textContent = selectedWorld().code;
  $("destinationName").textContent = visited(selectedWorldId) ? selectedWorld().revealedName : selectedWorld().unknownName;
  let status = `Status: ${selectedWorld().status}.`;
  if (visited(selectedWorldId)) status += ` Einsatzname bestätigt: ${selectedWorld().revealedName}.`;
  else if (surveyed(selectedWorldId)) status += ` Sondendaten vorhanden. Einsatzname noch nicht bestätigt.`;
  else status += ` Keine Einsatzdaten vorhanden.`;
  if (selectedWorld().lockedText) status += ` ${selectedWorld().lockedText}`;
  $("destinationStatus").textContent = status;
  $("scanWorldCode").textContent = probeUsed ? selectedWorld().code : "NO LINK";
}

function renderDestinationMeta() {
  const w = selectedWorld();
  const lines = [`<p><b>${w.code}</b></p>`];
  lines.push(`<p class="muted mini">${visited(w.id) ? `Einsatzname: ${w.revealedName}` : "Einsatzname: unbekannt"}</p>`);
  lines.push(`<p class="muted mini">${surveyed(w.id) ? "Sondierung: vorhanden" : "Sondierung: keine Daten"}</p>`);
  if (visited(w.id)) {
    lines.push(`<p class="muted mini">Geländetyp: ${w.profile.terrain}</p>`);
  }
  $("destinationMeta").innerHTML = lines.join("");
}

function renderLoadout() {
  const panel = $("loadoutPanel");
  if (!probeUsed) {
    panel.classList.add("hidden-block");
    $("loadoutList").innerHTML = "";
    $("loadoutText").textContent = "Ausrüstung erscheint nach dem Sondenscan.";
    return;
  }
  panel.classList.remove("hidden-block");
  $("loadoutText").textContent = `Ausrüstungskapazität: ${game.equipmentSlots} Modul${game.equipmentSlots === 1 ? "" : "e"}. Gewählt: ${loadout.length}/${game.equipmentSlots}.`;
  const choices = game.equipment.filter(item => item.unlocked);
  $("loadoutList").innerHTML = choices.map(item => `<button class="module-button ${hasLoadout(item.id) ? "active" : ""}" data-equip="${item.id}"><strong>${item.name}</strong><span>${item.category}</span><small>${item.description}</small></button>`).join("");
  document.querySelectorAll("[data-equip]").forEach(btn => btn.onclick = () => {
    const id = btn.dataset.equip;
    if (loadout.includes(id)) loadout = loadout.filter(x => x !== id);
    else {
      if (loadout.length >= game.equipmentSlots) loadout.shift();
      loadout.push(id);
    }
    renderLoadout();
    updateActionButtons();
  });
}

function resetProbeVisual() {
  const v = $("probeVisual");
  v.className = "probe-visual scan-off";
  $("probeSignal").className = "signal-label";
  $("probeSignal").textContent = "KEIN SIGNAL";
  $("scanQuality").textContent = "DATA 0%";
  $("probeData").innerHTML = "<p>Für Sondendaten muss zuerst eine stabile Gate-Verbindung aufgebaut werden.</p>";
}

function updateActionButtons() {
  $("probe").disabled = !gateOpen || probeUsed || selectedWorld().lockedText || game.energy < 5;
  $("start").disabled = !(gateOpen && probeUsed && loadout.length > 0 && game.energy >= 10);
}

function resetGate(resetWorld = false) {
  if (resetWorld && game.unlockedWorldIds.length) selectedWorldId = game.unlockedWorldIds[0];
  selected = [];
  gateOpen = false;
  probeUsed = false;
  probeOutcome = null;
  loadout = [];
  glyphs.forEach(g => { g.classList.remove("selected", "wrong"); g.disabled = false; });
  $("gate").classList.remove("open", "dialing");
  setGateStatus("Gate inaktiv");
  resetProbeVisual();
  renderGateRegister();
  renderLoadout();
  updateActionButtons();
}

function lockGlyph(btn) {
  const symbol = btn.dataset.symbol;
  const address = selectedWorld().address;
  if (selected.includes(symbol) || gateOpen) return;
  if (symbol !== address[selected.length]) {
    btn.classList.add("wrong");
    setGateStatus(`Glyph nicht in Sequenz · erwartet ${SYMBOLS[address[selected.length]]}`, "error");
    setTimeout(() => btn.classList.remove("wrong"), 500);
    return;
  }
  selected.push(symbol);
  btn.classList.add("selected");
  btn.disabled = true;
  const slot = document.querySelector(`[data-slot="${selected.length - 1}"]`);
  if (slot) slot.classList.add("locked");
  $("gate").classList.add("dialing");
  setGateStatus(`Symbol ${selected.length}/7 verriegelt`, "dialing");
  if (selected.length === address.length) {
    gateOpen = true;
    $("gate").classList.remove("dialing");
    $("gate").classList.add("open");
    setGateStatus(`Verbindung nach ${selectedWorld().code} stabil`, "active");
    updateActionButtons();
  }
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function autoDial() {
  if (selectedWorld().lockedText) return;
  resetGate(false);
  $("autoDial").disabled = true;
  setGateStatus("Adresse wird angewählt", "dialing");
  for (const sym of selectedWorld().address) {
    const btn = document.querySelector(`[data-symbol="${sym}"]`);
    if (btn) {
      lockGlyph(btn);
      await wait(380);
    }
  }
  $("autoDial").disabled = false;
}

function scannerHint(world) {
  const rows = [
    `<p><b>Atmosphäre:</b> ${world.profile.environment}</p>`,
    `<p><b>Gelände:</b> ${world.profile.terrain}</p>`,
    `<p><b>Strukturen:</b> ${world.profile.structures}</p>`,
    `<p><b>Energie:</b> ${world.profile.energy}</p>`,
    `<p><b>Lebenszeichen:</b> ${world.profile.life}</p>`,
    `<p><b>Signatur:</b> ${world.profile.signature}</p>`
  ];
  if (world.profile.environment.includes("nicht atembar")) rows.push(`<p class="warning"><b>Hinweis:</b> Diese Welt ist derzeit nicht sicher begehbar.</p>`);
  return rows.join("");
}

function runProbe() {
  if (!gateOpen || probeUsed || game.energy < 5 || selectedWorld().lockedText) return;
  const world = selectedWorld();
  game.energy -= 5;
  probeUsed = true;
  if (!game.surveyedWorldIds.includes(world.id)) game.surveyedWorldIds.push(world.id);
  const roll = Math.random();
  const visual = $("probeVisual");
  visual.className = `probe-visual ${world.scanClass}`;
  $("scanWorldCode").textContent = world.code;
  if (roll < 0.18) {
    probeOutcome = "detected";
    visual.classList.add("detected");
    $("probeSignal").className = "signal-label alert";
    $("probeSignal").textContent = "SIGNAL GESTÖRT";
    $("scanQuality").textContent = "DATA 61%";
    $("probeData").innerHTML = scannerHint(world) + `<p class="warning"><b>Telemetrie:</b> Die Sonde wurde möglicherweise bemerkt.</p>`;
  } else if (roll < 0.47) {
    probeOutcome = "partial";
    $("probeSignal").className = "signal-label warn";
    $("probeSignal").textContent = "UNVOLLSTÄNDIG";
    $("scanQuality").textContent = "DATA 78%";
    $("probeData").innerHTML = scannerHint(world) + `<p class="muted"><b>Telemetrie:</b> Einzelne Bereiche bleiben unklar.</p>`;
  } else {
    probeOutcome = "clear";
    $("probeSignal").className = "signal-label ok";
    $("probeSignal").textContent = "SCAN STABIL";
    $("scanQuality").textContent = "DATA 96%";
    $("probeData").innerHTML = scannerHint(world) + `<p class="ok"><b>Telemetrie:</b> Verwertbare Sondendaten liegen vor.</p>`;
  }
  if (world.id === "px441") game.worldFlags.nonBreathableLogged = true;
  saveGame(game);
  renderGateRegister();
  renderLoadout();
  updateActionButtons();
  renderBaseSummary();
}

function storyPush(text) {
  if (mission) mission.log.push(text);
}

function narration(text) {
  $("story").insertAdjacentHTML("beforeend", `<div class="narration">${text}</div>`);
  storyPush(text);
}

function dialogue(speaker, text) {
  $("story").insertAdjacentHTML("beforeend", `<div class="dialogue"><b>${speaker}</b><p>${text}</p></div>`);
  storyPush(`${speaker}: ${text}`);
}

function clearStory(title, phase, status) {
  $("sceneTitle").textContent = title;
  $("phase").textContent = phase;
  $("statusBadge").textContent = status;
  $("story").innerHTML = "";
}

function renderChoices(list) {
  $("choices").innerHTML = "";
  list.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.innerHTML = `<strong>${choice.title}</strong>`;
    btn.onclick = choice.action;
    $("choices").appendChild(btn);
  });
}

function startMission() {
  if (!gateOpen || !probeUsed || loadout.length < 1 || game.energy < 10) return;
  const world = selectedWorld();
  game.energy -= 10;
  mission = {
    number: game.completed + 1,
    worldId: world.id,
    planet: world.code,
    worldName: visited(world.id) ? world.revealedName : world.unknownName,
    loadout: [...loadout],
    probeOutcome,
    result: null,
    log: []
  };
  $("missionNo").textContent = String(mission.number).padStart(3, "0");
  $("planetName").textContent = `${world.code} · ${visited(world.id) ? world.revealedName : "Unbekannte Zielwelt"}`;
  show("mission");
  openingScene();
  saveGame(game);
  renderBaseSummary();
}

function openingContext() {
  if (!probeUsed) return "GC-1 betritt die Welt ohne vorherige Sondenaufklärung.";
  if (probeOutcome === "detected") return "Die Sonde lieferte Daten, wurde dabei jedoch vermutlich bemerkt.";
  if (probeOutcome === "partial") return "Die Sondentelemetrie war unvollständig und ließ mehrere Fragen offen.";
  return "Die Sonde lieferte verwertbare Daten und half bei der Vorbereitung.";
}

function openingScene() {
  $("return").classList.add("hidden");
  const w = selectedWorld();
  if (w.id === "px761") return px761Opening();
  if (w.id === "px204") return px204Opening();
  if (w.id === "px118") return px118Opening();
  if (w.id === "px392") return px392Opening();
  clearStory("Unbekannte Adresse", "Akt 1: Ankunft", "Status: keine Daten");
  narration(`${openingContext()} Hinter dem Ereignishorizont liegt eine Welt, die noch keinen Einsatznamen besitzt.`);
  dialogue("Colonel Jack O'Dell", "Langsam. Wenn wir nichts wissen, benehmen wir uns auch so.");
  renderChoices([{ title: "Umgebung sondieren", action: () => resolveMission({ title: "Basisdaten gesichert", outcome: "Teilerfolg", summary: "GC-1 dokumentierte die erste Umgebung.", info: "Es fehlen weiterführende Daten.", flags: ["Erstkontakt"], research: 2, materials: 1 }) }]);
}

function px761Opening() {
  clearStory("Ankunft an der Struktur", "Akt 1: Ankunft", "Status: Gelände unbekannt");
  narration(`${openingContext()} Vor dem Team liegt eine monumentale Steinstruktur. Noch ist sie nur PX-761. Ein Einsatzname wäre verfrüht.`);
  dialogue("Captain Kim Calder", "Die Oberfläche ist älter als die Sedimente daneben. Das Ding wurde nicht gebaut, es wurde freigelegt.");
  dialogue("Dr. David Jaxon", "Die Symbole am Rahmen sind kein Schmuck. Das ist eine Anleitung, Warnung oder beides.");
  dialogue("Tae'Khan", "Ich kenne diesen Stil nicht. Aber ich kenne Orte, an denen man besser zuerst zuhört.");
  dialogue("Colonel Jack O'Dell", "Gut. Dann hören wir uns jetzt stillschweigende Steine an.");
  renderChoices([
    { title: "Die rechte Fassung untersuchen", action: px761SocketScene },
    { title: "Die Glyphenwand lesen", action: px761GlyphScene },
    { title: "Erst die äußere Umgebung sichern", action: px761PerimeterScene }
  ]);
}

function px761SocketScene() {
  clearStory("Die rechte Fassung", "Akt 2: Untersuchung", "Status: mechanische Aktivität");
  narration("Nahe der rechten Wandfassung verläuft ein kaum sichtbarer Riss durch den Stein. Dahinter pulsiert in langen Abständen ein schwaches Licht.");
  dialogue("Captain Kim Calder", "Drei Leitbahnen laufen hier zusammen. Etwas wurde entfernt oder nie eingesetzt.");
  dialogue("Dr. David Jaxon", "Die Kante wurde oft berührt. Das ist kein Ornament, das ist ein Bedienpunkt.");
  const options = [];
  if (hasLoadout("scanner")) options.push({ title: "Den Feldscanner auf die Fassung richten", action: px761SocketScanner });
  else options.push({ title: "Die Fassung mit bloßem Auge prüfen", action: px761SocketBlind });
  options.push({ title: "Jaxon die Symbolkante abgleichen lassen", action: px761JaxonCompare });
  options.push({ title: "Zur Glyphenwand wechseln", action: px761GlyphScene });
  renderChoices(options);
}

function px761SocketScanner() {
  clearStory("Verborgene Kammer", "Akt 3: Analyse", "Status: Resonanz erkannt");
  narration("Der Feldscanner legt ein dichtes Netz aus Linien über den Stein. Dahinter erscheint eine kleine Kammer, getrennt durch eine versenkte Platte. In ihrem Inneren liegt ein gebrochenes, aber noch leitfähiges Objekt.");
  dialogue("Captain Kim Calder", "Da drin ist etwas. Kein ganzes Artefakt. Ein Fragment.");
  dialogue("Colonel Jack O'Dell", "Gut. Jetzt kommen wir zu dem Teil, wo wir es holen, ohne die Hälfte des Raums zu beleidigen.");
  renderChoices([
    { title: "Die Platte vorsichtig anheben", action: () => resolveMission({ title: "Erstes Reliktfragment geborgen", outcome: "Erfolg", summary: "GC-1 barg ein gebrochenes Reliktstück aus einer verborgenen Kammer.", info: "Das Fragment gehört offenbar zu einem größeren Mechanismus.", flags: ["Reliktfragment", "Scanner genutzt"], research: 4, materials: 2, find: { name: "Kheprischer Schwellen-Splitter", category: "relic_fragment", inventoryKey: "fragment_threshold", amount: 1, source: "PX-761", description: "Ein gebrochenes Reliktstück mit leitfähigen Symboladern." }, lines: [["Dr. David Jaxon", "Das ist Teil von etwas Größerem. Vielleicht von etwas, das andernorts fortgesetzt wird."], ["Colonel Jack O'Dell", "Dann ist unser Tag ab sofort offiziell fragmentiert."]] }) },
    { title: "Erst den Mechanismus dokumentieren", action: () => resolveMission({ title: "Mechanismus kartiert", outcome: "Teilerfolg", summary: "GC-1 dokumentierte die Fassung und ihre Resonanzmuster.", info: "Ein Fragment blieb in der Kammer zurück.", flags: ["Kartierung", "Unvollständiger Fund"], research: 5, materials: 1, lines: [["Captain Kim Calder", "Wir kennen jetzt die Schaltwege, aber das Fragment bleibt dahinter."], ["Colonel Jack O'Dell", "Schlau. Nicht befriedigend, aber schlau."]] }) },
    { title: "Doch lieber die Glyphenwand prüfen", action: px761GlyphScene }
  ]);
}

function px761SocketBlind() {
  clearStory("Gefühl statt Daten", "Akt 3: Risiko", "Status: unklare Mechanik");
  narration("Ohne Scanner bleibt die Kammer verborgen. Die Steinkante gibt nur vage auf Druck nach. Jeder Eingriff wäre ein Versuch ins Blaue.");
  dialogue("Captain Kim Calder", "Ich kann nicht erkennen, was hinter der Platte liegt. Wenn wir jetzt drücken, lösen wir vielleicht die falsche Stufe aus.");
  dialogue("Colonel Jack O'Dell", "Dann drücken wir vielleicht lieber noch nicht.");
  renderChoices([
    { title: "Die Platte trotzdem anheben", action: () => resolveMission({ title: "Fassung beschädigt", outcome: "Verpasste Chance", summary: "GC-1 öffnete die falsche Platte und verlor den Zugang zum Hohlraum.", info: "Ein möglicher Fund blieb unerreichbar.", flags: ["Fehlentscheidung", "Kein Fund"], research: 1, materials: 0, lines: [["Captain Kim Calder", "Die Kante ist eingerastet. Jetzt komme ich nicht mehr zerstörungsfrei dahinter."], ["Colonel Jack O'Dell", "Das war der wissenschaftliche Fachbegriff für Pech, oder?"]] }) },
    { title: "Jaxon die Symbolkante lesen lassen", action: px761JaxonCompare },
    { title: "Abbrechen und Umgebung sichern", action: px761PerimeterScene }
  ]);
}

function px761JaxonCompare() {
  clearStory("Zeichen und Warnungen", "Akt 3: Deutung", "Status: Sprachmuster aktiv");
  narration("Jaxon fährt die schmale Zeichenreihe mit den Fingern entlang. Einige Symbole wiederholen sich an der Wand und an der Fassung.");
  dialogue("Dr. David Jaxon", "Das ist kein Satz im klassischen Sinn. Es ist eher eine Zuordnung. Träger. Schwelle. Kälte.");
  if (hasLoadout("translator")) {
    dialogue("Dr. David Jaxon", "Mit dem Modul bekomme ich genug Kontext. Drei Trägerstücke öffnen eine Schwelle unter Eis.");
    renderChoices([
      { title: "Die Warnung vollständig protokollieren", action: () => resolveMission({ title: "Warntext entschlüsselt", outcome: "Kultureller Erfolg", summary: "Jaxon rekonstruierte den Warntext einer Schwellenstruktur.", info: "Der Text erwähnt drei Trägerstücke und eine Tür unter Eis.", flags: ["Übersetzung", "PX-118 Hinweis"], research: 5, materials: 1, unlock: "px392", find: { name: "Warnung der drei Träger", category: "cultural", source: "PX-761", description: "Eine teilweise rekonstruierte Inschrift über drei getrennte Trägerstücke und eine Schwelle unter Eis." }, lines: [["Dr. David Jaxon", "Das hier verweist auf eine andere Welt. Kälte, Tiefe und eine Schwelle."], ["Tae'Khan", "Dann sind diese Orte verbunden."], ["Colonel Jack O'Dell", "Gut. Dann haben wir jetzt ein Rätsel mit Reisezielen."]] }) },
      { title: "Zur Fassung zurückkehren und gezielt bergen", action: px761SocketScanner }
    ]);
  } else {
    dialogue("Dr. David Jaxon", "Ohne Hilfsmittel kann ich es nur grob einordnen. Irgendetwas mit Trägern und einer Schwelle.");
    renderChoices([
      { title: "Die unvollständige Übersetzung sichern", action: () => resolveMission({ title: "Zeichenfolge dokumentiert", outcome: "Teilerfolg", summary: "GC-1 dokumentierte die Symbolreihe, konnte sie aber nur teilweise deuten.", info: "Eine Verbindung zu einem kalten Ort ist wahrscheinlich, aber nicht bestätigt.", flags: ["Unvollständige Übersetzung"], research: 2, materials: 0, lines: [["Dr. David Jaxon", "Ich weiß genug, um misstrauisch zu sein. Aber nicht genug, um sicher zu sein."], ["Colonel Jack O'Dell", "Das ist praktisch unser Markenauftritt."]] }) },
      { title: "Zur Fassung zurückkehren", action: px761SocketBlind }
    ]);
  }
}

function px761GlyphScene() {
  clearStory("Die Glyphenwand", "Akt 2: Untersuchung", "Status: Muster erkennbar");
  narration("Die Wand gegenüber dem Gate trägt eine Folge aus wiederkehrenden Glyphen. Drei davon sind stärker abgenutzt als die übrigen.");
  dialogue("Dr. David Jaxon", "Jemand hat genau diese Zeichen immer wieder berührt. Vielleicht markieren sie Reihenfolge oder Bedeutung.");
  dialogue("Tae'Khan", "Oder Zugehörigkeit. Manche Völker benennen Besitz über Wiederholung.");
  renderChoices([
    { title: "Die Zeichen nacheinander prüfen", action: px761JaxonCompare },
    { title: "Die rechte Fassung aufsuchen", action: px761SocketScene },
    { title: "Erst die Außenkammern absichern", action: px761PerimeterScene }
  ]);
}

function px761PerimeterScene() {
  clearStory("Äußere Sicherung", "Akt 2: Sicherung", "Status: Nebenkammer gefunden");
  narration("Jenseits der Hauptstruktur entdeckt das Team eine halb eingestürzte Nebenkammer. Darin liegen leere Behälter, zerbrochene Halterungen und noch intakte Legierungsstreifen.");
  dialogue("Captain Kim Calder", "Nichts Großes, aber genug, um daraus verwertbares Material zu bergen.");
  dialogue("Colonel Jack O'Dell", "Gut. Nicht jeder gute Tag braucht gleich kosmische Offenbarungen.");
  renderChoices([
    { title: "Material bergen und zurückkehren", action: () => resolveMission({ title: "Nebenkammer gesichert", outcome: "Teilerfolg", summary: "GC-1 sicherte eine äußere Nebenkammer und barg verwertbares Material.", info: "Die Hauptstruktur blieb teilweise unerforscht.", flags: ["Materialfund"], research: 2, materials: 4, lines: [["Captain Kim Calder", "Die Legierung ist alt, aber noch stabil."], ["Colonel Jack O'Dell", "Dann war der Spaziergang nicht umsonst."]] }) },
    { title: "Von außen zur Glyphenwand zurück", action: px761GlyphScene },
    { title: "Von außen zur Fassung zurück", action: hasLoadout("scanner") ? px761SocketScanner : px761SocketBlind }
  ]);
}

function px204Opening() {
  clearStory("Wärmeschatten im Basalt", "Akt 1: Ankunft", "Status: Lebenszeichen bestätigt");
  narration(`${openingContext()} PX-204 öffnet sich zu einer dunklen mineralischen Ebene. Der Einsatzname dieser Welt muss erst verdient werden.`);
  dialogue("Captain Kim Calder", "Mehrere Wärmeschatten bewegen sich parallel zum Gate. Das ist kein Zufallsmuster.");
  dialogue("Dr. David Jaxon", "Dann sind wir nicht allein und vermutlich auch nicht unbemerkt.");
  dialogue("Colonel Jack O'Dell", "Großartig. Dann benehmen wir uns, als würden wir beobachtet.");
  renderChoices([
    { title: "Kontakt aufnehmen", action: px204ContactScene },
    { title: "Das beschädigte Fluggerät untersuchen", action: px204ShipScene },
    { title: "Von einer Anhöhe aus beobachten", action: px204ObserveScene }
  ]);
}

function px204ObserveScene() {
  clearStory("Beobachtungsposten", "Akt 2: Aufklärung", "Status: Bewegung im Tal");
  narration("Von einer scharfkantigen Basaltstufe aus sieht GC-1 eine kleine Formation bewaffneter Gestalten und, etwas dahinter, den Rumpf eines beschädigten Fluggeräts.");
  dialogue("Tae'Khan", "Ihre Haltung ist diszipliniert. Keine Jäger. Wachen.");
  dialogue("Colonel Jack O'Dell", "Dann wäre jetzt ein guter Moment, zwischen ihnen und ihrem Spielzeug zu wählen.");
  renderChoices([
    { title: "Mit den Wachen Kontakt aufnehmen", action: px204ContactScene },
    { title: "Zum Fluggerät vorrücken", action: px204ShipScene },
    { title: "Nur Daten sichern und zurückkehren", action: () => resolveMission({ title: "Tal dokumentiert", outcome: "Teilerfolg", summary: "GC-1 beobachtete eine organisierte Präsenz und sicherte Distanzdaten.", info: "Die Fraktion blieb unklassifiziert.", flags: ["Aufklärung"], research: 3, materials: 0, lines: [["Captain Kim Calder", "Genug Daten für ein erstes Profil. Nicht genug für Gewissheit."]] }) }
  ]);
}

function px204ContactScene() {
  clearStory("Erster Kontakt", "Akt 2: Begegnung", "Status: bewaffnete Formation");
  narration("Die Gestalten nähern sich in sauberer Formation. Ihre Waffen bleiben gesenkt, aber sichtbar. Ihre Helme erinnern an rituelle Symbolik.");
  dialogue("Dr. David Jaxon", "Nicht aggressiv. Noch nicht. Irgendetwas an unseren Zeichen interessiert sie.");
  if (hasLoadout("translator")) {
    dialogue("Dr. David Jaxon", "Das Modul erkennt einzelne Wortstämme. Hüter. Schwelle. Befehl.");
    renderChoices([
      { title: "Ruhig kommunizieren und Abstand wahren", action: () => resolveMission({ title: "Kontakt im Basalttal", outcome: "Diplomatischer Erfolg", summary: "GC-1 vermied eine Eskalation mit einer bewaffneten Wächtergruppe.", info: "Die Wächter scheinen nicht unabhängig zu handeln.", flags: ["Fraktionskontakt", "Bewaffnete Wächter"], research: 4, materials: 1, faction: "temple_guard", unlock: "px392", lines: [["Dr. David Jaxon", "Sie reagieren auf Zeichen, nicht auf Namen."], ["Tae'Khan", "Dann dient ihre Sprache der Ordnung."], ["Colonel Jack O'Dell", "Ordnung ist mir lieb, solange sie uns nicht erschießt."]] }) },
      { title: "Nach ihrem Bezug zur Schwelle fragen", action: () => resolveMission({ title: "Hinweis auf Flutwelt", outcome: "Storyfolge", summary: "Die Wächter reagierten auf das Wort Schwelle und verwiesen auf eine instabile Adresse.", info: "Eine neue Welt scheint mit ihrem Auftrag verknüpft zu sein.", flags: ["Neue Adresse", "Schwellenhinweis"], research: 4, materials: 0, faction: "temple_guard", unlock: "px392", lines: [["Dr. David Jaxon", "Sie nennen einen Ort, der bei Flut verschwindet."], ["Colonel Jack O'Dell", "Mysteriös, unpraktisch, faszinierend. Klingt nach uns."]] }) },
      { title: "Sich lösen und das Fluggerät prüfen", action: px204ShipScene }
    ]);
  } else {
    dialogue("Dr. David Jaxon", "Ohne Übersetzung kann ich nur Gesten lesen. Und die sagen nicht genug.");
    renderChoices([
      { title: "Ruhig zurückweichen", action: () => resolveMission({ title: "Kontakt vermieden", outcome: "Teilerfolg", summary: "GC-1 verhinderte eine Eskalation, gewann aber nur begrenzte Informationen.", info: "Die Fraktion blieb weitgehend unklassifiziert.", flags: ["Fraktionskontakt"], research: 2, materials: 0, faction: "temple_guard", lines: [["Colonel Jack O'Dell", "Manchmal ist nicht erschossen werden schon ein Ergebnis."]] }) },
      { title: "Zum Fluggerät ausweichen", action: px204ShipScene }
    ]);
  }
}

function px204ShipScene() {
  clearStory("Das beschädigte Fluggerät", "Akt 2: Untersuchung", "Status: Kern instabil");
  narration("Der Rumpf des Fluggeräts ist teilweise geschmolzen, aber der innere Navigationskern sendet noch in Intervallen. Ein einzelnes Paneel pulsiert im Takt der Gate-Verbindung.");
  dialogue("Captain Kim Calder", "Wenn wir das richtig anfassen, bekommen wir Koordinaten. Wenn nicht, vielleicht einen Alarm.");
  if (hasLoadout("scanner")) {
    dialogue("Captain Kim Calder", "Mit dem Feldscanner sehe ich zumindest, welche Leitungen noch leben.");
    renderChoices([
      { title: "Den Navigationskern sauber extrahieren", action: () => resolveMission({ title: "Navigationskern extrahiert", outcome: "Technischer Erfolg", summary: "Calder sicherte Koordinaten aus einem beschädigten Fluggerät.", info: "Eine Route verweist auf eine instabile Flutwelt.", flags: ["Navigationskern", "Neue Adresse"], research: 5, materials: 3, unlock: "px392", find: { name: "Schwarzer Navigationskern", category: "technology", source: "PX-204", description: "Ein beschädigter Navigationskern mit mehreren Gate-Fragmentadressen." }, lines: [["Captain Kim Calder", "PX-392 taucht mehrfach auf. Kein Unfall. Eine Route."], ["Colonel Jack O'Dell", "Dann besuchen wir irgendwann eine Welt, die sogar von kaputten Schiffen empfohlen wird."]] }) },
      { title: "Nur Daten spiegeln und Rückzug vorbereiten", action: () => resolveMission({ title: "Teilkopie gesichert", outcome: "Teilerfolg", summary: "GC-1 spiegelte einen Teil des Navigationskerns und verließ das Tal rechtzeitig.", info: "Eine Adresse wirkt instabil und unvollständig.", flags: ["Teilkopie", "Routenhinweis"], research: 4, materials: 1, unlock: "px392", lines: [["Captain Kim Calder", "Nicht alles, aber genug für ein Zielprofil."], ["Dr. David Jaxon", "Dann hat uns dieser Ort wenigstens einen Weg gezeigt."]] }) }
    ]);
  } else {
    renderChoices([
      { title: "Das Paneel trotzdem aktivieren", action: () => resolveMission({ title: "Fluggerät alarmiert", outcome: "Gefahr", summary: "Ohne Scanner löste GC-1 eine Sicherungsroutine aus und musste ausweichen.", info: "Der Navigationskern blieb nur teilweise auslesbar.", flags: ["Alarm", "Teilinformationen"], research: 2, materials: 1, unlock: "px392", lines: [["Captain Kim Calder", "Ich hätte vorher gern gesehen, was ich berühre."], ["Colonel Jack O'Dell", "Ich auch. Das gilt für überraschend viele Dinge."]] }) },
      { title: "Nur Sichtdaten sichern", action: () => resolveMission({ title: "Wrack dokumentiert", outcome: "Teilerfolg", summary: "GC-1 dokumentierte das Wrack, ohne in den Kern einzugreifen.", info: "Die Adresse einer weiteren Welt bleibt unbestätigt.", flags: ["Sichtdaten"], research: 2, materials: 0, lines: [["Dr. David Jaxon", "Weniger Gewinn, aber auch weniger Risiko."], ["Colonel Jack O'Dell", "Nicht glamourös, aber lebendig."]] }) }
    ]);
  }
}

function px118Opening() {
  clearStory("Unter dem Eis", "Akt 1: Untersuchung", "Status: Tiefenzugang unklar");
  narration(`${openingContext()} PX-118 wirkt still. Unter dem Eis liegt eine geometrische Struktur, deren Eingang auf keine Standardfrequenz reagiert.`);
  dialogue("Captain Kim Calder", "Der Zugang ist nicht mechanisch verriegelt. Er sucht nach einem Identifikationsmuster.");
  dialogue("Dr. David Jaxon", "Ein Schloss, das wissen will, wer wir sind. Oder was wir tragen.");
  if (!hasInventory("threshold_eye")) {
    renderChoices([
      { title: "Den Tiefenzugang direkt untersuchen", action: px118BlockedScene },
      { title: "Die Oberfläche kartieren", action: () => resolveMission({ title: "Oberflächendaten gesichert", outcome: "Blocker bestätigt", summary: "GC-1 bestätigte, dass der Tiefenzugang ein rekonstruiertes Relikt verlangt.", info: "Es fehlen passende Reliktfragmente.", flags: ["Blocker", "Schwellenrelikt"], research: 3, materials: 1, find: { name: "Schema der Schwellentür", category: "research_data", source: "PX-118", description: "Messdaten einer Tür, die auf ein zusammengesetztes Relikt reagiert." }, lines: [["Captain Kim Calder", "Wir haben genug Daten, um zu wissen, dass uns etwas fehlt."], ["Dr. David Jaxon", "Dann ist das hier nicht das Ende. Nur eine verschobene Antwort."]] }) },
      { title: "Geordneten Rückzug vorbereiten", action: () => resolveMission({ title: "Geordneter Rückzug", outcome: "Rückzug", summary: "GC-1 brach die Untersuchung ab und sicherte die bisherigen Daten.", info: "Der Hauptbereich blieb unerforscht.", flags: ["Mission abgebrochen"], research: 1, materials: 0, lines: [["Colonel Jack O'Dell", "Wir kommen zurück, wenn wir etwas haben, das diese Tür respektiert."]] }) }
    ]);
  } else {
    renderChoices([
      { title: "Das rekonstruierte Relikt einsetzen", action: () => resolveMission({ title: "Schwelle geöffnet", outcome: "Großer Erfolg", summary: "Das rekonstruierte Schwellenrelikt öffnete den Tiefenzugang unter PX-118.", info: "Die Archivdaten nennen Orte, die noch nicht im Adressregister stehen.", flags: ["Tiefenarchiv", "Relikt eingesetzt"], research: 8, materials: 2, find: { name: "Archivkern der Eisstruktur", category: "artifact", source: "PX-118", description: "Ein stabiler Datenkern aus einer unterirdischen Archivschicht." }, lines: [["Captain Kim Calder", "Die Tür akzeptiert das Relikt."], ["Dr. David Jaxon", "Nicht als Schlüssel. Als Ausweis."], ["Colonel Jack O'Dell", "Dann merken wir uns: Manche Türen wollen Ausweispapiere."]] }) },
      { title: "Erst den Randbereich auslesen", action: () => resolveMission({ title: "Datenkern gesichert", outcome: "Teilerfolg", summary: "GC-1 sicherte Randdaten des Archivs, ohne die Hauptkammer vollständig zu öffnen.", info: "Die Hauptkammer bleibt verschlossen.", flags: ["Datenkern"], research: 4, materials: 1, lines: [["Captain Kim Calder", "Genug Daten für eine neue Analyse."], ["Colonel Jack O'Dell", "Dann lassen wir den großen unheimlichen Raum noch einen Tag groß und unheimlich sein."]] }) }
    ]);
  }
}

function px118BlockedScene() {
  clearStory("Versiegelter Tiefenzugang", "Akt 2: Blocker", "Status: Zugang verweigert");
  narration("Die kreisförmige Tür unter dem Eis reagiert auf die Nähe des Teams. Für einen Moment erscheinen drei leere Fassungen in der Oberfläche. Es fehlt ein Gegenstück.");
  dialogue("Captain Kim Calder", "Keine Energiebarriere. Keine mechanische Sperre. Das System sucht drei passende Trägerlinien.");
  dialogue("Dr. David Jaxon", "Dann ist das kein Feind. Es ist eine Bedingung.");
  renderChoices([
    { title: "Die Fassungen genau protokollieren", action: () => resolveMission({ title: "Blocker dokumentiert", outcome: "Teilerfolg", summary: "GC-1 dokumentierte die drei leeren Fassungen des Tiefenzugangs.", info: "Ein rekonstruiertes Relikt scheint erforderlich zu sein.", flags: ["Blocker", "Drei Fassungen"], research: 3, materials: 0, lines: [["Captain Kim Calder", "Drei Fragmente. Ganz sauber."], ["Dr. David Jaxon", "Dann müssen wir wohl lernen, sie zu finden."]] }) },
      { title: "Die Umgebung nach weiteren Hinweisen absuchen", action: () => resolveMission({ title: "Randhinweis gesichert", outcome: "Teilerfolg", summary: "GC-1 fand zusätzliche Oberflächenmarkierungen rund um den Blocker.", info: "Die Markierungen verweisen auf eine Schwelle und auf Trägerstücke.", flags: ["Hinweis"], research: 2, materials: 1, lines: [["Tae'Khan", "Man wollte, dass nur Vorbereitete tiefer gehen."], ["Colonel Jack O'Dell", "Dann sind wir heute offiziell unvorbereitet."]] }) }
    ]);
}

function px392Opening() {
  clearStory("Flutzeitfenster", "Akt 1: Landung", "Status: Zeitfenster begrenzt");
  narration(`${openingContext()} PX-392 liegt unter einem silbernen Himmel. Zwischen Flutbecken werden Ruinen nur für kurze Zeit freigelegt.`);
  dialogue("Captain Kim Calder", "Die Ruinen verschwinden wieder, sobald die Resonanzwelle zurückläuft.");
  dialogue("Dr. David Jaxon", "Dann ist dieser Ort zur Ungeduld gebaut.");
  renderChoices([
    { title: "Eine freiliegende Nische bergen", action: px392NicheScene },
    { title: "Den Flutmechanismus beobachten", action: () => resolveMission({ title: "Flutmechanismus verstanden", outcome: "Analyseerfolg", summary: "GC-1 erkannte, dass die Ruinen über Wasserstand und Gate-Energie gesteuert werden.", info: "Ein Fragment erscheint nur während einer kurzen Resonanzphase.", flags: ["Flutmechanismus"], research: 5, materials: 0, lines: [["Dr. David Jaxon", "Das Meer ist kein Hindernis. Es ist der Taktgeber."], ["Colonel Jack O'Dell", "Ich werde von einem Ozean gehetzt. Wieder was Neues."]] }) },
    { title: "Nur Sichtdaten sichern", action: () => resolveMission({ title: "Ruinen gesichtet", outcome: "Teilerfolg", summary: "GC-1 sicherte Sichtdaten der kurzzeitig freigelegten Ruinen.", info: "Die genaue Struktur bleibt unklar.", flags: ["Sichtdaten"], research: 2, materials: 0, lines: [["Captain Kim Calder", "Nicht viel. Aber genug, um wiederzukommen."]] }) }
  ]);
}

function px392NicheScene() {
  clearStory("Die Resonanznische", "Akt 2: Bergung", "Status: instabile Energie");
  narration("In einer freigelegten Nische steckt ein weiteres Reliktfragment in einer Halterung aus schwarzem Stein. Um die Nische flimmert eine kurze Energieladung.");
  dialogue("Captain Kim Calder", "Wenn wir das jetzt ziehen, bekommt die Umgebung einen kurzen Rückschlag.");
  if (hasLoadout("impulse_shield")) {
    renderChoices([
      { title: "Mit Schutzmodul bergen", action: () => resolveMission({ title: "Reliktfragment geborgen", outcome: "Erfolg", summary: "Das Schutzmodul stabilisierte die Energie lange genug für eine sichere Bergung.", info: "Weitere Fragmente können nun im Labor rekonstruiert werden.", flags: ["Reliktfragment"], research: 4, materials: 2, find: { name: "Flutgebundener Schwellen-Splitter", category: "relic_fragment", inventoryKey: "fragment_threshold", amount: 1, source: "PX-392", description: "Ein Reliktfragment, das nur während einer Flutphase erreichbar war." }, lines: [["Captain Kim Calder", "Der Schutz hält. Jetzt."], ["Colonel Jack O'Dell", "Dann raus hier, bevor das Meer nachverhandelt."]] }) }
    ]);
  } else {
    renderChoices([
      { title: "Trotzdem bergen", action: () => resolveMission({ title: "Fragment verloren", outcome: "Verpasste Chance", summary: "Das Fragment wurde erreicht, aber eine Energieentladung riss es in die Flut zurück.", info: "Mit besserem Schutz könnte eine Bergung möglich sein.", flags: ["Fehlende Ausrüstung", "Fragment verloren"], research: 2, materials: 0, lines: [["Captain Kim Calder", "Die Entladung war vorhersehbar. Nur nicht sichtbar."], ["Colonel Jack O'Dell", "Das ist eine sehr elegante Art, unfair zu sagen."]] }) },
      { title: "Abbrechen und Flutdaten sichern", action: () => resolveMission({ title: "Flutdaten gesichert", outcome: "Teilerfolg", summary: "GC-1 sicherte Flutdaten und vertagte die Bergung.", info: "Ein Schutzmodul wäre für eine sichere Bergung sinnvoll.", flags: ["Flutdaten"], research: 3, materials: 0, lines: [["Dr. David Jaxon", "Manchmal ist Wissen die Beute, nicht das Objekt."], ["Colonel Jack O'Dell", "Ich beschwere mich später darüber."]] }) }
    ]);
  }
}

function addFind(find) {
  game.finds.push({ ...find, at: new Date().toISOString() });
  if (find.inventoryKey) game.inventory[find.inventoryKey] = (game.inventory[find.inventoryKey] || 0) + (find.amount || 1);
}

function addFactionKnowledge(id, amount = 1) {
  if (!game.knownFactions[id]) return;
  game.knownFactions[id] = { ...game.knownFactions[id], known: (game.knownFactions[id].known || 0) + amount };
}

function revealWorld(id) {
  if (!game.visitedWorldIds.includes(id)) game.visitedWorldIds.push(id);
}

function unlockWorld(id) {
  if (!game.unlockedWorldIds.includes(id)) game.unlockedWorldIds.push(id);
}

function resolveMission(payload) {
  const world = selectedWorld();
  revealWorld(world.id);
  if (payload.unlock) unlockWorld(payload.unlock);
  if (payload.find) addFind(payload.find);
  if (payload.faction) addFactionKnowledge(payload.faction, 1);
  game.research += payload.research || 0;
  game.materials += payload.materials || 0;
  if ((game.inventory.fragment_threshold || 0) >= 3) game.projects.threshold_eye.visible = true;
  game.baseStatus = `Expedition ${String(mission.number).padStart(3, "0")} abgeschlossen: ${payload.outcome}.`;
  mission.result = {
    title: payload.title,
    outcome: payload.outcome,
    summary: payload.summary,
    info: payload.info,
    flags: payload.flags || [],
    lines: payload.lines || []
  };
  clearStory(payload.title, "Abschluss", "Status: Rückkehr möglich");
  narration(`Die Expedition auf ${world.code} endet mit ${payload.outcome}. Forschung +${payload.research || 0}, Material +${payload.materials || 0}.`);
  (payload.lines || []).forEach(line => dialogue(line[0], line[1]));
  $("choices").innerHTML = "";
  $("return").classList.remove("hidden");
  saveGame(game);
  updateAll();
}

function tickProjects() {
  Object.values(game.projects).forEach(project => {
    if (project.status === "active") {
      project.remaining = Math.max(0, (project.remaining || 0) - 1);
      if (project.remaining === 0) {
        project.status = "done";
        if (project.resultItem === "threshold_eye") game.inventory.threshold_eye = (game.inventory.threshold_eye || 0) + 1;
        if (project.result === "equipment_slot") game.equipmentSlots = Math.max(game.equipmentSlots, 2);
      }
    }
  });
  const shield = game.equipment.find(x => x.id === "impulse_shield");
  if (shield && !shield.unlocked && game.finds.some(f => f.name === "Schwarzer Navigationskern")) shield.unlocked = true;
}

function returnBase() {
  const r = mission.result;
  game.archive.push({
    no: String(mission.number).padStart(3, "0"),
    planet: mission.planet,
    title: r.title,
    outcome: r.outcome,
    summary: r.summary,
    info: r.info,
    flags: r.flags,
    log: [...mission.log]
  });
  game.completed += 1;
  tickProjects();
  mission = null;
  resetGate(false);
  saveGame(game);
  updateAll();
  show("base");
}

function updateAll() {
  renderBaseSummary();
  renderProjects();
  renderEquipmentArchive();
  renderFinds();
  renderFactions();
  renderTeam();
  renderArchive();
  renderGateRegister();
  renderLoadout();
  $("labValue").textContent = game.research;
  $("labText").textContent = game.research >= 10 ? "Auswertbare Datenbestände wachsen. Neue Rekonstruktionen werden wahrscheinlicher." : "Forschung wird für Laborprojekte und Rekonstruktionen benötigt.";
  $("barFill").style.width = Math.min(100, game.research * 5) + "%";
  updateActionButtons();
}

$("destinationSelect").addEventListener("change", e => {
  selectedWorldId = e.target.value;
  resetGate(false);
  saveGame(game);
});
$("abortDial").onclick = () => resetGate(false);
document.querySelectorAll("[data-view]").forEach(btn => btn.onclick = () => show(btn.dataset.view));
glyphs.forEach(btn => btn.onclick = () => lockGlyph(btn));
$("prepare").onclick = () => { resetGate(false); show("gateView"); };
$("autoDial").onclick = autoDial;
$("probe").onclick = runProbe;
$("start").onclick = startMission;
$("return").onclick = returnBase;
$("reset").onclick = () => {
  if (confirm("Den gesamten Spielstand einschließlich Einsatzarchiv löschen?")) {
    resetSavedGame();
    game = freshGame();
    selectedWorldId = game.unlockedWorldIds[0];
    mission = null;
    resetGate(false);
    updateAll();
    show("base");
  }
};

resetGate(false);
updateAll();
