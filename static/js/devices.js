import { DeviceAPI } from "./api.js"
import { UI } from "./ui.js"
import { Utils } from "./utils.js"

/**
 * The DeviceManager object handles all logic and functionality related to managing devices.
 * It's responsible for loading data, rendering UI components, binding events, and handling
 * user interactions like adding, deleting, and updating devices and their operations.
 * @namespace DeviceManager
 */
export const DeviceManager = {
    /** @type {boolean} A flag to control the visibility of inactive devices. */
    showInactiveDevices: false,
    
    /** @type {number} The year currently selected for displaying statistics and charts. */
    currentStatsYear: new Date().getFullYear(), 
    
    /** @type {Chart|null} The Chart.js instance for the monthly operations line chart. */
    operationsLineChart: null,

    /**
     * Initializes the manager by setting default states, binding events, and loading data.
     */
    init() {
        this.showInactiveDevices = false;
        this.currentStatsYear = new Date().getFullYear(); 
        this.operationsLineChart = null;
        this.bindEvents();
        this.loadInitialData();
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
        });
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
    },

    /**
     * Fetches all devices to determine the unique years of their operations,
     * then populates the year filter dropdown with these years.
     */
    async populateYearFilters() {
        try {
            const devices = await DeviceAPI.getDevices();
            const years = new Set();
            // Collect all unique years from all device operations.
            devices.forEach(device => {
                device.operations?.forEach(op => {
                    years.add(new Date(op.date).getFullYear());
                });
            });

            const sortedYears = Array.from(years).sort((a, b) => b - a); // Sort years in descending order.
            const yearFilterSelect = document.getElementById('stats-year-filter');
            if (yearFilterSelect) {
                yearFilterSelect.innerHTML = ''; // Clears existing options.
                // Adds an option for each available year.
                sortedYears.forEach(year => {
                    const option = new Option(year, year);
                    yearFilterSelect.add(option);
                });

                // Sets the initial selection of the dropdown.
                if (sortedYears.includes(this.currentStatsYear)) {
                    yearFilterSelect.value = this.currentStatsYear;
                } else if (sortedYears.length > 0) {
                    this.currentStatsYear = sortedYears[0]; // Defaults to the latest year if the current year isn't present.
                    yearFilterSelect.value = this.currentStatsYear;
                } else {
                    // Fallback for when there are no operations yet.
                    this.currentStatsYear = new Date().getFullYear();
                    yearFilterSelect.add(new Option(this.currentStatsYear, this.currentStatsYear));
                    yearFilterSelect.value = this.currentStatsYear;
                }
            }
        } catch (error) {
            console.error('Failed to populate year filters:', error);
        }
    },

    /**
     * Renders a summary of all-time device statistics, such as total runtime and operation count.
     */
    async renderAllTimeDeviceSummaryStatistics() {
        const allTimeSummaryGrid = document.getElementById('all-time-device-summary-grid');
        if (!allTimeSummaryGrid) return;

        try {
            const devices = await DeviceAPI.getDevices();
            const activeDevices = devices.filter(device => device.active);

            // Displays a message if there are no active devices.
            if (activeDevices.length === 0) {
                allTimeSummaryGrid.innerHTML = UI.createEmptyState('tools', 'Keine Geräte', 'Füge Geräte hinzu, um Gesamtstatistiken zu sehen.');
                return;
            }

            // Maps active devices to HTML summary cards and joins them into a single string.
            allTimeSummaryGrid.innerHTML = activeDevices.map(device => {
                // Calculates total duration and operation count for all time.
                const totalDuration = device.operations?.reduce((sum, op) => sum + op.duration, 0) || 0;
                const operationsCount = device.operations?.length || 0;

                return `
                    <div class="statistic-card device-all-time-summary-card">
                        <div class="card-body">
                            <h4 class="card-title">${device.name}</h4>
                            <div class="statistic-item">
                                <i class="fas fa-clock statistic-icon-small"></i>
                                <span class="statistic-label">Betriebszeit:</span>
                                <span class="statistic-value">${Utils.formatDuration(totalDuration)}</span>
                            </div>
                            <div class="statistic-item">
                                <i class="fas fa-clipboard-list statistic-icon-small"></i>
                                <span class="statistic-label">Einsätze:</span>
                                <span class="statistic-value">${operationsCount}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load all-time device summary statistics:', error);
            allTimeSummaryGrid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Gesamtstatistiken pro Gerät', 'Statistikdaten konnten nicht geladen werden.');
        }
    },

    async loadDeviceEntries() {
        try {
            const devices = await DeviceAPI.getDevices();
            const activeDevices = devices.filter(device => device.active);

            const tableBody = document.getElementById('device-entries-table-body');
            if (!tableBody) return;

            tableBody.innerHTML = ''; // Clear existing entries

            activeDevices.forEach(device => {
                const operations = device.operations;

                operations.forEach(operation => {
                    const row = tableBody.insertRow();
                    row.dataset.id = device.id; // Store ID on the row

                    row.innerHTML = `
                        <td>${(device.name)}</td>
                        <td>${Utils.formatDate(operation.date)}</td>
                        <td>${Utils.formatDuration(operation.duration)}</td>
                        <td>${(operation.note)}</td>
                        <td>
                            <button class="btn-delete" data-id="${device.id}">Löschen</button>
                        </td>
                    `;
                    // Attach event listener directly after creation for efficiency
                    row.querySelector('.btn-delete').addEventListener('click', () => this.deleteOperation(operation.id));
                })
            });
        } catch (error) {
            console.error('Error loading device entries:', error);
            showMessage(`Fehler beim Laden der Geräte-Einträge: ${error.message}`, 'error');
        }
    },

    /**
     * Renders a line chart showing the monthly trend of device operations for the selected year.
     * The chart displays total operational hours per month for each active device.
     */
    async renderMonthlyTrendChart() {
        const ctx = document.getElementById('deviceOperationsLineChart')?.getContext('2d');
        if (!ctx) return;

        try {
            const devices = await DeviceAPI.getDevices();
            const activeDevices = devices.filter(device => device.active);

            const labels = [
                'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
            ];
            const datasets = [];

            // Define a set of colors for different lines
            const colors = [
                'rgba(128, 0, 128, 1)', // Purple
                'rgba(0, 128, 0, 1)',  // Green
                'rgba(255, 165, 0, 1)',// Orange
                'rgba(0, 128, 128, 1)',// Teal
                'rgba(173, 216, 230, 1)',// Light Blue
                'rgba(255, 105, 180, 1)',// Hot Pink
                'rgba(0, 0, 0, 1)',    // Black
                'rgba(128, 128, 128, 1)',// Grey
                'rgba(255, 215, 0, 1)', // Gold
                'rgba(70, 130, 180, 1)' // Steel Blue
            ];
            const backgroundColors = colors.map(color => color.replace('1)', '0.2)')); // Lighter background for points

            activeDevices.forEach((device, index) => {
                const monthlyDurationsHours = new Array(12).fill(0); // Initialize for 12 months with 0 hours

                // Fills the monthlyDurationsHours array with data for the selected year.
                device.operations?.forEach(op => {
                    const opDate = new Date(op.date);
                    if (opDate.getFullYear() === this.currentStatsYear) {
                        const month = opDate.getMonth(); // 0 for Jan, 11 for Dec
                        monthlyDurationsHours[month] += op.duration / 60; // Convert minutes to hours
                    }
                });

                // Only adds a dataset if there is data for the current year.
                if (monthlyDurationsHours.some(val => val > 0)) {
                    datasets.push({
                        label: device.name,
                        data: monthlyDurationsHours.map(val => parseFloat(val.toFixed(2))), // Format to 2 decimal places
                        borderColor: colors[index % colors.length],
                        backgroundColor: backgroundColors[index % backgroundColors.length], // Lighter for points
                        pointBackgroundColor: colors[index % colors.length], // Point color
                        pointBorderColor: colors[index % colors.length], // Point border color
                        fill: false, // Don't fill area under the line
                        tension: 0.2, // Slightly curve the line
                        borderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    });
                }
            });

            // Destroys the existing chart instance to prevent memory leaks and conflicts.
            if (this.operationsLineChart) {
                this.operationsLineChart.destroy();
            }

            // Creates a new Chart.js instance for the line chart.
            this.operationsLineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allows setting custom height via CSS
                    plugins: {
                        title: {
                            display: false, // Title is in h4 now
                            text: `Monatliche Entwicklung im Jahr ${this.currentStatsYear}`,
                            color: 'var(--text-primary)',
                            font: { size: 16 }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'var(--text-secondary)'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += `${context.parsed.y} Stunden`;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Monat',
                                color: 'var(--text-secondary)'
                            },
                            ticks: {
                                color: 'var(--text-secondary)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)' // Lighter grid lines for dark mode
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Stunden',
                                color: 'var(--text-secondary)'
                            },
                            beginAtZero: true,
                            ticks: {
                                color: 'var(--text-secondary)',
                                // Use callback to ensure proper hour formatting, e.g., "0.5", "1.0"
                                callback: function(value) {
                                    return value.toFixed(1); // Show one decimal place for hours
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to render monthly trend chart:', error);
            const chartContainer = document.querySelector('.charts-section .chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = UI.createEmptyState('chart-line', 'Fehler beim Laden des Diagramms', 'Diagrammdaten konnten nicht geladen werden.');
            }
        }
    },

    /**
     * Fetches device data and renders the device cards on the page.
     * The list is filtered based on the `showInactiveDevices` flag.
     */
    async loadDevices() {
        try {
            const devices = await DeviceAPI.getDevices();
            const grid = document.getElementById('device-list');
            if (grid) {
                // Filters devices based on the showInactiveDevices flag.
                const devicesToDisplay = this.showInactiveDevices ? devices : devices.filter(device => device.active);

                if (devicesToDisplay.length === 0) {
                    grid.innerHTML = UI.createEmptyState('tools', 'Keine Geräte', 'Füge dein erstes Gerät hinzu, um Einsätze zu verfolgen.');
                } else {
                    // Generates and renders the device cards, passing the currentStatsYear for filtering.
                    grid.innerHTML = devicesToDisplay.map(device => this.createDeviceCard(device, this.currentStatsYear)).join('');
                }
                this.bindDeviceCardEvents();
                this.updateToggleButtonStyle();
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            const grid = document.getElementById('device-list');
            if (grid) {
                grid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Geräte', 'Gerätedaten konnten nicht geladen werden.');
            }
        }
    },

    /**
     * Creates the HTML string for a single device card.
     * @param {Object} device - The device data object.
     * @param {number|string} yearFilter - The year to filter operations by for the card's summary.
     * @returns {string} The HTML string for the device card.
     */
    createDeviceCard(device, yearFilter) {
        // Filters operations by year for the summary displayed *within* the card
        const filteredOperations = device.operations?.filter(op =>
            yearFilter === 'all' || new Date(op.date).getFullYear() === yearFilter
        ) || [];

        const operationsCount = filteredOperations.length;
        // Sorts operations by date descending to get the last operation for the filtered year.
        const lastOperation = filteredOperations.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const totalDuration = filteredOperations.reduce((sum, op) => sum + op.duration, 0) || 0;


        return `
            <div class="card ${!device.active && !this.showInactiveDevices ? 'hidden-inactive' : ''}" data-device-id="${device.id}">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-wrench"></i>
                        ${device.name}
                    </h3>
                    <div class="card-actions">
                        <span class="status-badge ${device.active ? 'status-active' : 'status-inactive'}">
                            <i class="fas fa-circle" style="font-size: 0.6em;"></i>
                            ${device.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <button class="btn btn-sm btn-primary add-operation-btn" data-id="${device.id}" data-type="device">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-${device.active ? 'secondary' : 'success'} toggle-active-btn" data-id="${device.id}" data-active="${device.active}">
                            <i class="fas fa-${device.active ? 'archive' : 'undo'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-device-btn" data-id="${device.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Gesamteinsätze (${yearFilter})</span>
                            <span class="info-value">${operationsCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gesamtbetriebszeit (${yearFilter})</span>
                            <span class="info-value">${Utils.formatDuration(totalDuration)}</span>
                        </div>
                        ${lastOperation ? `
                        <div class="info-item">
                            <span class="info-label">Zuletzt benutzt (${yearFilter})</span>
                            <span class="info-value">${Utils.formatDate(lastOperation.date)}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renders a grid of yearly device statistics, showing total hours and operations
     * for the currently selected year.
     */
    async renderYearlyDeviceStatistics() {
        const yearlyStatsGrid = document.getElementById('yearly-device-statistics');
        if (!yearlyStatsGrid) return;

        try {
            const devices = await DeviceAPI.getDevices();
            const activeDevices = devices.filter(device => device.active);

            if (activeDevices.length === 0) {
                yearlyStatsGrid.innerHTML = UI.createEmptyState('chart-bar', 'Keine Statistiken verfügbar', 'Füge aktive Geräte und Einsätze hinzu, um Statistiken zu sehen.');
                return;
            }

            // Generates and renders yearly statistic cards for active devices.
            yearlyStatsGrid.innerHTML = activeDevices.map(device => {
                // Filters operations by the currently selected year.
                const filteredOperations = device.operations?.filter(op =>
                    new Date(op.date).getFullYear() === this.currentStatsYear
                ) || [];

                const operationsCount = filteredOperations.length;
                const totalDuration = filteredOperations.reduce((sum, op) => sum + op.duration, 0);

                const displayDurationHours = (totalDuration / 60).toFixed(2);
                const displayDurationText = `${displayDurationHours}h`;

                return `
                    <div class="statistic-card device-statistic-overview-card">
                        <div class="card-header">
                            <h4 class="card-title">${device.name}</h4>
                        </div>
                        <div class="card-body">
                            <span class="statistic-value">${displayDurationText}</span>
                            <span class="statistic-sub-value">${totalDuration} Minuten</span>
                            <span class="statistic-sub-value">${operationsCount} Einsätze</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to render yearly device statistics:', error);
            yearlyStatsGrid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Statistiken', 'Statistikdaten konnten nicht geladen werden.');
        }
    },


    /**
     * Binds event listeners to the action buttons within each device card.
     */
    bindDeviceCardEvents() {
        // Event listener for the "Add Operation" button on each device card.
        document.querySelectorAll('.add-operation-btn[data-type="device"]').forEach(button => {
            button.onclick = (e) => {
                const deviceId = e.currentTarget.dataset.id;
                UI.showOperationModal('Einsatz hinzufügen', 'device', deviceId);
            };
        });

        // Event listener for the "Delete Device" button.
        document.querySelectorAll('.delete-device-btn').forEach(button => {
            button.onclick = async (e) => {
                const deviceId = e.currentTarget.dataset.id;
                await this.deleteDevice(deviceId);
            };
        });

        // Event listener for the "Delete Operation" button within an operation summary.
        document.querySelectorAll('.delete-operation-btn[data-type="device"]').forEach(button => {
            button.onclick = async (e) => {
                const operationId = e.currentTarget.dataset.operationId;
                await this.deleteOperation(operationId);
            };
        });

        // Event listener for the button that toggles a device's active status.
        document.querySelectorAll('.toggle-active-btn').forEach(button => {
            button.onclick = async (e) => {
                const deviceId = e.currentTarget.dataset.id;
                const currentActiveStatus = e.currentTarget.dataset.active === 'true';
                await this.toggleDeviceActiveStatus(deviceId, !currentActiveStatus);
            };
        });
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
            const operation = {
                device_id: deviceIdAsNumber, // Add device_id here
                date: formData.get('date'),
                duration: parseInt(formData.get('duration'), 10),
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
     * Deletes a device after a confirmation from the user.
     * @param {number} deviceId - The ID of the device to delete.
     */
    async deleteDevice(deviceId) {
        UI.showConfirmModal(
            "Gartengerät löschen",
            "Möchten Sie dieses Gartengerät wirklich löschen? Alle zugehörigen Einsätze werden ebenfalls entfernt.",
            async () => {
                try {
                    UI.showLoading(true);
                    await DeviceAPI.deleteDevice(deviceId);
                    UI.showToast('Gartengerät erfolgreich gelöscht.', 'success');
                    this.loadDevices(); // Reload devices after deletion
                } catch (error) {
                    console.error('Fehler beim Löschen des Geräts:', error);
                    UI.showToast('Fehler beim Löschen des Geräts.', 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    },

    /**
     * Deletes a specific operation after a confirmation from the user.
     * @param {number} operationId - The ID of the operation to delete.
     */
    async deleteOperation(operationId) {
        UI.showConfirmModal(
            "Einsatz löschen",
            "Möchten Sie diesen Einsatz wirklich löschen?",
            async () => {
                try {
                    UI.showLoading(true);
                    await DeviceAPI.deleteOperation(operationId);
                    UI.showToast('Einsatz erfolgreich gelöscht.', 'success');
                    this.loadDevices(); // Reload devices to reflect the change
                } catch (error) {
                    console.error('Fehler beim Löschen des Einsatzes:', error);
                    UI.showToast('Fehler beim Löschen des Einsatzes.', 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    },

    /**
     * Toggles a device's active/inactive status and updates it via the API.
     * @param {number} deviceId - The ID of the device to update.
     * @param {boolean} newStatus - The new active status (true for active, false for inactive).
     */
    async toggleDeviceActiveStatus(deviceId, newStatus) {
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren';
        if (!confirm(`Bist du sicher, dass du dieses Gerät ${actionText} möchtest?`)) {
            return;
        }

        try {
            await DeviceAPI.updateDevice(deviceId, { active: newStatus });
            UI.showToast(`Gerät erfolgreich ${actionText}!`, 'success');
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) {
            console.error(`Failed to ${actionText} device:`, error);
        }
    },

    /**
     * Toggles the visibility of inactive devices and reloads the device list.
     */
    toggleInactiveDeviceVisibility() {
        this.showInactiveDevices = !this.showInactiveDevices;
        this.loadDevices();
        this.updateToggleButtonStyle();
    },

    /**
     * Updates the text and style of the toggle button based on the current visibility state.
     */
    updateToggleButtonStyle() {
        const toggleButton = document.getElementById('toggle-inactive-devices-btn');
        if (toggleButton) {
            if (this.showInactiveDevices) {
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Inaktive ausblenden';
                toggleButton.classList.remove('btn-secondary');
                toggleButton.classList.add('btn-info');
            } else {
                toggleButton.innerHTML = '<i class="fas fa-eye"></i> Inaktive anzeigen';
                toggleButton.classList.remove('btn-info');
                toggleButton.classList.add('btn-secondary');
            }
        }
    }
};