// status.js

import {
    fetchData
} from './utils.js';

// Function to fetch and update developer messages
export async function fetchDeveloperMessages() {
    try {
        const messageData = await fetchData('https://raw.githubusercontent.com/TheDARTProject/Website-Configs/refs/heads/main/Status-Message.json');
        if (!messageData) {
            throw new Error('Failed to fetch developer messages');
        }

        const currentStatus = messageData.Statuses.find(status => status.id === messageData.CurrentStatus);

        // Update developer message title and description
        const messageTitleElement = document.getElementById('developerMessageTitle');
        const messageDescriptionElement = document.getElementById('developerMessageDescription');

        if (messageTitleElement) {
            messageTitleElement.textContent = currentStatus.name;
        }

        if (messageDescriptionElement) {
            messageDescriptionElement.textContent = currentStatus.description;
        }
    } catch (error) {
        console.error('Error fetching developer messages:', error);

        const messageTitleElement = document.getElementById('developerMessageTitle');
        const messageDescriptionElement = document.getElementById('developerMessageDescription');

        if (messageTitleElement) {
            messageTitleElement.textContent = 'Error';
            messageTitleElement.className = 'text-xl font-bold text-red-600';
        }

        if (messageDescriptionElement) {
            messageDescriptionElement.textContent = 'Failed to load developer messages.';
        }
    }
}

// Function to fetch and update the database status
export async function fetchDatabaseStatus() {
    try {
        const statusData = await fetchData('https://raw.githubusercontent.com/TheDARTProject/Website-Configs/refs/heads/main/Database-Status.json');
        if (!statusData) {
            throw new Error('Failed to fetch database status');
        }

        const currentStatus = statusData.Statuses.find(status => status.id === statusData.CurrentStatus);

        // Update overall database status
        const databaseStatusElement = document.getElementById('databaseStatus');
        if (databaseStatusElement) {
            databaseStatusElement.textContent = currentStatus.name;
            databaseStatusElement.className = `text-2xl font-bold ${currentStatus.color}`;
        }

        const databaseDescriptionElement = document.getElementById('databaseDescription');
        if (databaseDescriptionElement) {
            databaseDescriptionElement.textContent = currentStatus.description;
        }

        // Check individual database files
        await checkDatabaseFile(
            'https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Main-Database/Compromised-Discord-Accounts.json',
            'mainDatabaseStatus'
        );

        await checkDatabaseFile(
            'https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Edit-Database/Compromised-Discord-Accounts.json',
            'editDatabaseStatus'
        );

        await checkDatabaseFile(
            'https://raw.githubusercontent.com/TheDARTProject/Database-Files/refs/heads/main/Backup-Database/Compromised-Discord-Accounts-Backup.json',
            'backupDatabaseStatus'
        );

    } catch (error) {
        console.error('Error fetching database status:', error);
        const databaseStatusElement = document.getElementById('databaseStatus');
        if (databaseStatusElement) {
            databaseStatusElement.textContent = 'Status Unavailable';
            databaseStatusElement.className = 'text-2xl font-bold text-red-600';
        }

        // Set all individual statuses to unavailable
        ['mainDatabaseStatus', 'editDatabaseStatus', 'backupDatabaseStatus'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Unavailable';
                element.className = 'text-2xl font-bold text-red-600';
            }
        });
    }
}

// Function to check individual database files
async function checkDatabaseFile(url, elementId) {
    try {
        const response = await fetch(url);
        const statusElement = document.getElementById(elementId);

        if (!statusElement) return;

        if (response.ok) {
            // Try to parse JSON to ensure it's valid
            await response.json();
            statusElement.textContent = 'Operational';
            statusElement.className = 'text-2xl font-bold text-green-600';
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'text-2xl font-bold text-red-600';
        }
    } catch (error) {
        const statusElement = document.getElementById(elementId);
        if (statusElement) {
            statusElement.textContent = 'Error';
            statusElement.className = 'text-2xl font-bold text-orange-600';
        }
    }
}

// Improved function to check the status of external services
export async function checkServiceStatus(serviceName, endpoint, elementId) {
    // Get the status element by ID
    const statusElement = document.getElementById(elementId);

    // Check if the element exists before attempting to modify it
    if (!statusElement) {
        console.error(`Status element with ID "${elementId}" not found for service "${serviceName}"`);
        return; // Exit the function if the element doesn't exist
    }

    statusElement.textContent = 'Checking...';
    statusElement.classList.remove('text-green-600', 'text-red-600');
    statusElement.classList.add('text-yellow-500');

    try {
        // For GitHub API (which supports CORS) or endpoints that are already proxied
        const response = await fetch(endpoint, {
            method: 'GET',
            cache: 'no-cache', // Ensure we don't get a cached response
            mode: 'cors'
        });

        // For Discord Users API, we expect a 401 if the API is online but requires auth
        // This allows us to determine if the API is operational even without credentials
        if (response.ok || (serviceName === 'Discord API Users' && response.status === 401)) {
            statusElement.textContent = 'Operational';
            statusElement.classList.remove('text-red-600', 'text-yellow-500');
            statusElement.classList.add('text-green-600');
        } else {
            statusElement.textContent = 'Degraded';
            statusElement.classList.remove('text-green-600', 'text-yellow-500');
            statusElement.classList.add('text-red-600');
            console.log(`${serviceName} returned status ${response.status}`);
        }
    } catch (error) {
        statusElement.textContent = 'Offline';
        statusElement.classList.remove('text-green-600', 'text-yellow-500');
        statusElement.classList.add('text-red-600');
        console.log(`Error checking ${serviceName}:`, error.message);
    }
}

// Function to initialize the status checks
export function initializeStatusChecks() {
    // Check if we're on the status page by looking at the current URL
    const isStatusPage = window.location.pathname.includes('status.html') ||
        window.location.pathname.endsWith('status') ||
        document.getElementById('statusPageContainer'); // Additional check for a container element

    // Only run status checks if we're on the status page
    if (!isStatusPage) {
        return; // Exit if not on status page
    }

    // Call fetchDatabaseStatus if it exists and we're on the status page
    if (typeof fetchDatabaseStatus === 'function') {
        fetchDatabaseStatus();
    }

    const corsProxyUrl = 'https://corsproxy.io/?';

    // Check the status of all external services
    checkServiceStatus(
        'VirusTotal API',
        `${corsProxyUrl}https://www.virustotal.com/api/v3/ip-addresses/8.8.8.8`,
        'virustotalStatus'
    );

    checkServiceStatus(
        'URLScan.io API',
        `${corsProxyUrl}https://urlscan.io/api/v1/search/?q=domain:example.com`,
        'urlscanStatus'
    );

    checkServiceStatus(
        'IPinfo.io API',
        `${corsProxyUrl}https://ipinfo.io/8.8.8.8/json`,
        'ipinfoStatus'
    );

    checkServiceStatus(
        'Discord API Invites',
        `${corsProxyUrl}https://discord.com/api/v9/gateway`,
        'discordInvitesStatus'
    );

    checkServiceStatus(
        'Discord API Users',
        `${corsProxyUrl}https://discord.com/api/v9/gateway/bot`,
        'discordUsersStatus'
    );

    checkServiceStatus(
        'GitHub API',
        'https://api.github.com',
        'githubStatus'
    );
}

// Initialize status checks when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeStatusChecks();
    fetchDeveloperMessages();
});