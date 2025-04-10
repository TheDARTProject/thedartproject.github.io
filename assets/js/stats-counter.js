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
        return 0; // Return 0 if there's an error
    }
}

// Function to update the stats on the page
async function updateStats() {
    const threatsCount = await countThreats();
    const protectedServersCount = countProtectedServers();

    // Format numbers with commas
    const formattedThreats = threatsCount.toLocaleString();
    const formattedServers = protectedServersCount.toLocaleString();

    // Update the DOM
    document.getElementById('threats-detected').textContent = formattedThreats;
    document.getElementById('protected-servers').textContent = formattedServers;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', updateStats);