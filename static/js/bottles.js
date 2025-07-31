const BottleManager = {
    async loadBottles() {
        try {
            const bottles = await API.getBottles();
            this.renderBottles(bottles);
        } catch (error) {
            console.error('Failed to load bottles:', error);
            this.renderBottles([]);
        }
    },

    renderBottles(bottles) {
        const grid = document.getElementById('bottles-grid');
        
        if (bottles.length === 0) {
            grid.innerHTML = UI.createEmptyState('gas-pump', 'No Gas Bottles', 'Start by adding your first gas bottle to track usage.');
            return;
        }

        grid.innerHTML = bottles.map(bottle => this.createBottleCard(bottle)).join('');
    },

    createBottleCard(bottle) {
        const operationsCount = bottle.operations?.length || 0;
        const lastOperation = bottle.operations?.[0];
        const currentWeight = lastOperation?.weight || bottle.initial_weight;
        const usedGas = bottle.initial_weight - currentWeight;
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
                        <button class="btn btn-sm btn-primary" onclick="BottleManager.addOperation(${bottle.id})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="BottleManager.deleteBottle(${bottle.id})">
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
                            <span class="info-value">${Utils.formatCurrency(bottle.purchpase_price)}</span>
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
                                <button class="btn btn-sm btn-danger" onclick="BottleManager.deleteOperation(${op.id})" style="padding: 2px 6px; font-size: 0.7em;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>` : ''}
                </div>
            </div>
        `;
    },

    async addOperation(bottleId) {
        const modal = document.getElementById('operation-modal');
        const form = document.getElementById('operation-form');
        const title = document.getElementById('operation-modal-title');
        
        title.textContent = 'Add Weight Measurement';
        
        // Show bottle operation fields
        document.getElementById('duration-group').style.display = 'none';
        document.getElementById('weight-group').style.display = 'block';
        document.getElementById('note-group').style.display = 'none';
        
        // Set today's date as default
        document.getElementById('operation-date').value = new Date().toISOString().split('T')[0];
        
        // Store bottle ID for form submission
        form.dataset.bottleId = bottleId;
        form.dataset.type = 'bottle';
        
        UI.showModal('operation-modal');
    },

    async submitOperation(formData) {
        try {
            const operation = {
                date: formData.get('date'),
                weight: parseFloat(formData.get('weight'))
            };

            await API.createBottleOperation(parseInt(formData.get('bottleId')), operation);
            UI.showToast('Weight measurement added successfully!', 'success');
            UI.hideModal('operation-modal');
            this.loadBottles();
        } catch (error) {
            console.error('Failed to add measurement:', error);
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