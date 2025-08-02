import { Utils } from "./utils.js";

/**
 * ChartManager provides common chart functionality for different types of data visualization.
 * This module contains reusable chart creation and update methods.
 */
export class ChartManager {
    constructor() {
        this.charts = new Map(); // Store chart instances by name
    }

    /**
     * Destroys a chart instance to prevent memory leaks.
     * @param {string} chartName - The name/key of the chart to destroy.
     */
    destroyChart(chartName) {
        const chart = this.charts.get(chartName);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartName);
        }
    }

    /**
     * Destroys all chart instances.
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    /**
     * Creates a line chart for time-series data.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {string} chartName - The name to store the chart instance.
     * @param {Array} labels - Array of labels for the x-axis.
     * @param {Array} datasets - Array of dataset objects for Chart.js.
     * @param {Object} options - Additional chart options.
     */
    createLineChart(canvasId, chartName, labels, datasets, options = {}) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) {
            console.warn(`Chart canvas element '${canvasId}' not found.`);
            return;
        }

        // Destroy existing chart if it exists
        this.destroyChart(chartName);

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 20, // Add padding for X-axis labels
                    top: 10,
                    left: 10,
                    right: 10
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'var(--text-secondary)',
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'var(--primary-color)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Zeit',
                        color: 'var(--text-secondary)',
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Wert',
                        color: 'var(--text-secondary)',
                        font: {
                            size: 12
                        }
                    },
                    beginAtZero: true,
                    ticks: {
                        color: 'var(--text-secondary)',
                        maxTicksLimit: 8
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                },
                line: {
                    tension: 0.2
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: { ...defaultOptions, ...options }
        });

        this.charts.set(chartName, chart);
        return chart;
    }

    /**
     * Creates a bar chart for categorical data.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {string} chartName - The name to store the chart instance.
     * @param {Array} labels - Array of labels for the x-axis.
     * @param {Array} data - Array of data values.
     * @param {Object} options - Additional chart options.
     */
    createBarChart(canvasId, chartName, labels, data, options = {}) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) {
            console.warn(`Chart canvas element '${canvasId}' not found.`);
            return;
        }

        // Destroy existing chart if it exists
        this.destroyChart(chartName);

        const defaultOptions = {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'var(--text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this.generateColors(data.length),
                    borderColor: this.generateColors(data.length).map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: { ...defaultOptions, ...options }
        });

        this.charts.set(chartName, chart);
        return chart;
    }

    /**
     * Generates an array of colors for chart elements.
     * @param {number} count - The number of colors needed.
     * @param {number} alpha - The alpha value for the colors (0-1).
     * @returns {Array} Array of color strings.
     */
    generateColors(count, alpha = 0.8) {
        // Modern, consistent color palette
        const colors = [
            'rgba(74, 125, 255, ' + alpha + ')',   // Primary Blue
            'rgba(142, 68, 173, ' + alpha + ')',   // Purple
            'rgba(46, 204, 113, ' + alpha + ')',   // Green
            'rgba(241, 196, 15, ' + alpha + ')',   // Yellow
            'rgba(231, 76, 60, ' + alpha + ')',    // Red
            'rgba(26, 188, 156, ' + alpha + ')',   // Teal
            'rgba(243, 156, 18, ' + alpha + ')',   // Orange
            'rgba(155, 89, 182, ' + alpha + ')',   // Light Purple
            'rgba(52, 152, 219, ' + alpha + ')',   // Light Blue
            'rgba(230, 126, 34, ' + alpha + ')'    // Dark Orange
        ];

        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    /**
     * Creates a consumption chart for bottles showing remaining percentages.
     * @param {Array} bottles - Array of bottle objects with percentage data.
     */
    createConsumptionChart(bottles) {
        const labels = bottles.map(bottle => `Flasche #${bottle.id}`);
        const data = bottles.map(bottle => bottle.percentage);
        
        // Use static colors for better consistency
        const backgroundColors = bottles.map((bottle, index) => {
            // Use a consistent color palette instead of dynamic colors
            const staticColors = [
                'rgba(74, 125, 255, 0.8)',   // Primary Blue
                'rgba(142, 68, 173, 0.8)',   // Purple
                'rgba(46, 204, 113, 0.8)',   // Green
                'rgba(241, 196, 15, 0.8)',   // Yellow
                'rgba(26, 188, 156, 0.8)',   // Teal
                'rgba(243, 156, 18, 0.8)',   // Orange
                'rgba(155, 89, 182, 0.8)',   // Light Purple
                'rgba(52, 152, 219, 0.8)',   // Light Blue
                'rgba(230, 126, 34, 0.8)',   // Dark Orange
                'rgba(231, 76, 60, 0.8)'     // Red
            ];
            return staticColors[index % staticColors.length];
        });

        const options = {
            scales: {
                y: {
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + "%";
                        }
                    }
                }
            }
        };

        return this.createBarChart('consumption-chart', 'consumption', labels, data, options);
    }

    /**
     * Creates a monthly trend chart for device operations.
     * @param {Array} devices - Array of device objects with operation data.
     * @param {number} year - The year to filter operations by.
     */
    createMonthlyTrendChart(devices, year) {
        const labels = [
            'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
            'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
        ];

        // Modern, consistent color palette for line charts
        const colors = [
            'rgba(74, 125, 255, 1)',   // Primary Blue
            'rgba(142, 68, 173, 1)',   // Purple
            'rgba(46, 204, 113, 1)',   // Green
            'rgba(241, 196, 15, 1)',   // Yellow
            'rgba(26, 188, 156, 1)',   // Teal
            'rgba(243, 156, 18, 1)',   // Orange
            'rgba(155, 89, 182, 1)',   // Light Purple
            'rgba(52, 152, 219, 1)',   // Light Blue
            'rgba(230, 126, 34, 1)',   // Dark Orange
            'rgba(231, 76, 60, 1)'     // Red
        ];

        const datasets = [];

        devices.forEach((device, index) => {
            const monthlyDurationsHours = new Array(12).fill(0);

            device.operations?.forEach(op => {
                const opDate = new Date(op.start_time);
                if (opDate.getFullYear() === year) {
                    const month = opDate.getMonth();
                    const durationInMinutes = (new Date(op.end_time).getTime() - new Date(op.start_time).getTime()) / 60000;
                    monthlyDurationsHours[month] += durationInMinutes / 60;
                }
            });

            if (monthlyDurationsHours.some(val => val > 0)) {
                const color = colors[index % colors.length];
                const backgroundColor = color.replace('1)', '0.2)');
                
                datasets.push({
                    label: device.name,
                    data: monthlyDurationsHours.map(val => parseFloat(val.toFixed(2))),
                    borderColor: color,
                    backgroundColor: backgroundColor,
                    pointBackgroundColor: color,
                    pointBorderColor: color,
                    fill: false,
                    tension: 0.2,
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                });
            }
        });

        // Calculate the maximum value to determine appropriate scaling
        const allValues = datasets.flatMap(dataset => dataset.data);
        const maxValue = Math.max(...allValues);
        
        // Determine appropriate step size based on data range
        let stepSize;
        let maxTicksLimit;
        
        if (maxValue <= 0.1) {
            stepSize = 0.02; // For very small values (0-0.1 hours)
            maxTicksLimit = 6;
        } else if (maxValue <= 1) {
            stepSize = 0.1; // For small values (0-1 hours)
            maxTicksLimit = 6;
        } else if (maxValue <= 5) {
            stepSize = 0.5; // For medium values (0-5 hours)
            maxTicksLimit = 8;
        } else if (maxValue <= 10) {
            stepSize = 1; // For larger values (0-10 hours)
            maxTicksLimit = 8;
        } else {
            stepSize = Math.ceil(maxValue / 8); // For very large values
            maxTicksLimit = 8;
        }

        const options = {
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                // Format hours more appropriately
                                const hours = context.parsed.y;
                                if (hours < 1) {
                                    const minutes = Math.round(hours * 60);
                                    label += `${minutes} Minuten`;
                                } else {
                                    label += `${hours.toFixed(1)} Stunden`;
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        text: 'Monat',
                        display: true,
                        color: 'var(--text-secondary)',
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        maxRotation: 0, // Keep labels horizontal
                        minRotation: 0,
                        padding: 8 // Add padding around labels
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        text: 'Zeit',
                        display: true,
                        color: 'var(--text-secondary)',
                        font: {
                            size: 12
                        }
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            // Format Y-axis labels appropriately
                            if (value < 1) {
                                const minutes = Math.round(value * 60);
                                return `${minutes}min`;
                            } else {
                                return `${value.toFixed(1)}h`;
                            }
                        },
                        maxTicksLimit: maxTicksLimit,
                        stepSize: stepSize,
                        color: 'var(--text-secondary)',
                        padding: 5
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };

        return this.createLineChart('deviceOperationsLineChart', 'operationsLine', labels, datasets, options);
    }

    /**
     * Creates a history chart for bottle weight tracking.
     * @param {Array} bottles - Array of bottle objects with operation history.
     */
    createBottleHistoryChart(bottles) {
        // Consistent color palette for bottle history
        const colors = [
            'rgba(74, 125, 255, 1)',   // Primary Blue
            'rgba(142, 68, 173, 1)',   // Purple
            'rgba(46, 204, 113, 1)',   // Green
            'rgba(241, 196, 15, 1)',   // Yellow
            'rgba(26, 188, 156, 1)',   // Teal
            'rgba(243, 156, 18, 1)',   // Orange
            'rgba(155, 89, 182, 1)',   // Light Purple
            'rgba(52, 152, 219, 1)',   // Light Blue
            'rgba(230, 126, 34, 1)',   // Dark Orange
            'rgba(231, 76, 60, 1)'     // Red
        ];

        const datasets = bottles.map((bottle, index) => {
            const sortedOperations = bottle.operations ? 
                [...bottle.operations].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
            
            const dataPoints = [];

            // Include initial weight as starting point
            dataPoints.push({
                x: Utils.formatDate(bottle.purchase_date),
                y: bottle.initial_weight
            });

            // Add each operation as a data point
            sortedOperations.forEach(op => {
                dataPoints.push({
                    x: Utils.formatDate(op.date),
                    y: op.weight
                });
            });

            return {
                label: `Flasche #${bottle.id}`,
                data: dataPoints,
                borderColor: colors[index % colors.length],
                fill: false,
                tension: 0.1
            };
        });

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: "Verlauf des Flaschengewichts (Aktive Flaschen)"
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || "";
                            if (label) {
                                label += ": ";
                            }
                            if (context.parsed.y !== null) {
                                label += Utils.formatWeight(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: "category",
                    title: {
                        text: "Datum"
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        text: "Gewicht (kg)"
                    },
                    ticks: {
                        callback: function(value) {
                            return Utils.formatWeight(value);
                        }
                    }
                }
            }
        };

        return this.createLineChart('bottle-history-chart', 'bottleHistory', [], datasets, options);
    }
} 