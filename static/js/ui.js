/**
 * A utility object for handling UI-related tasks such as showing/hiding
 * modals, displaying toasts, and managing loading states.
 * @namespace UI
 */
export const UI = {
    /**
     * Toggles the visibility of the global loading spinner.
     * @param {boolean} show - If true, shows the spinner; otherwise, hides it.
     */
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) { // Check if spinner exists
            if (show) {
                spinner.classList.add('active');
            } else {
                spinner.classList.remove('active');
            }
        }
    },

    /**
     * Displays a toast notification with a message and a type.
     * @param {string} message - The message to display.
     * @param {string} [type='info'] - The type of toast ('success', 'error', 'warning', 'info').
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return; // Ensure container exists
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Automatically remove the toast after 5 seconds.
        setTimeout(() => {
            toast.remove();
        }, 5000);
    },

    /**
     * Gets the Font Awesome icon name corresponding to a toast type.
     * @param {string} type - The toast type ('success', 'error', 'warning', 'info').
     * @returns {string} The icon class name.
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    },

    /**
     * Displays a modal by adding the 'active' class and preventing body scrolling.
     * @param {string} modalId - The ID of the modal element to show.
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) { // Check if modal exists
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Shows a generic confirmation modal with a custom message and a callback for the confirm button.
     * @param {string} title - The title for the modal header.
     * @param {string} message - The message to display inside the modal body.
     * @param {Function} onConfirm - The callback function to execute when the confirm button is clicked.
     */
    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('delete-modal');
        const modalTitle = document.getElementById('delete-modal-title');
        const modalMessage = document.getElementById('delete-modal-message');
        const confirmBtn = document.getElementById('delete-confirm-btn');
        const cancelBtn = document.getElementById('delete-cancel-btn');

        if (!modal || !modalTitle || !modalMessage || !confirmBtn || !cancelBtn) return;

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Clone and replace the buttons to remove old event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideModal('delete-modal');
        });

        newCancelBtn.addEventListener('click', () => {
            this.hideModal('delete-modal');
        });

        // Also handle the close button in the header
        document.getElementById('delete-modal-close')?.addEventListener('click', () => {
            this.hideModal('delete-modal');
        }, { once: true }); // Use { once: true } to prevent multiple listeners

        this.showModal('delete-modal');
    },

    /**
     * Hides a modal by removing the 'active' class and restoring body scrolling.
     * @param {string} modalId - The ID of the modal element to hide.
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) { // Check if modal exists
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Resets a form to its default state.
     * @param {string} formId - The ID of the form element to clear.
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) { // Check if form exists
            form.reset();
            // Reset any custom states for checkboxes (if needed)
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = cb.hasAttribute('checked'));
        }
    },

    /**
     * Creates the HTML string for an empty state message.
     * @param {string} icon - The Font Awesome icon class name.
     * @param {string} title - The title of the empty state message.
     * @param {string} description - The descriptive text.
     * @returns {string} The HTML string for the empty state.
     */
    createEmptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    },

    /**
     * Displays the operation modal, configuring it for either a device or a bottle operation.
     * @param {string} title - The title for the modal.
     * @param {string} type - The type of operation ('device' or 'bottle').
     * @param {number} targetId - The ID of the device or bottle the operation is for.
     */
    showOperationModal(title, type, targetId) {
        const operationModalTitle = document.getElementById('operation-modal-title');
        const operationForm = document.getElementById('operation-form');
        
        if (!operationModalTitle || !operationForm) return; // Ensure elements exist

        operationModalTitle.textContent = title;
        operationForm.dataset.type = type; // Set type to 'device' or 'bottle'
        operationForm.dataset.targetId = targetId; // Set the ID of the device or bottle

        // Set today's date as default
        document.getElementById('operation-date').value = new Date().toISOString().split('T')[0];
        
        // Show/hide fields based on the operation type.
        const durationGroup = document.getElementById('duration-group');
        const weightGroup = document.getElementById('weight-group');
        const noteGroup = document.getElementById('note-group');

        if (type === 'device') {
            if (durationGroup) durationGroup.style.display = 'block';
            if (weightGroup) weightGroup.style.display = 'none';
            if (noteGroup) noteGroup.style.display = 'block'; // Ensure note is visible for devices
        } else if (type === 'bottle') {
            if (durationGroup) durationGroup.style.display = 'none';
            if (weightGroup) weightGroup.style.display = 'block';
            if (noteGroup) noteGroup.style.display = 'none'; // Ensure note is hidden for bottles
        }

        this.showModal('operation-modal');
    },
};