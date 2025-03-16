// Main data object
let accountsData = {};
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for the info button
    const infoButton = document.getElementById('infoButton');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            window.location.href = 'info.html';
        });
    }

    // Other event listeners and initialization code...
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

    initializeTheme();

    const symbols = ['🔒', '🛡️', '🔐', '⚠️', '{...}', '</>',
        '101010', '0x1A3F', 'SSL', 'HTTPS', 'RSA', 'SHA-256'
    ];

    // Create and initialize symbol animation
    initializeSecuritySymbols(symbols);
});

function initializeSecuritySymbols(symbols) {
    if (!document.querySelector('.texture')) {
        setTimeout(() => {
            if (document.querySelector('.texture')) {
                startSecuritySymbolsAnimation(symbols);
            }
        }, 500);
    } else {
        startSecuritySymbolsAnimation(symbols);
    }
}

function startSecuritySymbolsAnimation(symbols) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const container = document.body;
    let animationInterval;

    // Function to add security symbol
    function addSecuritySymbol() {
        if (!document.querySelector('.texture')) {
            clearInterval(animationInterval);
            return;
        }

        const symbol = document.createElement('div');
        symbol.className = 'security-symbol';
        symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        // Random position
        symbol.style.left = Math.random() * 95 + '%';
        symbol.style.top = Math.random() * 95 + '%';
        symbol.style.fontSize = (Math.random() * 14 + 8) + 'px';
        symbol.style.opacity = '0';
        symbol.style.transform = 'rotate(' + (Math.random() * 40 - 20) + 'deg)';
        symbol.style.zIndex = '-1'; // Ensure it stays behind content
        symbol.style.pointerEvents = 'none'; // Ensure it doesn't block interaction

        container.appendChild(symbol);

        // Animate it
        setTimeout(() => {
            symbol.style.animation = 'symbolFade 3s ease-in-out forwards';

            // Remove after animation
            setTimeout(() => {
                if (symbol && symbol.parentNode === container) {
                    container.removeChild(symbol);
                }
            }, 3000);
        }, 100);
    }

    // Start the animation interval
    animationInterval = setInterval(addSecuritySymbol, 2000);

    // Initial symbol to start immediately
    setTimeout(addSecuritySymbol, 200);

    // Clean up animation if page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(animationInterval);
        } else if (document.querySelector('.texture')) {
            animationInterval = setInterval(addSecuritySymbol, 2000);
        }
    });
}

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.contains('bg-gray-900');

    // Toggle classes
    document.body.classList.toggle('bg-gray-900');
    document.body.classList.toggle('text-white');
    const cards = document.querySelectorAll('.bg-white');
    cards.forEach(card => {
        card.classList.toggle('bg-gray-800');
        card.classList.toggle('text-white');
    });
    const glossary = document.getElementById('infoBar');
    if (glossary) {
        glossary.classList.toggle('bg-gray-800');
        glossary.classList.toggle('text-white');
    }

    // Save state to localStorage
    localStorage.setItem('darkMode', isDarkMode ? 'disabled' : 'enabled');
});

// Handle Theme state
function initializeTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';

    if (isDarkMode) {
        document.body.classList.add('bg-gray-900', 'text-white');
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach(card => {
            card.classList.add('bg-gray-800', 'text-white');
        });
        const glossary = document.getElementById('infoBar');
        if (glossary) {
            glossary.classList.add('bg-gray-800', 'text-white');
        }
    }
}

// Function to update breadcrumbs based on the current page
function updateBreadcrumbs() {
    const breadcrumbContainer = document.querySelector('.breadcrumb ol');
    if (!breadcrumbContainer) return;

    // Clear existing breadcrumbs
    breadcrumbContainer.innerHTML = '';

    // Home breadcrumb
    const homeBreadcrumb = document.createElement('li');
    homeBreadcrumb.className = 'inline-flex items-center';
    homeBreadcrumb.innerHTML = `
        <a href="/CDA-Project/index.html" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
            Home
        </a>
    `;
    breadcrumbContainer.appendChild(homeBreadcrumb);

    // Check if the current page is the dashboard or information page
    const isDashboardPage = window.location.pathname.includes('dashboard.html');
    const isInfoPage = window.location.pathname.includes('info.html');

    // Add the appropriate breadcrumb based on the current page
    if (isDashboardPage) {
        const dashboardBreadcrumb = document.createElement('li');
        dashboardBreadcrumb.setAttribute('aria-current', 'page');
        dashboardBreadcrumb.innerHTML = `
            <div class="flex items-center">
                <span class="text-gray-400 mx-2">></span>
                <span class="text-sm font-medium text-gray-500">Dashboard</span>
            </div>
        `;
        breadcrumbContainer.appendChild(dashboardBreadcrumb);
    } else if (isInfoPage) {
        const infoBreadcrumb = document.createElement('li');
        infoBreadcrumb.setAttribute('aria-current', 'page');
        infoBreadcrumb.innerHTML = `
            <div class="flex items-center">
                <span class="text-gray-400 mx-2">></span>
                <span class="text-sm font-medium text-gray-500">Information</span>
            </div>
        `;
        breadcrumbContainer.appendChild(infoBreadcrumb);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', updateBreadcrumbs);

// Data Glossary Toggle
const infoHeader = document.getElementById('infoHeader');
const expandButton = document.getElementById('expandButton');
const infoContent = document.getElementById('infoContent');

function toggleGlossary() {
    const infoContent = document.getElementById('infoContent');
    const expandButton = document.getElementById('expandButton');

    infoContent.classList.toggle('open');
    expandButton.classList.toggle('rotate-180');

    // Handle aria-expanded for accessibility
    const isExpanded = infoContent.classList.contains('open');
    expandButton.setAttribute('aria-expanded', isExpanded);
}

// Event Listeners for Glossary
infoHeader.addEventListener('click', toggleGlossary);
expandButton.addEventListener('click', toggleGlossary);

// Fetch data from JSON file
async function fetchData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');

        // Change this line to use the GitHub raw URL
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
    // Populate filter dropdowns
    populateFilters();

    // Initialize with all data
    filterData();

    // Update stats
    updateStats();

    // Create charts
    createCharts();
}

// Populate filter dropdowns
function populateFilters() {
    const attackMethods = new Set();
    const attackMethodFilter = document.getElementById('attackMethodFilter');

    // Clear existing options
    attackMethodFilter.innerHTML = '<option value="">All Methods</option>';

    Object.values(accountsData).forEach(account => {
        attackMethods.add(account.ATTACK_METHOD);
    });

    attackMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        attackMethodFilter.appendChild(option);
    });

    // Initialize date filters
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
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    dateTo.setHours(23, 59, 59); // Include the entire day

    filteredData = Object.values(accountsData).filter(account => {
        const foundDate = new Date(account.FOUND_ON);
        const matchesSearch =
            (account.USERNAME && account.USERNAME.toLowerCase().includes(searchTerm)) ||
            (account.BEHAVIOUR && account.BEHAVIOUR.toLowerCase().includes(searchTerm)) ||
            (account.ATTACK_METHOD && account.ATTACK_METHOD.toLowerCase().includes(searchTerm)) ||
            (account.ATTACK_VECTOR && account.ATTACK_VECTOR.toLowerCase().includes(searchTerm)) ||
            (account.DISCORD_ID && account.DISCORD_ID.includes(searchTerm));

        const matchesAttackMethod = !attackMethod || account.ATTACK_METHOD === attackMethod;
        const matchesDate = (!dateFrom || foundDate >= dateFrom) && (!dateTo || foundDate <= dateTo);

        return matchesSearch && matchesAttackMethod && matchesDate;
    });

    // Reset to first page
    currentPage = 1;

    // Update table and stats
    updateStats();
    updateTable();
    createCharts();
}

// Update main stats
function updateStats() {
    // Update total accounts count
    document.getElementById('totalAccounts').textContent = filteredData.length;

    // Count only FINAL_URL_STATUS that are ACTIVE
    const activeUrls = filteredData.filter(account =>
        account.FINAL_URL_STATUS === 'ACTIVE'
    ).length;
    document.getElementById('activeUrls').textContent = activeUrls;

    // Get status elements
    const activeUrlsElement = document.getElementById('activeUrls');
    const statusElement = document.getElementById('activeUrlsStatus');

    // Remove existing color classes
    activeUrlsElement.classList.remove('text-red-600', 'text-orange-500', 'text-green-600');

    // Calculate FINAL_URL_STATUS that are ACTIVE for risk assessment
    const activeFinalUrls = filteredData.filter(account =>
        account.FINAL_URL_STATUS === 'ACTIVE'
    ).length;

    // Determine status and color based on active final URLs
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

    // Update status text
    statusElement.textContent = statusText;

    // Most common attack method
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

    // Most targeted platform
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

    // Deleted accounts count
    const deletedAccounts = filteredData.filter(account =>
        account.USERNAME && account.USERNAME.toLowerCase().includes('deleted_user_')
    ).length;
    document.getElementById('deletedAccounts').textContent = deletedAccounts;

    // New last VT check calculation
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

        // Determine the status class based on FINAL_URL_STATUS
        let statusClass = '';
        if (account.FINAL_URL_STATUS === 'ACTIVE') {
            statusClass = 'bg-red-100';
        } else if (account.FINAL_URL_STATUS === 'INACTIVE') {
            statusClass = 'bg-green-100';
        } else if (account.FINAL_URL_STATUS === 'UNKNOWN') {
            statusClass = 'bg-orange-100';
        }

        // Build the row HTML
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

    // Update pagination info
    document.getElementById('tableInfo').textContent =
        `Showing ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length} entries`;

    // Update pagination buttons
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredData.length;

    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const caseNumber = button.getAttribute('data-case');
            showAccountDetails(caseNumber);
        });
    });

    // Update pagination info
    document.getElementById('tableInfo').textContent =
        `Showing ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length} entries`;

    // Update pagination buttons
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredData.length;

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

    modalContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 class="font-medium text-lg mb-2">Account Information</h3>
                <p><span class="font-medium">Case Number:</span> ${account.CASE_NUMBER}</p>
                <p><span class="font-medium">Found On:</span> ${formatDate(account.FOUND_ON)}</p>
                <p><span class="font-medium">Discord ID:</span> ${account.DISCORD_ID}</p>
                <p><span class="font-medium">Username:</span> ${account.USERNAME}</p>
                <p><span class="font-medium">Behaviour:</span> ${account.BEHAVIOUR}</p>
            </div>
            <div>
                <h3 class="font-medium text-lg mb-2">Attack Details</h3>
                <p><span class="font-medium">Attack Method:</span> ${account.ATTACK_METHOD}</p>
                <p><span class="font-medium">Attack Vector:</span> ${account.ATTACK_VECTOR}</p>
                <p><span class="font-medium">Attack Goal:</span> ${account.ATTACK_GOAL}</p>
                <p><span class="font-medium">Attack Surface:</span> ${account.ATTACK_SURFACE}</p>
                <p><span class="font-medium">Suspected Origin:</span> ${account.SUSPECTED_REGION_OF_ORIGIN}</p>
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
    createStatusAccountsChart();
    createGoalsChart();
    createMethodGoalChart();
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

    // Create cross-tabulation matrix
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

    // Prepare datasets
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

// Account Status
function createStatusAccountsChart() {
    const canvas = document.getElementById('statusAccountsChart');
    if (canvas.chart) canvas.chart.destroy();

    let deletedCount = 0;
    let activeCount = 0;

    filteredData.forEach(account => {
        if (account.USERNAME && account.USERNAME.toLowerCase().includes('deleted_user')) {
            deletedCount++;
        } else {
            activeCount++;
        }
    });

    canvas.chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['Deleted Accounts', 'Active Accounts'],
            datasets: [{
                label: 'Account Status',
                data: [deletedCount, activeCount],
                backgroundColor: [
                    'rgba(147, 51, 234, 0.8)', // Purple for deleted
                    'rgba(16, 185, 129, 0.8)' // Green for active
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
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

    // Sort by count descending
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

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Group data by date
    const dateGroups = {};
    filteredData.forEach(account => {
        const date = account.FOUND_ON;
        dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    // Sort dates
    const sortedDates = Object.keys(dateGroups).sort();

    // Create chart
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

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Count attack methods
    const methodCounts = {};
    filteredData.forEach(account => {
        const method = account.ATTACK_METHOD;
        methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    // Get labels and data
    const labels = Object.keys(methodCounts);
    const data = Object.values(methodCounts);

    // Generate colors
    const backgroundColors = labels.map((_, i) =>
        `hsl(${(i * 137) % 360}, 70%, 60%)`
    );

    // Create chart
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

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Count attack surfaces
    const surfaceCounts = {};
    filteredData.forEach(account => {
        const surface = account.ATTACK_SURFACE;
        surfaceCounts[surface] = (surfaceCounts[surface] || 0) + 1;
    });

    // Get labels and data
    const labels = Object.keys(surfaceCounts);
    const data = Object.values(surfaceCounts);

    // Create chart
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

    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Count regions
    const regionCounts = {};
    filteredData.forEach(account => {
        const region = account.SUSPECTED_REGION_OF_ORIGIN || 'UNKNOWN';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // Get labels and data
    const labels = Object.keys(regionCounts);
    const data = Object.values(regionCounts);

    // Generate colors
    const backgroundColors = labels.map((_, i) =>
        `hsl(${(i * 137 + 60) % 360}, 70%, 60%)`
    );

    // Create chart
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