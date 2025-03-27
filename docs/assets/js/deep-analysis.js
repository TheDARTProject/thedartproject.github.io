// deep_analysis.js

// Import serverNames from servers.js
import servers from './servers.js';
const serverNames = servers.serverNames;

// Main data object
let accountsData = {};
let filteredData = [];

// Event listeners for deep analysis page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('deep_analysis.html')) {
        fetchData();
    }

    // Add event listeners for temporal chart controls
    document.getElementById('temporalGroupBy')?.addEventListener('change', updateTemporalChart);
    document.getElementById('temporalTimeUnit')?.addEventListener('change', updateTemporalChart);
    document.getElementById('temporalChartType')?.addEventListener('change', updateTemporalChart);

    // Add event listeners for vector distribution chart controls
    document.getElementById('vectorGroupBy')?.addEventListener('change', updateVectorDistributionChart);
    document.getElementById('vectorChartType')?.addEventListener('change', updateVectorDistributionChart);
});

// Fetch data from JSON file
async function fetchData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('analysis').classList.add('hidden');

        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        accountsData = await response.json();
        processData();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('analysis').classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please check that the data file exists and is accessible.');
    }
}

// Process data and initialize charts
function processData() {
    filteredData = Object.values(accountsData);
    createAdvancedCharts();
}

// Create all advanced charts
function createAdvancedCharts() {
    createTemporalPatternChart();
}

// Create Temporal Pattern Analysis Chart
function createTemporalPatternChart() {
    const canvas = document.getElementById('temporalPatternChart');
    if (canvas.chart) canvas.chart.destroy();

    // Get initial settings from controls
    const groupBy = document.getElementById('temporalGroupBy').value;
    const timeUnit = document.getElementById('temporalTimeUnit').value;
    const chartType = document.getElementById('temporalChartType').value;

    // Process data based on grouping
    const timeSeriesData = processTemporalData(groupBy, timeUnit);

    // Create the chart
    canvas.chart = new Chart(canvas, {
        type: chartType === 'bar' ? 'bar' : chartType === 'area' ? 'line' : 'line',
        data: {
            labels: timeSeriesData.labels,
            datasets: timeSeriesData.datasets.map(dataset => ({
                label: dataset.label,
                data: dataset.data,
                backgroundColor: dataset.color,
                borderColor: dataset.color,
                borderWidth: 2,
                fill: chartType === 'area',
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 5
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !ci.getDatasetMeta(index).hidden : null;
                        ci.update();
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        threshold: 10
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cases'
                    },
                    ticks: {
                        precision: 0
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest',
                axis: 'x'
            },
            ...(chartType === 'bar' && {
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            })
        }
    });

    // Add reset zoom on right-click
    canvas.oncontextmenu = (e) => {
        e.preventDefault();
        if (canvas.chart) {
            canvas.chart.resetZoom();
        }
    };
}

// Process temporal data based on grouping and time unit
function processTemporalData(groupBy, timeUnit) {
    // Get all unique values for the grouping dimension
    const groups = new Set();
    filteredData.forEach(account => {
        groups.add(account[`ATTACK_${groupBy.toUpperCase()}`] || 'Unknown');
    });
    const groupList = Array.from(groups).sort();

    // Create date bins based on time unit
    const dateBins = {};
    filteredData.forEach(account => {
        const date = new Date(account.FOUND_ON);
        let binKey;

        if (timeUnit === 'day') {
            binKey = date.toISOString().split('T')[0];
        } else if (timeUnit === 'week') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            binKey = weekStart.toISOString().split('T')[0];
        } else if (timeUnit === 'month') {
            binKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (timeUnit === 'quarter') {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            binKey = `${date.getFullYear()}-Q${quarter}`;
        }

        if (!dateBins[binKey]) dateBins[binKey] = {};
        const groupValue = account[`ATTACK_${groupBy.toUpperCase()}`] || 'Unknown';
        dateBins[binKey][groupValue] = (dateBins[binKey][groupValue] || 0) + 1;
    });

    // Sort date bins chronologically
    const sortedBinKeys = Object.keys(dateBins).sort((a, b) => {
        if (timeUnit === 'quarter') {
            const [aYear, aQ] = a.split('-Q');
            const [bYear, bQ] = b.split('-Q');
            return aYear !== bYear ? aYear - bYear : aQ - bQ;
        }
        return a.localeCompare(b);
    });

    // Prepare dataset for each group
    const colors = [
        'rgba(99, 102, 241, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(5, 150, 105, 0.8)'
    ];

    const datasets = groupList.map((group, i) => ({
        label: group,
        data: sortedBinKeys.map(binKey => dateBins[binKey][group] || 0),
        color: colors[i % colors.length]
    }));

    // Format labels based on time unit
    let labels;
    if (timeUnit === 'day') {
        labels = sortedBinKeys.map(date => formatDate(date));
    } else if (timeUnit === 'week') {
        labels = sortedBinKeys.map(date => `Week of ${formatDate(date)}`);
    } else if (timeUnit === 'month') {
        labels = sortedBinKeys.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
    } else if (timeUnit === 'quarter') {
        labels = sortedBinKeys.map(quarter => {
            const [year, q] = quarter.split('-Q');
            return `Q${q} ${year}`;
        });
    }

    return { labels, datasets };
}

// Update temporal chart when controls change
function updateTemporalChart() {
    const canvas = document.getElementById('temporalPatternChart');
    if (!canvas.chart) return;

    const groupBy = document.getElementById('temporalGroupBy').value;
    const timeUnit = document.getElementById('temporalTimeUnit').value;
    const chartType = document.getElementById('temporalChartType').value;

    // Process new data
    const timeSeriesData = processTemporalData(groupBy, timeUnit);

    // Update chart
    canvas.chart.data.labels = timeSeriesData.labels;
    canvas.chart.data.datasets = timeSeriesData.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.color,
        borderColor: dataset.color,
        borderWidth: 2,
        fill: chartType === 'area',
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    }));

    // Change chart type if needed
    if (chartType === 'bar') {
        canvas.chart.config.type = 'bar';
        canvas.chart.options.scales.x.stacked = true;
        canvas.chart.options.scales.y.stacked = true;
    } else if (chartType === 'area') {
        canvas.chart.config.type = 'line';
        canvas.chart.options.scales.x.stacked = false;
        canvas.chart.options.scales.y.stacked = false;
    } else {
        canvas.chart.config.type = 'line';
        canvas.chart.options.scales.x.stacked = false;
        canvas.chart.options.scales.y.stacked = false;
    }

    canvas.chart.update();
}

// Format date to a more readable format
function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}