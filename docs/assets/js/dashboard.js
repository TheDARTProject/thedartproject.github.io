// dashboard.js

// Import serverNames from servers.js
import servers from './servers.js';
const serverNames = servers.serverNames;

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

    const timeRangeFilter = document.getElementById('timeRangeFilter');
    if (timeRangeFilter) {
      timeRangeFilter.addEventListener('change', filterData);
    }

    const displayByFilter = document.getElementById('displayByFilter');
    if (displayByFilter) {
      displayByFilter.addEventListener('change', filterData);
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

    const sortedServers = Array.from(servers).sort((a, b) => {
        const nameA = a.startsWith('ANONYMOUS_SERVER') ?
            `Anonymous Server #${a.split('_').pop()}` :
            serverNames[a] || a;
        const nameB = b.startsWith('ANONYMOUS_SERVER') ?
            `Anonymous Server #${b.split('_').pop()}` :
            serverNames[b] || b;

        return nameA.localeCompare(nameB);
    });

    sortedServers.forEach(server => {
        const option = document.createElement('option');
        option.value = server;

        if (server.startsWith('ANONYMOUS_SERVER')) {
            const serverNumber = server.split('_').pop();
            option.textContent = `Anonymous Server #${serverNumber}`;
        } else {
            option.textContent = serverNames[server] || server;
        }

        serverFilter.appendChild(option);
    });

    // Set initial date range for "All Time"
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
    const timeRange = document.getElementById('timeRangeFilter').value;
    const displayBy = document.getElementById('displayByFilter').value;

    let dateFrom = new Date(document.getElementById('dateFrom').value);
    let dateTo = new Date(document.getElementById('dateTo').value);

    if (timeRange !== 'all') {
        // Apply predefined time range
        const months = parseInt(timeRange);
        dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - months);
        dateTo = new Date();

        // Update the date inputs to reflect the selected time range
        document.getElementById('dateFrom').value = dateFrom.toISOString().split('T')[0];
        document.getElementById('dateTo').value = dateTo.toISOString().split('T')[0];
    } else {
        // Reset to full date range when "All Time" is selected
        const dates = Object.values(accountsData).map(account => new Date(account.FOUND_ON));
        if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            dateFrom = minDate;
            dateTo = maxDate;

            // Update the date inputs to show full range
            document.getElementById('dateFrom').value = minDate.toISOString().split('T')[0];
            document.getElementById('dateTo').value = maxDate.toISOString().split('T')[0];
        }
    }

    dateTo.setHours(23, 59, 59);

    filteredData = Object.values(accountsData).filter(account => {
        const foundDate = new Date(account.FOUND_ON);

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

    // Count attack methods only for active URLs
    const activeAccounts = filteredData.filter(account =>
        account.FINAL_URL_STATUS === 'ACTIVE'
    );

    const attackCounts = {};
    activeAccounts.forEach(account => {
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

    // Count platforms only for active URLs
    const platformCounts = {};
    activeAccounts.forEach(account => {
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
        .map(account => {
            // Convert UTC time to local time
            const utcDate = new Date(account.LAST_CHECK);
            return new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000).getTime();
        });

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

    // Helper functions for URL testing defined inline
    const virusTotalLink = function(url) {
        const base64Url = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return `https://www.virustotal.com/gui/url/${base64Url}`;
    };

    const urlVoidLink = function(url) {
        // Extract the domain from the URL
        let domain = url;
        try {
            // Remove protocol (http://, https://, etc.)
            if (domain.includes('://')) {
                domain = domain.split('://')[1];
            }
            // Get just the domain part (remove paths, query params, etc.)
            if (domain.includes('/')) {
                domain = domain.split('/')[0];
            }
            // Remove any trailing slash
            domain = domain.replace(/\/$/, '');
            // Remove any www. prefix if present
            domain = domain.replace(/^www\./, '');
        } catch (e) {
            // If any error occurs during parsing, use the original URL
            console.error("Error extracting domain:", e);
        }

        return `https://www.urlvoid.com/scan/${domain}/`;
    };

    const ipQualityScoreLink = function(url) {
        // For IPQualityScore, we encode the URL and append it to their scanner URL
        return `https://www.ipqualityscore.com/threat-feeds/malicious-url-scanner/${encodeURIComponent(url)}`;
    };

    // Calculate the time till compromise in days
    const createdDate = new Date(account.ACCOUNT_CREATION);
    const foundDate = new Date(account.FOUND_ON);
    const timeTillCompromise = Math.floor((foundDate - createdDate) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

    modalContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 class="font-medium text-lg mb-2">Case Information</h3>
                <p><span class="font-medium">Case Number:</span> ${account.CASE_NUMBER}</p>
                <p><span class="font-medium">Found On:</span> ${formatDate(account.FOUND_ON)}</p>
                <p><span class="font-medium">Found On Server:</span> ${account.FOUND_ON_SERVER}</p>
                <p><span class="font-medium">Discord ID:</span> ${account.DISCORD_ID}</p>
                <p><span class="font-medium">Username:</span> ${account.USERNAME}</p>
                <p><span class="font-medium">Account Status:</span> ${account.ACCOUNT_STATUS}</p>
                <p><span class="font-medium">Created on:</span> ${formatDate(account.ACCOUNT_CREATION)}</p>
                <p><span class="font-medium">Behaviour:</span> ${account.BEHAVIOUR}</p>
            </div>
            <div>
                <h3 class="font-medium text-lg mb-2">Attack Details</h3>
                <p><span class="font-medium">Attack Method:</span> ${account.ATTACK_METHOD}</p>
                <p><span class="font-medium">Attack Vector:</span> ${account.ATTACK_VECTOR}</p>
                <p><span class="font-medium">Attack Goal:</span> ${account.ATTACK_GOAL}</p>
                <p><span class="font-medium">Attack Surface:</span> ${account.ATTACK_SURFACE}</p>
                <p><span class="font-medium">Suspected Region of Origin:</span> ${account.SUSPECTED_REGION_OF_ORIGIN}</p>
                <p><span class="font-medium">Last Check:</span> ${formatDate(account.LAST_CHECK)}</p>
                <p><span class="font-medium">Time Till Compromise:</span> ${timeTillCompromise} days</p>
                <p><span class="font-medium">Non-ASCII Username:</span> ${account.NON_ASCII_USERNAME ? 'Yes' : 'No'}</p>
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
                                <span class="spoiler" onclick="this.classList.toggle('revealed')">${account.SURFACE_URL}</span>
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
                                <span class="spoiler" onclick="this.classList.toggle('revealed')">${account.FINAL_URL}</span>
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
        <!-- Buttons for Testing URLs -->
        <div class="mt-6 text-center">
            <h3 class="font-medium text-lg mb-2 text-center">Test URLs</h3>
            <div class="flex justify-center gap-2">
                <button onclick="window.open('${virusTotalLink(account.FINAL_URL)}', '_blank')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    VirusTotal
                </button>
                <button onclick="window.open('${ipQualityScoreLink(account.FINAL_URL)}', '_blank')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                    IPQualityScore
                </button>
                <button onclick="window.open('${urlVoidLink(account.FINAL_URL)}', '_blank')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                    URLVoid
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// Create Final Domains Distribution Chart
function createFinalDomainsChart() {
    const canvas = document.getElementById('finalDomainsChart');

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const domainCounts = {};
    filteredData.forEach(account => {
        const domain = account.FINAL_URL_DOMAIN || 'Unknown';
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });

    // Sort domains by count in descending order
    const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);

    // Limit to top 10 domains for better visualization
    const topDomains = sortedDomains.slice(0, 10);

    const labels = topDomains.map(d => d[0]);
    const data = topDomains.map(d => d[1]);

    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Cases',
                data: data,
                backgroundColor: 'rgba(255, 159, 64, 0.8)', // Orange color
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

// Create Average Time Till Compromise Chart
function createAverageTimeChart() {
    const canvas = document.getElementById('averageTimeChart');

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Calculate the average time till compromise per year
    const yearData = {};
    Object.values(accountsData).forEach(account => {
        const foundDate = new Date(account.FOUND_ON);
        const creationDate = new Date(account.ACCOUNT_CREATION);
        const year = foundDate.getFullYear();

        if (!isNaN(foundDate) && !isNaN(creationDate)) {
            const timeDiff = foundDate - creationDate; // Difference in milliseconds
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert to days

            if (!yearData[year]) {
                yearData[year] = {
                    totalDays: 0,
                    count: 0
                };
            }
            yearData[year].totalDays += daysDiff;
            yearData[year].count += 1;
        }
    });

    // Calculate the average days per year
    const labels = Object.keys(yearData).sort();
    const data = labels.map(year => (yearData[year].totalDays / yearData[year].count).toFixed(2));

    // Create the chart
    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Days Till Compromise',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.8)', // Teal color
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
                            return `${context.label}: ${context.raw} days`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Days'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            }
        }
    });
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
    createServerAttackTrendsChart();
    createServerCasesChart();
    createFinalDomainsChart();
    createAverageTimeChart()
}

// Create server cases chart
function createServerCasesChart() {
    const canvas = document.getElementById('serverCasesChart');
    if (canvas.chart) canvas.chart.destroy();

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
            // Use the nice name from serverNames
            const niceName = serverNames[server] || server;
            serverCounts[niceName] = (serverCounts[niceName] || 0) + 1;
        }
    });

    // Add the aggregated anonymous server count to the serverCounts object
    if (anonymousServerCount > 0) {
        const anonymousLabel = totalAnonymousServers === 1 ?
            "1 Anonymous Server" :
            `${totalAnonymousServers} Anonymous Servers`;
        serverCounts[anonymousLabel] = anonymousServerCount;
    }

    // Sort servers by count (descending)
    const sortedServers = Object.entries(serverCounts)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedServers.map(s => s[0]);
    const data = sortedServers.map(s => s[1]);

    // Create chart
    canvas.chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Cases',
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
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
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

    // Sort goals by count (descending)
    const sortedGoals = Object.entries(goalsCounts)
        .sort((a, b) => b[1] - a[1]);

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

// Create Server Attack Trends Chart
function createServerAttackTrendsChart() {
    const canvas = document.getElementById('serverAttackTrendsChart');
    if (canvas.chart) canvas.chart.destroy();

    const selectedServer = document.getElementById('serverFilter').value;

    // Aggregate data
    const serverGoalCounts = {};
    const servers = new Set();
    const goals = new Set();

    filteredData.forEach(account => {
        const server = account.FOUND_ON_SERVER || 'Unknown';
        const goal = account.ATTACK_GOAL || 'Unknown';

        servers.add(server);
        goals.add(goal);

        if (!serverGoalCounts[server]) serverGoalCounts[server] = {};
        serverGoalCounts[server][goal] = (serverGoalCounts[server][goal] || 0) + 1;
    });

    // Sort servers by total attacks
    const sortedServers = Array.from(servers).sort((a, b) => {
        const totalA = Object.values(serverGoalCounts[a] || {}).reduce((sum, count) => sum + count, 0);
        const totalB = Object.values(serverGoalCounts[b] || {}).reduce((sum, count) => sum + count, 0);
        return totalB - totalA;
    });

    // Sort goals by frequency
    const sortedGoals = Array.from(goals).sort((a, b) => {
        if (selectedServer) {
            return (serverGoalCounts[selectedServer]?.[b] || 0) - (serverGoalCounts[selectedServer]?.[a] || 0);
        }
        return sortedServers.reduce((sum, server) => sum + (serverGoalCounts[server]?.[b] || 0), 0) -
            sortedServers.reduce((sum, server) => sum + (serverGoalCounts[server]?.[a] || 0), 0);
    });

    const displayServers = selectedServer ? [selectedServer] : sortedServers.slice(0, 10);

    // Prepare datasets
    const datasets = sortedGoals.map(goal => ({
        label: goal,
        data: displayServers.map(server => serverGoalCounts[server]?.[goal] || 0),
        backgroundColor: `hsl(${(sortedGoals.indexOf(goal) * 60 % 360)}, 70%, 60%)`,
        borderWidth: 1
    }));

    canvas.chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: displayServers.map(server =>
                server.startsWith('ANONYMOUS_SERVER') ?
                `Anonymous Server #${server.split('_').pop()}` :
                serverNames[server] || server
            ),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        autoSkip: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        text: 'Number of Attacks',
                        display: true
                    },
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const server = displayServers[context.dataIndex];
                            const total = Object.values(serverGoalCounts[server] || {}).reduce((a, b) => a + b, 0);
                            const value = context.raw || 0;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${context.dataset.label}: ${value} (${percentage}%)`;
                        },
                        footer: (context) => {
                            if (!selectedServer && context.length > 0) {
                                const server = displayServers[context[0].dataIndex];
                                const total = Object.values(serverGoalCounts[server] || {}).reduce((a, b) => a + b, 0);
                                return `Total: ${total} cases`;
                            }
                            return null;
                        }
                    },
                    displayColors: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    bodyFont: {
                        size: 12
                    },
                    footerFont: {
                        size: 12,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'top',
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !ci.getDatasetMeta(index).hidden : null;
                        ci.update();
                    },
                    labels: {
                        sort: (a, b) => sortedGoals.indexOf(b.text) - sortedGoals.indexOf(a.text),
                        padding: 20,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
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

    // Sort behaviours by count (descending)
    const sortedBehaviours = Object.entries(behaviourCounts)
        .sort((a, b) => b[1] - a[1]);

    canvas.chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: sortedBehaviours.map(b => b[0]),
            datasets: [{
                data: sortedBehaviours.map(b => b[1]),
                backgroundColor: sortedBehaviours.map((_, i) =>
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

    // Sort account types by count (descending)
    const sortedTypes = Object.entries(accountTypeCounts)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedTypes.map(t => t[0]);
    const data = sortedTypes.map(t => t[1]);

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

    const displayBy = document.getElementById('displayByFilter').value;
    const dateGroups = {};

    filteredData.forEach(account => {
        const date = new Date(account.FOUND_ON);
        let groupKey;

        switch(displayBy) {
            case 'weekly':
                // Group by week (year + week number)
                const week = getWeek(date);
                groupKey = `${date.getFullYear()}-W${week}`;
                break;
            case 'monthly':
                // Group by month (year + month)
                groupKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                break;
            case 'yearly':
                // Group by year
                groupKey = date.getFullYear().toString();
                break;
            default: // daily
                groupKey = account.FOUND_ON; // Use the original date string
        }

        dateGroups[groupKey] = (dateGroups[groupKey] || 0) + 1;
    });

    // Convert to array and sort
    const sortedGroups = Object.entries(dateGroups).sort((a, b) => {
        return new Date(a[0]) - new Date(b[0]);
    });

    // Format labels based on displayBy
    const labels = sortedGroups.map(([dateKey]) => {
        if (displayBy === 'weekly') {
            const [year, week] = dateKey.split('-W');
            return `Week ${week}, ${year}`;
        } else if (displayBy === 'monthly') {
            const [year, month] = dateKey.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (displayBy === 'yearly') {
            return dateKey;
        } else {
            return formatDate(dateKey);
        }
    });

    const data = sortedGroups.map(([_, count]) => count);

    // Create the chart with zoom/pan options
    canvas.chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Compromised Accounts',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
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
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        },
                        title: function(context) {
                            return context[0].label;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        threshold: 10,
                        overScaleMode: 'x'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
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
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest',
                axis: 'x'
            }
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

// Helper function to get week number
function getWeek(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Create attack methods chart
function createMethodsChart() {
    const canvas = document.getElementById('methodsChart');
    if (canvas.chart) canvas.chart.destroy();

    const methodCounts = {};
    filteredData.forEach(account => {
        const method = account.ATTACK_METHOD;
        methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    // Sort methods by count (descending)
    const sortedMethods = Object.entries(methodCounts)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedMethods.map(m => m[0]);
    const data = sortedMethods.map(m => m[1]);

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

    // Sort surfaces by count (descending)
    const sortedSurfaces = Object.entries(surfaceCounts)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedSurfaces.map(s => s[0]);
    const data = sortedSurfaces.map(s => s[1]);

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
    if (canvas.chart) canvas.chart.destroy();

    const regionCounts = {};
    filteredData.forEach(account => {
        const region = account.SUSPECTED_REGION_OF_ORIGIN || 'UNKNOWN';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // Sort regions by count (descending)
    const sortedRegions = Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedRegions.map(r => r[0]);
    const data = sortedRegions.map(r => r[1]);

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