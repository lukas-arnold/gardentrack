import { API } from "./api.js"
import { UI } from "./ui.js"
import { Utils } from "./utils.js"

export const DeviceManager = {
    init() {
        this.showInactiveDevices = false;
        this.currentStatsYear = new Date().getFullYear(); // Re-introduce currentStatsYear
        this.operationsLineChart = null; // New property for the line chart instance
        this.bindEvents();
        this.loadInitialData(); // Call loadInitialData to get everything rendered
    },

    bindEvents() {
        document.getElementById('add-device-btn')?.addEventListener('click', () => {
            UI.clearForm('device-form');
            UI.showModal('device-modal');
        });

        document.getElementById('toggle-inactive-devices-btn')?.addEventListener('click', () => {
            this.toggleInactiveDeviceVisibility();
        });

        // Event listener for the year filter, now located in charts-section
        document.getElementById('stats-year-filter')?.addEventListener('change', (e) => {
            this.currentStatsYear = parseInt(e.target.value, 10);
            this.renderMonthlyTrendChart(); // Update line chart
            this.renderYearlyDeviceStatistics(); // Update yearly summary cards
            this.loadDevices(); // Update device list (for year-filtered operation summaries in cards)
        });
    },

    async loadInitialData() {
        // Ensure year filters are populated first, as other renders depend on currentStatsYear
        await this.populateYearFilters();
        // Render all sections
        await this.renderAllTimeDeviceSummaryStatistics();
        await this.renderMonthlyTrendChart(); // Render the new line chart
        await this.renderYearlyDeviceStatistics();
        await this.loadDevices(); // This should be last to ensure all data is ready for card rendering
    },

    async populateYearFilters() {
        try {
            const devices = await API.getDevices();
            const years = new Set();
            devices.forEach(device => {
                device.operations?.forEach(op => {
                    years.add(new Date(op.date).getFullYear());
                });
            });

            const sortedYears = Array.from(years).sort((a, b) => b - a); // Descending order
            const yearFilterSelect = document.getElementById('stats-year-filter');
            if (yearFilterSelect) {
                yearFilterSelect.innerHTML = ''; // Clear previous options
                // Add an option for each year
                sortedYears.forEach(year => {
                    const option = new Option(year, year);
                    yearFilterSelect.add(option);
                });

                // Set initial selection to current year or the latest available year
                if (sortedYears.includes(this.currentStatsYear)) {
                    yearFilterSelect.value = this.currentStatsYear;
                } else if (sortedYears.length > 0) {
                    this.currentStatsYear = sortedYears[0]; // Set to latest year if current not available
                    yearFilterSelect.value = this.currentStatsYear;
                } else {
                    // Fallback: if no operations yet, just add current year as an option
                    this.currentStatsYear = new Date().getFullYear();
                    yearFilterSelect.add(new Option(this.currentStatsYear, this.currentStatsYear));
                    yearFilterSelect.value = this.currentStatsYear;
                }
            }
        } catch (error) {
            console.error('Failed to populate year filters:', error);
        }
    },

    async renderAllTimeDeviceSummaryStatistics() {
        const allTimeSummaryGrid = document.getElementById('all-time-device-summary-grid');
        if (!allTimeSummaryGrid) return;

        try {
            const devices = await API.getDevices();
            const activeDevices = devices.filter(device => device.active);

            if (activeDevices.length === 0) {
                allTimeSummaryGrid.innerHTML = UI.createEmptyState('tools', 'Keine Geräte', 'Füge Geräte hinzu, um Gesamtstatistiken zu sehen.');
                return;
            }

            allTimeSummaryGrid.innerHTML = activeDevices.map(device => {
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

    // NEW: Function to render the monthly trend line chart
    async renderMonthlyTrendChart() {
        const ctx = document.getElementById('deviceOperationsLineChart')?.getContext('2d');
        if (!ctx) return;

        try {
            const devices = await API.getDevices();
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

                device.operations?.forEach(op => {
                    const opDate = new Date(op.date);
                    if (opDate.getFullYear() === this.currentStatsYear) {
                        const month = opDate.getMonth(); // 0 for Jan, 11 for Dec
                        monthlyDurationsHours[month] += op.duration / 60; // Convert minutes to hours
                    }
                });

                // Only add dataset if there's any data for the current year
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

            if (this.operationsLineChart) {
                this.operationsLineChart.destroy(); // Destroy existing chart before re-rendering
            }

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

    async loadDevices() {
        try {
            const devices = await API.getDevices();
            const grid = document.getElementById('device-list');
            if (grid) {
                const devicesToDisplay = this.showInactiveDevices ? devices : devices.filter(device => device.active);

                if (devicesToDisplay.length === 0) {
                    grid.innerHTML = UI.createEmptyState('tools', 'Keine Geräte', 'Füge dein erstes Gerät hinzu, um Einsätze zu verfolgen.');
                } else {
                    // Pass currentStatsYear to createDeviceCard for year-filtered summaries
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

    // Modified createDeviceCard to accept a yearFilter for its internal summary
    createDeviceCard(device, yearFilter) {
        // Filter operations by year for the summary displayed *within* the card
        const filteredOperations = device.operations?.filter(op =>
            yearFilter === 'all' || new Date(op.date).getFullYear() === yearFilter
        ) || [];

        const operationsCount = filteredOperations.length;
        // Sort operations by date descending to get the last operation for the filtered year
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
                    ${filteredOperations.length > 0 ? `
                    <div class="operations-summary">
                        <div class="operations-count">Einsätze für ${yearFilter}: ${operationsCount}</div>
                        ${filteredOperations.slice(0, 3).map(op => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.9em; color: var(--text-secondary);">
                                <span>${Utils.formatDate(op.date)}</span>
                                ${op.note ? `<span style="flex-grow: 1; margin: 0 8px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${op.note}</span>` : '<span style="flex-grow: 1; margin: 0 8px;"></span>'}
                                <span>${Utils.formatDuration(op.duration)}</span>
                                <button class="btn btn-sm btn-danger delete-operation-btn" data-operation-id="${op.id}" data-type="device" style="padding: 2px 6px; font-size: 0.7em;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                        ${filteredOperations.length > 3 ? '<div style="text-align: right; margin-top: 10px;"><a href="#" class="btn btn-sm btn-outline-primary">Alle anzeigen</a></div>' : ''}
                    </div>` : '<div class="operations-summary"><p>Keine Einsätze für dieses Jahr.</p></div>'}
                </div>
            </div>
        `;
    },

    async renderYearlyDeviceStatistics() {
        const yearlyStatsGrid = document.getElementById('yearly-device-statistics');
        if (!yearlyStatsGrid) return;

        try {
            const devices = await API.getDevices();
            const activeDevices = devices.filter(device => device.active);

            if (activeDevices.length === 0) {
                yearlyStatsGrid.innerHTML = UI.createEmptyState('chart-bar', 'Keine Statistiken verfügbar', 'Füge aktive Geräte und Einsätze hinzu, um Statistiken zu sehen.');
                return;
            }

            yearlyStatsGrid.innerHTML = activeDevices.map(device => {
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


    // No changes needed for createStatisticCard, bindDeviceCardEvents, handleDeviceFormSubmit, submitOperation, deleteDevice, deleteOperation, toggleDeviceActiveStatus, toggleInactiveDeviceVisibility, updateToggleButtonStyle
    // (Rest of the methods from your provided devices.js should be appended here)

    bindDeviceCardEvents() { //
        document.querySelectorAll('.add-operation-btn[data-type="device"]').forEach(button => { //
            button.onclick = (e) => { //
                const deviceId = e.currentTarget.dataset.id; //
                UI.showOperationModal('Einsatz hinzufügen', 'device', deviceId); //
            }; //
        }); //

        document.querySelectorAll('.delete-device-btn').forEach(button => { //
            button.onclick = async (e) => { //
                const deviceId = e.currentTarget.dataset.id; //
                await this.deleteDevice(deviceId); //
            }; //
        }); //

        document.querySelectorAll('.delete-operation-btn[data-type="device"]').forEach(button => { //
            button.onclick = async (e) => { //
                const operationId = e.currentTarget.dataset.operationId; //
                await this.deleteOperation(operationId); //
            }; //
        }); //

        document.querySelectorAll('.toggle-active-btn').forEach(button => { //
            button.onclick = async (e) => { //
                const deviceId = e.currentTarget.dataset.id; //
                const currentActiveStatus = e.currentTarget.dataset.active === 'true'; //
                await this.toggleDeviceActiveStatus(deviceId, !currentActiveStatus); //
            }; //
        }); //
    }, //

    handleDeviceFormSubmit: async function(e) { //
        e.preventDefault(); //
        const formData = new FormData(e.target); //

        try { //
            const device = { //
                name: formData.get('name'), //
                active: true // New devices are active by default
            }; //

            await API.createDevice(device); //
            UI.showToast('Gerät erfolgreich erstellt!', 'success'); //
            UI.hideModal('device-modal'); //
            UI.clearForm('device-form'); //
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) { //
            console.error('Failed to create device:', error); //
        }
    }, //

    submitOperation: async function(formData, type, targetId) { //
        if (type !== 'device') return; //

        const deviceIdAsNumber = parseInt(targetId, 10); //
        if (isNaN(deviceIdAsNumber)) { //
            console.error('Invalid device ID for operation:', targetId); //
            UI.showToast('Fehler: Geräte-ID für Einsatz konnte nicht ermittelt werden.', 'error'); //
            return; // Stop execution
        } //

        try { //
            const operation = { //
                device_id: deviceIdAsNumber, // Add device_id here
                date: formData.get('date'), //
                duration: parseInt(formData.get('duration'), 10), //
                note: formData.get('note') || null //
            }; //
            await API.createDeviceOperation(operation); // Pass the complete operation object
            UI.showToast('Einsatz erfolgreich hinzugefügt!', 'success'); //
            UI.hideModal('operation-modal'); //
            UI.clearForm('operation-form'); //
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) { //
            console.error('Failed to add device operation:', error); //
        }
    }, //

    async deleteDevice(deviceId) { //
        if (!confirm('Bist du sicher, dass du dieses Gerät löschen möchtest? Dies löscht auch alle zugehörigen Einsätze.')) { //
            return; //
        } //

        try { //
            await API.deleteDevice(deviceId); //
            UI.showToast('Gerät erfolgreich gelöscht!', 'success'); //
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) { //
            console.error('Failed to delete device:', error); //
        }
    }, //

    async deleteOperation(operationId) { //
        if (!confirm('Bist du sicher, dass du diesen Einsatz löschen möchtest?')) { //
            return; //
        } //

        try { //
            await API.deleteDeviceOperation(operationId); //
            UI.showToast('Einsatz erfolgreich gelöscht!', 'success'); //
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) { //
            console.error('Failed to delete operation:', error); //
        }
    }, //

    async toggleDeviceActiveStatus(deviceId, newStatus) { //
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren'; //
        if (!confirm(`Bist du sicher, dass du dieses Gerät ${actionText} möchtest?`)) { //
            return; //
        } //

        try { //
            await API.updateDevice(deviceId, { active: newStatus }); //
            UI.showToast(`Gerät erfolgreich ${actionText}!`, 'success'); //
            this.loadInitialData(); // Call loadInitialData to refresh all UI elements
        } catch (error) { //
            console.error(`Failed to ${actionText} device:`, error); //
        }
    }, //

    toggleInactiveDeviceVisibility() { //
        this.showInactiveDevices = !this.showInactiveDevices; //
        this.loadDevices(); //
        this.updateToggleButtonStyle(); //
    }, //

    updateToggleButtonStyle() { //
        const toggleButton = document.getElementById('toggle-inactive-devices-btn'); //
        if (toggleButton) { //
            if (this.showInactiveDevices) { //
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Inaktive ausblenden'; //
                toggleButton.classList.remove('btn-secondary'); //
                toggleButton.classList.add('btn-info'); //
            } else { //
                toggleButton.innerHTML = '<i class="fas fa-eye"></i> Inaktive anzeigen'; //
                toggleButton.classList.remove('btn-info'); //
                toggleButton.classList.add('btn-secondary'); //
            } //
        } //
    } //
};