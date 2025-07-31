const DeviceManager = {
    init() {
        this.showInactiveDevices = false; // New state to track visibility of inactive devices
        this.bindEvents();
        this.loadDevices();
    },

    bindEvents() {
        document.getElementById('add-device-btn')?.addEventListener('click', () => {
            UI.clearForm('device-form');
            UI.showModal('device-modal');
        });

        document.getElementById('toggle-inactive-devices-btn')?.addEventListener('click', () => {
            this.toggleInactiveDeviceVisibility();
        });
    },

    async loadDevices() {
        try {
            const devices = await API.getDevices();
            const grid = document.getElementById('device-list');
            if (grid) {
                // Filter devices based on showInactiveDevices state
                const devicesToDisplay = this.showInactiveDevices ? devices : devices.filter(device => device.active);

                if (devicesToDisplay.length === 0) {
                    grid.innerHTML = UI.createEmptyState('tools', 'Keine Geräte', 'Füge dein erstes Gerät hinzu, um Einsätze zu verfolgen.');
                } else {
                    grid.innerHTML = devicesToDisplay.map(device => this.createDeviceCard(device)).join('');
                }
                this.bindDeviceCardEvents();
                this.updateToggleButtonStyle(); // Update button style on load
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
                UI.showOperationModal('Einsatz hinzufügen', 'device', deviceId);
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

        document.querySelectorAll('.toggle-active-btn').forEach(button => {
            button.onclick = async (e) => {
                const deviceId = e.currentTarget.dataset.id;
                const currentActiveStatus = e.currentTarget.dataset.active === 'true';
                await this.toggleDeviceActiveStatus(deviceId, !currentActiveStatus);
            };
        });
    },

    handleDeviceFormSubmit: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const device = {
                name: formData.get('name'),
                active: true // New devices are active by default
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
                duration: parseInt(formData.get('duration'), 10),
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
    },

    async toggleDeviceActiveStatus(deviceId, newStatus) {
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren';
        if (!confirm(`Bist du sicher, dass du dieses Gerät ${actionText} möchtest?`)) {
            return;
        }

        try {
            await API.updateDevice(deviceId, { active: newStatus });
            UI.showToast(`Gerät erfolgreich ${actionText}!`, 'success');
            this.loadDevices();
        } catch (error) {
            console.error(`Failed to ${actionText} device:`, error);
        }
    },

    toggleInactiveDeviceVisibility() {
        this.showInactiveDevices = !this.showInactiveDevices;
        this.loadDevices();
        this.updateToggleButtonStyle();
    },

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