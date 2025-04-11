// domain-analytics.js

// Main data object
let domainsData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 20;

// Store chart references
const chartInstances = {
    platformChart: null,
    threatTypeChart: null,
    tldChart: null,
    compositionChart: null,
    lengthChart: null
};

// Platform detection regex patterns
const platformPatterns = {
    discord: /(?:discord|discor(c?l|d|b)|di(c|s)cord|d[il1]sc[o0]rd|dys[ck]ord|nitro|hypesquad|moderator|academy|academi|captcha|capt?cha|b[o0]t|gu[il1]ld|dyno|mee6|carl|w[il1]ck|vulcan|sledgehammer|restorecord)/i,
    roblox: /(?:r[o0]bl[o0]x|rblx|rbux|bl[o0]x|robux)/i,
    gaming: /(?:st[e3]am|valv[e3]|c[s5]g[o0]|c[s5]2|counter[-_]?strike|sourc[e3]|cs[-_]|navi(?![ag])|faze|g2e?|nip|ence|valorant|vct|riot|faceit|hypix[e3]l|gam(?:er|ing)|esport|esea|esl|pgl|blast|buff|sk[i1l!]n|case|dr[o0]p|trad[e3]|item|inventory|workshop|dota|pubg|minecraft|lunar|badlion|rust|facepunch)/i,
    crypto: /(?:crypto|c[o0][i1l!]n|b[i1l!]tc|bitcoin|eth|ether(?:eum)?|usd[tc]|bnb|solana|xrp|doge|shib[ae]?|tok[e3]n|nft|a[i1l!]rdr[o0]p|cla[i1l!]m|wall[e3]t|connect|swap|exchang[e3]|trad[e3]|f[i1l!]nanc[e3]|invest|m[i1l!]n[i1l!]ng|stak[e3]|bl[o0]ckcha[i1l!]n|w[e3]b3|dapp|def[i1l!]|metaverse|bridg[e3]|layerzero|zksync|polyhedra|starknet|arb[i1l!]trum|celestia|manta|satoshi|jup|open?sea|blur|magiceden|binance|coinbase|kraken|bybit|kucoin|metamask|lido|rocketpool|uniswap|pancake|sushi|chainlink|pudgy|bayc|azuki|ordinals|brc20|musk|elon|tesla|spacex|apy|yield|mint|presale|dao|0x[a-f0-9]{10,})/i,
    delivery: /(?:usps|dhl|fedex|ups|post[ea]?|pack(?:age)?|deliv[e]?ry|track(?:ing)?|parcel)/i,
    social: /(?:fac[e3]b[o0][o0]k|m[e3]ta|insta(?:gram)?)/i,
    apple: /(?:appl[e3]|icloud|itunes|appleid)/i,
    adult: /(?:adult|s[e3]x|dat[i1l!]ng|naughty|p[o0]rn|nsfw|hentai|h[o0][o0]kup|flirt|teen|lover|lady|girl|gay)/i,
    hosting: /(?:000webhostapp\.com|netlify\.app|vercel\.app|firebaseapp\.com|repl\.co|bit\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|t\.co|goo\.gl|is\.gd|shorte\.st|weebly\.com|duckdns\.org|github\.io|herokuapp\.com|surge\.sh|pages\.dev|onrender\.com|\.cloud|^209\.213|^24\.207|^61\.160)/i
};

// Threat type detection regex patterns
const threatTypePatterns = {
    credential: /(?:login|log-in|sign-?in|verif(?:y|ication|ies|ied)|auth(?:enticat|oriz)?|account|support|captcha|recover(?:y)?|secur(?:e|ity)|confirm|validat(?:e|ion)|access|connect|credential|password|username)/i,
    giveaway: /(?:giveaway|reward|bonus|g[i1l!]ft|cla[i1l!]m|pr[i1l!]z[e3]|w[i1l!]n|fr[e3][e3]|promo|event|a[i1l!]rdr[o0]p|x2|sale|sweep|lotto|lucky|dr[o0]p|code|earn|get|receive)/i,
    support: /(?:support|help|service|desk|center|contact|assist|recover(?:y)?)/i,
    malware: /(?:download|app|cl[i1l!]ent|apk|setup|install|software|tool|update|crack|hack)/i,
    investment: /(?:invest|trading|trade|yield|apy|stake|pool|farm|signal|profit|generator|rich|finance|fund|earn|x2)/i
};

// Event listeners for domain analytics page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('domain-analytics.html')) {
        fetchData();
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterData);
    }

    // Filter dropdowns
    const platformFilter = document.getElementById('platformFilter');
    if (platformFilter) {
        platformFilter.addEventListener('change', filterData);
    }

    const threatTypeFilter = document.getElementById('threatTypeFilter');
    if (threatTypeFilter) {
        threatTypeFilter.addEventListener('change', filterData);
    }

    const tldFilter = document.getElementById('tldFilter');
    if (tldFilter) {
        tldFilter.addEventListener('change', filterData);
    }

    // Pagination
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

    // Export CSV
    const exportCSV = document.getElementById('exportCSV');
    if (exportCSV) {
        exportCSV.addEventListener('click', exportToCSV);
    }

    // Refresh data
    const refreshData = document.getElementById('refreshData');
    if (refreshData) {
        refreshData.addEventListener('click', fetchData);
    }

    // Data glossary toggle
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

        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Filter-Database/Global-Domains.json');
        if (!response.ok) {
            throw new Error('Failed to fetch domain data');
        }

        domainsData = await response.json();
        processData();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching domain data:', error);
        alert('Failed to load domain data. Please check that the data file exists and is accessible.');
    }
}

// Process data and initialize charts
function processData() {
    // Enrich domains with platform and threat type classifications
    domainsData = domainsData.map(domain => {
        const platform = detectPlatform(domain);
        const threatType = detectThreatType(domain);
        const tld = extractTLD(domain);
        const length = domain.length;

        return {
            domain,
            platform,
            threatType,
            tld,
            length
        };
    });

    populateFilters();
    filterData();
    updateStats();
    createCharts();
}

// Create all charts
function createCharts() {
    // Destroy existing charts if they exist
    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });

    // Create new charts and store references
    const platformChart = createPlatformChart();
    const threatTypeChart = createThreatTypeChart();
    const tldChart = createTLDChart();
    const compositionChart = createCompositionChart();
    const lengthChart = createLengthChart();

    // Attach chart instances to canvas elements
    document.getElementById('platformChart').chart = platformChart;
    document.getElementById('threatTypeChart').chart = threatTypeChart;
    document.getElementById('tldChart').chart = tldChart;
    document.getElementById('compositionChart').chart = compositionChart;
    document.getElementById('lengthChart').chart = lengthChart;

    // Update chartInstances object
    chartInstances.platformChart = platformChart;
    chartInstances.threatTypeChart = threatTypeChart;
    chartInstances.tldChart = tldChart;
    chartInstances.compositionChart = compositionChart;
    chartInstances.lengthChart = lengthChart;
}

// Detect platform based on domain content
function detectPlatform(domain) {
    for (const [platform, pattern] of Object.entries(platformPatterns)) {
        if (pattern.test(domain)) {
            return platform;
        }
    }
    return 'other';
}

// Detect threat type based on domain content
function detectThreatType(domain) {
    for (const [threatType, pattern] of Object.entries(threatTypePatterns)) {
        if (pattern.test(domain)) {
            return threatType;
        }
    }
    return 'unknown';
}

// Extract TLD from domain
function extractTLD(domain) {
    const parts = domain.split('.');
    if (parts.length > 1) {
        return parts[parts.length - 1];
    }
    return domain;
}

// Populate filter dropdowns
function populateFilters() {
    // Get unique TLDs
    const tlds = [...new Set(domainsData.map(d => d.tld))].sort();

    const tldFilter = document.getElementById('tldFilter');
    tldFilter.innerHTML = '<option value="">All TLDs</option>';

    tlds.forEach(tld => {
        const option = document.createElement('option');
        option.value = tld;
        option.textContent = tld;
        tldFilter.appendChild(option);
    });
}

// Filter data based on current filters
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const platform = document.getElementById('platformFilter').value;
    const threatType = document.getElementById('threatTypeFilter').value;
    const tld = document.getElementById('tldFilter').value;

    filteredData = domainsData.filter(domainData => {
        const matchesSearch = domainData.domain.toLowerCase().includes(searchTerm);
        const matchesPlatform = !platform || domainData.platform === platform;
        const matchesThreatType = !threatType || domainData.threatType === threatType;
        const matchesTLD = !tld || domainData.tld === tld;

        return matchesSearch && matchesPlatform && matchesThreatType && matchesTLD;
    });

    currentPage = 1;
    updateStats();
    updateTable();
    createCharts();
}

function calculateAverageLength() {
    if (filteredData.length === 0) return 0;
    const totalLength = filteredData.reduce((sum, domain) => sum + domain.length, 0);
    return Math.round(totalLength / filteredData.length);
}

// Update main stats
function updateStats() {
    document.getElementById('totalDomains').textContent = filteredData.length;

    // Most common platform
    const platformCounts = {};
    filteredData.forEach(d => {
        platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
    });
    const commonPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    document.getElementById('commonPlatform').textContent = formatPlatformName(commonPlatform);

    // Most common TLD
    const tldCounts = {};
    filteredData.forEach(d => {
        tldCounts[d.tld] = (tldCounts[d.tld] || 0) + 1;
    });
    const commonTLD = Object.entries(tldCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    document.getElementById('commonTLD').textContent = commonTLD;

    // Average domain length
    const avgLength = calculateAverageLength();
    document.getElementById('avgLength').textContent = avgLength;
}

// Format platform name for display
function formatPlatformName(platform) {
    const names = {
        discord: 'Discord',
        roblox: 'Roblox',
        gaming: 'Gaming',
        crypto: 'Crypto',
        delivery: 'Delivery',
        social: 'Social Media',
        apple: 'Apple',
        adult: 'Adult',
        hosting: 'Hosting',
        other: 'Other',
        unknown: 'Unknown'
    };
    return names[platform] || platform;
}

// Format threat type for display
function formatThreatType(threatType) {
    const names = {
        credential: 'Credential Theft',
        giveaway: 'Giveaway',
        support: 'Fake Support',
        malware: 'Malware',
        investment: 'Investment Scam',
        unknown: 'Unknown'
    };
    return names[threatType] || threatType;
}

// Update the domain table
function updateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    pageData.forEach(domainData => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="px-6 py-4"><span class="truncate truncate-tooltip" title="${domainData.domain}">${domainData.domain}</span></td>
            <td class="px-6 py-4">${formatPlatformName(domainData.platform)}</td>
            <td class="px-6 py-4">${formatThreatType(domainData.threatType)}</td>
            <td class="px-6 py-4">${domainData.tld}</td>
        `;

        tableBody.appendChild(row);
    });

    document.getElementById('tableInfo').textContent =
        `Showing ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length} domains`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredData.length;
}

// Create platform distribution chart
function createPlatformChart() {
    const canvas = document.getElementById('platformChart');
    if (canvas.chart) canvas.chart.destroy();

    const platformCounts = {};
    filteredData.forEach(d => {
        platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
    });

    // Sort platforms by count
    const sortedPlatforms = Object.entries(platformCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([platform, count]) => ({
            platform: formatPlatformName(platform),
            count
        }));

    const labels = sortedPlatforms.map(p => p.platform);
    const data = sortedPlatforms.map(p => p.count);

    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
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

    return chart;
}

// Create threat type distribution chart
function createThreatTypeChart() {
    const canvas = document.getElementById('threatTypeChart');
    if (canvas.chart) canvas.chart.destroy();

    const threatTypeCounts = {};
    filteredData.forEach(d => {
        threatTypeCounts[d.threatType] = (threatTypeCounts[d.threatType] || 0) + 1;
    });

    // Sort threat types by count
    const sortedThreatTypes = Object.entries(threatTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([threatType, count]) => ({
            threatType: formatThreatType(threatType),
            count
        }));

    const labels = sortedThreatTypes.map(t => t.threatType);
    const data = sortedThreatTypes.map(t => t.count);

    const chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map((_, i) =>
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
                    position: 'right',
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

    return chart;
}

// Create TLD distribution chart
function createTLDChart() {
    const canvas = document.getElementById('tldChart');
    if (canvas.chart) canvas.chart.destroy();

    const tldCounts = {};
    filteredData.forEach(d => {
        tldCounts[d.tld] = (tldCounts[d.tld] || 0) + 1;
    });

    // Sort TLDs by count and get top 10
    const sortedTLDs = Object.entries(tldCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = sortedTLDs.map(t => t[0]);
    const data = sortedTLDs.map(t => t[1]);

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Domains',
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

    return chart;
}

function analyzeDomainComposition() {
    const patterns = {
        'Digits': /\d/,                   // Contains numbers
        'Hyphens': /-/,                   // Contains hyphens
        'Multiple Hyphens': /-.*-/,       // Contains multiple hyphens
        'Long Strings': /.{20,}/          // Very long strings (20+ chars)
    };

    const counts = {};
    Object.keys(patterns).forEach(pattern => {
        counts[pattern] = 0;
    });

    filteredData.forEach(domain => {
        for (const [pattern, regex] of Object.entries(patterns)) {
            if (regex.test(domain.domain)) {
                counts[pattern]++;
            }
        }
    });

    return {
        labels: Object.keys(counts),
        data: Object.values(counts)
    };
}

// Create domain composition analysis chart
function createCompositionChart() {
    const canvas = document.getElementById('compositionChart');
    if (canvas.chart) canvas.chart.destroy();

    const compositionData = analyzeDomainComposition();

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: compositionData.labels,
            datasets: [{
                label: 'Domains with Pattern',
                data: compositionData.data,
                backgroundColor: 'rgba(220, 38, 38, 0.8)',
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
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = filteredData.length;
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value} domains (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });

    return chart;
}

// Create domain length analysis chart
function createLengthChart() {
    const canvas = document.getElementById('lengthChart');
    if (canvas.chart) canvas.chart.destroy();

    // Group domains by length ranges
    const lengthRanges = {
        '1-10': 0,
        '11-20': 0,
        '21-30': 0,
        '31-40': 0,
        '41-50': 0,
        '51+': 0
    };

    filteredData.forEach(d => {
        const length = d.length;
        if (length <= 10) lengthRanges['1-10']++;
        else if (length <= 20) lengthRanges['11-20']++;
        else if (length <= 30) lengthRanges['21-30']++;
        else if (length <= 40) lengthRanges['31-40']++;
        else if (length <= 50) lengthRanges['41-50']++;
        else lengthRanges['51+']++;
    });

    const labels = Object.keys(lengthRanges);
    const data = Object.values(lengthRanges);

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Domains',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
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

    return chart;
}

// Export data to CSV
function exportToCSV() {
    const headers = ['Domain', 'Platform', 'Threat Type', 'TLD', 'Length'];

    let csvContent = headers.join(',') + '\n';

    filteredData.forEach(domainData => {
        const row = [
            `"${domainData.domain.replace(/"/g, '""')}"`,
            formatPlatformName(domainData.platform),
            formatThreatType(domainData.threatType),
            domainData.tld,
            domainData.length
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'malicious_domains_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Toggle glossary section
function toggleGlossary() {
    const infoContent = document.getElementById('infoContent');
    const expandButton = document.getElementById('expandButton');

    infoContent.classList.toggle('open');
    expandButton.classList.toggle('rotate-180');

    const isExpanded = infoContent.classList.contains('open');
    expandButton.setAttribute('aria-expanded', isExpanded);
}