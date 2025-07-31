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

        // Re-bind form submissions for modals, as they are now global
        // The event listeners for these forms need to be removed and re-added
        // each time the content is loaded/switched to avoid duplicate handlers.
        // It's better to manage them directly in the respective managers.
    },

    bindNavigationEvents() {
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

            // Re-bind global form submissions only if needed, or ensure they are handled by managers
            // For example, the `operation-form` listener.
            this.rebindSharedFormSubmissions();

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

    // This function ensures common form submissions are handled correctly
    // It's crucial because content is loaded dynamically, so event listeners
    // on these forms might be lost or duplicated if not managed carefully.
    rebindSharedFormSubmissions() {
        // Remove previous listeners to prevent duplicates
        const opForm = document.getElementById('operation-form');
        const deviceForm = document.getElementById('device-form');
        const bottleForm = document.getElementById('bottle-form');

        // It's generally safer to have these form submissions handled directly
        // by the respective managers. If a form is part of the dynamically loaded
        // content, its submit handler needs to be attached *after* it's loaded.
        // Since modals are now global, their form submissions can be directly bound.

        // Device form submission (global)
        if (deviceForm) {
            deviceForm.removeEventListener('submit', DeviceManager.handleDeviceFormSubmit); // Assuming a named function
            deviceForm.addEventListener('submit', DeviceManager.handleDeviceFormSubmit);
        }

        // Bottle form submission (global)
        if (bottleForm) {
            bottleForm.removeEventListener('submit', BottleManager.handleBottleFormSubmit); // Assuming a named function
            bottleForm.addEventListener('submit', BottleManager.handleBottleFormSubmit);
        }
        
        // Operation form submission (global, but context-dependent)
        if (opForm) {
            opForm.removeEventListener('submit', App.handleOperationFormSubmit); // Remove App's general handler
            opForm.addEventListener('submit', App.handleOperationFormSubmit); // Add App's general handler
        }
    },

    // General handler for operation form that delegates to the currentManager
    async handleOperationFormSubmit(e) {
        e.preventDefault();
        if (currentManager && typeof currentManager.submitOperation === 'function') {
            await currentManager.submitOperation(new FormData(e.target), e.target.dataset.targetId);
        } else {
            console.warn('No active manager or submitOperation function found for operation form.');
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});