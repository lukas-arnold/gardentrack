const BottleManager = {
    init() {
        this.showInactiveBottles = false; // New state to track visibility of inactive bottles
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
            const bottles = await API.getBottles();
            const grid = document.getElementById('bottle-list');
            if (grid) {
                // Filter bottles based on showInactiveBottles state
                const bottlesToDisplay = this.showInactiveBottles ? bottles : bottles.filter(bottle => bottle.active);

                if (bottlesToDisplay.length === 0) {
                    grid.innerHTML = UI.createEmptyState('gas-pump', 'Keine Gasflaschen', 'Füge deine erste Gasflasche hinzu, um den Verbrauch zu verfolgen.');
                } else {
                    grid.innerHTML = bottlesToDisplay.map(bottle => this.createBottleCard(bottle)).join('');
                }
                this.bindBottleCardEvents();
                this.updateToggleButtonStyle(); // Update button style on load
            }
        } catch (error) {
            console.error('Failed to load bottles:', error);
            const grid = document.getElementById('bottle-list');
            if (grid) {
                grid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Gasflaschen', 'Gasflaschendaten konnten nicht geladen werden.');
            }
        }
    },

    createBottleCard(bottle) {
        const operationsCount = bottle.operations?.length || 0;
        const lastOperation = bottle.operations?.[0];
        const currentWeight = lastOperation?.weight !== undefined ? lastOperation.weight : bottle.initial_weight;
        const usedGas = (bottle.initial_weight - currentWeight).toFixed(1);
        const remainingPercentage = ((currentWeight - (bottle.initial_weight - bottle.filling_weight)) / bottle.filling_weight * 100).toFixed(1);

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
                            <span class="info-label">Aktuelles Gewicht</span>
                            <span class="info-value">${Utils.formatWeight(currentWeight)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Restliches Gas</span>
                            <span class="info-value">${remainingPercentage}%</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Verbrauchtes Gas</span>
                            <span class="info-value">${Utils.formatWeight(usedGas)}</span>
                        </div>
                    </div>
                    ${bottle.operations && bottle.operations.length > 0 ? `
                    <div class="operations-summary">
                        <div class="operations-count">${operationsCount} Messung${operationsCount !== 1 ? 'en' : ''}</div>
                        ${bottle.operations.slice(0, 3).map(op => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.9em; color: var(--text-secondary);">
                                <span>${Utils.formatDate(op.date)}</span>
                                <span>${Utils.formatWeight(op.weight)}</span>
                                <button class="btn btn-sm btn-danger delete-operation-btn" data-operation-id="${op.id}" data-type="bottle" style="padding: 2px 6px; font-size: 0.7em;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
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
                active: true // New bottles are active by default
            };

            await API.createBottle(bottle);
            UI.showToast('Gasflasche erfolgreich erstellt!', 'success');
            UI.hideModal('bottle-modal');
            UI.clearForm('bottle-form');
            BottleManager.loadBottles();
        } catch (error) {
            console.error('Failed to create bottle:', error);
        }
    },

    submitOperation: async function(formData, type, targetId) {
        if (type !== 'bottle') return;

        const bottleIdAsNumber = parseInt(targetId, 10);
        if (isNaN(bottleIdAsNumber)) {
            console.error('Invalid bottle ID for operation:', targetId);
            UI.showToast('Fehler: Flaschen-ID für Messung konnte nicht ermittelt werden.', 'error');
            return; // Stop execution
        }

        try {
            const operation = {
                bottle_id: bottleIdAsNumber, // Add bottle_id here
                date: formData.get('date'),
                weight: parseFloat(formData.get('weight')),
                note: formData.get('note') || null
            };
            await API.createBottleOperation(operation); // Pass the complete operation object
            UI.showToast('Gewichtsmessung erfolgreich hinzugefügt!', 'success');
            UI.hideModal('operation-modal');
            UI.clearForm('operation-form');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to add bottle operation:', error);
        }
    },

    async deleteBottle(bottleId) {
        if (!confirm('Bist du sicher, dass du diese Gasflasche löschen möchtest? Dies löscht auch alle zugehörigen Messungen.')) {
            return;
        }

        try {
            await API.deleteBottle(bottleId);
            UI.showToast('Gasflasche erfolgreich gelöscht!', 'success');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to delete bottle:', error);
        }
    },

    async deleteOperation(operationId) {
        if (!confirm('Bist du sicher, dass du diese Messung löschen möchtest?')) {
            return;
        }

        try {
            await API.deleteBottleOperation(operationId);
            UI.showToast('Messung erfolgreich gelöscht!', 'success');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to delete measurement:', error);
        }
    },

    async toggleBottleActiveStatus(bottleId, newStatus) {
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren';
        if (!confirm(`Bist du sicher, dass du diese Gasflasche ${actionText} möchtest?`)) {
            return;
        }

        try {
            await API.updateBottle(bottleId, { active: newStatus });
            UI.showToast(`Gasflasche erfolgreich ${actionText}!`, 'success');
            this.loadBottles();
        } catch (error) {
            console.error(`Failed to ${actionText} bottle:`, error);
        }
    },

    toggleInactiveBottleVisibility() {
        this.showInactiveBottles = !this.showInactiveBottles;
        this.loadBottles(); // Reload bottles to apply the filter
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
    }
};