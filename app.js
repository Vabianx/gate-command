const views = document.querySelectorAll(".view");
const navigationButtons = document.querySelectorAll("[data-view]");
const startExpeditionButton = document.getElementById(
    "start-expedition-btn"
);

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

navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });
});

startExpeditionButton.addEventListener("click", () => {
    showView("expedition-view");
});