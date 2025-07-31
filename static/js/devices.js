const DeviceManager = {
    init() {
        this.bindEvents();
        this.loadDevices();
    },

    bindEvents() {
        document.getElementById('add-device-btn')?.addEventListener('click', () => {
            UI.clearForm('device-form');
            UI.showModal('device-modal');
        });
    },

    async loadDevices() {
        try {
            const devices = await API.getDevices();
            const grid = document.getElementById('device-list');
            if (grid) {
                if (devices.length === 0) {
                    grid.innerHTML = UI.createEmptyState('tools', 'No Devices', 'Start by adding your first device to track operations.');
                } else {
                    grid.innerHTML = devices.map(device => this.createDeviceCard(device)).join('');
                }
                this.bindDeviceCardEvents();
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            const grid = document.getElementById('device-list');
            if (grid) {
                grid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Error Loading Devices', 'Failed to load device data.');
            }
        }
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
                        <button class="btn btn-sm btn-primary add-operation-btn" data-id="${device.id}" data-type="device">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-device-btn" data-id="${device.id}">
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
                                <button class="btn btn-sm btn-danger delete-operation-btn" data-operation-id="${op.id}" data-type="device" style="padding: 2px 6px; font-size: 0.7em;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>` : ''}
                </div>
            </div>
        `;
    },

    bindDeviceCardEvents() {
        document.querySelectorAll('.add-operation-btn[data-type="device"]').forEach(button => {
            button.onclick = (e) => {
                const deviceId = e.currentTarget.dataset.id;
                UI.showOperationModal('Add Device Operation', 'device', deviceId);
            };
        });

        document.querySelectorAll('.delete-device-btn').forEach(button => {
            button.onclick = async (e) => {
                const deviceId = e.currentTarget.dataset.id;
                await this.deleteDevice(deviceId);
            };
        });

        document.querySelectorAll('.delete-operation-btn[data-type="device"]').forEach(button => {
            button.onclick = async (e) => {
                const operationId = e.currentTarget.dataset.operationId;
                await this.deleteOperation(operationId);
            };
        });
    },

    handleDeviceFormSubmit: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const device = {
                name: formData.get('name')
            };

            await API.createDevice(device);
            UI.showToast('Device created successfully!', 'success');
            UI.hideModal('device-modal');
            UI.clearForm('device-form');
            DeviceManager.loadDevices();
        } catch (error) {
            console.error('Failed to create device:', error);
        }
    },

    submitOperation: async function(formData, type, targetId) {
        if (type !== 'device') return;

        const deviceIdAsNumber = parseInt(targetId, 10);
        if (isNaN(deviceIdAsNumber)) {
            console.error('Invalid device ID for operation:', targetId);
            UI.showToast('Error: Could not determine device ID for operation.', 'error');
            return; // Stop execution
        }

        try {
            const operation = {
                device_id: deviceIdAsNumber, // Add device_id here
                date: formData.get('date'),
                duration: parseInt(formData.get('duration')),
                note: formData.get('note') || null
            };
            await API.createDeviceOperation(operation); // Pass the complete operation object
            UI.showToast('Operation added successfully!', 'success');
            UI.hideModal('operation-modal');
            UI.clearForm('operation-form');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to add device operation:', error);
        }
    },

    async deleteDevice(deviceId) {
        if (!confirm('Are you sure you want to delete this device? This will also delete all its operations.')) {
            return;
        }

        try {
            await API.deleteDevice(deviceId);
            UI.showToast('Device deleted successfully!', 'success');
            this.loadDevices(); // <<< RELOAD DEVICES AFTER DELETION
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
            this.loadDevices(); // <<< RELOAD DEVICES AFTER DELETION
        } catch (error) {
            console.error('Failed to delete operation:', error);
        }
    }
};