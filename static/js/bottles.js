import { BottleAPI } from "./api.js";
import { UI } from "./ui.js";
import { Utils } from "./utils.js";
import { ChartManager } from "./chartManager.js";
import { DataManager } from "./dataManager.js";

/**
 * The BottleManager object handles all logic and functionality related to managing gas bottles.
 * It extends BaseManager to inherit common functionality and uses ChartManager and DataManager
 * for specialized operations.
 * @namespace BottleManager
 */
export const BottleManager = {
    /** @type {ChartManager} Instance of ChartManager for handling charts. */
    chartManager: new ChartManager(),

    // BaseManager properties
    showInactive: false,
    currentChart: null,
    historyChart: null,

    /**
     * Initializes the manager by setting default states, binding events, and loading data.
     */
    init() {
        this.showInactive = false;
        this.chartManager = new ChartManager();
        this.bindEvents();
        this.loadBottles();
        this.loadBottleEntries();
    },

    // BaseManager methods
    toggleInactiveVisibility(toggleButtonId, loadFunction) {
        this.showInactive = !this.showInactive;
        loadFunction();
        this.loadBottleEntries();
        this.updateToggleButtonStyle(toggleButtonId);
    },

    updateToggleButtonStyle(toggleButtonId) {
        const toggleButton = document.getElementById(toggleButtonId);
        if (toggleButton) {
            if (this.showInactive) {
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Inaktive ausblenden';
                toggleButton.classList.remove('btn-secondary');
                toggleButton.classList.add('btn-info');
            } else {
                toggleButton.innerHTML = '<i class="fas fa-eye"></i> Inaktive anzeigen';
                toggleButton.classList.remove('btn-info');
                toggleButton.classList.add('btn-secondary');
            }
        }
    },

    createCardHeader(item, title, icon, itemType, itemId, isActive) {
        return `
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-${icon}"></i>
                    ${title}
                </h3>
                <div class="card-actions">
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-circle" style="font-size: 0.6em;"></i>
                        ${isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <button class="btn btn-sm btn-primary add-operation-btn" data-id="${itemId}" data-type="${itemType}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-${isActive ? 'secondary' : 'success'} toggle-active-btn" data-id="${itemId}" data-active="${isActive}">
                        <i class="fas fa-${isActive ? 'archive' : 'undo'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-${itemType}-btn" data-id="${itemId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    createCard(item, content, itemType, itemId, isActive) {
        const hiddenClass = !isActive && !this.showInactive ? 'hidden-inactive' : '';
        return `
            <div class="card ${hiddenClass}" data-${itemType}-id="${itemId}">
                ${content}
            </div>
        `;
    },

    bindCardEvents(itemType, handlers) {
        // Add operation button
        document.querySelectorAll(`.add-operation-btn[data-type="${itemType}"]`).forEach(button => {
            button.onclick = (e) => {
                const itemId = e.currentTarget.dataset.id;
                const modalTitle = handlers.getModalTitle ? handlers.getModalTitle(itemType) : 'Operation hinzufügen';
                UI.showOperationModal(modalTitle, itemType, itemId);
            };
        });

        // Delete item button
        document.querySelectorAll(`.delete-${itemType}-btn`).forEach(button => {
            button.onclick = async (e) => {
                const itemId = e.currentTarget.dataset.id;
                if (handlers.deleteItem) {
                    await handlers.deleteItem(itemId);
                }
            };
        });

        // Delete operation button
        document.querySelectorAll(`.delete-operation-btn[data-type="${itemType}"]`).forEach(button => {
            button.onclick = async (e) => {
                const operationId = e.currentTarget.dataset.operationId;
                if (handlers.deleteOperation) {
                    await handlers.deleteOperation(operationId);
                }
            };
        });

        // Toggle active status button
        document.querySelectorAll('.toggle-active-btn').forEach(button => {
            button.onclick = async (e) => {
                const itemId = e.currentTarget.dataset.id;
                const currentActiveStatus = e.currentTarget.dataset.active === 'true';
                if (handlers.toggleActive) {
                    await handlers.toggleActive(itemId, !currentActiveStatus);
                }
            };
        });
    },

    async deleteItem(itemId, itemName, deleteFunction, reloadFunction) {
        UI.showConfirmModal(
            `${itemName} löschen`,
            `Möchten Sie dieses ${itemName} wirklich löschen? Alle zugehörigen Einträge werden ebenfalls entfernt.`,
            async () => {
                try {
                    UI.showLoading(true);
                    await deleteFunction(itemId);
                    UI.showToast(`${itemName} erfolgreich gelöscht.`, 'success');
                    reloadFunction();
                } catch (error) {
                    console.error(`Fehler beim Löschen des ${itemName}:`, error);
                    UI.showToast(`Fehler beim Löschen des ${itemName}.`, 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    },

    async _deleteOperation(operationId, operationName, deleteFunction, reloadFunction) {
        UI.showConfirmModal(
            `${operationName} löschen`,
            `Möchten Sie diesen ${operationName} wirklich löschen?`,
            async () => {
                try {
                    UI.showLoading(true);
                    await deleteFunction(operationId);
                    UI.showToast(`${operationName} erfolgreich gelöscht.`, 'success');
                    reloadFunction();
                } catch (error) {
                    console.error(`Fehler beim Löschen des ${operationName}:`, error);
                    UI.showToast(`Fehler beim Löschen des ${operationName}.`, 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    },

    async toggleActiveStatus(itemId, newStatus, itemName, updateFunction, reloadFunction) {
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren';
        const confirmBtnText = newStatus ? 'Aktivieren' : 'Deaktivieren'; // <-- Neuer Text für den Button
        const title = `${itemName} ${actionText}`;
        const message = `Bist du sicher, dass du dieses ${itemName} wirklich ${actionText} möchtest?`;
        
        // Die Toast-Nachricht wird dynamisch gesetzt
        const toastMessage = `${itemName} erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}.`;

        UI.showConfirmModal(title, message, async () => {
            try {
                UI.showLoading(true);
                await updateFunction(itemId, { active: newStatus });
                UI.showToast(toastMessage, 'success');
                reloadFunction();
            } catch (error) {
                console.error(`Fehler beim ${actionText} des ${itemName}:`, error);
                UI.showToast(`Fehler beim ${actionText} des ${itemName}.`, 'error');
            } finally {
                UI.showLoading(false);
            }
        }, confirmBtnText); // <-- Übergabe des neuen Button-Textes
    },

    filterItemsByVisibility(items) {
        return this.showInactive ? items : items.filter(item => item.active);
    },

    createEmptyState(icon, title, description) {
        return UI.createEmptyState(icon, title, description);
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
                const bottlesToDisplay = this.filterItemsByVisibility(bottles);

                if (bottlesToDisplay.length === 0) {
                    // Display an empty state message if no bottles are available.
                    grid.innerHTML = this.createEmptyState(
                        "fire",
                        "Keine Gasflaschen",
                        "Füge deine erste Gasflasche hinzu, um den Verbrauch zu verfolgen."
                    );
                    // Destroy any existing charts to prevent them from showing stale data.
                    this.chartManager.destroyAllCharts();
                } else {
                    // Render the bottle cards and insert them into the grid.
                    grid.innerHTML = bottlesToDisplay.map((bottle) => this.createBottleCard(bottle)).join("");

                    // Prepare data and update the consumption and history charts.
                    const activeBottlesForChart = bottlesToDisplay.filter((b) => b.active).map((bottle) => {
                        const stats = DataManager.calculateBottleStats(bottle);
                        return {
                            id: bottle.id,
                            percentage: stats.remainingPercentage,
                        };
                    });
                    this.chartManager.createConsumptionChart(activeBottlesForChart);
                    let activeBottlesWithHistory = bottlesToDisplay;
                    if (!this.showInactive) {
                        activeBottlesWithHistory = bottlesToDisplay.filter((b) => b.active);
                    }
                    this.chartManager.createBottleHistoryChart(activeBottlesWithHistory);
                }
                // Rebind events for the newly created bottle cards and update the toggle button's style.
                this.bindBottleCardEvents();
                this.updateToggleButtonStyle("toggle-inactive-bottles-btn");
            }
        } catch (error) {
            console.error("Failed to load bottles:", error);
            const grid = document.getElementById("bottle-list");
            if (grid) {
                grid.innerHTML = this.createEmptyState(
                    "exclamation-triangle",
                    "Fehler beim Laden der Gasflaschen",
                    "Gasflaschendaten konnten nicht geladen werden."
                );
            }
            // Destroy charts on error to prevent displaying incorrect information.
            this.chartManager.destroyAllCharts();
        }
    },
    
    async loadBottleEntries() {
        try {
            let bottles = await BottleAPI.getBottles();
            if (!this.showInactive) {
                bottles = bottles.filter(bottle => bottle.active);
            }

            const tableBody = document.getElementById('bottle-entries-table-body');
            if (!tableBody) return;

            tableBody.innerHTML = ''; // Clear existing entries

            const allOperations = [];

            bottles.forEach(bottle => {
                const operations = bottle.operations ? [...bottle.operations] : [];

                operations.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Calculate previousWeight per bottle
                operations.forEach((operation, index) => {
                    const nextOp = operations[index + 1];
                    operation.previousWeight = nextOp ? nextOp.weight : bottle.initial_weight;

                    allOperations.push({ operation, bottle });
                });
            });

            // Sort by date
            allOperations.sort((a, b) => new Date(b.operation.date) - new Date(a.operation.date));

            allOperations.forEach(({ operation, bottle }) => {
                const row = tableBody.insertRow();
                row.dataset.id = bottle.id;

                row.innerHTML = DataManager.createOperationTableRow(operation, bottle, 'bottle');

                row.querySelector('.btn-delete').addEventListener('click', () => this.deleteOperation(operation.id));
            });

        } catch (error) {
            console.error('Error loading bottle entries:', error);
            UI.showToast(`Fehler beim Laden der Flaschen-Einträge: ${error.message}`, 'error');
        }
    },

    /**
     * Toggles the visibility of inactive bottles and reloads the bottle list.
     */
    toggleInactiveBottleVisibility() {
        this.toggleInactiveVisibility('toggle-inactive-bottles-btn', () => this.loadBottles());
    },

    /**
     * Creates the HTML string for a single bottle card.
     * @param {Object} bottle - The bottle data object.
     * @returns {string} The HTML string for the bottle card.
     */
    createBottleCard(bottle) {
        const stats = DataManager.calculateBottleStats(bottle);
        
        const cardBody = `
            <div class="card-body">
                <div class="card-info">
                    ${DataManager.createInfoItem('Kaufdatum', Utils.formatDate(bottle.purchase_date))}
                    ${DataManager.createInfoItem('Kaufpreis', Utils.formatCurrency(bottle.purchase_price))}
                    ${DataManager.createInfoItem('Anfangsgewicht', Utils.formatWeight(bottle.initial_weight))}
                    ${DataManager.createInfoItem('Füllmenge', Utils.formatWeight(bottle.filling_weight))}
                    ${DataManager.createInfoItem('Flaschengewicht', Utils.formatWeight(stats.bottleWeight))}
                    ${DataManager.createInfoItem('Restliches Gas', Utils.formatWeight(stats.remainingGasKg))}
                    ${DataManager.createInfoItem('Gesamtverbrauch', Utils.formatWeight(stats.totalUsedGas))}
                    ${DataManager.createInfoItem('Gesamtmessungen', stats.operationsCount)}
                </div>
            </div>
        `;

        const cardContent = this.createCardHeader(bottle, `Gasflasche Nr. ${bottle.id}`, 'fire', 'bottle', bottle.id, bottle.active) + cardBody;
        return this.createCard(bottle, cardContent, 'bottle', bottle.id, bottle.active);
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
     * Binds event listeners to the buttons within each bottle card.
     */
    bindBottleCardEvents() {
        const handlers = {
            getModalTitle: (type) => 'Gewichtsmessung hinzufügen',
            deleteItem: (bottleId) => this.deleteBottle(bottleId),
            deleteOperation: (operationId) => this.deleteOperation(operationId),
            toggleActive: (bottleId, newStatus) => this.toggleBottleActiveStatus(bottleId, newStatus)
        };

        this.bindCardEvents('bottle', handlers);

        // Additional bottle-specific event handlers
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
            };
            await BottleAPI.createBottleOperation(operation);
            UI.showToast("Gewichtsmessung erfolgreich hinzugefügt!", "success");
            UI.hideModal("operation-modal");
            UI.clearForm("operation-form");
            this.loadBottles();
            this.loadBottleEntries();
        } catch (error) {
            console.error("Failed to add bottle operation:", error);
            UI.showToast("Fehler beim Hinzufügen der Gewichtsmessung.", "error");
        }
    },
    
    /**
     * Toggles a bottle's active/inactive status and updates it via the API.
     * @param {number} bottleId - The ID of the bottle to update.
     * @param {boolean} newStatus - The new active status (true for active, false for inactive).
     */
    async toggleBottleActiveStatus(bottleId, newStatus) {
        await this.toggleActiveStatus(bottleId, newStatus, 'Gasflasche', BottleAPI.updateBottle, () => this.loadBottles());
    },
    
    /**
     * Deletes a bottle after a confirmation from the user.
     * @param {number} bottleId - The ID of the bottle to delete.
     */
    async deleteBottle(bottleId) {
        await this.deleteItem(bottleId, 'Gasflasche', BottleAPI.deleteBottle, () => this.loadBottles());
    },

    /**
     * Deletes a specific operation (weight measurement) after confirmation.
     * @param {number} operationId - The ID of the operation to delete.
     */
    async deleteOperation(operationId) {
        await this._deleteOperation(operationId, 'Messung', BottleAPI.deleteBottleOperation, () => this.loadBottleEntries());
    },
};