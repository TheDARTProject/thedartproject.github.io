// Fetch data from JSON file
async function fetchData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return {};
    }
}

// Populate filter dropdowns with unique values from the data
function populateFilters(accounts) {
    const servers = new Set();
    const years = new Set();
    const regions = new Set();

    accounts.forEach(account => {
        // Extract servers
        if (account.FOUND_ON_SERVER) {
            servers.add(account.FOUND_ON_SERVER);
        }

        // Extract years from FOUND_ON date
        if (account.FOUND_ON) {
            const year = new Date(account.FOUND_ON).getFullYear();
            years.add(year);
        }

        // Extract regions
        if (account.SUSPECTED_REGION_OF_ORIGIN) {
            regions.add(account.SUSPECTED_REGION_OF_ORIGIN);
        }
    });

    // Populate server filter
    const serverFilter = document.getElementById('serverFilter');
    servers.forEach(server => {
        const option = document.createElement('option');
        option.value = server;
        option.textContent = server;
        serverFilter.appendChild(option);
    });

    // Populate year filter
    const yearFilter = document.getElementById('yearFilter');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    // Populate region filter
    const regionFilter = document.getElementById('regionFilter');
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
    });
}

// Process data and update statistics with filters
async function processData(filters = {}) {
    const data = await fetchData();
    let accounts = Object.values(data);

    // Populate filters with unique values from the data
    populateFilters(accounts);

    // Apply filters
    if (filters.server && filters.server !== "ALL") {
        accounts = accounts.filter(account => account.FOUND_ON_SERVER === filters.server);
    }
    if (filters.year && filters.year !== "ALL") {
        accounts = accounts.filter(account => new Date(account.FOUND_ON).getFullYear() === parseInt(filters.year));
    }
    if (filters.region && filters.region !== "ALL") {
        accounts = accounts.filter(account => account.SUSPECTED_REGION_OF_ORIGIN === filters.region);
    }

    // Update statistics based on filtered accounts
    document.getElementById('totalAccounts').textContent = accounts.length;

    // Deleted Accounts
    const deletedAccounts = accounts.filter(account =>
        account.USERNAME && account.USERNAME.toLowerCase().includes('deleted_user')
    ).length;
    document.getElementById('deletedAccounts').textContent = deletedAccounts;

    // Attack Methods
    const attackMethods = new Set();
    const attackMethodCounts = {};
    accounts.forEach(account => {
        const method = account.ATTACK_METHOD || 'Unknown';
        attackMethods.add(method);
        attackMethodCounts[method] = (attackMethodCounts[method] || 0) + 1;
    });
    const mostCommonMethod = Object.entries(attackMethodCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    document.getElementById('commonAttackMethod').textContent = mostCommonMethod;
    document.getElementById('totalAttackMethods').textContent = accounts.length;
    document.getElementById('uniqueAttackMethods').textContent = attackMethods.size;

    // Attack Surfaces
    const attackSurfaces = new Set();
    const attackSurfaceCounts = {};
    accounts.forEach(account => {
        const surface = account.ATTACK_SURFACE || 'Unknown';
        attackSurfaces.add(surface);
        attackSurfaceCounts[surface] = (attackSurfaceCounts[surface] || 0) + 1;
    });
    const mostTargetedSurface = Object.entries(attackSurfaceCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    document.getElementById('mostTargetedSurface').textContent = mostTargetedSurface;
    document.getElementById('totalAttackSurfaces').textContent = accounts.length;
    document.getElementById('uniqueAttackSurfaces').textContent = attackSurfaces.size;

    // URL Status
    const activeUrls = accounts.filter(account => account.FINAL_URL_STATUS === 'ACTIVE').length;
    const inactiveUrls = accounts.filter(account => account.FINAL_URL_STATUS === 'INACTIVE').length;
    const unknownUrls = accounts.filter(account => account.FINAL_URL_STATUS === 'UNKNOWN').length;
    document.getElementById('activeUrls').textContent = activeUrls;
    document.getElementById('inactiveUrls').textContent = inactiveUrls;
    document.getElementById('unknownUrls').textContent = unknownUrls;

    // Regions
    const regions = new Set();
    const regionCounts = {};
    accounts.forEach(account => {
        const region = account.SUSPECTED_REGION_OF_ORIGIN || 'Unknown';
        regions.add(region);
        regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    const mostCommonRegion = Object.entries(regionCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    document.getElementById('mostCommonRegion').textContent = mostCommonRegion;
    document.getElementById('totalRegions').textContent = accounts.length;
    document.getElementById('uniqueRegions').textContent = regions.size;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    processData();

    // Add event listener for the Apply Filters button
    document.getElementById('applyFilters').addEventListener('click', () => {
        const serverFilter = document.getElementById('serverFilter').value;
        const yearFilter = document.getElementById('yearFilter').value;
        const regionFilter = document.getElementById('regionFilter').value;

        processData({
            server: serverFilter,
            year: yearFilter,
            region: regionFilter
        });
    });
});