const DeviceManager = {
    async loadDevices() {
        try {
            const devices = await API.getDevices();
            this.renderDevices(devices);
        } catch (error) {
            console.error('Failed to load devices:', error);
            this.renderDevices([]);
        }
    },

    renderDevices(devices) {
        const grid = document.getElementById('devices-grid');
        
        if (devices.length === 0) {
            grid.innerHTML = UI.createEmptyState('tools', 'No Devices', 'Start by adding your first device to track operations.');
            return;
        }

        grid.innerHTML = devices.map(device => this.createDeviceCard(device)).join('');
    },

    createDeviceCard(device) {
        const operationsCount = device.operations?.length || 0;
        const lastOperation = device.operations?.[0];
        const totalDuration = device.operations?.reduce((sum, op) => sum + op.duration, 0) || 0;

        return `
            <div class="card" data-device-id="${device.id}">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-wrench"></i>
                        ${device.name}
                    </h3>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-primary" onclick="DeviceManager.addOperation(${device.id})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="DeviceManager.deleteDevice(${device.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Total Operations</span>
                            <span class="info-value">${operationsCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Runtime</span>
                            <span class="info-value">${Utils.formatDuration(totalDuration)}</span>
                        </div>
                        ${lastOperation ? `
                        <div class="info-item">
                            <span class="info-label">Last Used</span>
                            <span class="info-value">${Utils.formatDate(lastOperation.date)}</span>
                        </div>` : ''}
                    </div>
                    ${device.operations && device.operations.length > 0 ? `
                    <div class="operations-summary">
                        <div class="operations-count">${operationsCount} operation${operationsCount !== 1 ? 's' : ''}</div>
                        ${device.operations.slice(0, 3).map(op => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.9em; color: var(--text-secondary);">
                                <span>${Utils.formatDate(op.date)}</span>
                                <span>${Utils.formatDuration(op.duration)}</span>
                                <button class="btn btn-sm btn-danger" onclick="DeviceManager.deleteOperation(${op.id})" style="padding: 2px 6px; font-size: 0.7em;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>` : ''}
                </div>
            </div>
        `;
    },

    async addOperation(deviceId) {
        const modal = document.getElementById('operation-modal');
        const form = document.getElementById('operation-form');
        const title = document.getElementById('operation-modal-title');
        
        title.textContent = 'Add Device Operation';
        
        // Show device operation fields
        document.getElementById('duration-group').style.display = 'block';
        document.getElementById('weight-group').style.display = 'none';
        document.getElementById('note-group').style.display = 'block';
        
        // Set today's date as default
        document.getElementById('operation-date').value = new Date().toISOString().split('T')[0];
        
        // Store device ID for form submission
        form.dataset.deviceId = deviceId;
        form.dataset.type = 'device';
        
        UI.showModal('operation-modal');
    },

    async submitOperation(formData) {
        try {
            const operation = {
                date: formData.get('date'),
                duration: parseInt(formData.get('duration')),
                note: formData.get('note') || null
            };

            await API.createDeviceOperation(parseInt(formData.get('deviceId')), operation);
            UI.showToast('Operation added successfully!', 'success');
            UI.hideModal('operation-modal');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to add operation:', error);
        }
    },

    async deleteDevice(deviceId) {
        if (!confirm('Are you sure you want to delete this device? This will also delete all its operations.')) {
            return;
        }

        try {
            await API.deleteDevice(deviceId);
            UI.showToast('Device deleted successfully!', 'success');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to delete device:', error);
        }
    },

    async deleteOperation(operationId) {
        if (!confirm('Are you sure you want to delete this operation?')) {
            return;
        }

        try {
            await API.deleteDeviceOperation(operationId);
            UI.showToast('Operation deleted successfully!', 'success');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to delete operation:', error);
        }
    }
};