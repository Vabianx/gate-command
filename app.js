const game = {
    energy: 100,
    research: 0,
    personnel: 4,
    completedMissions: 0,
    probeUsed: false
};

const views = document.querySelectorAll(".view");
const navigationButtons = document.querySelectorAll("[data-view]");

const energyValue = document.getElementById("energy-value");
const researchValue = document.getElementById("research-value");
const personnelValue = document.getElementById("personnel-value");
const researchPageValue = document.getElementById(
    "research-page-value"
);

const baseStatus = document.getElementById("base-status");
const archiveStatus = document.getElementById("archive-status");

const prepareExpeditionButton = document.getElementById(
    "prepare-expedition-btn"
);

const sendProbeButton = document.getElementById(
    "send-probe-btn"
);

const startMissionButton = document.getElementById(
    "start-mission-btn"
);

const investigateButton = document.getElementById(
    "investigate-btn"
);

const secureAreaButton = document.getElementById(
    "secure-area-btn"
);

const returnBaseButton = document.getElementById(
    "return-base-btn"
);

const probeResult = document.getElementById("probe-result");
const missionText = document.getElementById("mission-text");
const missionOptions = document.getElementById("mission-options");

function updateInterface() {
    energyValue.textContent = game.energy;
    researchValue.textContent = game.research;
    personnelValue.textContent = game.personnel;
    researchPageValue.textContent = game.research;

    if (game.completedMissions === 0) {
        archiveStatus.textContent =
            "Noch keine Expedition abgeschlossen.";
    } else {
        archiveStatus.textContent =
            `${game.completedMissions} Expedition abgeschlossen. ` +
            "Planet P4X-761 wurde im Archiv gespeichert.";
    }
}

function showView(viewId) {
    views.forEach((view) => {
        view.classList.remove("active");
    });

    const targetView = document.getElementById(viewId);

    if (!targetView) {
        console.error(`Ansicht nicht gefunden: ${viewId}`);
        return;
    }

    targetView.classList.add("active");
    window.scrollTo(0, 0);
}

function resetMission() {
    game.probeUsed = false;

    probeResult.innerHTML = `
        <p>Noch keine Sondendaten vorhanden.</p>
    `;

    sendProbeButton.disabled = false;
    sendProbeButton.textContent = "Sonde senden – 5 Energie";

    missionText.textContent =
        "Das Team erreicht eine beschädigte außerirdische Anlage. " +
        "Im Inneren wird eine schwache Energiesignatur registriert.";

    missionOptions.classList.remove("hidden");
    returnBaseButton.classList.add("hidden");
}

navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });
});

prepareExpeditionButton.addEventListener("click", () => {
    resetMission();
    showView("gate-view");
});

sendProbeButton.addEventListener("click", () => {
    if (game.probeUsed) {
        return;
    }

    if (game.energy < 5) {
        probeResult.innerHTML = `
            <p>Nicht genügend Energie für den Sondenstart.</p>
        `;
        return;
    }

    game.energy -= 5;
    game.probeUsed = true;

    probeResult.innerHTML = `
        <p><strong>Atmosphäre:</strong> atembar</p>
        <p><strong>Temperatur:</strong> 21 °C</p>
        <p><strong>Lebenszeichen:</strong> keine eindeutigen Signale</p>
        <p><strong>Ruinen:</strong> bestätigt</p>
        <p><strong>Energiesignatur:</strong> schwach</p>
    `;

    sendProbeButton.disabled = true;
    sendProbeButton.textContent = "Sondendaten empfangen";

    updateInterface();
});

startMissionButton.addEventListener("click", () => {
    if (game.energy < 10) {
        probeResult.innerHTML = `
            <p>Nicht genügend Energie für die Expedition.</p>
        `;
        return;
    }

    game.energy -= 10;

    updateInterface();
    showView("expedition-view");
});

investigateButton.addEventListener("click", () => {
    game.research += 3;

    missionText.textContent =
        "Der Wissenschaftler aktiviert eine beschädigte Konsole. " +
        "Das Team sichert Daten über eine unbekannte Energiequelle. " +
        "Die Expedition erhält 3 Forschungspunkte.";

    missionOptions.classList.add("hidden");
    returnBaseButton.classList.remove("hidden");

    updateInterface();
});

secureAreaButton.addEventListener("click", () => {
    game.energy += 2;

    missionText.textContent =
        "Das Team durchsucht den Außenbereich und findet einen " +
        "teilweise geladenen Energiekristall. 2 Energie wurden geborgen.";

    missionOptions.classList.add("hidden");
    returnBaseButton.classList.remove("hidden");

    updateInterface();
});

returnBaseButton.addEventListener("click", () => {
    game.completedMissions += 1;

    baseStatus.textContent =
        "Expedition erfolgreich abgeschlossen. " +
        "Das Team ist vollständig zurückgekehrt.";

    updateInterface();
    showView("basis-view");
});

updateInterface();