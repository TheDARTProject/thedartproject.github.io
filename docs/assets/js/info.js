// info.js

// Import necessary functions from utils.js
import {
    initializeTheme,
    toggleDarkMode
} from './utils.js';
import {
    serverNames,
    serverInvites
} from './servers.js';

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the theme (dark/light mode)
    initializeTheme();

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Info and FAQ buttons
    const infoButton = document.getElementById('infoButton');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            window.location.href = 'info.html';
        });
    }

    const faqButton = document.getElementById('faqButton');
    if (faqButton) {
        faqButton.addEventListener('click', () => {
            window.location.href = 'faq.html';
        });
    }

    // Initialize server counts for the contributing servers section
    initializeServerCounts();
});

// Function to fetch account data for server cards
async function fetchAccountData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching account data:', error);
        return {};
    }
}

// Function to fetch member count from Discord invite link
async function fetchMemberCount(inviteLink) {
    if (!inviteLink) return "Member Count Hidden";

    try {
        const inviteCode = inviteLink.split('/').pop();
        const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.approximate_member_count || "Member Count Hidden";
    } catch (error) {
        console.error('Error fetching member count:', error);
        return "Member Count Hidden";
    }
}

// Function to count cases per server for server cards
function countCasesPerServer(data) {
    const serverCounts = {};

    // Initialize counters for known servers
    Object.keys(serverNames).forEach(server => {
        serverCounts[server] = 0;
    });

    // Count cases from the data
    Object.values(data).forEach(account => {
        const server = account.FOUND_ON_SERVER;
        if (server) {
            serverCounts[server] = (serverCounts[server] || 0) + 1;
        }
    });

    return serverCounts;
}

// Function to update server cards with case counts and member counts
async function updateServerCards(serverCounts) {
    const serverCards = document.querySelectorAll('.server-card');

    for (const card of serverCards) {
        const titleElement = card.querySelector('h4');
        if (!titleElement) continue;

        const serverTitle = titleElement.textContent.trim();

        // Find the corresponding server key
        const serverKey = Object.keys(serverNames).find(key =>
            serverNames[key] === serverTitle
        );

        if (serverKey && serverCounts[serverKey] !== undefined) {
            // Update case count
            const caseCountElement = card.querySelector('.case-count');
            if (caseCountElement) {
                caseCountElement.textContent = `${serverCounts[serverKey]} Cases Contributed`;
            }

            // Update member count
            const memberCountElement = card.querySelector('.text-gray-600'); // Find the first <p> with "Members"
            if (memberCountElement && memberCountElement.textContent.trim() === "Members") {
                const inviteLink = serverInvites[serverKey];
                const memberCount = await fetchMemberCount(inviteLink);
                if (memberCount !== "Member Count Hidden") {
                    memberCountElement.textContent = `${memberCount} Members`;
                }
            }
        }
    }
}

// Function to initialize server counts
async function initializeServerCounts() {
    const accountsData = await fetchAccountData();
    const serverCounts = countCasesPerServer(accountsData);
    await updateServerCards(serverCounts);
}