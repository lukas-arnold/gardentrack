import { DeviceManager } from "./devices.js";
import { BottleManager } from "./bottles.js";
import { UI } from "./ui.js"

let currentManager = null; // To keep track of the currently active manager

const App = {
    init() {
        this.bindGlobalEvents();
        this.bindNavigationEvents();
        // Load devices.html content by default on startup
        this.loadContent('devices');
    },

    bindGlobalEvents() {
        // Operation modal events (these are common to both pages)
        document.getElementById('operation-modal-close')?.addEventListener('click', () => {
            UI.hideModal('operation-modal');
        });

        document.getElementById('operation-cancel-btn')?.addEventListener('click', () => {
            UI.hideModal('operation-modal');
        });

        // Device modal events (these are global now)
        document.getElementById('device-modal-close')?.addEventListener('click', () => {
            UI.hideModal('device-modal');
        });

        document.getElementById('device-cancel-btn')?.addEventListener('click', () => {
            UI.hideModal('device-modal');
        });

        // Bottle modal events (these are global now)
        document.getElementById('bottle-modal-close')?.addEventListener('click', () => {
            UI.hideModal('bottle-modal');
        });

        document.getElementById('bottle-cancel-btn')?.addEventListener('click', () => {
            UI.hideModal('bottle-modal');
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

        // Bind the global form submission handlers once
        this.rebindSharedFormSubmissions();
    },

    bindNavigationEvents() {
        document.querySelectorAll('.nav-tab-home').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                this.loadContent("devices");
                this.setActiveTab("devices");
            });
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                const tabType = e.currentTarget.dataset.tab;
                this.loadContent(tabType);
                this.setActiveTab(tabType);
            });
        });
    },

    async loadContent(tabType) {
        UI.showLoading(true);
        const contentArea = document.getElementById('content-area');
        
        try {
            const response = await fetch(`static/${tabType}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load static/${tabType}.html`);
            }
            const htmlContent = await response.text();
            contentArea.innerHTML = htmlContent;

            // Initialize the correct manager after content is loaded
            if (tabType === 'devices') {
                currentManager = DeviceManager;
                DeviceManager.init(); // Initialize or re-initialize devices functionality
            } else if (tabType === 'bottles') {
                currentManager = BottleManager;
                BottleManager.init(); // Initialize or re-initialize bottles functionality
            }

        } catch (error) {
            console.error('Error loading content:', error);
            UI.showToast(`Could not load ${tabType} content.`, 'error');
            contentArea.innerHTML = UI.createEmptyState('exclamation-triangle', 'Content Not Available', 'There was an error loading the requested section.');
        } finally {
            UI.showLoading(false);
        }
    },

    setActiveTab(tabType) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab === tabType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    rebindSharedFormSubmissions() {
        const deviceForm = document.getElementById('device-form');
        const bottleForm = document.getElementById('bottle-form');
        const operationForm = document.getElementById('operation-form');

        // It's safer to remove and re-add listeners to prevent multiple bindings
        // if this function were called multiple times (though in this SPA, it's once at App.init)

        if (deviceForm) {
            deviceForm.removeEventListener('submit', DeviceManager.handleDeviceFormSubmit);
            deviceForm.addEventListener('submit', DeviceManager.handleDeviceFormSubmit);
        }

        if (bottleForm) {
            bottleForm.removeEventListener('submit', BottleManager.handleBottleFormSubmit);
            bottleForm.addEventListener('submit', BottleManager.handleBottleFormSubmit);
        }
        
        if (operationForm) {
            operationForm.removeEventListener('submit', App.handleOperationFormSubmit);
            operationForm.addEventListener('submit', App.handleOperationFormSubmit);
        }
    },

    // General handler for operation form that delegates to the currentManager
    // This handler extracts the type and targetId from the form's dataset
    async handleOperationFormSubmit(e) {
        e.preventDefault();
        const operationForm = e.target;
        const type = operationForm.dataset.type; // Get type (device/bottle)
        const targetId = operationForm.dataset.targetId; // Get ID of the device/bottle

        if (currentManager && typeof currentManager.submitOperation === 'function') {
            await currentManager.submitOperation(new FormData(operationForm), type, targetId);
        } else {
            console.warn('No active manager or submitOperation function found for operation form.');
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});