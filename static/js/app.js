import { DeviceManager } from "./devices.js";
import { BottleManager } from "./bottles.js";
import { UI } from "./ui.js";

// This variable keeps track of which manager (DeviceManager or BottleManager) is currently active.
let currentManager = null;

/**
 * The main application object that handles page navigation, event binding, and content loading.
 * @namespace App
 */
const App = {
    /**
     * Initializes the application by setting up event listeners and loading the default content.
     */
    init() {
        this.bindGlobalEvents();
        this.bindNavigationEvents();
        // Load the devices view by default when the app starts.
        this.loadContent("devices");
    },

    /**
     * Binds event listeners to global elements like modals and the document body.
     */
    bindGlobalEvents() {
        // Add listeners to close buttons on all modals.
        document.getElementById("operation-modal-close")?.addEventListener("click", () => {
            UI.hideModal("operation-modal");
        });
        document.getElementById("operation-cancel-btn")?.addEventListener("click", () => {
            UI.hideModal("operation-modal");
        });
        document.getElementById("device-modal-close")?.addEventListener("click", () => {
            UI.hideModal("device-modal");
        });
        document.getElementById("device-cancel-btn")?.addEventListener("click", () => {
            UI.hideModal("device-modal");
        });
        document.getElementById("bottle-modal-close")?.addEventListener("click", () => {
            UI.hideModal("bottle-modal");
        });
        document.getElementById("bottle-cancel-btn")?.addEventListener("click", () => {
            UI.hideModal("bottle-modal");
        });

        // Close modals when a click occurs outside of them.
        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    UI.hideModal(modal.id);
                }
            });
        });

        // Close any active modal when the Escape key is pressed.
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll(".modal.active").forEach((modal) => {
                    UI.hideModal(modal.id);
                });
            }
        });

        // Bind form submission handlers for forms that are shared across different views.
        this.rebindSharedFormSubmissions();
    },

    /**
     * Binds event listeners to navigation tabs to handle page switching.
     */
    bindNavigationEvents() {
        // Event listener for the home tab, which always leads to the 'devices' page.
        document.querySelectorAll(".nav-tab-home").forEach((tab) => {
            tab.addEventListener("click", (e) => {
                e.preventDefault();
                this.loadContent("devices");
                this.setActiveTab("devices");
            });
        });

        // Event listeners for all other navigation tabs, using a data attribute to determine the content to load.
        document.querySelectorAll(".nav-tab").forEach((tab) => {
            tab.addEventListener("click", (e) => {
                e.preventDefault();
                const tabType = e.currentTarget.dataset.tab;
                this.loadContent(tabType);
                this.setActiveTab(tabType);
            });
        });
    },

    /**
     * Asynchronously loads HTML content from a file and inserts it into the main content area.
     * @param {string} tabType - The type of content to load ('devices' or 'bottles').
     */
    async loadContent(tabType) {
        UI.showLoading(true);
        const contentArea = document.getElementById("content-area");

        try {
            // Fetch the corresponding HTML file based on the tab type.
            const response = await fetch(`static/${tabType}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load static/${tabType}.html`);
            }
            const htmlContent = await response.text();
            contentArea.innerHTML = htmlContent;

            // After loading the new content, initialize the correct manager (DeviceManager or BottleManager)
            // and set it as the current active manager.
            if (tabType === "devices") {
                currentManager = DeviceManager;
                DeviceManager.init();
            } else if (tabType === "bottles") {
                currentManager = BottleManager;
                BottleManager.init();
            }
        } catch (error) {
            console.error("Error loading content:", error);
            UI.showToast(`Could not load ${tabType} content.`, "error");
            contentArea.innerHTML = UI.createEmptyState(
                "exclamation-triangle",
                "Content Not Available",
                "There was an error loading the requested section."
            );
        } finally {
            UI.showLoading(false);
        }
    },

    /**
     * Sets the 'active' class on the clicked navigation tab to highlight it.
     * @param {string} tabType - The type of the tab to activate ('devices' or 'bottles').
     */
    setActiveTab(tabType) {
        document.querySelectorAll(".nav-tab").forEach((tab) => {
            if (tab.dataset.tab === tabType) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    },

    /**
     * Rebinds form submission event listeners to ensure they are active on newly loaded content.
     * This is important because dynamically loaded content loses its event listeners.
     */
    rebindSharedFormSubmissions() {
        const deviceForm = document.getElementById("device-form");
        const bottleForm = document.getElementById("bottle-form");
        const operationForm = document.getElementById("operation-form");

        if (deviceForm) {
            deviceForm.removeEventListener("submit", DeviceManager.handleDeviceFormSubmit);
            deviceForm.addEventListener("submit", DeviceManager.handleDeviceFormSubmit);
        }

        if (bottleForm) {
            bottleForm.removeEventListener("submit", BottleManager.handleBottleFormSubmit);
            bottleForm.addEventListener("submit", BottleManager.handleBottleFormSubmit);
        }

        if (operationForm) {
            operationForm.removeEventListener("submit", App.handleOperationFormSubmit);
            operationForm.addEventListener("submit", App.handleOperationFormSubmit);
        }
    },

    /**
     * Handles the submission of the operation form by delegating the task to the current active manager.
     * @param {Event} e - The form submission event.
     */
    async handleOperationFormSubmit(e) {
        e.preventDefault();
        const operationForm = e.target;
        const type = operationForm.dataset.type; // Get type (device/bottle) from the form's data attribute.
        const targetId = operationForm.dataset.targetId; // Get the ID of the target from the form's data attribute.

        if (currentManager && typeof currentManager.submitOperation === "function") {
            await currentManager.submitOperation(new FormData(operationForm), type, targetId);
        } else {
            console.warn("No active manager or submitOperation function found for operation form.");
        }
    },
};

// Initializes the application once the entire DOM content has been loaded.
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});