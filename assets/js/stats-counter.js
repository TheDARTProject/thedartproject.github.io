// stats-counter.js

// Function to fetch and parse data from Inspection.md
async function fetchInspectionData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Inspection-Database/Inspection.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        return parseInspectionData(text);
    } catch (error) {
        console.error('Error fetching inspection data:', error);
        return null;
    }
}

// Function to parse the Inspection.md content
function parseInspectionData(text) {
    const data = {
        threatsDetected: 0,
        monitoredServers: 0,
        protectedMembers: 0,
        maliciousServers: 0,
        maliciousUrls: 0
    };

    // Extract Total Cases (THREATS DETECTED)
    const totalCasesMatch = text.match(/## Total Cases: (\d+)/);
    if (totalCasesMatch) {
        data.threatsDetected = parseInt(totalCasesMatch[1].replace(/,/g, ''));
    }

    // Extract Protected Members (PROTECTED MEMBERS)
    const protectedMembersMatch = text.match(/## Protected Members: ([\d,]+)/);
    if (protectedMembersMatch) {
        data.protectedMembers = parseInt(protectedMembersMatch[1].replace(/,/g, ''));
    }

    // Count Found On Server list (MONITORED SERVERS) - excluding DIRECT_MESSAGES
    const serverListMatch = text.match(/## Found On Server\n([\s\S]+?)\n##/);
    if (serverListMatch) {
        const serverList = serverListMatch[1].split('\n')
            .filter(line => line.trim().startsWith('- '))
            .filter(server => !server.includes('DIRECT_MESSAGES')); // Exclude DIRECT_MESSAGES
        data.monitoredServers = serverList.length;
    }

    // Extract Discord Servers (MALICIOUS SERVERS)
    const discordServersMatch = text.match(/- \*\*Discord Servers\*\*: (\d+) entries/);
    if (discordServersMatch) {
        data.maliciousServers = parseInt(discordServersMatch[1].replace(/,/g, ''));
    }

    // Extract Global Domains (MALICIOUS URLS)
    const globalDomainsMatch = text.match(/- \*\*Global Domains\*\*: (\d+) entries/);
    if (globalDomainsMatch) {
        data.maliciousUrls = parseInt(globalDomainsMatch[1].replace(/,/g, ''));
    }

    return data;
}

// Function to format numbers with appropriate units
function formatNumber(value, showDecimal = true) {
    if (value >= 1000000) {
        const millions = value / 1000000;
        return showDecimal ? `${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M` : `${Math.round(millions)}M`;
    } else if (value >= 1000) {
        const thousands = value / 1000;
        return showDecimal ? `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}k` : `${Math.round(thousands)}k`;
    }
    return value.toLocaleString();
}

// Function to update the stats on the page
async function updateStats() {
    // Show loading state
    const statElements = [
        'threats-detected',
        'protected-servers',
        'total-members',
        'malicious-urls',
        'malicious-servers'
    ];

    statElements.forEach(id => {
        document.getElementById(id).textContent = 'Loading...';
    });

    // Fetch and parse the data
    const inspectionData = await fetchInspectionData();

    if (!inspectionData) {
        // Fallback if data couldn't be fetched
        statElements.forEach(id => {
            document.getElementById(id).textContent = 'Error';
        });
        return;
    }

    // Format numbers appropriately
    const formattedThreats = formatNumber(inspectionData.threatsDetected);
    const formattedServers = formatNumber(inspectionData.monitoredServers) + '+';
    const formattedMembers = formatNumber(inspectionData.protectedMembers, false); // No decimal for protected members
    const formattedUrls = formatNumber(inspectionData.maliciousUrls);
    const formattedServersMalicious = formatNumber(inspectionData.maliciousServers);

    // Update the DOM with the new values
    document.getElementById('threats-detected').textContent = formattedThreats;
    document.getElementById('protected-servers').textContent = formattedServers;
    document.getElementById('total-members').textContent = formattedMembers;
    document.getElementById('malicious-urls').textContent = formattedUrls;
    document.getElementById('malicious-servers').textContent = formattedServersMalicious;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', updateStats);

// Refresh stats every 5 minutes (300000 ms)
setInterval(updateStats, 300000);