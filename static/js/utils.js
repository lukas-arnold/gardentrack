/**
 * A utility object containing various helper functions for formatting data,
 * handling UI interactions, and other common tasks.
 * @namespace Utils
 */
export const Utils = {
    /**
     * Formats a date string to 'DD.MM.YYYY'.
     * @param {string} dateString - The date string from the backend (e.g., 'YYYY-MM-DD').
     * @returns {string} Formatted date.
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Formats a date string into a localized date and time string.
     * @param {string|Date} date - The date to format.
     * @returns {string} The formatted date and time string, or an empty string if the input is falsy.
     */
    formatDateTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Optional: für 24-Stunden-Format, falls gewünscht
        });
    },


    /**
     * Formats a number into a currency string using the German (de-DE) locale and EUR currency.
     * @param {number} amount - The amount to format.
     * @returns {string} The formatted currency string.
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    /**
     * Formats a number to represent a weight in kilograms.
     * @param {number} weight - The weight value.
     * @returns {string} The formatted weight string, e.g., "10 kg".
     */
    formatWeight(weight) {
        return new Intl.NumberFormat('de-DE', {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }).format(weight) + " kg";
    },

    /**
     * Converts a duration in minutes into a human-readable string of hours and minutes.
     * @param {number} minutes - The duration in minutes.
     * @returns {string} The formatted duration string, e.g., "2h 30m" or "45m".
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    /**
     * Formats a number representing hours into a more readable string.
     *
     * @param {number} hours - The number of hours.
     * @returns {string} The formatted string (e.g., 1,5 Stunden").
     */
    formatHours(hours) {
        return new Intl.NumberFormat('de-DE', {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(hours);
    },

    /**
     * Creates a debounced function that delays invoking a function until after `wait`
     * milliseconds have elapsed since the last time the debounced function was invoked.
     * @param {Function} func - The function to debounce.
     * @param {number} wait - The number of milliseconds to wait.
     * @returns {Function} The new debounced function.
     */
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

    /**
     * Generates a short, random, alphanumeric ID.
     * @returns {string} A 9-character random ID.
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};