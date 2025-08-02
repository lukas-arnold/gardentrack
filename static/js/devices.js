import { DeviceAPI } from "./api.js"
import { UI } from "./ui.js"
import { Utils } from "./utils.js"
import { ChartManager } from "./chartManager.js"
import { DataManager } from "./dataManager.js"

/**
 * The DeviceManager object handles all logic and functionality related to managing devices.
 * It extends BaseManager to inherit common functionality and uses ChartManager and DataManager
 * for specialized operations.
 * @namespace DeviceManager
 */
export const DeviceManager = {
    /** @type {number} The year currently selected for displaying statistics and charts. */
    currentStatsYear: new Date().getFullYear(),

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
        this.currentStatsYear = new Date().getFullYear();
        this.chartManager = new ChartManager();
        this.bindEvents();
        this.loadInitialData();
    },

    // BaseManager methods
    toggleInactiveVisibility(toggleButtonId, loadFunction) {
        this.showInactive = !this.showInactive;
        loadFunction();
        this.loadInitialData();
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
        if (!confirm(`Bist du sicher, dass du dieses ${itemName} ${actionText} möchtest?`)) {
            return;
        }

        try {
            await updateFunction(itemId, { active: newStatus });
            UI.showToast(`${itemName} erfolgreich ${actionText}!`, 'success');
            reloadFunction();
        } catch (error) {
            console.error(`Failed to ${actionText} ${itemName}:`, error);
            UI.showToast(`Fehler beim ${actionText} des ${itemName}.`, 'error');
        }
    },

    filterItemsByVisibility(items) {
        return this.showInactive ? items : items.filter(item => item.active);
    },

    createEmptyState(icon, title, description) {
        return UI.createEmptyState(icon, title, description);
    },

    /**
     * Loads all initial data required for the device manager's display.
     * This includes populating filters and rendering various statistics and lists.
     */
    async loadInitialData() {
        // Populates the year filter dropdown first, as other components depend on the selected year.
        await this.populateYearFilters();
        // Renders all summary and list sections.
        await this.renderAllTimeDeviceSummaryStatistics();
        await this.renderMonthlyTrendChart();
        await this.renderYearlyDeviceStatistics();
        await this.loadDevices(); // This should be last to ensure all data is ready for card rendering
        await this.loadDeviceEntries();
        await this.loadYearlyDeviceEntries();
    },

    /**
     * Fetches device data and renders the device cards on the page.
     * The list is filtered based on the `showInactive` flag.
     */
    async loadDevices() {
        try {
            const devices = await DeviceAPI.getDevices();
            const grid = document.getElementById('device-list');
            if (grid) {
                // Filters devices based on the showInactive flag.
                const devicesToDisplay = this.filterItemsByVisibility(devices);

                if (devicesToDisplay.length === 0) {
                    grid.innerHTML = this.createEmptyState('tools', 'Keine Geräte', 'Füge dein erstes Gerät hinzu, um Einsätze zu verfolgen.');
                } else {
                    // Generates and renders the device cards, passing the currentStatsYear for filtering.
                    grid.innerHTML = devicesToDisplay.map(device => this.createDeviceCard(device, this.currentStatsYear)).join('');
                }
                this.bindDeviceCardEvents();
                this.updateToggleButtonStyle('toggle-inactive-devices-btn');
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            const grid = document.getElementById('device-list');
            if (grid) {
                grid.innerHTML = this.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Geräte', 'Gerätedaten konnten nicht geladen werden.');
            }
        }
    },

    async loadDeviceOperations({ filterYear = null, tableBodyId }) {
        try {
            let devices = await DeviceAPI.getDevices();
            if (!this.showInactive) {
                devices = devices.filter(device => device.active);
            }

            const tableBody = document.getElementById(tableBodyId);
            if (!tableBody) return;

            tableBody.innerHTML = ''; // Clear existing entries

            // Get all operations with device
            const allOperations = [];
            devices.forEach(device => {
                device.operations.forEach(operation => {
                    // Filter by year
                    if (
                        !filterYear || 
                        new Date(operation.start_time).getFullYear() === filterYear
                    ) {
                        allOperations.push({ operation, device });
                    }
                });
            });

            // Sort by date
            allOperations.sort((a, b) => new Date(a.operation.start_time) - new Date(b.operation.start_time));

            // Render
            allOperations.forEach(({ operation, device }) => {
                const row = tableBody.insertRow();
                row.dataset.id = device.id;

                row.innerHTML = DataManager.createOperationTableRow(operation, device, 'device');

                row.querySelector('.btn-delete').addEventListener('click', () => this.deleteOperation(operation.id));
            });

        } catch (error) {
            console.error('Error loading device entries:', error);
            UI.showToast(`Fehler beim Laden der Geräte-Einträge: ${error.message}`, 'error');
        }
    },

    async loadYearlyDeviceEntries() {
        this.loadDeviceOperations({
            filterYear: this.currentStatsYear,
            tableBodyId: 'device-entries-table-body'
        });
    },

    async loadDeviceEntries() {
        this.loadDeviceOperations({
            tableBodyId: 'all-device-entries-table-body'
        });
    },
    
    /**
     * Toggles the visibility of inactive devices and reloads the device list.
     */
    toggleInactiveDeviceVisibility() {
        this.toggleInactiveVisibility('toggle-inactive-devices-btn', () => this.loadDevices());
    },

    /**
     * Creates the HTML string for a single device card.
     * @param {Object} device - The device data object.
     * @param {number|string} yearFilter - The year to filter operations by for the card's summary.
     * @returns {string} The HTML string for the device card.
     */
    createDeviceCard(device, yearFilter) {
        const stats = DataManager.calculateDeviceStats(device, yearFilter);
        
        const cardBody = `
            <div class="card-body">
                <div class="card-info">
                    ${DataManager.createInfoItem(`Gesamteinsätze (${yearFilter})`, stats.operationsCount)}
                    ${DataManager.createInfoItem(`Gesamtbetriebszeit (${yearFilter})`, Utils.formatDuration(stats.totalDuration))}
                    ${stats.lastOperation ? DataManager.createInfoItem(`Zuletzt benutzt (${yearFilter})`, Utils.formatDate(stats.lastOperation.start_time)) : ''}
                </div>
            </div>
        `;

        const cardContent = this.createCardHeader(device, device.name, 'wrench', 'device', device.id, device.active) + cardBody;
        return this.createCard(device, cardContent, 'device', device.id, device.active);
    },

    /**
     * Renders a summary of all-time device statistics, such as total runtime and operation count.
     */
    async renderAllTimeDeviceSummaryStatistics() {
        const allTimeSummaryGrid = document.getElementById('all-time-device-summary-grid');
        if (!allTimeSummaryGrid) return;

        try {
            let devices = await DeviceAPI.getDevices();
            if (!this.showInactive) {
                devices = devices.filter(device => device.active);
            }


            // Displays a message if there are no active devices.
            if (devices.length === 0) {
                allTimeSummaryGrid.innerHTML = this.createEmptyState('tools', 'Keine Geräte', 'Füge Geräte hinzu, um Gesamtstatistiken zu sehen.');
                return;
            }

            // Maps active devices to HTML summary cards and joins them into a single string.
            allTimeSummaryGrid.innerHTML = devices.map(device => {
                const totalDuration = DataManager.calculateTotalDuration(device.operations);
                const operationsCount = device.operations?.length || 0;

                const statistics = [
                    { icon: 'clock', label: 'Betriebszeit', value: Utils.formatDuration(totalDuration) },
                    { icon: 'clipboard-list', label: 'Einsätze', value: operationsCount }
                ];

                return DataManager.createStatisticCard(device.name, statistics, 'device-all-time-summary-card');
            }).join('');
        } catch (error) {
            console.error('Failed to load all-time device summary statistics:', error);
            allTimeSummaryGrid.innerHTML = this.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Gesamtstatistiken pro Gerät', 'Statistikdaten konnten nicht geladen werden.');
        }
    },

    /**
     * Renders a grid of yearly device statistics, showing total hours and operations
     * for the currently selected year.
     */
    async renderYearlyDeviceStatistics() {
        const yearlyStatsGrid = document.getElementById('yearly-device-statistics');
        if (!yearlyStatsGrid) return;

        try {
            let devices = await DeviceAPI.getDevices();
            if (!this.showInactive) {
                devices = devices.filter(device => device.active);
            }

            if (devices.length === 0) {
                yearlyStatsGrid.innerHTML = this.createEmptyState('chart-bar', 'Keine Statistiken verfügbar', 'Füge aktive Geräte und Einsätze hinzu, um Statistiken zu sehen.');
                return;
            }

            // Generates and renders yearly statistic cards for active devices.
            yearlyStatsGrid.innerHTML = devices.map(device => {
                const stats = DataManager.calculateDeviceStats(device, this.currentStatsYear);
                const displayDurationHours = (stats.totalDuration / 60).toFixed(2);
                const displayDurationText = `${Utils.formatHours(displayDurationHours)}h`;

                return `
                    <div class="statistic-card device-statistic-overview-card">
                        <div class="card-header">
                            <h4 class="card-title">${device.name}</h4>
                        </div>
                        <div class="card-body">
                            <span class="statistic-value">${displayDurationText}</span>
                            <span class="statistic-sub-value">${stats.operationsCount} Einsätze</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to render yearly device statistics:', error);
            yearlyStatsGrid.innerHTML = this.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Statistiken', 'Statistikdaten konnten nicht geladen werden.');
        }
    },

    /**
     * Renders a line chart showing the monthly trend of device operations for the selected year.
     * The chart displays total operational hours per month for each active device.
     */
    async renderMonthlyTrendChart() {
        try {
            let devices = await DeviceAPI.getDevices();
            if (!this.showInactive) {
                devices = devices.filter(device => device.active);
            }

            this.chartManager.createMonthlyTrendChart(devices, this.currentStatsYear);
        } catch (error) {
            console.error('Failed to render monthly trend chart:', error);
            const chartContainer = document.querySelector('.charts-section .chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = this.createEmptyState('chart-line', 'Fehler beim Laden des Diagramms', 'Diagrammdaten konnten nicht geladen werden.');
            }
        }
    },
    
    /**
     * Binds event listeners to UI elements on the device management page.
     */
    bindEvents() {
        // Event listener for the "Add Device" button to show the device creation modal.
        document.getElementById('add-device-btn')?.addEventListener('click', () => {
            UI.clearForm('device-form');
            UI.showModal('device-modal');
        });

        // Event listener for the button that toggles the visibility of inactive devices.
        document.getElementById('toggle-inactive-devices-btn')?.addEventListener('click', () => {
            this.toggleInactiveDeviceVisibility();
        });

        // Event listener for the year filter dropdown.
        document.getElementById('stats-year-filter')?.addEventListener('change', (e) => {
            // Updates the current year based on the selected value.
            this.currentStatsYear = parseInt(e.target.value, 10);
            // Re-renders all UI elements that depend on the selected year.
            this.renderMonthlyTrendChart();
            this.renderYearlyDeviceStatistics();
            this.loadDevices();
            this.loadYearlyDeviceEntries();
        });
    },

    /**
     * Binds event listeners to the action buttons within each device card.
     */
    bindDeviceCardEvents() {
        const handlers = {
            getModalTitle: (type) => 'Einsatz hinzufügen',
            deleteItem: (deviceId) => this.deleteDevice(deviceId),
            deleteOperation: (operationId) => this.deleteOperation(operationId),
            toggleActive: (deviceId, newStatus) => this.toggleDeviceActiveStatus(deviceId, newStatus)
        };

        this.bindCardEvents('device', handlers);
    },

    /**
     * Handles the submission of the device creation form.
     * @param {Event} e - The form submission event.
     */
    handleDeviceFormSubmit: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const device = {
                name: formData.get('name'),
                active: true // New devices are active by default
            };

            await DeviceAPI.createDevice(device);
            UI.showToast('Gerät erfolgreich erstellt!', 'success');
            UI.hideModal('device-modal');
            UI.clearForm('device-form');
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) {
            console.error('Failed to create device:', error);
        }
    },

    /**
     * Submits a new operation for a specific device.
     * @param {FormData} formData - The form data containing operation details.
     * @param {string} type - The type of operation, should be 'device'.
     * @param {number} targetId - The ID of the device.
     */
    submitOperation: async function(formData, type, targetId) {
        if (type !== 'device') return;

        const deviceIdAsNumber = parseInt(targetId, 10);
        if (isNaN(deviceIdAsNumber)) {
            console.error('Invalid device ID for operation:', targetId);
            UI.showToast('Fehler: Geräte-ID für Einsatz konnte nicht ermittelt werden.', 'error');
            return;
        }

        try {
            const operationDate = formData.get('date');
            const startTime = formData.get('startTime');
            const endTime = formData.get('endTime');

            // Kombinieren Sie Datum und Uhrzeit zu einem vollständigen ISO-8601-Zeitstempel
            // Fügen Sie ':00Z' hinzu, um Sekunden und Zeitzone zu spezifizieren (UTC)
            const start_time_full = `${operationDate}T${startTime}:00Z`;
            const end_time_full = `${operationDate}T${endTime}:00Z`;

            const operation = {
                device_id: deviceIdAsNumber,
                start_time: start_time_full,
                end_time: end_time_full,
                note: formData.get('note') || null
            };

            await DeviceAPI.createDeviceOperation(operation);
            UI.showToast('Einsatz erfolgreich hinzugefügt!', 'success');
            UI.hideModal('operation-modal');
            UI.clearForm('operation-form');
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) {
            console.error('Failed to add device operation:', error);
        }
    },
    
    /**
     * Toggles a device's active/inactive status and updates it via the API.
     * @param {number} deviceId - The ID of the device to update.
     * @param {boolean} newStatus - The new active status (true for active, false for inactive).
     */
    async toggleDeviceActiveStatus(deviceId, newStatus) {
        await this.toggleActiveStatus(deviceId, newStatus, 'Gerät', DeviceAPI.updateDevice, () => this.loadInitialData());
    },

    /**
     * Deletes a device after a confirmation from the user.
     * @param {number} deviceId - The ID of the device to delete.
     */
    async deleteDevice(deviceId) {
        await this.deleteItem(deviceId, 'Gartengerät', DeviceAPI.deleteDevice, () => this.loadDevices());
    },

    /**
     * Deletes a specific operation after a confirmation from the user.
     * @param {number} operationId - The ID of the operation to delete.
     */
    async deleteOperation(operationId) {
        await this._deleteOperation(operationId, 'Einsatz', DeviceAPI.deleteDeviceOperation, () => this.loadDeviceEntries() && this.loadYearlyDeviceEntries());
    },
    
    /**
     * Fetches all devices to determine the unique years of their operations,
     * then populates the year filter dropdown with these years.
     */
    async populateYearFilters() {
        try {
            const devices = await DeviceAPI.getDevices();
            const allOperations = devices.flatMap(device => device.operations || []);
            this.currentStatsYear = DataManager.populateYearFilter('stats-year-filter', allOperations, this.currentStatsYear);
        } catch (error) {
            console.error('Failed to populate year filters:', error);
        }
    },
};