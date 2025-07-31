const Utils = {
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    },

    formatDateTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleString();
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    formatWeight(weight) {
        return `${weight} kg`;
    },

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};