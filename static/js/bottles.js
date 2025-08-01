import { BottleAPI } from "./api.js"
import { UI } from "./ui.js"
import { Utils } from "./utils.js"

export const BottleManager = {
    init() {
        this.showInactiveBottles = false;
        this.currentChart = null; // For the consumption chart
        this.historyChart = null; // New: To store the history Chart.js instance
        this.bindEvents();
        this.loadBottles();
    },

    bindEvents() {
        document.getElementById('add-bottle-btn')?.addEventListener('click', () => {
            UI.clearForm('bottle-form');
            UI.showModal('bottle-modal');
        });

        document.getElementById('toggle-inactive-bottles-btn')?.addEventListener('click', () => {
            this.toggleInactiveBottleVisibility();
        });
    },

    async loadBottles() {
        try {
            const bottles = await BottleAPI.getBottles();
            const grid = document.getElementById('bottle-list');
            if (grid) {
                const bottlesToDisplay = this.showInactiveBottles ? bottles : bottles.filter(bottle => bottle.active);

                if (bottlesToDisplay.length === 0) {
                    grid.innerHTML = UI.createEmptyState('gas-pump', 'Keine Gasflaschen', 'Füge deine erste Gasflasche hinzu, um den Verbrauch zu verfolgen.');
                    if (this.currentChart) {
                        this.currentChart.destroy();
                        this.currentChart = null;
                    }
                    if (this.historyChart) { // Destroy history chart as well
                        this.historyChart.destroy();
                        this.historyChart = null;
                    }
                } else {
                    grid.innerHTML = bottlesToDisplay.map(bottle => this.createBottleCard(bottle)).join('');

                    const activeBottlesForChart = bottlesToDisplay.filter(b => b.active).map(bottle => {
                        const lastOperation = bottle.operations ? [...bottle.operations].sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
                        const currentWeight = lastOperation?.weight !== undefined ? lastOperation.weight : bottle.initial_weight;
                        const bottleWeight = bottle.initial_weight - bottle.filling_weight;
                        const remainingPercentage = bottleWeight > 0 ? (((currentWeight - bottle.filling_weight) / bottleWeight) * 100) : 0;
                        return {
                            id: bottle.id,
                            percentage: parseFloat(remainingPercentage.toFixed(1))
                        };
                    });
                    this.updateConsumptionChart(activeBottlesForChart);

                    // New: Prepare data and update history chart for active bottles
                    const activeBottlesWithHistory = bottlesToDisplay.filter(b => b.active);
                    this.updateBottleHistoryChart(activeBottlesWithHistory);
                }
                this.bindBottleCardEvents();
                this.updateToggleButtonStyle();
            }
        } catch (error) {
            console.error('Failed to load bottles:', error);
            const grid = document.getElementById('bottle-list');
            if (grid) {
                grid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Gasflaschen', 'Gasflaschendaten konnten nicht geladen werden.');
            }
            if (this.currentChart) {
                this.currentChart.destroy();
                this.currentChart = null;
            }
            if (this.historyChart) { // Destroy history chart on error
                this.historyChart.destroy();
                this.historyChart = null;
            }
        }
    },

    createBottleCard(bottle) {
        // ... (existing createBottleCard code) ...
        const operationsCount = bottle.operations?.length || 0;
        const sortedOperations = bottle.operations ? [...bottle.operations].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
        const lastOperation = sortedOperations[0];
        const currentWeight = lastOperation?.weight !== undefined ? lastOperation.weight : bottle.initial_weight;

        const bottleWeight = bottle.initial_weight - bottle.filling_weight;
        const totalUsedGas = (bottle.initial_weight - currentWeight).toFixed(1);
        const remainingGasKg = (currentWeight - bottle.filling_weight).toFixed(1);

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
                    ${operationsCount > 0 ? `
                    <div class="operations-summary">
                        <div class="operations-count">${operationsCount} Messung${operationsCount !== 1 ? 'en' : ''}</div>
                        ${sortedOperations.slice(0, 3).map((op, index) => {
                            let usedGasForOperation = 0;
                            if (index < sortedOperations.length - 1) {
                                const previousOperation = sortedOperations[index + 1];
                                usedGasForOperation = (previousOperation.weight - op.weight).toFixed(1);
                            } else if (index === sortedOperations.length - 1 && bottle.operations.length > 1) {
                                usedGasForOperation = (bottle.initial_weight - op.weight).toFixed(1);
                            } else if (bottle.operations.length === 1) {
                                usedGasForOperation = (bottle.initial_weight - op.weight).toFixed(1);
                            }

                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.9em; color: var(--text-secondary);">
                                    <span>${Utils.formatDate(op.date)}</span>
                                    <span>${Utils.formatWeight(op.weight)}</span>
                                    ${usedGasForOperation > 0 ? `<span class="used-gas-indicator">-${Utils.formatWeight(usedGasForOperation)}</span>` : ''}
                                    <button class="btn btn-sm btn-danger delete-operation-btn" data-operation-id="${op.id}" data-type="bottle" style="padding: 2px 6px; font-size: 0.7em;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                        ${operationsCount > 3 ? `<div class="text-center mt-2"><button class="btn btn-sm btn-outline-secondary view-all-operations-btn" data-bottle-id="${bottle.id}">Alle Messungen anzeigen</button></div>` : ''}
                    </div>` : ''}
                </div>
            </div>
        `;
    },

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

    handleBottleFormSubmit: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const bottle = {
                purchase_date: formData.get('purchase_date'),
                purchase_price: parseFloat(formData.get('purchase_price')),
                initial_weight: parseFloat(formData.get('initial_weight')),
                filling_weight: parseFloat(formData.get('filling_weight')),
                active: true
            };

            await BottleAPI.createBottle(bottle);
            UI.showToast('Gasflasche erfolgreich erstellt!', 'success');
            UI.hideModal('bottle-modal');
            UI.clearForm('bottle-form');
            BottleManager.loadBottles();
        } catch (error) {
            console.error('Failed to create bottle:', error);
            UI.showToast('Fehler beim Erstellen der Gasflasche.', 'error');
        }
    },

    submitOperation: async function(formData, type, targetId) {
        if (type !== 'bottle') return;

        const bottleIdAsNumber = parseInt(targetId, 10);
        if (isNaN(bottleIdAsNumber)) {
            console.error('Invalid bottle ID for operation:', targetId);
            UI.showToast('Fehler: Flaschen-ID für Messung konnte nicht ermittelt werden.', 'error');
            return;
        }

        try {
            const operation = {
                bottle_id: bottleIdAsNumber,
                date: formData.get('date'),
                weight: parseFloat(formData.get('weight')),
                note: formData.get('note') || null
            };
            await BottleAPI.createBottleOperation(operation);
            UI.showToast('Gewichtsmessung erfolgreich hinzugefügt!', 'success');
            UI.hideModal('operation-modal');
            UI.clearForm('operation-form');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to add bottle operation:', error);
            UI.showToast('Fehler beim Hinzufügen der Gewichtsmessung.', 'error');
        }
    },

    async deleteBottle(bottleId) {
        if (!confirm('Bist du sicher, dass du diese Gasflasche löschen möchtest? Dies löscht auch alle zugehörigen Messungen.')) {
            return;
        }

        try {
            await BottleAPI.deleteBottle(bottleId);
            UI.showToast('Gasflasche erfolgreich gelöscht!', 'success');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to delete bottle:', error);
            UI.showToast('Fehler beim Löschen der Gasflasche.', 'error');
        }
    },

    async deleteOperation(operationId) {
        if (!confirm('Bist du sicher, dass du diese Messung löschen möchtest?')) {
            return;
        }

        try {
            await BottleAPI.deleteBottleOperation(operationId);
            UI.showToast('Messung erfolgreich gelöscht!', 'success');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to delete measurement:', error);
            UI.showToast('Fehler beim Löschen der Messung.', 'error');
        }
    },

    async toggleBottleActiveStatus(bottleId, newStatus) {
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren';
        if (!confirm(`Bist du sicher, dass du diese Gasflasche ${actionText} möchtest?`)) {
            return;
        }

        try {
            await BottleAPI.updateBottle(bottleId, { active: newStatus });
            UI.showToast(`Gasflasche erfolgreich ${actionText}!`, 'success');
            this.loadBottles();
        } catch (error) {
            console.error(`Failed to ${actionText} bottle:`, error);
            UI.showToast(`Fehler beim ${actionText} der Gasflasche.`, 'error');
        }
    },

    toggleInactiveBottleVisibility() {
        this.showInactiveBottles = !this.showInactiveBottles;
        this.loadBottles();
        this.updateToggleButtonStyle();
    },

    updateToggleButtonStyle() {
        const toggleButton = document.getElementById('toggle-inactive-bottles-btn');
        if (toggleButton) {
            if (this.showInactiveBottles) {
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

    updateConsumptionChart(bottles) {
        const ctx = document.getElementById('consumption-chart')?.getContext('2d');

        if (!ctx) {
            console.warn("Chart canvas element 'consumption-chart' not found.");
            return;
        }

        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const labels = bottles.map(bottle => `Flasche #${bottle.id}`);
        const data = bottles.map(bottle => bottle.percentage);
        const backgroundColors = bottles.map(bottle => {
            if (bottle.percentage >= 50) return 'rgba(46, 204, 113, 0.8)';
            if (bottle.percentage >= 20) return 'rgba(243, 156, 18, 0.8)';
            return 'rgba(231, 76, 60, 0.8)';
        });

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Füllstand (%)',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    updateBottleHistoryChart(activeBottles) {
        const ctx = document.getElementById('bottle-history-chart')?.getContext('2d'); // Assuming you have a canvas with this ID

        if (!ctx) {
            console.warn("Chart canvas element 'bottle-history-chart' not found. Please add a canvas element with id='bottle-history-chart' to your HTML.");
            return;
        }

        if (this.historyChart) {
            this.historyChart.destroy();
        }

        const datasets = activeBottles.map(bottle => {
            // Sort operations by date in ascending order for the line chart
            const sortedOperations = bottle.operations ? [...bottle.operations].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];

            // Include initial weight as the first data point if there are operations
            const dataPoints = [];
            if (bottle.operations && bottle.operations.length > 0) {
                // Add the initial weight as the starting point (date can be purchase date or first operation date)
                dataPoints.push({
                    x: Utils.formatDate(bottle.purchase_date), // Use purchase date as initial point
                    y: bottle.initial_weight
                });
            } else {
                // If no operations, just show initial weight (or nothing if you prefer)
                dataPoints.push({
                    x: Utils.formatDate(bottle.purchase_date),
                    y: bottle.initial_weight
                });
            }


            sortedOperations.forEach(op => {
                dataPoints.push({
                    x: Utils.formatDate(op.date),
                    y: op.weight
                });
            });


            return {
                label: `Flasche #${bottle.id}`,
                data: dataPoints,
                borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color for each bottle
                fill: false,
                tension: 0.1
            };
        });

        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Verlauf des Flaschengewichts (Aktive Flaschen)'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += Utils.formatWeight(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category', // Use 'category' for discrete date labels
                        labels: datasets.flatMap(dataset => dataset.data.map(point => point.x)).filter((value, index, self) => self.indexOf(value) === index).sort(), // Collect all unique dates and sort them
                        title: {
                            display: true,
                            text: 'Datum'
                        }
                    },
                    y: {
                        beginAtZero: false, // Weight might not start at zero
                        title: {
                            display: true,
                            text: 'Gewicht (kg)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatWeight(value);
                            }
                        }
                    }
                }
            }
        });
    }
};