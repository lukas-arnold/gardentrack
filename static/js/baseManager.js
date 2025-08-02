import { UI } from "./ui.js";

/**
 * BaseManager provides common functionality for managing entities (devices, bottles, etc.)
 * This class contains shared methods and properties that are used across different managers.
 */
export class BaseManager {
    constructor() {
        this.showInactive = false;
        this.currentChart = null;
        this.historyChart = null;
    }

    /**
     * Toggles the visibility of inactive items and reloads the list.
     * @param {string} toggleButtonId - The ID of the toggle button element.
     * @param {Function} loadFunction - The function to call to reload the data.
     */
    toggleInactiveVisibility(toggleButtonId, loadFunction) {
        this.showInactive = !this.showInactive;
        loadFunction();
        this.updateToggleButtonStyle(toggleButtonId);
    }

    /**
     * Updates the text and style of the toggle button based on the current visibility state.
     * @param {string} toggleButtonId - The ID of the toggle button element.
     */
    updateToggleButtonStyle(toggleButtonId) {
        const toggleButton = document.getElementById(toggleButtonId);
        if (toggleButton) {
            if (this.showInactive) {
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

    /**
     * Creates a standard card header with title, status badge, and action buttons.
     * @param {Object} item - The item data object.
     * @param {string} title - The title to display.
     * @param {string} icon - The Font Awesome icon class.
     * @param {string} itemType - The type of item ('device', 'bottle', etc.).
     * @param {string} itemId - The ID of the item.
     * @param {boolean} isActive - Whether the item is active.
     * @returns {string} The HTML string for the card header.
     */
    createCardHeader(item, title, icon, itemType, itemId, isActive) {
        return `
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-${icon}"></i>
                    ${title}
                </h3>
                <div class="card-actions">
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-circle" style="font-size: 0.6em;"></i>
                        ${isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <button class="btn btn-sm btn-primary add-operation-btn" data-id="${itemId}" data-type="${itemType}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-${isActive ? 'secondary' : 'success'} toggle-active-btn" data-id="${itemId}" data-active="${isActive}">
                        <i class="fas fa-${isActive ? 'archive' : 'undo'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-${itemType}-btn" data-id="${itemId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Creates a standard card wrapper with the given content.
     * @param {Object} item - The item data object.
     * @param {string} content - The card body content.
     * @param {string} itemType - The type of item.
     * @param {string} itemId - The ID of the item.
     * @param {boolean} isActive - Whether the item is active.
     * @returns {string} The complete card HTML.
     */
    createCard(item, content, itemType, itemId, isActive) {
        const hiddenClass = !isActive && !this.showInactive ? 'hidden-inactive' : '';
        return `
            <div class="card ${hiddenClass}" data-${itemType}-id="${itemId}">
                ${content}
            </div>
        `;
    }

    /**
     * Binds common event listeners for card action buttons.
     * @param {string} itemType - The type of item ('device', 'bottle', etc.).
     * @param {Object} handlers - Object containing handler functions for different actions.
     */
    bindCardEvents(itemType, handlers) {
        // Add operation button
        document.querySelectorAll(`.add-operation-btn[data-type="${itemType}"]`).forEach(button => {
            button.onclick = (e) => {
                const itemId = e.currentTarget.dataset.id;
                const modalTitle = handlers.getModalTitle ? handlers.getModalTitle(itemType) : 'Operation hinzufügen';
                UI.showOperationModal(modalTitle, itemType, itemId);
            };
        });

        // Delete item button
        document.querySelectorAll(`.delete-${itemType}-btn`).forEach(button => {
            button.onclick = async (e) => {
                const itemId = e.currentTarget.dataset.id;
                if (handlers.deleteItem) {
                    await handlers.deleteItem(itemId);
                }
            };
        });

        // Delete operation button
        document.querySelectorAll(`.delete-operation-btn[data-type="${itemType}"]`).forEach(button => {
            button.onclick = async (e) => {
                const operationId = e.currentTarget.dataset.operationId;
                if (handlers.deleteOperation) {
                    await handlers.deleteOperation(operationId);
                }
            };
        });

        // Toggle active status button
        document.querySelectorAll('.toggle-active-btn').forEach(button => {
            button.onclick = async (e) => {
                const itemId = e.currentTarget.dataset.id;
                const currentActiveStatus = e.currentTarget.dataset.active === 'true';
                if (handlers.toggleActive) {
                    await handlers.toggleActive(itemId, !currentActiveStatus);
                }
            };
        });
    }

    /**
     * Generic function to handle item deletion with confirmation.
     * @param {number} itemId - The ID of the item to delete.
     * @param {string} itemName - The display name of the item type.
     * @param {Function} deleteFunction - The API function to call for deletion.
     * @param {Function} reloadFunction - The function to call after successful deletion.
     */
    async deleteItem(itemId, itemName, deleteFunction, reloadFunction) {
        UI.showConfirmModal(
            `${itemName} löschen`,
            `Möchten Sie dieses ${itemName} wirklich löschen? Alle zugehörigen Einträge werden ebenfalls entfernt.`,
            async () => {
                try {
                    UI.showLoading(true);
                    await deleteFunction(itemId);
                    UI.showToast(`${itemName} erfolgreich gelöscht.`, 'success');
                    reloadFunction();
                } catch (error) {
                    console.error(`Fehler beim Löschen des ${itemName}:`, error);
                    UI.showToast(`Fehler beim Löschen des ${itemName}.`, 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    }

    /**
     * Generic function to handle operation deletion with confirmation.
     * @param {number} operationId - The ID of the operation to delete.
     * @param {string} operationName - The display name of the operation type.
     * @param {Function} deleteFunction - The API function to call for deletion.
     * @param {Function} reloadFunction - The function to call after successful deletion.
     */
    async deleteOperation(operationId, operationName, deleteFunction, reloadFunction) {
        UI.showConfirmModal(
            `${operationName} löschen`,
            `Möchten Sie diesen ${operationName} wirklich löschen?`,
            async () => {
                try {
                    UI.showLoading(true);
                    await deleteFunction(operationId);
                    UI.showToast(`${operationName} erfolgreich gelöscht.`, 'success');
                    reloadFunction();
                } catch (error) {
                    console.error(`Fehler beim Löschen des ${operationName}:`, error);
                    UI.showToast(`Fehler beim Löschen des ${operationName}.`, 'error');
                } finally {
                    UI.showLoading(false);
                }
            }
        );
    }

    /**
     * Generic function to toggle active status with confirmation.
     * @param {number} itemId - The ID of the item to update.
     * @param {boolean} newStatus - The new active status.
     * @param {string} itemName - The display name of the item type.
     * @param {Function} updateFunction - The API function to call for updating.
     * @param {Function} reloadFunction - The function to call after successful update.
     */
    async toggleActiveStatus(itemId, newStatus, itemName, updateFunction, reloadFunction) {
        const actionText = newStatus ? 'aktivieren' : 'deaktivieren';
        if (!confirm(`Bist du sicher, dass du dieses ${itemName} ${actionText} möchtest?`)) {
            return;
        }

        try {
            await updateFunction(itemId, { active: newStatus });
            UI.showToast(`${itemName} erfolgreich ${actionText}!`, 'success');
            reloadFunction();
        } catch (error) {
            console.error(`Failed to ${actionText} ${itemName}:`, error);
            UI.showToast(`Fehler beim ${actionText} des ${itemName}.`, 'error');
        }
    }

    /**
     * Filters items based on active status and current visibility setting.
     * @param {Array} items - Array of items to filter.
     * @returns {Array} Filtered array of items.
     */
    filterItemsByVisibility(items) {
        return this.showInactive ? items : items.filter(item => item.active);
    }

    /**
     * Creates an empty state message when no items are available.
     * @param {string} icon - The Font Awesome icon class.
     * @param {string} title - The title of the empty state.
     * @param {string} description - The description text.
     * @returns {string} The HTML string for the empty state.
     */
    createEmptyState(icon, title, description) {
        return UI.createEmptyState(icon, title, description);
    }
} 