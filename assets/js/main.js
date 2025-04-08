// main.js

import {
    initializeTheme,
    toggleDarkMode
} from './utils.js';

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
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

    // Info and FAQ buttons with page-aware navigation
    const infoButton = document.getElementById('infoButton');
    const faqButton = document.getElementById('faqButton');

    if (infoButton || faqButton) {
        // Get current page path
        const currentPath = window.location.pathname;
        const isIndexOr404 = currentPath.endsWith('index.html') ||
            currentPath.endsWith('404.html') ||
            currentPath === '/'; // Root path

        // Set appropriate paths based on current page
        const infoPath = isIndexOr404 ? 'pages/info.html' : 'info.html';
        const faqPath = isIndexOr404 ? 'pages/faq.html' : 'faq.html';

        if (infoButton) {
            infoButton.addEventListener('click', () => {
                window.location.href = infoPath;
            });
        }

        if (faqButton) {
            faqButton.addEventListener('click', () => {
                window.location.href = faqPath;
            });
        }
    }

    // Listen for theme changes and update article cards
    document.addEventListener("themeChanged", () => {
        const isDarkMode = document.documentElement.classList.contains("dark");
        const articleCards = newsContainer.querySelectorAll(".bg-white");

        articleCards.forEach((card) => {
            if (isDarkMode) {
                card.classList.remove("bg-white");
                card.classList.add("dark:bg-gray-800", "dark:text-gray-200");
            } else {
                card.classList.remove("dark:bg-gray-800", "dark:text-gray-200");
                card.classList.add("bg-white");
            }
        });
    });
});