const BottleManager = {
    init() {
        this.bindEvents();
        this.loadBottles();
    },

    bindEvents() {
        // Event listeners for elements that are part of the dynamically loaded content
        document.getElementById('add-bottle-btn')?.addEventListener('click', () => {
            UI.clearForm('bottle-form');
            UI.showModal('bottle-modal');
        });

        // The bottle form is now global (in index.html),
        // so its submit handler can be directly attached in App.js's rebindSharedFormSubmissions.
    },

    async loadBottles() {
        try {
            const bottles = await API.getBottles();
            const grid = document.getElementById('bottle-list');
            if (grid) {
                if (bottles.length === 0) {
                    grid.innerHTML = UI.createEmptyState('gas-pump', 'No Gas Bottles', 'Start by adding your first gas bottle to track usage.');
                } else {
                    grid.innerHTML = bottles.map(bottle => this.createBottleCard(bottle)).join('');
                }
                this.bindBottleCardEvents(); // Re-bind events for newly rendered cards
            }
        } catch (error) {
            console.error('Failed to load bottles:', error);
            const grid = document.getElementById('bottle-list');
            if (grid) {
                grid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Error Loading Bottles', 'Failed to load bottle data.');
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
            <div class="card" data-bottle-id="${bottle.id}">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-fire"></i>
                        Gas Bottle #${bottle.id}
                    </h3>
                    <div class="card-actions">
                        <span class="status-badge ${bottle.active ? 'status-active' : 'status-inactive'}">
                            <i class="fas fa-circle" style="font-size: 0.6em;"></i>
                            ${bottle.active ? 'Active' : 'Inactive'}
                        </span>
                        <button class="btn btn-sm btn-primary add-operation-btn" data-id="${bottle.id}" data-type="bottle">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-bottle-btn" data-id="${bottle.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Purchase Date</span>
                            <span class="info-value">${Utils.formatDate(bottle.purchase_date)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Purchase Price</span>
                            <span class="info-value">${Utils.formatCurrency(bottle.purchase_price)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Current Weight</span>
                            <span class="info-value">${Utils.formatWeight(currentWeight)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gas Remaining</span>
                            <span class="info-value">${remainingPercentage}%</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gas Used</span>
                            <span class="info-value">${Utils.formatWeight(usedGas)}</span>
                        </div>
                    </div>
                    ${bottle.operations && bottle.operations.length > 0 ? `
                    <div class="operations-summary">
                        <div class="operations-count">${operationsCount} measurement${operationsCount !== 1 ? 's' : ''}</div>
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
                UI.showOperationModal('Add Weight Measurement', 'bottle', bottleId);
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
    },

    // Form submission handler for bottle creation (now global)
    handleBottleFormSubmit: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const bottle = {
                purchase_date: formData.get('purchase_date'),
                purchase_price: parseFloat(formData.get('purchase_price')),
                initial_weight: parseFloat(formData.get('initial_weight')),
                filling_weight: parseFloat(formData.get('filling_weight')),
                active: formData.get('active') === 'on'
            };

            await API.createBottle(bottle);
            UI.showToast('Gas bottle created successfully!', 'success');
            UI.hideModal('bottle-modal');
            UI.clearForm('bottle-form');
            BottleManager.loadBottles(); // Use BottleManager.loadBottles()
        } catch (error) {
            console.error('Failed to create bottle:', error);
        }
    },

    // Form submission handler for operations (delegated from App.js)
    submitOperation: async function(formData, targetId) {
        try {
            const operation = {
                date: formData.get('date'),
                weight: parseFloat(formData.get('weight')),
                note: formData.get('note') || null
            };
            await API.createBottleOperation(parseInt(targetId), operation);
            UI.showToast('Weight measurement added successfully!', 'success');
            UI.hideModal('operation-modal');
            UI.clearForm('operation-form');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to add bottle operation:', error);
        }
    },

    async deleteBottle(bottleId) {
        if (!confirm('Are you sure you want to delete this gas bottle? This will also delete all its measurements.')) {
            return;
        }

        try {
            await API.deleteBottle(bottleId);
            UI.showToast('Gas bottle deleted successfully!', 'success');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to delete bottle:', error);
        }
    },

    async deleteOperation(operationId) {
        if (!confirm('Are you sure you want to delete this measurement?')) {
            return;
        }

        try {
            await API.deleteBottleOperation(operationId);
            UI.showToast('Measurement deleted successfully!', 'success');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to delete measurement:', error);
        }
    }
};