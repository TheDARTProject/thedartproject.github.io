// dashboard.js

// Import serverNames from servers.js
import serverNames from './servers.js';

// Main data object
let accountsData = {};
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

// Event listeners for dashboard page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        fetchData();
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterData);
    }

    const attackMethodFilter = document.getElementById('attackMethodFilter');
    if (attackMethodFilter) {
        attackMethodFilter.addEventListener('change', filterData);
    }

    // Add the server filter event listener here
    const serverFilter = document.getElementById('serverFilter');
    if (serverFilter) {
        serverFilter.addEventListener('change', filterData);
    }

    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', filterData);
    }

    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', filterData);
    }

    const prevPage = document.getElementById('prevPage');
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
            }
        });
    }

    const nextPage = document.getElementById('nextPage');
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < maxPage) {
                currentPage++;
                updateTable();
            }
        });
    }

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('detailModal').classList.add('hidden');
        });
    }

    const detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.classList.add('hidden');
            }
        });
    }

    const exportCSV = document.getElementById('exportCSV');
    if (exportCSV) {
        exportCSV.addEventListener('click', exportToCSV);
    }

    const refreshData = document.getElementById('refreshData');
    if (refreshData) {
        refreshData.addEventListener('click', fetchData);
    }

    const infoHeader = document.getElementById('infoHeader');
    const expandButton = document.getElementById('expandButton');
    if (infoHeader && expandButton) {
        infoHeader.addEventListener('click', toggleGlossary);
        expandButton.addEventListener('click', toggleGlossary);
    }
});

// Fetch data from JSON file
async function fetchData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');

        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        accountsData = await response.json();
        processData();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please check that the data file exists and is accessible.');
    }
}

// Process data and initialize charts
function processData() {
    populateFilters();
    filterData();
    updateStats();
    createCharts();
}

// Populate filter dropdowns
function populateFilters() {
    const attackMethods = new Set();
    const servers = new Set();
    const attackMethodFilter = document.getElementById('attackMethodFilter');
    const serverFilter = document.getElementById('serverFilter');

    attackMethodFilter.innerHTML = '<option value="">All Methods</option>';
    serverFilter.innerHTML = '<option value="">All Servers</option>';

    Object.values(accountsData).forEach(account => {
        attackMethods.add(account.ATTACK_METHOD);
        servers.add(account.FOUND_ON_SERVER);
    });

    attackMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        attackMethodFilter.appendChild(option);
    });

    servers.forEach(server => {
        const option = document.createElement('option');
        option.value = server;
        option.textContent = server;
        serverFilter.appendChild(option);
    });

    const dates = Object.values(accountsData).map(account => new Date(account.FOUND_ON));
    if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        document.getElementById('dateFrom').value = minDate.toISOString().split('T')[0];
        document.getElementById('dateTo').value = maxDate.toISOString().split('T')[0];
    }
}

// Filter data based on current filters
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const attackMethod = document.getElementById('attackMethodFilter').value;
    const server = document.getElementById('serverFilter').value;
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    dateTo.setHours(23, 59, 59);

    filteredData = Object.values(accountsData).filter(account => {
        const foundDate = new Date(account.FOUND_ON);

        // Check if any field in the account matches the search term
        const matchesSearch = Object.values(account).some(value => {
            if (typeof value === 'string') {
                return value.toLowerCase().includes(searchTerm);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                return value.toString().toLowerCase().includes(searchTerm);
            }
            return false;
        });

        const matchesAttackMethod = !attackMethod || account.ATTACK_METHOD === attackMethod;
        const matchesServer = !server || account.FOUND_ON_SERVER === server;
        const matchesDate = (!dateFrom || foundDate >= dateFrom) && (!dateTo || foundDate <= dateTo);

        return matchesSearch && matchesAttackMethod && matchesServer && matchesDate;
    });

    currentPage = 1;
    updateStats();
    updateTable();
    createCharts();
}

// Update main stats
function updateStats() {
    document.getElementById('totalAccounts').textContent = filteredData.length;

    const activeUrls = filteredData.filter(account =>
        account.FINAL_URL_STATUS === 'ACTIVE'
    ).length;
    document.getElementById('activeUrls').textContent = activeUrls;

    const activeUrlsElement = document.getElementById('activeUrls');
    const statusElement = document.getElementById('activeUrlsStatus');

    activeUrlsElement.classList.remove('text-red-600', 'text-orange-500', 'text-green-600');

    const activeFinalUrls = filteredData.filter(account =>
        account.FINAL_URL_STATUS === 'ACTIVE'
    ).length;

    let statusText;
    if (activeFinalUrls === 0) {
        activeUrlsElement.classList.add('text-green-600');
        statusText = 'No risk detected';
    } else if (activeFinalUrls <= 100) {
        activeUrlsElement.classList.add('text-green-600');
        statusText = 'Minimal risk detected';
    } else if (activeFinalUrls <= 200) {
        activeUrlsElement.classList.add('text-orange-500');
        statusText = 'Moderate risk detected';
    } else {
        activeUrlsElement.classList.add('text-red-600');
        statusText = 'Severe risk detected';
    }

    statusElement.textContent = statusText;

    const attackCounts = {};
    filteredData.forEach(account => {
        attackCounts[account.ATTACK_METHOD] = (attackCounts[account.ATTACK_METHOD] || 0) + 1;
    });

    let commonAttack = '';
    let maxCount = 0;
    for (const [attack, count] of Object.entries(attackCounts)) {
        if (count > maxCount) {
            maxCount = count;
            commonAttack = attack;
        }
    }
    document.getElementById('commonAttack').textContent = commonAttack || 'N/A';

    const platformCounts = {};
    filteredData.forEach(account => {
        platformCounts[account.ATTACK_SURFACE] = (platformCounts[account.ATTACK_SURFACE] || 0) + 1;
    });

    let targetedPlatform = '';
    maxCount = 0;
    for (const [platform, count] of Object.entries(platformCounts)) {
        if (count > maxCount) {
            maxCount = count;
            targetedPlatform = platform;
        }
    }
    document.getElementById('targetedPlatform').textContent = targetedPlatform || 'N/A';

    const deletedAccounts = filteredData.filter(account =>
        account.USERNAME && account.USERNAME.toLowerCase().includes('deleted_user_')
    ).length;
    document.getElementById('deletedAccounts').textContent = deletedAccounts;

    const timestamps = filteredData
        .filter(account => account.LAST_CHECK)
        .map(account => new Date(account.LAST_CHECK).getTime());

    const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
    const lastUpdatedElement = document.getElementById('lastUpdated');

    if (latestTimestamp) {
        const latestDate = new Date(latestTimestamp);
        const now = dayjs();
        const lastUpdate = dayjs(latestDate);

        const diffMinutes = now.diff(lastUpdate, 'minute');
        const diffHours = now.diff(lastUpdate, 'hour');
        const diffDays = now.diff(lastUpdate, 'day');

        let timeAgo;
        if (diffMinutes < 1) {
            timeAgo = 'just now';
        } else if (diffMinutes < 60) {
            timeAgo = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
        lastUpdatedElement.textContent = `Updated ${timeAgo}`;
    } else {
        lastUpdatedElement.textContent = 'Updated: data not available';
    }
}

// Update the data table
function updateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    pageData.forEach(account => {
        const row = document.createElement('tr');

        let statusClass = '';
        if (account.FINAL_URL_STATUS === 'ACTIVE') {
            statusClass = 'bg-red-100';
        } else if (account.FINAL_URL_STATUS === 'INACTIVE') {
            statusClass = 'bg-green-100';
        } else if (account.FINAL_URL_STATUS === 'UNKNOWN') {
            statusClass = 'bg-orange-100';
        }

        row.innerHTML = `
            <td class="px-6 py-4"><span class="truncate truncate-tooltip" title="${account.CASE_NUMBER}">${account.CASE_NUMBER}</span></td>
            <td class="px-6 py-4"><span class="truncate truncate-tooltip" title="${formatDate(account.FOUND_ON)}">${formatDate(account.FOUND_ON)}</span></td>
            <td class="px-6 py-4"><span class="truncate truncate-tooltip" title="${account.USERNAME}">${account.USERNAME}</span></td>
            <td class="px-6 py-4"><span class="truncate truncate-tooltip" title="${account.ATTACK_METHOD}">${account.ATTACK_METHOD}</span></td>
            <td class="px-6 py-4"><span class="truncate truncate-tooltip" title="${account.ATTACK_GOAL}">${account.ATTACK_GOAL}</span></td>
            <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass} truncate-tooltip" title="${account.FINAL_URL_STATUS}">
                    ${account.FINAL_URL_STATUS}
                </span>
            </td>
            <td class="px-6 py-4">
                <button class="text-indigo-600 hover:text-indigo-900 view-details" data-case="${account.CASE_NUMBER}">
                    View Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('tableInfo').textContent =
        `Showing ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length} cases`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredData.length;

    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const caseNumber = button.getAttribute('data-case');
            showAccountDetails(caseNumber);
        });
    });
}

// Show detailed information for a specific account
function showAccountDetails(caseNumber) {
    const account = Object.values(accountsData).find(acc => acc.CASE_NUMBER === caseNumber);
    if (!account) return;

    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 class="font-medium text-lg mb-2">Account Information</h3>
                <p><span class="font-medium">Case Number:</span> ${account.CASE_NUMBER}</p>
                <p><span class="font-medium">Found On:</span> ${formatDate(account.FOUND_ON)}</p>
                <p><span class="font-medium">Found On Server:</span> ${account.FOUND_ON_SERVER}</p>
                <p><span class="font-medium">Discord ID:</span> ${account.DISCORD_ID}</p>
                <p><span class="font-medium">Username:</span> ${account.USERNAME}</p>
                <p><span class="font-medium">Account Status:</span> ${account.ACCOUNT_STATUS}</p>
                <p><span class="font-medium">Behaviour:</span> ${account.BEHAVIOUR}</p>
                <p><span class="font-medium">Non-ASCII Username:</span> ${account.NON_ASCII_USERNAME ? 'Yes' : 'No'}</p>
            </div>
            <div>
                <h3 class="font-medium text-lg mb-2">Attack Details</h3>
                <p><span class="font-medium">Attack Method:</span> ${account.ATTACK_METHOD}</p>
                <p><span class="font-medium">Attack Vector:</span> ${account.ATTACK_VECTOR}</p>
                <p><span class="font-medium">Attack Goal:</span> ${account.ATTACK_GOAL}</p>
                <p><span class="font-medium">Attack Surface:</span> ${account.ATTACK_SURFACE}</p>
                <p><span class="font-medium">Suspected Region of Origin:</span> ${account.SUSPECTED_REGION_OF_ORIGIN}</p>
                <p><span class="font-medium">Last Check:</span> ${formatDate(account.LAST_CHECK)}</p>
            </div>
        </div>
        <div class="mt-4">
            <h3 class="font-medium text-lg mb-2">URLs</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">Surface URL</td>
                            <td class="px-6 py-4 url-cell">
                                <a href="#" class="text-indigo-600 hover:text-indigo-900 break-all">${account.SURFACE_URL}</a>
                            </td>
                            <td class="px-6 py-4 domain-cell" title="${account.SURFACE_URL_DOMAIN}">${account.SURFACE_URL_DOMAIN}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    account.SURFACE_URL_STATUS === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }">
                                    ${account.SURFACE_URL_STATUS}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">Final URL</td>
                            <td class="px-6 py-4 url-cell">
                                <a href="#" class="text-indigo-600 hover:text-indigo-900 break-all">${account.FINAL_URL}</a>
                            </td>
                            <td class="px-6 py-4 domain-cell" title="${account.FINAL_URL_DOMAIN}">${account.FINAL_URL_DOMAIN}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    account.FINAL_URL_STATUS === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }">
                                    ${account.FINAL_URL_STATUS}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// Create all charts
function createCharts() {
    createTimelineChart();
    createMethodsChart();
    createSurfacesChart();
    createRegionsChart();
    createBehaviourChart();
    createVectorsChart();
    createStatusChart();
    createAccountTypeChart();
    createGoalsChart();
    createMethodGoalChart();
    createServerCasesChart();
}

// Create server cases chart
function createServerCasesChart() {
    const canvas = document.getElementById('serverCasesChart');

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Count cases by server
    const serverCounts = {};
    let anonymousServerCount = 0;

    // Count the number of anonymous servers from serverNames
    const anonymousServerKeys = Object.keys(serverNames).filter(key => key.startsWith('ANONYMOUS_SERVER'));
    const totalAnonymousServers = anonymousServerKeys.length;

    filteredData.forEach(account => {
        const server = account.FOUND_ON_SERVER || 'Unknown';

        // Check if the server is an anonymous server
        if (server.startsWith('ANONYMOUS_SERVER')) {
            anonymousServerCount += 1;
        } else {
            serverCounts[server] = (serverCounts[server] || 0) + 1;
        }
    });

    // Add the aggregated anonymous server count to the serverCounts object
    if (anonymousServerCount > 0) {
        const anonymousLabel = totalAnonymousServers === 1 ?
            "1 Anonymous Server" :
            `${totalAnonymousServers} Anonymous Servers`;
        serverCounts[anonymousLabel] = anonymousServerCount;
    }

    // Map server codes to their full names using serverNames
    const labels = Object.keys(serverCounts).map(server => serverNames[server] || server);
    const data = Object.values(serverCounts);

    // Create chart
    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Cases',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo color
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.label}: ${context.raw} cases`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        }
    });
}

// Attack Goal Distribution
function createGoalsChart() {
    const canvas = document.getElementById('goalsChart');
    if (canvas.chart) canvas.chart.destroy();

    const goalsCounts = {};
    filteredData.forEach(account => {
        const goal = account.ATTACK_GOAL || 'Unknown';
        goalsCounts[goal] = (goalsCounts[goal] || 0) + 1;
    });

    const sortedGoals = Object.entries(goalsCounts).sort((a, b) => b[1] - a[1]);

    canvas.chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: sortedGoals.map(g => g[0]),
            datasets: [{
                data: sortedGoals.map(g => g[1]),
                backgroundColor: sortedGoals.map((_, i) =>
                    `hsl(${(i * 137) % 360}, 70%, 60%)`
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Attack Method vs Goal Matrix
function createMethodGoalChart() {
    const canvas = document.getElementById('methodGoalChart');
    if (canvas.chart) canvas.chart.destroy();

    const methodGoalCounts = {};
    const allMethods = new Set();
    const allGoals = new Set();

    filteredData.forEach(account => {
        const method = account.ATTACK_METHOD || 'Unknown';
        const goal = account.ATTACK_GOAL || 'Unknown';

        allMethods.add(method);
        allGoals.add(goal);

        if (!methodGoalCounts[method]) methodGoalCounts[method] = {};
        methodGoalCounts[method][goal] = (methodGoalCounts[method][goal] || 0) + 1;
    });

    const methods = Array.from(allMethods);
    const goals = Array.from(allGoals);
    const datasets = goals.map(goal => ({
        label: goal,
        data: methods.map(method => methodGoalCounts[method]?.[goal] || 0),
        backgroundColor: `hsl(${(goals.indexOf(goal) * 137) % 360}, 70%, 60%)`
    }));

    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: methods,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        autoSkip: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Behaviour Type Distribution
function createBehaviourChart() {
    const canvas = document.getElementById('behaviourChart');
    if (canvas.chart) canvas.chart.destroy();

    const behaviourCounts = {};
    filteredData.forEach(account => {
        const behaviour = account.BEHAVIOUR || 'Unknown';
        behaviourCounts[behaviour] = (behaviourCounts[behaviour] || 0) + 1;
    });

    canvas.chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: Object.keys(behaviourCounts),
            datasets: [{
                data: Object.values(behaviourCounts),
                backgroundColor: Object.keys(behaviourCounts).map((_, i) =>
                    `hsl(${(i * 197) % 360}, 70%, 60%)`
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Account Type Distribution
function createAccountTypeChart() {
    const canvas = document.getElementById('AccountTypeChart');
    if (canvas.chart) canvas.chart.destroy();

    const accountTypeCounts = {};
    filteredData.forEach(account => {
        const accountType = account.ACCOUNT_TYPE || 'Unknown';
        accountTypeCounts[accountType] = (accountTypeCounts[accountType] || 0) + 1;
    });

    const labels = Object.keys(accountTypeCounts);
    const data = Object.values(accountTypeCounts);

    canvas.chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Account Type Distribution',
                data: data,
                backgroundColor: labels.map((_, i) =>
                    `hsl(${(i * 137) % 360}, 70%, 60%)`
                ),
                borderWidth: 1
            }]
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
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Attack Vector Analysis
function createVectorsChart() {
    const canvas = document.getElementById('vectorsChart');
    if (canvas.chart) canvas.chart.destroy();

    const vectorCounts = {};
    filteredData.forEach(account => {
        const vector = account.ATTACK_VECTOR || 'Unknown';
        vectorCounts[vector] = (vectorCounts[vector] || 0) + 1;
    });

    const sortedVectors = Object.entries(vectorCounts)
        .sort((a, b) => b[1] - a[1]);

    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sortedVectors.map(v => v[0]),
            datasets: [{
                label: 'Number of Attacks',
                data: sortedVectors.map(v => v[1]),
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        }
    });
}

// URL Status Comparison
function createStatusChart() {
    const canvas = document.getElementById('statusChart');
    if (canvas.chart) canvas.chart.destroy();

    const statusCounts = {
        surfaceActive: 0,
        surfaceInactive: 0,
        surfaceUnknown: 0,
        finalActive: 0,
        finalInactive: 0,
        finalUnknown: 0
    };

    filteredData.forEach(account => {
        if (account.SURFACE_URL_STATUS === 'ACTIVE') statusCounts.surfaceActive++;
        else if (account.SURFACE_URL_STATUS === 'INACTIVE') statusCounts.surfaceInactive++;
        else statusCounts.surfaceUnknown++;

        if (account.FINAL_URL_STATUS === 'ACTIVE') statusCounts.finalActive++;
        else if (account.FINAL_URL_STATUS === 'INACTIVE') statusCounts.finalInactive++;
        else statusCounts.finalUnknown++;
    });

    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Surface URLs', 'Final URLs'],
            datasets: [{
                    label: 'Active',
                    data: [statusCounts.surfaceActive, statusCounts.finalActive],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)'
                },
                {
                    label: 'Inactive',
                    data: [statusCounts.surfaceInactive, statusCounts.finalInactive],
                    backgroundColor: 'rgba(16, 185, 129, 0.8)'
                },
                {
                    label: 'Unknown',
                    data: [statusCounts.surfaceUnknown, statusCounts.finalUnknown],
                    backgroundColor: 'rgba(251, 191, 36, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index'
                }
            }
        }
    });
}

// Create timeline chart
function createTimelineChart() {
    const canvas = document.getElementById('timelineChart');

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const dateGroups = {};
    filteredData.forEach(account => {
        const date = account.FOUND_ON;
        dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateGroups).sort();

    canvas.chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: sortedDates.map(date => formatDate(date)),
            datasets: [{
                label: 'Compromised Accounts',
                data: sortedDates.map(date => dateGroups[date]),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create attack methods chart
function createMethodsChart() {
    const canvas = document.getElementById('methodsChart');

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const methodCounts = {};
    filteredData.forEach(account => {
        const method = account.ATTACK_METHOD;
        methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    const labels = Object.keys(methodCounts);
    const data = Object.values(methodCounts);

    const backgroundColors = labels.map((_, i) =>
        `hsl(${(i * 137) % 360}, 70%, 60%)`
    );

    canvas.chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create attack surfaces chart
function createSurfacesChart() {
    const canvas = document.getElementById('surfacesChart');

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const surfaceCounts = {};
    filteredData.forEach(account => {
        const surface = account.ATTACK_SURFACE;
        surfaceCounts[surface] = (surfaceCounts[surface] || 0) + 1;
    });

    const labels = Object.keys(surfaceCounts);
    const data = Object.values(surfaceCounts);

    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Target Count',
                data: data,
                backgroundColor: 'rgba(6, 182, 212, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create regions chart
function createRegionsChart() {
    const canvas = document.getElementById('regionsChart');

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const regionCounts = {};
    filteredData.forEach(account => {
        const region = account.SUSPECTED_REGION_OF_ORIGIN || 'UNKNOWN';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    const labels = Object.keys(regionCounts);
    const data = Object.values(regionCounts);

    const backgroundColors = labels.map((_, i) =>
        `hsl(${(i * 137 + 60) % 360}, 70%, 60%)`
    );

    canvas.chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
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

// Export data to CSV
function exportToCSV() {
    const headers = [
        'Case Number',
        'Found On',
        'Discord ID',
        'Username',
        'Behaviour',
        'Attack Method',
        'Attack Vector',
        'Attack Goal',
        'Attack Surface',
        'Suspected Region',
        'Surface URL',
        'Surface URL Domain',
        'Surface URL Status',
        'Final URL',
        'Final URL Domain',
        'Final URL Status'
    ];

    let csvContent = headers.join(',') + '\n';

    filteredData.forEach(account => {
        const row = [
            account.CASE_NUMBER,
            account.FOUND_ON,
            account.DISCORD_ID,
            `"${(account.USERNAME || '').replace(/"/g, '""')}"`,
            `"${(account.BEHAVIOUR || '').replace(/"/g, '""')}"`,
            `"${(account.ATTACK_METHOD || '').replace(/"/g, '""')}"`,
            `"${(account.ATTACK_VECTOR || '').replace(/"/g, '""')}"`,
            `"${(account.ATTACK_GOAL || '').replace(/"/g, '""')}"`,
            `"${(account.ATTACK_SURFACE || '').replace(/"/g, '""')}"`,
            account.SUSPECTED_REGION_OF_ORIGIN,
            `"${(account.SURFACE_URL || '').replace(/"/g, '""')}"`,
            account.SURFACE_URL_DOMAIN,
            account.SURFACE_URL_STATUS,
            `"${(account.FINAL_URL || '').replace(/"/g, '""')}"`,
            account.FINAL_URL_DOMAIN,
            account.FINAL_URL_STATUS
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'malicious_accounts_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Data Glossary Toggle
function toggleGlossary() {
    const infoContent = document.getElementById('infoContent');
    const expandButton = document.getElementById('expandButton');

    infoContent.classList.toggle('open');
    expandButton.classList.toggle('rotate-180');

    const isExpanded = infoContent.classList.contains('open');
    expandButton.setAttribute('aria-expanded', isExpanded);
}