export const UI = {
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
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    },

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) { // Check if modal exists
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) { // Check if modal exists
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) { // Check if form exists
            form.reset();
            // Reset any custom states for checkboxes (if needed)
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = cb.hasAttribute('checked'));
        }
    },

    createEmptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    },

    showOperationModal(title, type, targetId) {
        const operationModalTitle = document.getElementById('operation-modal-title');
        const operationForm = document.getElementById('operation-form');
        
        if (!operationModalTitle || !operationForm) return; // Ensure elements exist

        operationModalTitle.textContent = title;
        operationForm.dataset.type = type; // Set type to 'device' or 'bottle'
        operationForm.dataset.targetId = targetId; // Set the ID of the device or bottle

        // Set today's date as default
        document.getElementById('operation-date').value = new Date().toISOString().split('T')[0];
        
        // Show/hide fields based on type
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