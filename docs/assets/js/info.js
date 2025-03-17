// info.js

// Import necessary functions from utils.js
import { initializeTheme, toggleDarkMode } from './utils.js';
import serverNames from './servers.js';

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the theme (dark/light mode)
    initializeTheme();

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Sidebar toggle functionality
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Close sidebar when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    });

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

// Function to update server cards with case counts
function updateServerCards(serverCounts) {
    const serverCards = document.querySelectorAll('.server-card');

    serverCards.forEach(card => {
        const titleElement = card.querySelector('h4');
        if (!titleElement) return;

        const serverTitle = titleElement.textContent.trim();

        // Find the corresponding server key
        const serverKey = Object.keys(serverNames).find(key =>
            serverNames[key] === serverTitle
        );

        if (serverKey && serverCounts[serverKey] !== undefined) {
            const caseCountElement = card.querySelector('.case-count');
            if (caseCountElement) {
                caseCountElement.textContent = `${serverCounts[serverKey]} Cases Contributed`;
            }
        }
    });
}

// Function to initialize server counts
async function initializeServerCounts() {
    const accountsData = await fetchAccountData();
    const serverCounts = countCasesPerServer(accountsData);
    updateServerCards(serverCounts);
}