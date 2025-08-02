import { Utils } from "./utils.js";

/**
 * DataManager provides common data processing and calculation functions.
 * This module contains reusable methods for data manipulation and statistics.
 */
export class DataManager {
    /**
     * Calculates total duration from an array of operations.
     * @param {Array} operations - Array of operation objects with start_time and end_time.
     * @returns {number} Total duration in minutes.
     */
    static calculateTotalDuration(operations) {
        if (!operations || operations.length === 0) return 0;
        
        return operations.reduce((sum, op) => {
            const startTime = new Date(op.start_time).getTime();
            const endTime = new Date(op.end_time).getTime();
            return sum + (endTime - startTime) / 60000; // Convert to minutes
        }, 0);
    }

    /**
     * Filters operations by year.
     * @param {Array} operations - Array of operation objects.
     * @param {number} year - The year to filter by.
     * @returns {Array} Filtered operations.
     */
    static filterOperationsByYear(operations, year) {
        if (!operations) return [];
        
        return operations.filter(op => {
            const opDate = new Date(op.start_time);
            return opDate.getFullYear() === year;
        });
    }

    /**
     * Gets the last operation from a sorted array of operations.
     * @param {Array} operations - Array of operation objects.
     * @returns {Object|null} The last operation or null if no operations exist.
     */
    static getLastOperation(operations) {
        if (!operations || operations.length === 0) return null;
        
        const sortedOperations = [...operations].sort((a, b) => 
            new Date(b.start_time) - new Date(a.start_time)
        );
        return sortedOperations[0];
    }

    /**
     * Calculates monthly statistics for operations.
     * @param {Array} operations - Array of operation objects.
     * @param {number} year - The year to calculate statistics for.
     * @returns {Array} Array of monthly durations in hours.
     */
    static calculateMonthlyStats(operations, year) {
        const monthlyDurations = new Array(12).fill(0);
        
        if (!operations) return monthlyDurations;
        
        operations.forEach(op => {
            const opDate = new Date(op.start_time);
            if (opDate.getFullYear() === year) {
                const month = opDate.getMonth();
                const durationInMinutes = (new Date(op.end_time).getTime() - new Date(op.start_time).getTime()) / 60000;
                monthlyDurations[month] += durationInMinutes / 60; // Convert to hours
            }
        });
        
        return monthlyDurations;
    }

    /**
     * Extracts unique years from operations.
     * @param {Array} operations - Array of operation objects.
     * @returns {Array} Array of unique years, sorted in descending order.
     */
    static extractUniqueYears(operations) {
        if (!operations) return [];
        
        const years = new Set();
        operations.forEach(op => {
            years.add(new Date(op.start_time).getFullYear());
        });
        
        return Array.from(years).sort((a, b) => b - a);
    }

    /**
     * Calculates bottle statistics including current weight and remaining gas.
     * @param {Object} bottle - Bottle object with operations and weight data.
     * @returns {Object} Object containing calculated statistics.
     */
    static calculateBottleStats(bottle) {
        const operationsCount = bottle.operations?.length || 0;
        const sortedOperations = bottle.operations ? 
            [...bottle.operations].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
        
        const lastOperation = sortedOperations[0];
        const currentWeight = lastOperation?.weight !== undefined ? lastOperation.weight : bottle.initial_weight;
        const bottleWeight = bottle.initial_weight - bottle.filling_weight;
        const totalUsedGas = (bottle.initial_weight - currentWeight).toFixed(1);
        const remainingGasKg = (currentWeight - bottle.filling_weight).toFixed(1);
        const remainingPercentage = bottleWeight > 0 ? 
            (((currentWeight - bottle.filling_weight) / bottleWeight) * 100) : 0;

        return {
            operationsCount,
            currentWeight,
            bottleWeight,
            totalUsedGas,
            remainingGasKg,
            remainingPercentage: parseFloat(remainingPercentage.toFixed(1)),
            lastOperation
        };
    }

    /**
     * Calculates device statistics for a specific year.
     * @param {Object} device - Device object with operations.
     * @param {number} year - The year to calculate statistics for.
     * @returns {Object} Object containing calculated statistics.
     */
    static calculateDeviceStats(device, year) {
        const filteredOperations = this.filterOperationsByYear(device.operations, year);
        const operationsCount = filteredOperations.length;
        const totalDuration = this.calculateTotalDuration(filteredOperations);
        const lastOperation = this.getLastOperation(filteredOperations);

        return {
            operationsCount,
            totalDuration,
            lastOperation,
            filteredOperations
        };
    }

    /**
     * Creates an info item for display in cards.
     * @param {string} label - The label text.
     * @param {string} value - The value text.
     * @returns {string} HTML string for the info item.
     */
    static createInfoItem(label, value) {
        return `
            <div class="info-item">
                <span class="info-label">${label}</span>
                <span class="info-value">${value}</span>
            </div>
        `;
    }

    /**
     * Creates a statistic card for display.
     * @param {string} title - The card title.
     * @param {Array} statistics - Array of statistic objects with icon, label, and value.
     * @param {string} cssClass - Additional CSS class for the card.
     * @returns {string} HTML string for the statistic card.
     */
    static createStatisticCard(title, statistics, cssClass = '') {
        const statisticItems = statistics.map(stat => `
            <div class="statistic-item">
                <i class="fas fa-${stat.icon} statistic-icon-small"></i>
                <span class="statistic-label">${stat.label}:</span>
                <span class="statistic-value">${stat.value}</span>
            </div>
        `).join('');

        return `
            <div class="statistic-card ${cssClass}">
                <div class="card-body">
                    <h4 class="card-title">${title}</h4>
                    ${statisticItems}
                </div>
            </div>
        `;
    }

    /**
     * Creates a table row for operation entries.
     * @param {Object} operation - The operation object.
     * @param {Object} item - The parent item (device/bottle).
     * @param {string} itemType - The type of item ('device' or 'bottle').
     * @param {Function} deleteHandler - Function to handle deletion.
     * @returns {string} HTML string for the table row.
     */
    static createOperationTableRow(operation, item, itemType, deleteHandler) {
        if (itemType === 'device') {
            const durationInMinutes = (new Date(operation.end_time).getTime() - new Date(operation.start_time).getTime()) / 60000;
            return `
                <tr data-id="${item.id}">
                    <td>${item.name}</td>
                    <td>${Utils.formatDate(operation.start_time)}</td>
                    <td>${Utils.formatDateTime(operation.start_time)}</td>
                    <td>${Utils.formatDateTime(operation.end_time)}</td>
                    <td>${Utils.formatDuration(durationInMinutes)}</td>
                    <td>${operation.note ? operation.note : ""}</td>
                    <td>
                        <button class="btn-delete" data-id="${operation.id}">Löschen</button>
                    </td>
                </tr>
            `;
        } else if (itemType === 'bottle') {
            const bottleWeight = item.initial_weight - item.filling_weight;
            const previousWeight = operation.previousWeight || item.initial_weight;
            const usedGas = (previousWeight - operation.weight).toFixed(1);
            const remainingGas = (operation.weight - bottleWeight).toFixed(1);
            
            return `
                <tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${Utils.formatDate(operation.date)}</td>
                    <td>${Utils.formatWeight(operation.weight)}</td>
                    <td>${Utils.formatWeight(usedGas)}</td>
                    <td>${Utils.formatWeight(remainingGas)}</td>
                    <td>
                        <button class="btn-delete" data-id="${operation.id}">Löschen</button>
                    </td>
                </tr>
            `;
        }
        
        return '';
    }

    /**
     * Populates a year filter dropdown with available years.
     * @param {string} selectId - The ID of the select element.
     * @param {Array} operations - Array of operations to extract years from.
     * @param {number} currentYear - The currently selected year.
     * @returns {number} The selected year.
     */
    static populateYearFilter(selectId, operations, currentYear) {
        const years = this.extractUniqueYears(operations);
        const yearFilterSelect = document.getElementById(selectId);
        
        if (!yearFilterSelect) return currentYear;
        
        yearFilterSelect.innerHTML = '';
        
        years.forEach(year => {
            const option = new Option(year, year);
            yearFilterSelect.add(option);
        });

        // Set the initial selection
        if (years.includes(currentYear)) {
            yearFilterSelect.value = currentYear;
        } else if (years.length > 0) {
            currentYear = years[0];
            yearFilterSelect.value = currentYear;
        } else {
            currentYear = new Date().getFullYear();
            yearFilterSelect.add(new Option(currentYear, currentYear));
            yearFilterSelect.value = currentYear;
        }
        
        return currentYear;
    }
} 