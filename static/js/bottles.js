import { BottleAPI } from "./api.js";
import { UI } from "./ui.js";
import { Utils } from "./utils.js";

/**
 * The BottleManager object handles all logic and functionality related to managing gas bottles.
 * @namespace BottleManager
 */
export const BottleManager = {
    // Flag to track whether inactive bottles should be displayed.
    showInactiveBottles: false,
    // Stores the Chart.js instance for the consumption bar chart.
    currentChart: null,
    // Stores the Chart.js instance for the history line chart.
    historyChart: null,

    /**
     * Initializes the manager by setting default states, binding events, and loading data.
     */
    init() {
        this.showInactiveBottles = false;
        this.currentChart = null;
        this.historyChart = null;
        this.bindEvents();
        this.loadBottles();
        this.loadBottleEntries();
    },

    /**
     * Binds event listeners to buttons and other elements on the bottle management page.
     */
    bindEvents() {
        // Listener for the "Add Bottle" button to show the bottle creation modal.
        document.getElementById("add-bottle-btn")?.addEventListener("click", () => {
            UI.clearForm("bottle-form");
            UI.showModal("bottle-modal");
        });

        // Listener for the "Toggle Inactive Bottles" button to show/hide archived bottles.
        document.getElementById("toggle-inactive-bottles-btn")?.addEventListener("click", () => {
            this.toggleInactiveBottleVisibility();
        });
    },

    /**
     * Fetches bottle data from the API and renders the bottle cards and charts.
     */
    async loadBottles() {
        try {
            const bottles = await BottleAPI.getBottles();
            const grid = document.getElementById("bottle-list");
            if (grid) {
                // Filter bottles based on the current visibility setting.
                const bottlesToDisplay = this.showInactiveBottles
                    ? bottles
                    : bottles.filter((bottle) => bottle.active);

                if (bottlesToDisplay.length === 0) {
                    // Display an empty state message if no bottles are available.
                    grid.innerHTML = UI.createEmptyState(
                        "gas-pump",
                        "Keine Gasflaschen",
                        "Füge deine erste Gasflasche hinzu, um den Verbrauch zu verfolgen."
                    );
                    // Destroy any existing charts to prevent them from showing stale data.
                    if (this.currentChart) {
                        this.currentChart.destroy();
                        this.currentChart = null;
                    }
                    if (this.historyChart) {
                        this.historyChart.destroy();
                        this.historyChart = null;
                    }
                } else {
                    // Render the bottle cards and insert them into the grid.
                    grid.innerHTML = bottlesToDisplay.map((bottle) => this.createBottleCard(bottle)).join("");

                    // Prepare data and update the consumption and history charts.
                    const activeBottlesForChart = bottlesToDisplay.filter((b) => b.active).map((bottle) => {
                        const lastOperation = bottle.operations ? [...bottle.operations].sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
                        const currentWeight = lastOperation?.weight !== undefined ? lastOperation.weight : bottle.initial_weight;
                        const bottleWeight = bottle.initial_weight - bottle.filling_weight;
                        const remainingPercentage = bottleWeight > 0 ? (((currentWeight - bottle.filling_weight) / bottleWeight) * 100) : 0;
                        return {
                            id: bottle.id,
                            percentage: parseFloat(remainingPercentage.toFixed(1)),
                        };
                    });
                    this.updateConsumptionChart(activeBottlesForChart);
                    const activeBottlesWithHistory = bottlesToDisplay.filter((b) => b.active);
                    this.updateBottleHistoryChart(activeBottlesWithHistory);
                }
                // Rebind events for the newly created bottle cards and update the toggle button's style.
                this.bindBottleCardEvents();
                this.updateToggleButtonStyle();
            }
        } catch (error) {
            console.error("Failed to load bottles:", error);
            const grid = document.getElementById("bottle-list");
            if (grid) {
                grid.innerHTML = UI.createEmptyState(
                    "exclamation-triangle",
                    "Fehler beim Laden der Gasflaschen",
                    "Gasflaschendaten konnten nicht geladen werden."
                );
            }
            // Destroy charts on error to prevent displaying incorrect information.
            if (this.currentChart) {
                this.currentChart.destroy();
                this.currentChart = null;
            }
            if (this.historyChart) {
                this.historyChart.destroy();
                this.historyChart = null;
            }
        }
    },

    /**
     * Creates the HTML string for a single bottle card.
     * @param {Object} bottle - The bottle data object.
     * @returns {string} The HTML string for the bottle card.
     */
    createBottleCard(bottle) {
        // Calculate various weight and operation summary metrics for display.
        const operationsCount = bottle.operations?.length || 0;
        const sortedOperations = bottle.operations ? [...bottle.operations].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
        const lastOperation = sortedOperations[0];
        const currentWeight = lastOperation?.weight !== undefined ? lastOperation.weight : bottle.initial_weight;
        const bottleWeight = bottle.initial_weight - bottle.filling_weight;
        const totalUsedGas = (bottle.initial_weight - currentWeight).toFixed(1);
        const remainingGasKg = (currentWeight - bottle.filling_weight).toFixed(1);

        // Returns a template literal containing the full HTML structure for a bottle card.
        return `
            <div class="card ${!bottle.active && !this.showInactiveBottles ? 'hidden-inactive' : ''}" data-bottle-id="${bottle.id}">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-fire"></i>
                        Gasflasche Nr. ${bottle.id}
                    </h3>
                    <div class="card-actions">
                        <span class="status-badge ${bottle.active ? 'status-active' : 'status-inactive'}">
                            <i class="fas fa-circle" style="font-size: 0.6em;"></i>
                            ${bottle.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <button class="btn btn-sm btn-primary add-operation-btn" data-id="${bottle.id}" data-type="bottle">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-${bottle.active ? 'secondary' : 'success'} toggle-active-btn" data-id="${bottle.id}" data-active="${bottle.active}">
                            <i class="fas fa-${bottle.active ? 'archive' : 'undo'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-bottle-btn" data-id="${bottle.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Kaufdatum</span>
                            <span class="info-value">${Utils.formatDate(bottle.purchase_date)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Kaufpreis</span>
                            <span class="info-value">${Utils.formatCurrency(bottle.purchase_price)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Anfangsgewicht</span>
                            <span class="info-value">${Utils.formatWeight(bottle.initial_weight)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Füllmenge</span>
                            <span class="info-value">${Utils.formatWeight(bottle.filling_weight)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Flaschengewicht</span>
                            <span class="info-value">${Utils.formatWeight(bottleWeight)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Restliches Gas</span>
                            <span class="info-value">${Utils.formatWeight(remainingGasKg)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gesamtverbrauch</span>
                            <span class="info-value">${Utils.formatWeight(totalUsedGas)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Binds event listeners to the buttons within each bottle card.
     */
    bindBottleCardEvents() {
        document.querySelectorAll('.add-operation-btn[data-type="bottle"]').forEach(button => {
            button.onclick = (e) => {
                const bottleId = e.currentTarget.dataset.id;
                UI.showOperationModal('Gewichtsmessung hinzufügen', 'bottle', bottleId);
            };
        });

        document.querySelectorAll('.delete-bottle-btn').forEach(button => {
            button.onclick = async (e) => {
                const bottleId = e.currentTarget.dataset.id;
                await this.deleteBottle(bottleId);
            };
        });

        document.querySelectorAll('.delete-operation-btn[data-type="bottle"]').forEach(button => {
            button.onclick = async (e) => {
                const operationId = e.currentTarget.dataset.operationId;
                await this.deleteOperation(operationId);
            };
        });

        document.querySelectorAll('.toggle-active-btn').forEach(button => {
            button.onclick = async (e) => {
                const bottleId = e.currentTarget.dataset.id;
                const currentActiveStatus = e.currentTarget.dataset.active === 'true';
                await this.toggleBottleActiveStatus(bottleId, !currentActiveStatus);
            };
        });

        document.querySelectorAll('.view-all-operations-btn').forEach(button => {
            button.onclick = (e) => {
                const bottleId = e.currentTarget.dataset.bottleId;
                console.log(`View all operations for bottle ${bottleId}`);
                UI.showToast('Funktion zum Anzeigen aller Messungen ist noch nicht implementiert.', 'info');
            };
        });
    },

    /**
     * Handles the submission of the bottle creation form.
     * @param {Event} e - The form submission event.
     */
    handleBottleFormSubmit: async function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const bottle = {
                purchase_date: formData.get("purchase_date"),
                purchase_price: parseFloat(formData.get("purchase_price")),
                initial_weight: parseFloat(formData.get("initial_weight")),
                filling_weight: parseFloat(formData.get("filling_weight")),
                active: true,
            };

            await BottleAPI.createBottle(bottle);
            UI.showToast("Gasflasche erfolgreich erstellt!", "success");
            UI.hideModal("bottle-modal");
            UI.clearForm("bottle-form");
            this.loadBottles();
        } catch (error) {
            console.error("Failed to create bottle:", error);
            UI.showToast("Fehler beim Erstellen der Gasflasche.", "error");
        }
    },

    /**
     * Submits a new operation (weight measurement) for a specific bottle.
     * @param {FormData} formData - The form data containing operation details.
     * @param {string} type - The type of operation, should be 'bottle'.
     * @param {number} targetId - The ID of the bottle.
     */
    submitOperation: async function (formData, type, targetId) {
        if (type !== "bottle") return;

        const bottleIdAsNumber = parseInt(targetId, 10);
        if (isNaN(bottleIdAsNumber)) {
            console.error("Invalid bottle ID for operation:", targetId);
            UI.showToast("Fehler: Flaschen-ID für Messung konnte nicht ermittelt werden.", "error");
            return;
        }

        try {
            const operation = {
                bottle_id: bottleIdAsNumber,
                date: formData.get("date"),
                weight: parseFloat(formData.get("weight")),
                note: formData.get("note") || null,
            };
            await BottleAPI.createBottleOperation(operation);
            UI.showToast("Gewichtsmessung erfolgreich hinzugefügt!", "success");
            UI.hideModal("operation-modal");
            UI.clearForm("operation-form");
            this.loadBottles();
        } catch (error) {
            console.error("Failed to add bottle operation:", error);
            UI.showToast("Fehler beim Hinzufügen der Gewichtsmessung.", "error");
        }
    },

async loadBottleEntries() {
    try {
        const bottles = await BottleAPI.getBottles();
        const activeBottles = bottles.filter(bottle => bottle.active);

        const tableBody = document.getElementById('bottle-entries-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = ''; // Clear existing entries

        activeBottles.forEach(bottle => {
            const bottleWeight = bottle.initial_weight - bottle.filling_weight;
            const sortedOperations = bottle.operations
                ? [...bottle.operations].sort((a, b) => new Date(b.date) - new Date(a.date))
                : [];

            sortedOperations.forEach((operation, index) => {
                const row = tableBody.insertRow();
                row.dataset.id = bottle.id;

                // Gewicht der vorherigen Messung (falls vorhanden)
                let previousWeight = index < sortedOperations.length - 1
                    ? sortedOperations[index + 1].weight
                    : bottle.initial_weight;

                // Verbrauch seit der vorherigen Messung
                const usedGas = (previousWeight - operation.weight).toFixed(1);

                // Restgas = aktuelles Gewicht - Leergewicht der Flasche
                const remainingGas = (operation.weight - bottleWeight).toFixed(1);

                row.innerHTML = `
                    <td>${bottle.id}</td>
                    <td>${Utils.formatDate(operation.date)}</td>
                    <td>${Utils.formatWeight(operation.weight)}</td>
                    <td>${Utils.formatWeight(usedGas)}</td>
                    <td>${Utils.formatWeight(remainingGas)}</td>
                    <td>
                        <button class="btn-delete" data-id="${operation.id}">Löschen</button>
                    </td>
                `;

                row.querySelector('.btn-delete').addEventListener('click', () => this.deleteOperation(operation.id));
            });
        });
    } catch (error) {
        console.error('Error loading bottle entries:', error);
        showMessage(`Fehler beim Laden der Flaschen-Einträge: ${error.message}`, 'error');
    }
},


    /**
     * Deletes a bottle after a confirmation from the user.
     * @param {number} bottleId - The ID of the bottle to delete.
     */
    async deleteBottle(bottleId) {
        // Use the new confirmation modal instead of the default browser alert.
        UI.showConfirmModal(
            "Gasflasche löschen",
            "Möchten Sie diese Gasflasche wirklich löschen? Alle zugehörigen Messungen werden ebenfalls entfernt.",
            async () => {
                try {
                    UI.showLoading(true);
                    await BottleAPI.deleteBottle(bottleId);
                    UI.showToast('Gasflasche erfolgreich gelöscht.', 'success');
                    this.loadBottles(); // Reload bottles after deletion
                } catch (error) {
                    console.error('Fehler beim Löschen der Gasflasche:', error);
                    UI.showToast('Fehler beim Löschen der Gasflasche.', 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    },

    /**
     * Deletes a specific operation (weight measurement) after confirmation.
     * @param {number} operationId - The ID of the operation to delete.
     */
    async deleteOperation(operationId) {
        UI.showConfirmModal(
            "Messung löschen",
            "Möchten Sie diese Messung wirklich löschen?",
            async () => {
                try {
                    UI.showLoading(true);
                    await BottleAPI.deleteBottleOperation(operationId);
                    UI.showToast('Messung erfolgreich gelöscht.', 'success');
                    this.loadBottles(); // Reload bottles to reflect the change
                } catch (error) {
                    console.error('Fehler beim Löschen der Messung:', error);
                    UI.showToast('Fehler beim Löschen der Messung.', 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    },

    /**
     * Toggles a bottle's active/inactive status and updates it via the API.
     * @param {number} bottleId - The ID of the bottle to update.
     * @param {boolean} newStatus - The new active status (true for active, false for inactive).
     */
    async toggleBottleActiveStatus(bottleId, newStatus) {
        const actionText = newStatus ? "aktivieren" : "deaktivieren";
        if (!confirm(`Bist du sicher, dass du diese Gasflasche ${actionText} möchtest?`)) {
            return;
        }

        try {
            await BottleAPI.updateBottle(bottleId, { active: newStatus });
            UI.showToast(`Gasflasche erfolgreich ${actionText}!`, "success");
            this.loadBottles();
        } catch (error) {
            console.error(`Failed to ${actionText} bottle:`, error);
            UI.showToast(`Fehler beim ${actionText} der Gasflasche.`, "error");
        }
    },

    /**
     * Toggles the visibility of inactive bottles and reloads the bottle list.
     */
    toggleInactiveBottleVisibility() {
        this.showInactiveBottles = !this.showInactiveBottles;
        this.loadBottles();
        this.updateToggleButtonStyle();
    },

    /**
     * Updates the text and style of the toggle button based on the current visibility state.
     */
    updateToggleButtonStyle() {
        const toggleButton = document.getElementById("toggle-inactive-bottles-btn");
        if (toggleButton) {
            if (this.showInactiveBottles) {
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Inaktive ausblenden';
                toggleButton.classList.remove("btn-secondary");
                toggleButton.classList.add("btn-info");
            } else {
                toggleButton.innerHTML = '<i class="fas fa-eye"></i> Inaktive anzeigen';
                toggleButton.classList.remove("btn-info");
                toggleButton.classList.add("btn-secondary");
            }
        }
    },

    /**
     * Renders a bar chart showing the remaining gas percentage for each active bottle.
     * @param {Array<Object>} bottles - An array of active bottle objects with calculated percentages.
     */
    updateConsumptionChart(bottles) {
        const ctx = document.getElementById("consumption-chart")?.getContext("2d");

        if (!ctx) {
            console.warn("Chart canvas element 'consumption-chart' not found.");
            return;
        }

        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const labels = bottles.map((bottle) => `Flasche #${bottle.id}`);
        const data = bottles.map((bottle) => bottle.percentage);
        const backgroundColors = bottles.map((bottle) => {
            if (bottle.percentage >= 50) return "rgba(46, 204, 113, 0.8)";
            if (bottle.percentage >= 20) return "rgba(243, 156, 18, 0.8)";
            return "rgba(231, 76, 60, 0.8)";
        });

        this.currentChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Füllstand (%)",
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map((color) => color.replace("0.8", "1")),
                    borderWidth: 1,
                }, ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + "%";
                            },
                        },
                    },
                },
            },
        });
    },

    /**
     * Renders a line chart that displays the historical weight data for each active bottle.
     * @param {Array<Object>} activeBottles - An array of active bottle objects with their operation histories.
     */
    updateBottleHistoryChart(activeBottles) {
        const ctx = document.getElementById("bottle-history-chart")?.getContext("2d");

        if (!ctx) {
            console.warn("Chart canvas element 'bottle-history-chart' not found. Please add a canvas element with id='bottle-history-chart' to your HTML.");
            return;
        }

        if (this.historyChart) {
            this.historyChart.destroy();
        }

        // Prepare datasets for the Chart.js line chart.
        const datasets = activeBottles.map((bottle) => {
            const sortedOperations = bottle.operations ? [...bottle.operations].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
            const dataPoints = [];

            // Include initial weight as the starting point for the chart.
            dataPoints.push({
                x: Utils.formatDate(bottle.purchase_date),
                y: bottle.initial_weight,
            });

            // Add each operation as a data point.
            sortedOperations.forEach((op) => {
                dataPoints.push({
                    x: Utils.formatDate(op.date),
                    y: op.weight,
                });
            });

            return {
                label: `Flasche #${bottle.id}`,
                data: dataPoints,
                borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // Assign a random color to each line.
                fill: false,
                tension: 0.1,
            };
        });

        this.historyChart = new Chart(ctx, {
            type: "line",
            data: {
                datasets: datasets,
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "Verlauf des Flaschengewichts (Aktive Flaschen)",
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || "";
                                if (label) {
                                    label += ": ";
                                }
                                if (context.parsed.y !== null) {
                                    label += Utils.formatWeight(context.parsed.y);
                                }
                                return label;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        type: "category",
                        labels: datasets.flatMap((dataset) => dataset.data.map((point) => point.x)).filter((value, index, self) => self.indexOf(value) === index).sort(),
                        title: {
                            display: true,
                            text: "Datum",
                        },
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: "Gewicht (kg)",
                        },
                        ticks: {
                            callback: function (value) {
                                return Utils.formatWeight(value);
                            },
                        },
                    },
                },
            },
        });
    },
};