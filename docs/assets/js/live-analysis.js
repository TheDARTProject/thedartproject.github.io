// live-analysis.js

// Import serverNames from servers.js if needed
import servers from './servers.js';
const serverNames = servers.serverNames;

// Main data object
let accountsData = {};
let currentChart = null;

// Event listeners for live analysis page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('live-analysis.html')) {
        fetchData();
        setupEventListeners();
    }
});

function setupEventListeners() {
    // Chart type change
    document.getElementById('chartType').addEventListener('change', updateFilterOptions);

    // Filter selection changes
    document.querySelectorAll('.series-filter').forEach(filter => {
        filter.addEventListener('change', updateFilterValueOptions);
    });

    // Add series button
    document.getElementById('addSeries').addEventListener('click', addSeries);

    // Generate chart button
    document.getElementById('generateChart').addEventListener('click', generateChart);

    // Reset button
    document.getElementById('resetChart').addEventListener('click', resetChart);

    // Download buttons
    document.getElementById('downloadPNG').addEventListener('click', downloadPNG);
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
}

async function fetchData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('analysisContainer').classList.add('hidden');

        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        accountsData = await response.json();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('analysisContainer').classList.remove('hidden');

        // Initialize filter options
        updateFilterOptions();
        updateFilterValueOptions();
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please check that the data file exists and is accessible.');
    }
}

function updateFilterOptions() {
    const chartType = document.getElementById('chartType').value;
    const xAxisSelect = document.getElementById('xAxis');

    // Clear existing options
    xAxisSelect.innerHTML = '';

    // Common options
    const commonOptions = [
        { value: 'FOUND_ON', text: 'Date Found' },
        { value: 'ATTACK_METHOD', text: 'Attack Method' },
        { value: 'ATTACK_GOAL', text: 'Attack Goal' },
        { value: 'ATTACK_SURFACE', text: 'Attack Surface' },
        { value: 'BEHAVIOUR', text: 'Behaviour' },
        { value: 'FINAL_URL_STATUS', text: 'URL Status' }
    ];

    // Add options based on chart type
    commonOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        xAxisSelect.appendChild(opt);
    });

    // Special options for certain chart types
    if (chartType === 'scatter' || chartType === 'bubble') {
        const numericOptions = [
            { value: 'ACCOUNT_CREATION', text: 'Account Age (Days)' },
            { value: 'LAST_CHECK', text: 'Days Since Last Check' }
        ];

        numericOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            xAxisSelect.appendChild(opt);
        });
    }
}

function updateFilterValueOptions() {
    document.querySelectorAll('.series-config').forEach(series => {
        const filterSelect = series.querySelector('.series-filter');
        const valueSelect = series.querySelector('.series-filter-value');

        const filterField = filterSelect.value;
        valueSelect.innerHTML = '<option value="">All Values</option>';

        if (filterField) {
            // Get all unique values for this field
            const values = new Set();
            Object.values(accountsData).forEach(account => {
                if (account[filterField]) {
                    values.add(account[filterField]);
                }
            });

            // Special handling for server names
            if (filterField === 'FOUND_ON_SERVER') {
                const sortedValues = Array.from(values).sort((a, b) => {
                    const nameA = a.startsWith('ANONYMOUS_SERVER') ?
                        `Anonymous Server #${a.split('_').pop()}` :
                        serverNames[a] || a;
                    const nameB = b.startsWith('ANONYMOUS_SERVER') ?
                        `Anonymous Server #${b.split('_').pop()}` :
                        serverNames[b] || b;
                    return nameA.localeCompare(nameB);
                });

                sortedValues.forEach(value => {
                    const opt = document.createElement('option');
                    opt.value = value;

                    if (value.startsWith('ANONYMOUS_SERVER')) {
                        opt.textContent = `Anonymous Server #${value.split('_').pop()}`;
                    } else {
                        opt.textContent = serverNames[value] || value;
                    }

                    valueSelect.appendChild(opt);
                });
            } else {
                // Regular fields
                Array.from(values).sort().forEach(value => {
                    const opt = document.createElement('option');
                    opt.value = value;
                    opt.textContent = value;
                    valueSelect.appendChild(opt);
                });
            }
        }
    });
}

function addSeries() {
    const seriesContainer = document.getElementById('seriesContainer');
    const seriesCount = seriesContainer.children.length + 1;

    const seriesDiv = document.createElement('div');
    seriesDiv.className = 'series-config p-4 border rounded-lg';
    seriesDiv.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">Series ${seriesCount}</h3>
            <button class="text-red-500 hover:text-red-700 remove-series" title="Remove this series">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
                <select class="series-filter w-full border border-gray-300 rounded p-2">
                    <option value="">No Filter</option>
                    <option value="ATTACK_METHOD">Attack Method</option>
                    <option value="ATTACK_GOAL">Attack Goal</option>
                    <option value="FOUND_ON_SERVER">Server</option>
                    <option value="FINAL_URL_STATUS">URL Status</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Filter Value</label>
                <select class="series-filter-value w-full border border-gray-300 rounded p-2">
                    <option value="">All Values</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="color" class="series-color w-full h-10 rounded" value="${getRandomColor()}">
            </div>
        </div>
    `;

    seriesContainer.appendChild(seriesDiv);

    // Add event listeners to new elements
    seriesDiv.querySelector('.remove-series').addEventListener('click', () => {
        seriesDiv.remove();
        renumberSeries();
    });

    seriesDiv.querySelector('.series-filter').addEventListener('change', updateFilterValueOptions);
}

function renumberSeries() {
    document.querySelectorAll('.series-config').forEach((series, index) => {
        series.querySelector('h3').textContent = `Series ${index + 1}`;
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateChart() {
    const chartType = document.getElementById('chartType').value;
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;

    // Get all series configurations
    const seriesConfigs = Array.from(document.querySelectorAll('.series-config')).map(series => {
        return {
            filterField: series.querySelector('.series-filter').value,
            filterValue: series.querySelector('.series-filter-value').value,
            color: series.querySelector('.series-color').value
        };
    });

    // Prepare datasets based on series configurations
    const datasets = seriesConfigs.map((config, index) => {
        // Filter data based on series configuration
        const filteredData = Object.values(accountsData).filter(account => {
            if (!config.filterField) return true;
            if (!config.filterValue) return true;
            return account[config.filterField] === config.filterValue;
        });

        // Process data for this series
        const { labels, data } = processDataForChart(filteredData, xAxis, yAxis);

        return {
            label: config.filterValue ? `${config.filterField}: ${config.filterValue}` : `Series ${index + 1}`,
            data: data,
            backgroundColor: config.color,
            borderColor: config.color,
            borderWidth: 1,
            tension: 0.1
        };
    });

    // For pie/doughnut charts, we only use the first dataset
    if (chartType === 'pie' || chartType === 'doughnut') {
        if (datasets.length > 0) {
            datasets[0].backgroundColor = datasets.map(d => d.backgroundColor);
            while (datasets.length > 1) datasets.pop();
        }
    }

    // Get labels from the first dataset (they should be the same for all series)
    const labels = datasets.length > 0 ?
        processDataForChart(Object.values(accountsData), xAxis, yAxis).labels :
        [];

    // Create or update chart
    const canvas = document.getElementById('analysisChart');
    const ctx = canvas.getContext('2d');

    if (currentChart) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (yAxis === 'count') {
                                label += context.raw;
                            } else {
                                label += context.raw.toFixed(2);
                            }
                            return label;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxis === 'count' ? 'Count of Cases' : yAxis
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: xAxis
                    }
                }
            }
        }
    });

    // Add reset zoom on right-click
    canvas.oncontextmenu = (e) => {
        e.preventDefault();
        if (currentChart) {
            currentChart.resetZoom();
        }
    };
}

function processDataForChart(data, xAxis, yAxis) {
    const groups = {};

    data.forEach(account => {
        let groupKey;

        // Handle date grouping differently
        if (xAxis === 'FOUND_ON') {
            const date = new Date(account[xAxis]);
            groupKey = date.toISOString().split('T')[0]; // Group by day
        } else {
            groupKey = account[xAxis] || 'Unknown';
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }

        groups[groupKey].push(account);
    });

    // Sort groups
    let sortedGroups;
    if (xAxis === 'FOUND_ON') {
        // Sort dates chronologically
        sortedGroups = Object.entries(groups).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    } else {
        // Sort other groups alphabetically
        sortedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }

    // Prepare labels and data
    const labels = sortedGroups.map(([key]) => {
        if (xAxis === 'FOUND_ON') {
            return formatDate(key);
        } else if (xAxis === 'FOUND_ON_SERVER' && key.startsWith('ANONYMOUS_SERVER')) {
            return `Anonymous Server #${key.split('_').pop()}`;
        } else if (xAxis === 'FOUND_ON_SERVER') {
            return serverNames[key] || key;
        }
        return key;
    });

    const values = sortedGroups.map(([_, accounts]) => {
        if (yAxis === 'count') {
            return accounts.length;
        } else {
            // Calculate average for numeric fields
            const sum = accounts.reduce((total, account) => {
                if (yAxis === 'ACCOUNT_CREATION') {
                    const createdDate = new Date(account.ACCOUNT_CREATION);
                    const foundDate = new Date(account.FOUND_ON);
                    return total + Math.floor((foundDate - createdDate) / (1000 * 60 * 60 * 24));
                } else if (yAxis === 'LAST_CHECK') {
                    const lastCheck = new Date(account.LAST_CHECK);
                    const now = new Date();
                    return total + Math.floor((now - lastCheck) / (1000 * 60 * 60 * 24));
                }
                return total;
            }, 0);

            return accounts.length > 0 ? sum / accounts.length : 0;
        }
    });

    return { labels, data: values };
}

function resetChart() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    // Reset to first series only
    const seriesContainer = document.getElementById('seriesContainer');
    while (seriesContainer.children.length > 1) {
        seriesContainer.lastChild.remove();
    }

    // Reset first series
    const firstSeries = seriesContainer.firstChild;
    firstSeries.querySelector('.series-filter').value = '';
    firstSeries.querySelector('.series-filter-value').innerHTML = '<option value="">All Values</option>';
    firstSeries.querySelector('.series-color').value = '#6366F1';

    // Reset chart type and axes
    document.getElementById('chartType').value = 'bar';
    document.getElementById('xAxis').value = 'FOUND_ON';
    document.getElementById('yAxis').value = 'count';
}

function downloadPNG() {
    if (currentChart) {
        const link = document.createElement('a');
        link.download = 'custom-analysis.png';
        link.href = document.getElementById('analysisChart').toDataURL('image/png');
        link.click();
    } else {
        alert('Please generate a chart first');
    }
}

function downloadCSV() {
    const chartType = document.getElementById('chartType').value;
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;

    // Get all series configurations
    const seriesConfigs = Array.from(document.querySelectorAll('.series-config')).map(series => {
        return {
            filterField: series.querySelector('.series-filter').value,
            filterValue: series.querySelector('.series-filter-value').value
        };
    });

    let csvContent = 'Category,Series,Value\n';

    seriesConfigs.forEach((config, index) => {
        // Filter data based on series configuration
        const filteredData = Object.values(accountsData).filter(account => {
            if (!config.filterField) return true;
            if (!config.filterValue) return true;
            return account[config.filterField] === config.filterValue;
        });

        // Process data for this series
        const { labels, data } = processDataForChart(filteredData, xAxis, yAxis);

        labels.forEach((label, i) => {
            const seriesName = config.filterValue ? `${config.filterField}: ${config.filterValue}` : `Series ${index + 1}`;
            csvContent += `"${label}","${seriesName}",${data[i]}\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'custom-analysis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}