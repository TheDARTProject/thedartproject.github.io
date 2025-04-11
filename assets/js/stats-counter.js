// stats-counter.js

import servers from './servers.js';

// Function to count the number of protected servers (excluding anonymous and DM)
function countProtectedServers() {
    let count = 0;
    for (const server in servers.serverNames) {
        if (server !== 'DIRECT_MESSAGES' &&
            !server.startsWith('ANONYMOUS_SERVER_') &&
            servers.serverInvites[server] !== "") {
            count++;
        }
    }
    return count;
}

// Function to get total member count from all servers
async function getTotalMembers() {
    let totalMembers = 0;

    for (const server in servers.serverInvites) {
        const inviteUrl = servers.serverInvites[server];
        if (inviteUrl && !inviteUrl.startsWith('http')) continue; // Skip invalid URLs

        try {
            // Extract invite code from URL
            const inviteCode = inviteUrl.split('/').pop();
            if (!inviteCode) continue;

            const response = await fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
            if (!response.ok) continue;

            const data = await response.json();
            if (data.approximate_member_count) {
                totalMembers += data.approximate_member_count;
            }
        } catch (error) {
            console.error(`Error fetching member count for ${server}:`, error);
            continue;
        }
    }

    return totalMembers;
}

// Function to fetch and count threats from the database
async function countThreats() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Main-Database/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Failed to fetch threats data');
        }
        const data = await response.json();
        return Object.keys(data).length;
    } catch (error) {
        console.error('Error fetching threats:', error);
        return 0;
    }
}

// Function to count malicious URLs
async function countMaliciousUrls() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Filter-Database/Global-Domains.json');
        if (!response.ok) {
            throw new Error('Failed to fetch malicious URLs data');
        }
        const data = await response.json();
        return data.length;
    } catch (error) {
        console.error('Error fetching malicious URLs:', error);
        return 0;
    }
}

// Function to count malicious servers
async function countMaliciousServers() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Filter-Database/Discord-Servers.json');
        if (!response.ok) {
            throw new Error('Failed to fetch malicious servers data');
        }
        const data = await response.json();
        return Object.keys(data).length;
    } catch (error) {
        console.error('Error fetching malicious servers:', error);
        return 0;
    }
}

// Function to update the stats on the page
async function updateStats() {
    const threatsCount = await countThreats();
    const protectedServersCount = countProtectedServers();
    const totalMembers = await getTotalMembers();
    const maliciousUrlsCount = await countMaliciousUrls();
    const maliciousServersCount = await countMaliciousServers();

    // Format numbers
    const formattedThreats = threatsCount.toLocaleString();
    const formattedServers = protectedServersCount.toLocaleString();
    const formattedMembers = totalMembers >= 1000 ?
        `${Math.round(totalMembers / 1000)}k` :
        totalMembers.toLocaleString();
    const formattedUrls = maliciousUrlsCount.toLocaleString();
    const formattedServersMalicious = maliciousServersCount.toLocaleString();

    // Update the DOM
    document.getElementById('threats-detected').textContent = formattedThreats;
    document.getElementById('protected-servers').textContent = formattedServers + '+';
    document.getElementById('total-members').textContent = formattedMembers;
    document.getElementById('malicious-urls').textContent = formattedUrls;
    document.getElementById('malicious-servers').textContent = formattedServersMalicious;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', updateStats);