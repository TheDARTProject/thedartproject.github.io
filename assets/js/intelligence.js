// intelligence.js - Enhanced Version with Improved Styling and PDF Fixes

import servers from './servers.js';
const serverNames = servers.serverNames;

// Main data object
let accountsData = {};
let filteredData = [];

// Event listeners for intelligence page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('intelligence.html')) {
        // Apply theme-specific styles immediately
        applyThemeStyles();

        // Watch for theme changes
        const themeObserver = new MutationObserver(applyThemeStyles);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        fetchData();

        // Setup event listeners for radio buttons
        document.querySelectorAll('input[name="timePeriod"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'custom') {
                    document.getElementById('customDateRange').classList.remove('hidden');
                    // Set default dates for custom range
                    const today = new Date();
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(today.getMonth() - 1);

                    document.getElementById('startDate').valueAsDate = oneMonthAgo;
                    document.getElementById('endDate').valueAsDate = today;
                } else {
                    document.getElementById('customDateRange').classList.add('hidden');
                }
            });
        });

        // Generate report button
        document.getElementById('generateReport').addEventListener('click', generateReport);

        // Export report button
        document.getElementById('exportReport').addEventListener('click', exportReportAsPDF);

        // Print report button
        document.getElementById('printReport').addEventListener('click', printReport);

        // Spoiler text click handler
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('spoiler')) {
                e.target.classList.add('revealed');
            }
        });
    }
});

// Apply theme-specific styles
function applyThemeStyles() {
    const isDark = document.documentElement.classList.contains('dark');
    const reportMeta = document.getElementById('reportMeta');

    if (reportMeta) {
        if (isDark) {
            reportMeta.classList.remove('bg-gray-100', 'text-gray-600');
            reportMeta.classList.add('bg-gray-700', 'text-gray-300');
        } else {
            reportMeta.classList.remove('bg-gray-700', 'text-gray-300');
            reportMeta.classList.add('bg-gray-100', 'text-gray-600');
        }
    }
}

// Print report function
function printReport() {
    // Temporarily switch to light theme for printing
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');

    // Wait a moment for the theme change to take effect
    setTimeout(() => {
        window.print();

        // Restore theme after printing
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        }
    }, 100);
}

// Fetch data from JSON file
async function fetchData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('intelligenceContent').classList.add('hidden');

        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Main-Database/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        accountsData = await response.json();
        populateFilters();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('intelligenceContent').classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Failed to load data. Please check that the data file exists and is accessible.', 'error');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
        type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    }`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                    type === 'error' ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"' :
                    type === 'success' ? 'M5 13l4 4L19 7' :
                    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                }" />
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Populate filter dropdowns
function populateFilters() {
    const attackMethods = new Set();
    const attackSurfaces = new Set();
    const serversSet = new Set();

    // Get all unique values for each filter
    Object.values(accountsData).forEach(account => {
        attackMethods.add(account.ATTACK_METHOD);
        attackSurfaces.add(account.ATTACK_SURFACE);
        serversSet.add(account.FOUND_ON_SERVER);
    });

    // Populate attack method filter
    const attackMethodFilter = document.getElementById('attackMethodFilter');
    Array.from(attackMethods).sort().forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        attackMethodFilter.appendChild(option);
    });

    // Populate attack surface filter
    const attackSurfaceFilter = document.getElementById('attackSurfaceFilter');
    Array.from(attackSurfaces).sort().forEach(surface => {
        const option = document.createElement('option');
        option.value = surface;
        option.textContent = surface;
        attackSurfaceFilter.appendChild(option);
    });

    // Populate server filter with nice names
    const serverFilter = document.getElementById('serverFilter');
    const sortedServers = Array.from(serversSet).sort((a, b) => {
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
}

// Filter data based on current filters and time period
function filterData() {
    const server = document.getElementById('serverFilter').value;
    const attackMethod = document.getElementById('attackMethodFilter').value;
    const attackSurface = document.getElementById('attackSurfaceFilter').value;
    const urlStatus = document.getElementById('urlStatusFilter').value;

    // Get time period selection
    const timePeriod = document.querySelector('input[name="timePeriod"]:checked').value;
    let startDate, endDate = new Date();

    if (timePeriod === 'custom') {
        startDate = new Date(document.getElementById('startDate').value);
        endDate = new Date(document.getElementById('endDate').value);
        if (isNaN(startDate.getTime())) {
            showAlert('Please select a valid start date', 'error');
            return [];
        }
        if (isNaN(endDate.getTime())) {
            showAlert('Please select a valid end date', 'error');
            return [];
        }
        endDate.setHours(23, 59, 59);
    } else {
        // Calculate dates based on time period
        switch(timePeriod) {
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'day':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'all':
            default:
                startDate = null;
                endDate = null;
        }
    }

    filteredData = Object.values(accountsData).filter(account => {
        const foundDate = new Date(account.FOUND_ON);

        // Check if account matches filters
        const matchesServer = !server || account.FOUND_ON_SERVER === server;
        const matchesAttackMethod = !attackMethod || account.ATTACK_METHOD === attackMethod;
        const matchesAttackSurface = !attackSurface || account.ATTACK_SURFACE === attackSurface;
        const matchesUrlStatus = !urlStatus ||
            account.FINAL_URL_STATUS === urlStatus ||
            account.SURFACE_URL_STATUS === urlStatus;

        // Check if account is within date range
        const matchesDate = !startDate || (
            foundDate >= startDate &&
            (!endDate || foundDate <= endDate)
        );

        return matchesServer && matchesAttackMethod &&
               matchesAttackSurface && matchesUrlStatus && matchesDate;
    });

    return filteredData;
}

// Generate report based on filtered data
function generateReport() {
    const btn = document.getElementById('generateReport');
    btn.classList.add('loading');
    btn.disabled = true;

    // Filter data first
    const filteredData = filterData();

    if (filteredData.length === 0) {
        showAlert('No cases match your selected filters. Please adjust your criteria.', 'error');
        btn.classList.remove('loading');
        btn.disabled = false;
        return;
    }

    // Update report meta information
    const timePeriod = document.querySelector('input[name="timePeriod"]:checked').value;
    let timeText = '';

    switch(timePeriod) {
        case 'year': timeText = 'Last Year'; break;
        case 'month': timeText = 'Last Month'; break;
        case 'week': timeText = 'Last Week'; break;
        case 'day': timeText = 'Last 24 Hours'; break;
        case 'custom':
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            timeText = `Custom Range (${formatDate(startDate)} to ${formatDate(endDate)})`;
            break;
        default: timeText = 'All Time';
    }

    const reportMeta = document.getElementById('reportMeta');
    reportMeta.textContent = `Generated on ${formatDate(new Date())} | ${timeText} | ${filteredData.length} cases`;

    // Apply theme styles to meta info
    if (document.documentElement.classList.contains('dark')) {
        reportMeta.classList.remove('bg-gray-100', 'text-gray-600');
        reportMeta.classList.add('bg-gray-700', 'text-gray-300');
    } else {
        reportMeta.classList.remove('bg-gray-700', 'text-gray-300');
        reportMeta.classList.add('bg-gray-100', 'text-gray-600');
    }

    // Generate report content
    const reportContent = generateReportContent(filteredData);
    document.getElementById('reportContent').innerHTML = reportContent;
    document.getElementById('reportContainer').classList.remove('hidden');

    // Scroll to report
    document.getElementById('reportContainer').scrollIntoView({ behavior: 'smooth' });

    btn.classList.remove('loading');
    btn.disabled = false;
    showAlert('Report generated successfully!', 'success');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Generate detailed report content
function generateReportContent(data) {
    if (data.length === 0) {
        return `
            <div class="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-lg mb-6">
                <p class="text-red-800 dark:text-red-200">No cases match your selected filters. Please adjust your criteria and try again.</p>
            </div>
        `;
    }

    // Calculate statistics
    const stats = calculateStatistics(data);

    // Generate report sections
    const reportSections = [
        generateExecutiveSummary(stats),
        generateTimeAnalysis(stats),
        generateServerAnalysis(stats),
        generateAttackMethodAnalysis(stats),
        generateAttackSurfaceAnalysis(stats),
        generateAccountStatusAnalysis(stats),
        generateUrlStatusAnalysis(stats),
        generateRegionAnalysis(stats),
        generateBehaviorAnalysis(stats),
        generateNotableCases(stats)
    ].join('');

    return reportSections;
}

// Calculate various statistics from the data
function calculateStatistics(data) {
    const stats = {
        totalCases: data.length,
        earliestDate: null,
        latestDate: null,
        servers: {},
        attackMethods: {},
        attackSurfaces: {},
        accountStatuses: {},
        urlStatuses: { ACTIVE: 0, INACTIVE: 0, UNKNOWN: 0 },
        regions: {},
        behaviors: {},
        accountTypes: {},
        notableCases: []
    };

    // Initialize dates
    if (data.length > 0) {
        const dates = data.map(account => new Date(account.FOUND_ON));
        stats.earliestDate = new Date(Math.min(...dates));
        stats.latestDate = new Date(Math.max(...dates));
    }

    // Count occurrences of each category
    data.forEach(account => {
        // Servers
        const serverName = account.FOUND_ON_SERVER.startsWith('ANONYMOUS_SERVER') ?
            `Anonymous Server #${account.FOUND_ON_SERVER.split('_').pop()}` :
            serverNames[account.FOUND_ON_SERVER] || account.FOUND_ON_SERVER;
        stats.servers[serverName] = (stats.servers[serverName] || 0) + 1;

        // Attack methods
        stats.attackMethods[account.ATTACK_METHOD] = (stats.attackMethods[account.ATTACK_METHOD] || 0) + 1;

        // Attack surfaces
        stats.attackSurfaces[account.ATTACK_SURFACE] = (stats.attackSurfaces[account.ATTACK_SURFACE] || 0) + 1;

        // Account statuses
        stats.accountStatuses[account.ACCOUNT_STATUS] = (stats.accountStatuses[account.ACCOUNT_STATUS] || 0) + 1;

        // URL statuses (count both surface and final URLs)
        stats.urlStatuses[account.SURFACE_URL_STATUS] = (stats.urlStatuses[account.SURFACE_URL_STATUS] || 0) + 1;
        stats.urlStatuses[account.FINAL_URL_STATUS] = (stats.urlStatuses[account.FINAL_URL_STATUS] || 0) + 1;

        // Regions
        stats.regions[account.SUSPECTED_REGION_OF_ORIGIN] = (stats.regions[account.SUSPECTED_REGION_OF_ORIGIN] || 0) + 1;

        // Behaviors
        stats.behaviors[account.BEHAVIOUR] = (stats.behaviors[account.BEHAVIOUR] || 0) + 1;

        // Account types
        stats.accountTypes[account.ACCOUNT_TYPE] = (stats.accountTypes[account.ACCOUNT_TYPE] || 0) + 1;

        // Notable cases (active URLs)
        if (account.FINAL_URL_STATUS === 'ACTIVE' || account.SURFACE_URL_STATUS === 'ACTIVE') {
            stats.notableCases.push(account);
        }
    });

    // Sort categories by count
    stats.sortedServers = Object.entries(stats.servers).sort((a, b) => b[1] - a[1]);
    stats.sortedAttackMethods = Object.entries(stats.attackMethods).sort((a, b) => b[1] - a[1]);
    stats.sortedAttackSurfaces = Object.entries(stats.attackSurfaces).sort((a, b) => b[1] - a[1]);
    stats.sortedAccountStatuses = Object.entries(stats.accountStatuses).sort((a, b) => b[1] - a[1]);
    stats.sortedRegions = Object.entries(stats.regions).sort((a, b) => b[1] - a[1]);
    stats.sortedBehaviors = Object.entries(stats.behaviors).sort((a, b) => b[1] - a[1]);
    stats.sortedAccountTypes = Object.entries(stats.accountTypes).sort((a, b) => b[1] - a[1]);

    return stats;
}

// Generate executive summary section
function generateExecutiveSummary(stats) {
    const topMethod = stats.sortedAttackMethods[0] || ['None', 0];
    const topSurface = stats.sortedAttackSurfaces[0] || ['None', 0];
    const topServer = stats.sortedServers[0] || ['None', 0];
    const activeUrlCount = stats.urlStatuses.ACTIVE;

    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Executive Summary</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">This report analyzes <span class="font-semibold text-indigo-600 dark:text-indigo-300">${stats.totalCases}</span> cases of malicious activity
            ${stats.earliestDate ? `between ${formatDate(stats.earliestDate)} and ${formatDate(stats.latestDate)}` : ''}.</p>

            <div class="${activeUrlCount > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400'} p-4 rounded-lg mb-4">
                <p class="${activeUrlCount > 0 ? 'text-yellow-800 dark:text-yellow-200' : 'text-blue-800 dark:text-blue-200'}">
                    ${activeUrlCount > 0 ?
                        `⚠️ <span class="font-semibold">${activeUrlCount}</span> active malicious URLs were detected in this dataset, representing an ongoing threat.` :
                        '✅ No active malicious URLs were detected in this dataset.'}
                </p>
            </div>

            <p class="text-gray-600 dark:text-gray-300 mb-2">Key findings from the analysis:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li>The most common attack method was <span class="font-semibold text-indigo-600 dark:text-indigo-300">${topMethod[0]}</span> (${topMethod[1]} cases).</li>
                <li>The primary attack surface targeted was <span class="font-semibold text-indigo-600 dark:text-indigo-300">${topSurface[0]}</span> (${topSurface[1]} cases).</li>
                <li>The server with the most reported cases was <span class="font-semibold text-indigo-600 dark:text-indigo-300">${topServer[0]}</span> (${topServer[1]} cases).</li>
                <li>Account status distribution: ${Object.entries(stats.accountStatuses).map(([status, count]) =>
                    `<span class="font-semibold text-indigo-600 dark:text-indigo-300">${status}</span> (${count})`).join(', ')}.</li>
            </ul>
        </div>
    `;
}

// Generate time analysis section
function generateTimeAnalysis(stats) {
    if (!stats.earliestDate) return '';

    const timeRange = Math.ceil((stats.latestDate - stats.earliestDate) / (1000 * 60 * 60 * 24));
    const casesPerDay = (stats.totalCases / timeRange).toFixed(2);

    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Temporal Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Cases were reported over a period of <span class="font-semibold text-indigo-600 dark:text-indigo-300">${timeRange}</span> days,
            with an average of <span class="font-semibold text-indigo-600 dark:text-indigo-300">${casesPerDay}</span> cases per day.</p>

            <p class="text-gray-600 dark:text-gray-300 mb-2">The time distribution shows:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li>Earliest case: <span class="font-semibold text-indigo-600 dark:text-indigo-300">${formatDate(stats.earliestDate)}</span></li>
                <li>Latest case: <span class="font-semibold text-indigo-600 dark:text-indigo-300">${formatDate(stats.latestDate)}</span></li>
            </ul>
        </div>
    `;
}

// Generate server analysis section
function generateServerAnalysis(stats) {
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Server Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Cases were reported from <span class="font-semibold text-indigo-600 dark:text-indigo-300">${stats.sortedServers.length}</span> different servers.</p>

            <p class="text-gray-600 dark:text-gray-300 mb-2">Top servers by case count:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                ${stats.sortedServers.slice(0, 5).map(([server, count]) => `
                    <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">${server}</span>: ${count} cases (${((count / stats.totalCases) * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Generate attack method analysis section
function generateAttackMethodAnalysis(stats) {
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Attack Method Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4"><span class="font-semibold text-indigo-600 dark:text-indigo-300">${stats.sortedAttackMethods.length}</span> distinct attack methods were identified.</p>

            <p class="text-gray-600 dark:text-gray-300 mb-2">Most prevalent attack methods:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                ${stats.sortedAttackMethods.slice(0, 5).map(([method, count]) => `
                    <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">${method}</span>: ${count} cases (${((count / stats.totalCases) * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Generate attack surface analysis section
function generateAttackSurfaceAnalysis(stats) {
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Attack Surface Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Attackers targeted <span class="font-semibold text-indigo-600 dark:text-indigo-300">${stats.sortedAttackSurfaces.length}</span> different surfaces.</p>

            <p class="text-gray-600 dark:text-gray-300 mb-2">Primary attack surfaces:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                ${stats.sortedAttackSurfaces.slice(0, 5).map(([surface, count]) => `
                    <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">${surface}</span>: ${count} cases (${((count / stats.totalCases) * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Generate account status analysis section
function generateAccountStatusAnalysis(stats) {
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Account Status Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Distribution of account statuses in reported cases:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                ${stats.sortedAccountStatuses.map(([status, count]) => `
                    <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">${status}</span>: ${count} cases (${((count / stats.totalCases) * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Generate URL status analysis section
function generateUrlStatusAnalysis(stats) {
    const totalUrls = stats.urlStatuses.ACTIVE + stats.urlStatuses.INACTIVE + stats.urlStatuses.UNKNOWN;

    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">URL Status Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Analysis of <span class="font-semibold text-indigo-600 dark:text-indigo-300">${totalUrls}</span> URLs associated with malicious activity:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">Active</span>: ${stats.urlStatuses.ACTIVE} URLs (${((stats.urlStatuses.ACTIVE / totalUrls) * 100).toFixed(1)}%)</li>
                <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">Inactive</span>: ${stats.urlStatuses.INACTIVE} URLs (${((stats.urlStatuses.INACTIVE / totalUrls) * 100).toFixed(1)}%)</li>
                <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">Unknown</span>: ${stats.urlStatuses.UNKNOWN} URLs (${((stats.urlStatuses.UNKNOWN / totalUrls) * 100).toFixed(1)}%)</li>
            </ul>
        </div>
    `;
}

// Generate region analysis section
function generateRegionAnalysis(stats) {
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Geographical Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Cases originated from <span class="font-semibold text-indigo-600 dark:text-indigo-300">${stats.sortedRegions.length}</span> suspected regions.</p>

            <p class="text-gray-600 dark:text-gray-300 mb-2">Top regions by suspected origin:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                ${stats.sortedRegions.slice(0, 5).map(([region, count]) => `
                    <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">${region}</span>: ${count} cases (${((count / stats.totalCases) * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Generate behavior analysis section
function generateBehaviorAnalysis(stats) {
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Behavior Analysis</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-4"><span class="font-semibold text-indigo-600 dark:text-indigo-300">${stats.sortedBehaviors.length}</span> distinct behaviors were observed.</p>

            <p class="text-gray-600 dark:text-gray-300 mb-2">Most common behaviors:</p>
            <ul class="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                ${stats.sortedBehaviors.slice(0, 5).map(([behavior, count]) => `
                    <li><span class="font-semibold text-indigo-600 dark:text-indigo-300">${behavior}</span>: ${count} cases (${((count / stats.totalCases) * 100).toFixed(1)}%)</li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Generate notable cases section
function generateNotableCases(stats) {
    if (stats.notableCases.length === 0) return '';

    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
            <h2 class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">Notable Cases with Active URLs</h2>
            <div class="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-lg mb-4">
                <p class="text-yellow-800 dark:text-yellow-200">The following <span class="font-semibold">${stats.notableCases.length}</span> cases contain active malicious URLs that may represent ongoing threats:</p>
            </div>

            <ul class="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300">
                ${stats.notableCases.slice(0, 10).map(account => `
                    <li>
                        <span class="font-semibold">Case ${account.CASE_NUMBER}</span> (${formatDate(account.FOUND_ON)}):
                        ${account.USERNAME} targeted via ${account.ATTACK_METHOD} on ${account.ATTACK_SURFACE}.
                        ${account.SURFACE_URL_STATUS === 'ACTIVE' ?
                            `<br>Active surface URL: <span class="spoiler">${account.SURFACE_URL}</span>` : ''}
                        ${account.FINAL_URL_STATUS === 'ACTIVE' ?
                            `<br>Active final URL: <span class="spoiler">${account.FINAL_URL}</span>` : ''}
                    </li>
                `).join('')}
            </ul>

            ${stats.notableCases.length > 10 ?
                `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">+ ${stats.notableCases.length - 10} more cases with active URLs not shown</p>` : ''}
        </div>
    `;
}

// Export report as PDF
async function exportReportAsPDF() {
    const { jsPDF } = window.jspdf;
    const reportElement = document.getElementById('reportContainer');

    // Show loading state
    const btn = document.getElementById('exportReport');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        // Create a clone of the report element to avoid affecting the displayed version
        const clone = reportElement.cloneNode(true);
        clone.style.width = reportElement.offsetWidth + 'px';
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';

        // Force light theme for PDF generation
        clone.classList.remove('dark');
        clone.querySelectorAll('.dark').forEach(el => el.classList.remove('dark'));

        // Remove the print button from the clone
        const printBtn = clone.querySelector('#printReport');
        if (printBtn) printBtn.remove();

        document.body.appendChild(clone);

        // Wait for any potential layout changes to take effect
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use html2canvas to capture the report
        const canvas = await html2canvas(clone, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            ignoreElements: (element) => {
                // Ignore elements that might cause issues
                return element.classList.contains('spoiler') && !element.classList.contains('revealed');
            }
        });

        // Remove the clone
        document.body.removeChild(clone);

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Download the PDF
        pdf.save(`DART_Threat_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        showAlert('Failed to generate PDF. Please try again.', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}