const App = {
    currentTab: 'devices',

    init() {
        this.bindEvents();
        this.loadCurrentTab();
    },

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Device modal events
        document.getElementById('add-device-btn').addEventListener('click', () => {
            UI.clearForm('device-form');
            UI.showModal('device-modal');
        });

        document.getElementById('device-modal-close').addEventListener('click', () => {
            UI.hideModal('device-modal');
        });

        document.getElementById('device-cancel-btn').addEventListener('click', () => {
            UI.hideModal('device-modal');
        });

        document.getElementById('device-form').addEventListener('submit', async (e) => {
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
                
                if (this.currentTab === 'devices') {
                    DeviceManager.loadDevices();
                }
            } catch (error) {
                console.error('Failed to create device:', error);
            }
        });

        // Bottle modal events
        document.getElementById('add-bottle-btn').addEventListener('click', () => {
            UI.clearForm('bottle-form');
            UI.showModal('bottle-modal');
        });

        document.getElementById('bottle-modal-close').addEventListener('click', () => {
            UI.hideModal('bottle-modal');
        });

        document.getElementById('bottle-cancel-btn').addEventListener('click', () => {
            UI.hideModal('bottle-modal');
        });

        document.getElementById('bottle-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const bottle = {
                    purchase_date: formData.get('purchase_date'),
                    purchpase_price: parseFloat(formData.get('purchase_price')),
                    initial_weight: parseFloat(formData.get('initial_weight')),
                    filling_weight: parseFloat(formData.get('filling_weight')),
                    active: formData.get('active') === 'on'
                };

                await API.createBottle(bottle);
                UI.showToast('Gas bottle created successfully!', 'success');
                UI.hideModal('bottle-modal');
                UI.clearForm('bottle-form');
                
                if (this.currentTab === 'bottles') {
                    BottleManager.loadBottles();
                }
            } catch (error) {
                console.error('Failed to create bottle:', error);
            }
        });

        // Operation modal events
        document.getElementById('operation-modal-close').addEventListener('click', () => {
            UI.hideModal('operation-modal');
        });

        document.getElementById('operation-cancel-btn').addEventListener('click', () => {
            UI.hideModal('operation-modal');
        });

        document.getElementById('operation-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const type = e.target.dataset.type;
            
            if (type === 'device') {
                formData.append('deviceId', e.target.dataset.deviceId);
                await DeviceManager.submitOperation(formData);
            } else if (type === 'bottle') {
                formData.append('bottleId', e.target.dataset.bottleId);
                await BottleManager.submitOperation(formData);
            }
            
            UI.clearForm('operation-form');
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UI.hideModal(modal.id);
                }
            });
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    UI.hideModal(modal.id);
                });
            }
        });
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        UI.switchTab(tabName);
        this.loadCurrentTab();
    },

    loadCurrentTab() {
        if (this.currentTab === 'devices') {
            DeviceManager.loadDevices();
        } else if (this.currentTab === 'bottles') {
            BottleManager.loadBottles();
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});