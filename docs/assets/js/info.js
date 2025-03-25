// info.js

// Import necessary functions from utils.js
import {
    initializeTheme,
    toggleDarkMode
} from './utils.js';
import servers from './servers.js';

// Destructure serverNames and serverInvites from the default export
const {
    serverNames,
    serverInvites
} = servers;

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
        const response = await fetch(`https://corsproxy.io/?https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
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

    // Initialize a counter for anonymous servers
    let anonymousServerCases = 0;

    // Count cases from the data
    Object.values(data).forEach(account => {
        const server = account.FOUND_ON_SERVER;
        if (server) {
            if (server.startsWith("ANONYMOUS_SERVER_")) {
                // Aggregate cases from all anonymous servers
                anonymousServerCases += 1;
            } else if (serverCounts[server] !== undefined) {
                serverCounts[server] = (serverCounts[server] || 0) + 1;
            }
        }
    });

    // Add the total anonymous server cases to the serverCounts object
    serverCounts["ANONYMOUS_SERVERS"] = anonymousServerCases;

    return serverCounts;
}

// Function to update server cards with case counts and member counts
async function updateServerCards(serverCounts) {
    const serverCards = document.querySelectorAll('.server-card');
    let totalMemberCount = 0;
    let serverWithMemberCount = 0;
    const memberCountsMap = {};

    for (const card of serverCards) {
        const titleElement = card.querySelector('h4');
        if (!titleElement) continue;

        const serverTitle = titleElement.textContent.trim();

        // Check if this is the anonymous server card
        if (serverTitle === "2 Anonymous Servers") {
            // Update case count for anonymous servers
            const caseCountElement = card.querySelector('.case-count');
            if (caseCountElement) {
                caseCountElement.textContent = `${serverCounts["ANONYMOUS_SERVERS"]} Cases Contributed`;
            }
            continue; // Skip the rest of the loop for anonymous servers
        }

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

                    // Add to total member count
                    const numericCount = parseInt(memberCount, 10);
                    if (!isNaN(numericCount)) {
                        totalMemberCount += numericCount;
                        memberCountsMap[serverKey] = numericCount;
                        serverWithMemberCount++;
                    }
                }
            }
        }
    }

    return totalMemberCount;
}

// Function to update placeholders in the page content
function updatePlaceholders(numberOfServers, totalMemberCount) {

    // Manual replacement for specific placeholders
    const serverCountPlaceholder = '{NUMBER_OF_SERVERS}';
    const memberCountPlaceholder = '{TOTAL_MEMBER_COUNT}';

    // Find all text nodes in the document
    const textNodes = [];

    function findTextNodes(node) {
        if (node.nodeType === 3) { // Text node
            textNodes.push(node);
        } else if (node.nodeType === 1) { // Element node
            for (let i = 0; i < node.childNodes.length; i++) {
                findTextNodes(node.childNodes[i]);
            }
        }
    }
    findTextNodes(document.body);

    // Replace placeholders in text nodes
    textNodes.forEach(textNode => {
        if (textNode.nodeValue.includes(serverCountPlaceholder)) {
            textNode.nodeValue = textNode.nodeValue.replace(serverCountPlaceholder, numberOfServers);
        }
        if (textNode.nodeValue.includes(memberCountPlaceholder)) {
            textNode.nodeValue = textNode.nodeValue.replace(memberCountPlaceholder, totalMemberCount.toLocaleString());
        }
    });

    // Also try innerHTML replacement on paragraphs
    document.querySelectorAll('p').forEach(p => {
        if (p.innerHTML.includes(serverCountPlaceholder)) {
            p.innerHTML = p.innerHTML.replace(new RegExp(serverCountPlaceholder, 'g'), numberOfServers);
        }
        if (p.innerHTML.includes(memberCountPlaceholder)) {
            p.innerHTML = p.innerHTML.replace(new RegExp(memberCountPlaceholder, 'g'), totalMemberCount.toLocaleString());
        }
    });
}

// Function to initialize server counts
async function initializeServerCounts() {
    const accountsData = await fetchAccountData();
    const serverCounts = countCasesPerServer(accountsData);

    // Get the total number of servers directly from serverNames
    const numberOfServers = Object.keys(serverNames).length;

    // Update server cards and get the total member count
    const totalMemberCount = await updateServerCards(serverCounts);

    // Update placeholders
    updatePlaceholders(numberOfServers, totalMemberCount || 0);

    // Try a second update with a delay to ensure DOM changes are processed
    setTimeout(() => {
        updatePlaceholders(numberOfServers, totalMemberCount || 0);
    }, 500);
}