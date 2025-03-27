// database.js

// Import serverNames from servers.js
import servers from './servers.js';
const serverNames = servers.serverNames;

// Main data object
let accountsData = {};
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 50;

// Event listeners for database page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('database.html')) {
        fetchData();
    }

    // Filter event listeners
    document.getElementById('searchInput').addEventListener('input', filterData);
    document.getElementById('statusFilter').addEventListener('change', filterData);
    document.getElementById('urlStatusFilter').addEventListener('change', filterData);
    document.getElementById('attackMethodFilter').addEventListener('change', filterData);
    document.getElementById('attackSurfaceFilter').addEventListener('change', filterData);
    document.getElementById('regionFilter').addEventListener('change', filterData);
    document.getElementById('serverFilter').addEventListener('change', filterData);
    document.getElementById('accountTypeFilter').addEventListener('change', filterData);
    document.getElementById('dateFrom').addEventListener('change', filterData);
    document.getElementById('dateTo').addEventListener('change', filterData);

    // Reset filters button
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Pagination controls
    document.getElementById('firstPage').addEventListener('click', () => {
        currentPage = 1;
        updateTable();
    });
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            updateTable();
        }
    });
    document.getElementById('lastPage').addEventListener('click', () => {
        currentPage = Math.ceil(filteredData.length / rowsPerPage);
        updateTable();
    });

    // Export and refresh buttons
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('refreshData').addEventListener('click', fetchData);

    // Modal close button
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('detailModal').classList.add('hidden');
    });

    // Modal backdrop click
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('detailModal')) {
            document.getElementById('detailModal').classList.add('hidden');
        }
    });
});

// Fetch data from JSON file
async function fetchData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('databaseContent').classList.add('hidden');

        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        accountsData = await response.json();
        processData();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('databaseContent').classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please check that the data file exists and is accessible.');
    }
}

// Process data and initialize filters
function processData() {
    populateFilters();
    filterData();
    updateStats();
}

// Populate filter dropdowns
function populateFilters() {
    const statuses = new Set();
    const urlStatuses = new Set();
    const attackMethods = new Set();
    const attackSurfaces = new Set();
    const regions = new Set();
    const servers = new Set();
    const accountTypes = new Set();

    // Get all unique values for each filter
    Object.values(accountsData).forEach(account => {
        statuses.add(account.ACCOUNT_STATUS);
        urlStatuses.add(account.FINAL_URL_STATUS);
        attackMethods.add(account.ATTACK_METHOD);
        attackSurfaces.add(account.ATTACK_SURFACE);
        regions.add(account.SUSPECTED_REGION_OF_ORIGIN);
        servers.add(account.FOUND_ON_SERVER);
        accountTypes.add(account.ACCOUNT_TYPE);
    });

    // Populate status filter
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.innerHTML = '<option value="">All Statuses</option>';
    Array.from(statuses).sort().forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });

    // Populate URL status filter
    const urlStatusFilter = document.getElementById('urlStatusFilter');
    urlStatusFilter.innerHTML = '<option value="">All Statuses</option>';
    Array.from(urlStatuses).sort().forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        urlStatusFilter.appendChild(option);
    });

    // Populate attack method filter
    const attackMethodFilter = document.getElementById('attackMethodFilter');
    attackMethodFilter.innerHTML = '<option value="">All Methods</option>';
    Array.from(attackMethods).sort().forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        attackMethodFilter.appendChild(option);
    });

    // Populate attack surface filter
    const attackSurfaceFilter = document.getElementById('attackSurfaceFilter');
    attackSurfaceFilter.innerHTML = '<option value="">All Surfaces</option>';
    Array.from(attackSurfaces).sort().forEach(surface => {
        const option = document.createElement('option');
        option.value = surface;
        option.textContent = surface;
        attackSurfaceFilter.appendChild(option);
    });

    // Populate region filter
    const regionFilter = document.getElementById('regionFilter');
    regionFilter.innerHTML = '<option value="">All Regions</option>';
    Array.from(regions).sort().forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
    });

    // Populate account type filter
    const accountTypeFilter = document.getElementById('accountTypeFilter');
    accountTypeFilter.innerHTML = '<option value="">All Types</option>';
    Array.from(accountTypes).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        accountTypeFilter.appendChild(option);
    });

    // Populate server filter with nice names
    const serverFilter = document.getElementById('serverFilter');
    serverFilter.innerHTML = '<option value="">All Servers</option>';

    // Convert the servers Set to an array and sort it alphabetically
    const sortedServers = Array.from(servers).sort((a, b) => {
        // Get the display names for comparison
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

        // Check if the server is an anonymous server
        if (server.startsWith('ANONYMOUS_SERVER')) {
            // Extract the number from the server key (e.g., "ANONYMOUS_SERVER_1" -> "1")
            const serverNumber = server.split('_').pop();
            // Format the label as "Anonymous Server #1"
            option.textContent = `Anonymous Server #${serverNumber}`;
        } else {
            // Use the nice name from serverNames
            option.textContent = serverNames[server] || server;
        }

        serverFilter.appendChild(option);
    });

    // Set default date range
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
    const status = document.getElementById('statusFilter').value;
    const urlStatus = document.getElementById('urlStatusFilter').value;
    const attackMethod = document.getElementById('attackMethodFilter').value;
    const attackSurface = document.getElementById('attackSurfaceFilter').value;
    const region = document.getElementById('regionFilter').value;
    const server = document.getElementById('serverFilter').value;
    const accountType = document.getElementById('accountTypeFilter').value;
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    dateTo.setHours(23, 59, 59);

    filteredData = Object.values(accountsData).filter(account => {
        const foundDate = new Date(account.FOUND_ON);

        // Check if any field in the account matches the search term
        const matchesSearch = searchTerm === '' ||
            Object.values(account).some(value => {
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchTerm);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    return value.toString().toLowerCase().includes(searchTerm);
                }
                return false;
            });

        const matchesStatus = !status || account.ACCOUNT_STATUS === status;
        const matchesUrlStatus = !urlStatus || account.FINAL_URL_STATUS === urlStatus;
        const matchesAttackMethod = !attackMethod || account.ATTACK_METHOD === attackMethod;
        const matchesAttackSurface = !attackSurface || account.ATTACK_SURFACE === attackSurface;
        const matchesRegion = !region || account.SUSPECTED_REGION_OF_ORIGIN === region;
        const matchesServer = !server || account.FOUND_ON_SERVER === server;
        const matchesAccountType = !accountType || account.ACCOUNT_TYPE === accountType;
        const matchesDate = (!dateFrom || foundDate >= dateFrom) && (!dateTo || foundDate <= dateTo);

        return matchesSearch && matchesStatus && matchesUrlStatus &&
            matchesAttackMethod && matchesAttackSurface && matchesRegion &&
            matchesServer && matchesAccountType && matchesDate;
    });

    currentPage = 1;
    updateStats();
    updateTable();
}

// Reset all filters to default
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('urlStatusFilter').value = '';
    document.getElementById('attackMethodFilter').value = '';
    document.getElementById('attackSurfaceFilter').value = '';
    document.getElementById('regionFilter').value = '';
    document.getElementById('serverFilter').value = '';
    document.getElementById('accountTypeFilter').value = '';

    // Reset date range to min/max
    const dates = Object.values(accountsData).map(account => new Date(account.FOUND_ON));
    if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        document.getElementById('dateFrom').value = minDate.toISOString().split('T')[0];
        document.getElementById('dateTo').value = maxDate.toISOString().split('T')[0];
    }

    filterData();
}

// Update stats counters
function updateStats() {
    const totalCases = filteredData.length;
    document.getElementById('totalCasesCount').textContent = totalCases;

    const activeUrls = filteredData.filter(account =>
        account.FINAL_URL_STATUS === 'ACTIVE'
    ).length;
    document.getElementById('activeUrlsCount').textContent = activeUrls;

    const criticalCases = filteredData.filter(account =>
        account.ACCOUNT_STATUS === 'COMPROMISED' &&
        account.FINAL_URL_STATUS === 'ACTIVE'
    ).length;
    document.getElementById('criticalCasesCount').textContent = criticalCases;
}

// Update the data table
function updateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    pageData.forEach(account => {
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50');

        // Determine status color
        let statusClass = '';
        if (account.ACCOUNT_STATUS === 'COMPROMISED') {
            statusClass = 'bg-red-100 text-red-800';
        } else if (account.ACCOUNT_STATUS === 'SUSPICIOUS') {
            statusClass = 'bg-yellow-100 text-yellow-800';
        } else if (account.ACCOUNT_STATUS === 'SECURE' || account.ACCOUNT_STATUS === 'RECOVERED') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (account.ACCOUNT_STATUS === 'DELETED') {
            statusClass = 'bg-orange-100 text-orange-800';
        }

        // Determine URL status color
        let urlStatusClass = '';
        if (account.FINAL_URL_STATUS === 'ACTIVE') {
            urlStatusClass = 'bg-red-100 text-red-800';
        } else if (account.FINAL_URL_STATUS === 'INACTIVE') {
            urlStatusClass = 'bg-green-100 text-green-800';
        } else if (account.FINAL_URL_STATUS === 'UNKNOWN') {
            urlStatusClass = 'bg-yellow-100 text-yellow-800';
        }

        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="font-medium">${account.CASE_NUMBER}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                ${formatDate(account.FOUND_ON)}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="truncate truncate-tooltip" title="${account.USERNAME}">${account.USERNAME}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${account.ACCOUNT_STATUS}
                </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="truncate truncate-tooltip" title="${account.ATTACK_METHOD}">${account.ATTACK_METHOD}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                ${account.ATTACK_SURFACE}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                ${account.SUSPECTED_REGION_OF_ORIGIN}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${urlStatusClass}">
                    ${account.FINAL_URL_STATUS}
                </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <button class="text-indigo-600 hover:text-indigo-900 view-details" data-case="${account.CASE_NUMBER}">
                    View Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update table info
    document.getElementById('tableInfo').textContent =
        `Showing ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length} cases`;

    // Update pagination info
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;

    // Enable/disable pagination buttons
    document.getElementById('firstPage').disabled = currentPage === 1;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    document.getElementById('lastPage').disabled = currentPage >= totalPages;

    // Add event listeners to view details buttons
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

    // Calculate the time till compromise in days
    const createdDate = new Date(account.ACCOUNT_CREATION);
    const foundDate = new Date(account.FOUND_ON);
    const timeTillCompromise = Math.floor((foundDate - createdDate) / (1000 * 60 * 60 * 24));

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
                <p><span class="font-medium">Account Type:</span> ${account.ACCOUNT_TYPE}</p>
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
                <p><span class="font-medium">Non-ASCII Username:</span> ${account.NON_ASCII_USERNAME ? 'Yes' : 'No'}</p>
                <p><span class="font-medium">Last Check:</span> ${formatDate(account.LAST_CHECK)}</p>
                <p><span class="font-medium">Time Till Compromise:</span> ${timeTillCompromise} days</p>
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
    `;

    modal.classList.remove('hidden');
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
        'Found On Server',
        'Discord ID',
        'Username',
        'Account Status',
        'Account Type',
        'Account Creation',
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
        'Final URL Status',
        'Non-ASCII Username',
        'Last Check'
    ];

    let csvContent = headers.join(',') + '\n';

    filteredData.forEach(account => {
        const row = [
            account.CASE_NUMBER,
            account.FOUND_ON,
            account.FOUND_ON_SERVER,
            account.DISCORD_ID,
            `"${(account.USERNAME || '').replace(/"/g, '""')}"`,
            account.ACCOUNT_STATUS,
            account.ACCOUNT_TYPE,
            account.ACCOUNT_CREATION,
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
            account.FINAL_URL_STATUS,
            account.NON_ASCII_USERNAME,
            account.LAST_CHECK
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cda_database_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}