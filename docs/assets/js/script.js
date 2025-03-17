// Imports
import serverNames from './servers.js';

// Main data object
let accountsData = {};
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Determine if we're on the status page
    const isStatusPage = window.location.pathname.includes('status.html');

    // Only call fetchDeveloperMessages if we're on the status page
    if (isStatusPage) {
        fetchDeveloperMessages();
    }

    // Determine if we're on the home page (index.html)
    const isHomePage = window.location.pathname.endsWith('index.html') ||
                        window.location.pathname.endsWith('/') ||
                        window.location.pathname === '';

    // Set the base path for info and FAQ based on current page
    const basePath = isHomePage ? 'pages/' : '';

    // Add event listener for the info button
    const infoButton = document.getElementById('infoButton');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            window.location.href = basePath + 'info.html';
        });
    }

    // Add event listener for the FAQ button
    const faqButton = document.getElementById('faqButton');
    if (faqButton) {
        faqButton.addEventListener('click', () => {
            window.location.href = basePath + 'faq.html';
        });
    }

    // Sidebar Toggle Functionality
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

    // Other event listeners and initialization code...
    if (window.location.pathname.includes('dashboard.html')) {
        fetchData();
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterData);
    }

    const attackMethodFilter = document.getElementById('attackMethodFilter');
    if (attackMethodFilter) {
        attackMethodFilter.addEventListener('change', filterData);
    }

    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', filterData);
    }

    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', filterData);
    }

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

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('detailModal').classList.add('hidden');
        });
    }

    const detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.classList.add('hidden');
            }
        });
    }

    const exportCSV = document.getElementById('exportCSV');
    if (exportCSV) {
        exportCSV.addEventListener('click', exportToCSV);
    }

    const refreshData = document.getElementById('refreshData');
    if (refreshData) {
        refreshData.addEventListener('click', fetchData);
    }

    const infoHeader = document.getElementById('infoHeader');
    const expandButton = document.getElementById('expandButton');
    if (infoHeader && expandButton) {
        infoHeader.addEventListener('click', toggleGlossary);
        expandButton.addEventListener('click', toggleGlossary);
    }

    initializeTheme();

    const symbols = ['🔒', '🛡️', '🔐', '⚠️', '{...}', '</>',
        '101010', '0x1A3F', 'SSL', 'HTTPS', 'RSA', 'SHA-256'
    ];

    // Create and initialize symbol animation
    initializeSecuritySymbols(symbols);

    // Add the intelligence page fetch functionality
    if (window.location.pathname.includes('intelligence.html')) {
        fetchIntelligenceData();
    }
});


function initializeSecuritySymbols(symbols) {
    if (!document.querySelector('.texture')) {
        setTimeout(() => {
            if (document.querySelector('.texture')) {
                startSecuritySymbolsAnimation(symbols);
            }
        }, 500);
    } else {
        startSecuritySymbolsAnimation(symbols);
    }
}

function startSecuritySymbolsAnimation(symbols) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const container = document.body;
    let animationInterval;

    // Function to add security symbol
    function addSecuritySymbol() {
        if (!document.querySelector('.texture')) {
            clearInterval(animationInterval);
            return;
        }

        const symbol = document.createElement('div');
        symbol.className = 'security-symbol';
        symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        // Random position
        symbol.style.left = Math.random() * 95 + '%';
        symbol.style.top = Math.random() * 95 + '%';
        symbol.style.fontSize = (Math.random() * 14 + 8) + 'px';
        symbol.style.opacity = '0';
        symbol.style.transform = 'rotate(' + (Math.random() * 40 - 20) + 'deg)';
        symbol.style.zIndex = '-1'; // Ensure it stays behind content
        symbol.style.pointerEvents = 'none'; // Ensure it doesn't block interaction

        container.appendChild(symbol);

        // Animate it
        setTimeout(() => {
            symbol.style.animation = 'symbolFade 3s ease-in-out forwards';

            // Remove after animation
            setTimeout(() => {
                if (symbol && symbol.parentNode === container) {
                    container.removeChild(symbol);
                }
            }, 3000);
        }, 100);
    }

    // Start the animation interval
    animationInterval = setInterval(addSecuritySymbol, 2000);

    // Initial symbol to start immediately
    setTimeout(addSecuritySymbol, 200);

    // Clean up animation if page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(animationInterval);
        } else if (document.querySelector('.texture')) {
            animationInterval = setInterval(addSecuritySymbol, 2000);
        }
    });
}

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.contains('bg-gray-900');

    // Toggle classes
    document.body.classList.toggle('bg-gray-900');
    document.body.classList.toggle('text-white');
    const cards = document.querySelectorAll('.bg-white');
    cards.forEach(card => {
        card.classList.toggle('bg-gray-800');
        card.classList.toggle('text-white');
    });
    const glossary = document.getElementById('infoBar');
    if (glossary) {
        glossary.classList.toggle('bg-gray-800');
        glossary.classList.toggle('text-white');
    }

    // Save state to localStorage
    localStorage.setItem('darkMode', isDarkMode ? 'disabled' : 'enabled');
});

// Handle Theme state
function initializeTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';

    if (isDarkMode) {
        document.body.classList.add('bg-gray-900', 'text-white');
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach(card => {
            card.classList.add('bg-gray-800', 'text-white');
        });
        const glossary = document.getElementById('infoBar');
        if (glossary) {
            glossary.classList.add('bg-gray-800', 'text-white');
        }
    }
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
    });
}
