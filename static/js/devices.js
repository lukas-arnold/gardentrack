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
                    grid.innerHTML = UI.createEmptyState('tools', 'Keine Geräte', 'Füge dein erstes Gerät hinzu, um Einsätze zu verfolgen.');
                } else {
                    grid.innerHTML = devices.map(device => this.createDeviceCard(device)).join('');
                }
                this.bindDeviceCardEvents();
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            const grid = document.getElementById('device-list');
            if (grid) {
                grid.innerHTML = UI.createEmptyState('exclamation-triangle', 'Fehler beim Laden der Geräte', 'Gerätedaten konnten nicht geladen werden.');
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
                            <span class="info-label">Gesamteinsätze</span>
                            <span class="info-value">${operationsCount}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gesamtbetriebszeit</span>
                            <span class="info-value">${Utils.formatDuration(totalDuration)}</span>
                        </div>
                        ${lastOperation ? `
                        <div class="info-item">
                            <span class="info-label">Zuletzt benutzt</span>
                            <span class="info-value">${Utils.formatDate(lastOperation.date)}</span>
                        </div>` : ''}
                    </div>
                    ${device.operations && device.operations.length > 0 ? `
                    <div class="operations-summary">
                        <div class="operations-count">${operationsCount} Operation${operationsCount !== 1 ? 'en' : ''}</div>
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
                UI.showOperationModal('Geräteoperation hinzufügen', 'device', deviceId);
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
            UI.showToast('Gerät erfolgreich erstellt!', 'success');
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
            UI.showToast('Fehler: Geräte-ID für Einsatz konnte nicht ermittelt werden.', 'error');
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
            UI.showToast('Einsatz erfolgreich hinzugefügt!', 'success');
            UI.hideModal('operation-modal');
            UI.clearForm('operation-form');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to add device operation:', error);
        }
    },

    async deleteDevice(deviceId) {
        if (!confirm('Bist du sicher, dass du dieses Gerät löschen möchtest? Dies löscht auch alle zugehörigen Einsätze.')) {
            return;
        }

        try {
            await API.deleteDevice(deviceId);
            UI.showToast('Gerät erfolgreich gelöscht!', 'success');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to delete device:', error);
        }
    },

    async deleteOperation(operationId) {
        if (!confirm('Bist du sicher, dass du diesen Einsatz löschen möchtest?')) {
            return;
        }

        try {
            await API.deleteDeviceOperation(operationId);
            UI.showToast('Einsatz erfolgreich gelöscht!', 'success');
            this.loadDevices();
        } catch (error) {
            console.error('Failed to delete operation:', error);
        }
    }
};